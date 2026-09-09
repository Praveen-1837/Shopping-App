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
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
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
