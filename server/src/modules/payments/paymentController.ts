import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { processPayment } from './payment.service';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

async function getDbUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: 'Customer User',
        email: `${clerkId}@example.com`,
        role: Role.CUSTOMER,
      },
    });
  }
  return user;
}

export const processOrderPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { orderId, paymentMethod = 'CARD', simulateFailure = false } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'orderId is required' },
      });
    }

    const dbUser = (req as any).dbUser || (await getDbUser(auth.userId));

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Order '${orderId}' not found` },
      });
    }

    // Ownership check: Caller must be the buyer who created the order or an ADMIN
    if (order.userId !== dbUser.id && dbUser.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to pay for this order' },
      });
    }

    // Idempotency check: If order has already been paid and confirmed, return existing order (prevent double charge and double stock decrement)
    if (order.paymentStatus === PaymentStatus.SUCCESS || order.status === OrderStatus.CONFIRMED) {
      return res.status(200).json({
        success: true,
        message: 'Order has already been paid and confirmed (duplicate prevented)',
        data: order,
      });
    }

    // Cancelled check: Do not allow payment for cancelled orders
    if (order.status === OrderStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        error: { code: 'ORDER_CANCELLED', message: 'Cannot process payment for a cancelled order.' },
      });
    }

    // Call isolated processPayment seam
    const result = await processPayment({
      orderId,
      amount: Number(order.total),
      paymentMethod,
      simulateFailure: Boolean(simulateFailure),
    });

    if (!result.success) {
      const failedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      return res.status(402).json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: result.message,
          transactionId: result.transactionId,
        },
        data: failedOrder,
      });
    }

    // Payment Succeeded — Execute Order Updates + Stock Decrements in a Transaction
    try {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // 1. Atomic stock bounds check and decrement
        const physicalItems = order.items.filter(item => item.productId && item.itemType !== 'COURSE');
        for (const item of physicalItems) {
          const updateRes = await tx.product.updateMany({
            where: {
              id: item.productId!,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          if (updateRes.count === 0) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }
        }

        // 2. Update Order Status
        const orderUpdated = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.SUCCESS,
            status: OrderStatus.CONFIRMED,
            paymentId: result.transactionId,
          },
          include: {
            items: {
              include: {
                product: true,
                course: true,
              },
            },
          },
        });

        // 3. Course Activation on Purchase (batched)
        const courseItems = order.items.filter(item => item.courseId || item.itemType === 'COURSE');
        await Promise.all(
          courseItems.map(item => tx.courseProgress.upsert({
            where: {
              userId_courseId: {
                userId: order.userId,
                courseId: item.courseId!,
              },
            },
            update: {}, // Keep existing progress if already enrolled
            create: {
              userId: order.userId,
              courseId: item.courseId!,
              completedModules: [],
              progressPercent: 0,
              certificateIssued: false,
            },
          }))
        );

        // 4. Clear user cart
        await tx.cart.updateMany({
          where: { userId: order.userId },
          data: { items: [] },
        });

        return orderUpdated;
      }, {
        timeout: 10000 // Increased safety net timeout
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: updatedOrder,
      });

    } catch (e: any) {
      console.error("[processOrderPayment] Transaction failed:", e.message);

      // Handle race condition where stock is unavailable gracefully by failing the order
      try {
        const failedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            status: OrderStatus.CANCELLED,
            cancellationReason: e.message,
          },
        });

        return res.status(400).json({
          success: false,
          error: {
            code: 'STOCK_UNAVAILABLE',
            message: e.message,
          },
          data: failedOrder,
        });
      } catch (dbErr: any) {
        console.error("[processOrderPayment] Secondary update failed:", dbErr.message);
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: e.message || 'Payment transaction failed',
          },
        });
      }
    }
  } catch (error) {
    next(error);
  }
};
