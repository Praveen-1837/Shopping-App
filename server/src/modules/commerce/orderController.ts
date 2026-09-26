import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role, OrderStatus } from '@prisma/client';
import { sendOrderCancellationEmail } from '../notifications/emailService';

async function getDbUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: 'User',
        email: `${clerkId}@example.com`,
        role: Role.CUSTOMER,
      },
    });
  }
  return user;
}

// Strict Allowed State Transitions Map per Phase 6 Rules
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

// Expose the transition map to the frontend to prevent UI duplication
export const getOrderTransitions = (req: Request, res: Response) => {
  return res.json({ success: true, data: ALLOWED_TRANSITIONS });
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;
    const { status: newStatus, cancellationReason } = req.body;

    if (!newStatus || !Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `Invalid status string '${newStatus}'` },
      });
    }

    const dbUser = (req as any).dbUser || (await getDbUser(auth.userId));

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        items: {
          select: {
            product: {
              select: {
                sellerId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Order '${id}' not found` },
      });
    }

    // Permission Checks
    const isSeller = [Role.SELLER, Role.FARMER, Role.ARTISAN].includes(dbUser.role);
    const isDeliveryPartner = dbUser.role === Role.DELIVERY_PARTNER;
    const isAdmin = dbUser.role === Role.ADMIN;

    if (!isAdmin) {
      if (isSeller) {
        const ownsProductInOrder = order.items.some(
          (item) => item.product && item.product.sellerId === dbUser.id
        );
        if (!ownsProductInOrder) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You are not authorized to update status for orders containing products you do not sell',
            },
          });
        }
        
        const sellerAllowedStatuses: string[] = [OrderStatus.CONFIRMED, OrderStatus.PACKED, OrderStatus.SHIPPED];
        if (!sellerAllowedStatuses.includes(newStatus as string)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Sellers are only allowed to transition orders up to SHIPPED. Later stages and cancellations must be requested from an ADMIN.',
            },
          });
        }
      } else if (isDeliveryPartner) {
        const deliveryAllowedStatuses: string[] = [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];
        if (!deliveryAllowedStatuses.includes(newStatus as string)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Delivery Partners are only allowed to transition orders to IN_TRANSIT, OUT_FOR_DELIVERY, or DELIVERED.',
            },
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to update order statuses.',
          },
        });
      }
    }

    // Validate forward transition rule
    const allowedNextStates = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedNextStates.includes(newStatus as OrderStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ILLEGAL_TRANSITION',
          message: `Cannot transition order status from '${order.status}' to '${newStatus}'. Allowed next states: [${allowedNextStates.join(
            ', '
          )}]`,
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus as OrderStatus,
        ...(newStatus === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
        ...(newStatus === OrderStatus.CANCELLED && typeof cancellationReason === 'string'
          ? { cancellationReason: cancellationReason.trim() || null }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: { select: { title: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    // If order was cancelled, trigger asynchronous email notification to the customer
    if (newStatus === OrderStatus.CANCELLED && updatedOrder.user?.email) {
      const items = updatedOrder.items.map((i) => ({
        title: i.product?.title || i.course?.title || 'Item',
        quantity: i.quantity,
        price: Number(i.price),
      }));

      // Non-blocking dispatch with graceful failure handling
      sendOrderCancellationEmail({
        customerEmail: updatedOrder.user.email,
        customerName: updatedOrder.user.name,
        orderId: updatedOrder.id,
        cancellationReason: updatedOrder.cancellationReason,
        items,
        total: Number(updatedOrder.total),
      }).catch((err) => {
        console.error('[updateOrderStatus] Failed to dispatch order cancellation email:', err);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    const parsedPage = parseInt((req.query.page as string) || '1', 10);
    const parsedLimit = parseInt((req.query.limit as string) || '10', 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(50, parsedLimit) : 10;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: dbUser.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
              course: true,
            },
          },
        },
      }),
      prisma.order.count({ where: { userId: dbUser.id } }),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    let whereClause: any = {};
    if (dbUser.role !== Role.ADMIN) {
      whereClause = {
        items: {
          some: {
            product: {
              sellerId: dbUser.id,
            },
          },
        },
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
            course: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                producer: true,
              },
            },
            course: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Order '${id}' not found` },
      });
    }

    // Access check: buyer, owning seller, or ADMIN
    const isBuyer = order.userId === dbUser.id;
    const isAdmin = dbUser.role === Role.ADMIN;
    const isOwningSeller = order.items.some(
      (item) => item.product && item.product.sellerId === dbUser.id
    );

    if (!isBuyer && !isAdmin && !isOwningSeller) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this order' },
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const requestCancellation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);
    const id = req.params.id as string;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    // Must be seller
    const ownsProductInOrder = order.items.some(
      (item) => item.product && item.product.sellerId === dbUser.id
    );

    if (!ownsProductInOrder) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not own this order' },
      });
    }

    if (order.cancellationRequested) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Cancellation already requested for this order' },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        cancellationRequested: true,
        cancellationRequestReason: reason || null,
        cancellationRequestedAt: new Date(),
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Cancellation requested successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
