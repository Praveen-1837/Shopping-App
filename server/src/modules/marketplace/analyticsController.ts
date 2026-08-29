import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';

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

// GET /api/v1/seller/analytics
export const getSellerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    // Ensure seller/farmer/artisan/admin role
    if (!['SELLER', 'FARMER', 'ARTISAN', 'ADMIN'].includes(dbUser.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Seller or Farmer role required' },
      });
      return;
    }

    // 1. Total Products
    const totalProducts = await prisma.product.count({
      where: { sellerId: dbUser.id },
    });

    // 2. Revenue & Total Order Items for this seller via Prisma Aggregation / SQL
    const revenueAgg: any[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
              COUNT(DISTINCT oi."orderId") as total_orders
       FROM "OrderItem" oi
       JOIN "Product" p ON oi."productId" = p.id
       JOIN "Order" o ON oi."orderId" = o.id
       WHERE p."sellerId" = $1 AND o."paymentStatus" = 'SUCCESS'`,
      dbUser.id
    );

    const totalRevenue = Number(revenueAgg[0]?.total_revenue || 0);
    const totalOrders = Number(revenueAgg[0]?.total_orders || 0);

    // 3. Recent Orders containing this seller's products
    const recentOrderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          sellerId: dbUser.id,
        },
      },
      take: 5,
      orderBy: { id: 'desc' },
      include: {
        product: {
          select: { title: true, images: true, price: true },
        },
        order: {
          select: { id: true, status: true, paymentStatus: true, createdAt: true, user: { select: { name: true, email: true } } },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders: recentOrderItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/educator/analytics
export const getEducatorAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    if (!['EDUCATOR', 'ADMIN'].includes(dbUser.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Educator role required' },
      });
      return;
    }

    // 1. Total Courses
    const totalCourses = await prisma.course.count({
      where: { educatorId: dbUser.id },
    });

    // 2. Total Revenue from courses
    const revenueAgg: any[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
       FROM "OrderItem" oi
       JOIN "Course" c ON oi."courseId" = c.id
       JOIN "Order" o ON oi."orderId" = o.id
       WHERE c."educatorId" = $1 AND o."paymentStatus" = 'SUCCESS'`,
      dbUser.id
    );
    const totalRevenue = Number(revenueAgg[0]?.total_revenue || 0);

    // 3. Total Students & Avg Completion Rate across educator's courses
    const studentAgg: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT cp."userId") as total_students,
              COALESCE(AVG(cp."progressPercent"), 0) as avg_completion
       FROM "CourseProgress" cp
       JOIN "Course" c ON cp."courseId" = c.id
       WHERE c."educatorId" = $1`,
      dbUser.id
    );

    const totalStudents = Number(studentAgg[0]?.total_students || 0);
    const avgCompletionRate = Math.round(Number(studentAgg[0]?.avg_completion || 0));

    // 4. Recent Enrollments
    const recentEnrollments = await prisma.courseProgress.findMany({
      where: {
        course: {
          educatorId: dbUser.id,
        },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        course: { select: { title: true, category: true } },
        user: { select: { name: true, email: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalRevenue,
        avgCompletionRate,
        recentEnrollments,
      },
    });
  } catch (error) {
    next(error);
  }
};
