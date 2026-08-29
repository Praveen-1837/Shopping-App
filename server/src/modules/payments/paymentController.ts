import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { processPayment } from './payment.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

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

    // Payment Succeeded — Update paymentStatus to SUCCESS, status to CONFIRMED, and clear cart
    const updatedOrder = await prisma.order.update({
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

    // Course Activation on Purchase (Phase 5 Requirement):
    // Automatically create/update CourseProgress rows for any course items in order
    for (const item of order.items) {
      if (item.courseId || item.itemType === 'COURSE') {
        const cId = item.courseId;
        if (cId) {
          await prisma.courseProgress.upsert({
            where: {
              userId_courseId: {
                userId: order.userId,
                courseId: cId,
              },
            },
            update: {}, // Keep existing progress if already enrolled
            create: {
              userId: order.userId,
              courseId: cId,
              completedModules: [],
              progressPercent: 0,
              certificateIssued: false,
            },
          });
        }
      }
    }

    // Clear user cart
    await prisma.cart.updateMany({
      where: { userId: order.userId },
      data: { items: [] },
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
