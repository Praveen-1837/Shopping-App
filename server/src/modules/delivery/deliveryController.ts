import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { OrderStatus, Role } from '@prisma/client';

export const getDeliveryOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = (req as any).dbUser || (await prisma.user.findUnique({ where: { clerkId: auth.userId } }));
    
    if (!dbUser || (dbUser.role !== Role.DELIVERY_PARTNER && dbUser.role !== Role.ADMIN)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only Delivery Partners and Admins can access this.' },
      });
    }

    // For this demo, we use a shared pool of orders. Realistically, these would be assigned to specific riders.
    
    // Pagination parameters
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const skip = (page - 1) * limit;
    const historyMode = req.query.history === 'true';

    const whereClause: any = {};
    
    // TODO: add per-partner assignment before production
    // For this demo, ANY approved Delivery Partner sees ALL orders platform-wide.
    // if (dbUser.role === Role.DELIVERY_PARTNER) {
    //   whereClause.deliveryPartnerId = dbUser.id;
    // }

    if (historyMode) {
      whereClause.status = OrderStatus.DELIVERED;
    } else {
      whereClause.status = {
        in: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],
      };
    }

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          items: true,
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });


  } catch (error) {
    next(error);
  }
};
