import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';

async function getDbUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    throw new Error('Authenticated user not found');
  }
  return user;
}

type EnrollmentWithDetails = {
  id: string;
  progressPercent: number;
  updatedAt: Date;
  user: { name: string; email: string } | null;
  course: { title: string } | null;
};

type ReviewWithDetails = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { name: string } | null;
  course: { title: string } | null;
};

type OrderItemWithOrder = {
  price: number | { toString(): string };
  quantity: number;
  order: { id: string; createdAt: Date };
};

type StudentProgressWithUser = {
  progressPercent: number;
  completedModules: string[];
  certificateIssued: boolean;
  updatedAt: Date;
  user: { id: string; name: string; email: string };
};

type RatingGroup = {
  rating: number;
  _count: {
    rating: number;
  };
};

// GET /api/v1/educator/stats
export const getEducatorStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    // 1. Total distinct enrolled students across educator's courses
    const distinctStudents = await prisma.courseProgress.groupBy({
      by: ['userId'],
      where: {
        course: { educatorId: dbUser.id },
      },
    });

    // 2. Active / published course count
    const activeCoursesCount = await prisma.course.count({
      where: { educatorId: dbUser.id, published: true },
    });

    const totalCoursesCount = await prisma.course.count({
      where: { educatorId: dbUser.id },
    });

    // 3. Total revenue from successful course sales
    const orderItems = await prisma.orderItem.findMany({
      where: {
        course: { educatorId: dbUser.id },
        order: { paymentStatus: 'SUCCESS' },
      },
      select: { price: true, quantity: true },
    });

    const totalRevenue = orderItems.reduce(
      (sum: number, item: { price: unknown; quantity: number }) =>
        sum + Number(item.price) * item.quantity,
      0
    );

    // 4. Average rating across educator's courses
    const ratingAgg = await prisma.review.aggregate({
      _avg: { rating: true },
      where: {
        course: { educatorId: dbUser.id },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalEnrolledStudents: distinctStudents.length,
        activeCourses: activeCoursesCount,
        totalCourses: totalCoursesCount,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageRating: Number((ratingAgg._avg.rating || 0).toFixed(1)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/educator/activity-feed
export const getEducatorActivityFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    const [enrollments, reviews] = await Promise.all([
      prisma.courseProgress.findMany({
        where: { course: { educatorId: dbUser.id } },
        take: 15,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.review.findMany({
        where: { course: { educatorId: dbUser.id } },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    const formattedEvents = [
      ...enrollments.map((e: EnrollmentWithDetails) => ({
        id: `enroll-${e.id}`,
        type: 'ENROLLMENT',
        title: `${e.user?.name || 'A student'} enrolled in "${e.course?.title}"`,
        subtitle: `Progress: ${e.progressPercent}%`,
        timestamp: e.updatedAt.toISOString(),
      })),
      ...reviews.map((r: ReviewWithDetails) => ({
        id: `review-${r.id}`,
        type: 'REVIEW',
        title: `${r.user?.name || 'A student'} rated "${r.course?.title}" ${r.rating} stars`,
        subtitle: r.comment || 'No comment provided',
        timestamp: r.createdAt.toISOString(),
      })),
    ].sort((a: { timestamp: string }, b: { timestamp: string }) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

    res.status(200).json({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/educator/analytics/revenue
export const getEducatorRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const period = (req.query.period as string) || 'daily';

    const orderItems = await prisma.orderItem.findMany({
      where: {
        course: { educatorId: dbUser.id },
        order: { paymentStatus: 'SUCCESS' },
      },
      include: {
        order: { select: { id: true, createdAt: true } },
      },
      orderBy: { order: { createdAt: 'asc' } },
    });

    let totalRevenue = 0;
    const orderIds = new Set<string>();
    const groupedMap: Record<string, { label: string; revenue: number; orders: Set<string> }> = {};

    orderItems.forEach((item: OrderItemWithOrder) => {
      const price = Number(item.price);
      const lineTotal = price * item.quantity;
      totalRevenue += lineTotal;
      orderIds.add(item.order.id);

      const d = new Date(item.order.createdAt);
      let label = d.toISOString().slice(0, 10);

      if (period === 'monthly') {
        label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
        label = `Week of ${firstDay.toISOString().slice(5, 10)}`;
      }

      if (!groupedMap[label]) {
        groupedMap[label] = { label, revenue: 0, orders: new Set() };
      }
      groupedMap[label].revenue += lineTotal;
      groupedMap[label].orders.add(item.order.id);
    });

    const chartData = Object.values(groupedMap).map((entry: { label: string; revenue: number; orders: Set<string> }) => ({
      label: entry.label,
      revenue: Number(entry.revenue.toFixed(2)),
      orders: entry.orders.size,
    }));

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalSales: orderIds.size,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/educator/courses/:id/students
export const getCourseStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
      return;
    }

    if (course.educatorId !== dbUser.id && dbUser.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not course owner' } });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.courseProgress.findMany({
        where: { courseId: id },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.courseProgress.count({ where: { courseId: id } }),
    ]);

    const formatted = students.map((s: StudentProgressWithUser) => ({
      studentId: s.user.id,
      name: s.user.name,
      email: s.user.email,
      progressPercent: s.progressPercent,
      completedModulesCount: s.completedModules.length,
      certificateIssued: s.certificateIssued,
      lastActive: s.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/educator/courses/:id/students/:studentId
export const getCourseStudentDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const studentId = req.params.studentId as string;
    const dbUser = await getDbUser(auth.userId);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
      return;
    }

    if (course.educatorId !== dbUser.id && dbUser.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not course owner' } });
      return;
    }

    const progress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: id,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!progress) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student enrollment not found' } });
      return;
    }

    // Extract lesson details from course.modules structure
    const rawModules: any = course.modules;
    const lessonsList: { id: string; title: string; completed: boolean }[] = [];

    if (rawModules?.sections && Array.isArray(rawModules.sections)) {
      rawModules.sections.forEach((sec: any) => {
        if (sec.lessons && Array.isArray(sec.lessons)) {
          sec.lessons.forEach((l: any) => {
            lessonsList.push({
              id: l.id,
              title: `${sec.title} > ${l.title}`,
              completed: progress.completedModules.includes(l.id),
            });
          });
        }
      });
    } else if (Array.isArray(rawModules)) {
      rawModules.forEach((m: any) => {
        lessonsList.push({
          id: m.id,
          title: m.title,
          completed: progress.completedModules.includes(m.id),
        });
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: progress.user,
        progressPercent: progress.progressPercent,
        certificateIssued: progress.certificateIssued,
        lastActive: progress.updatedAt,
        lessons: lessonsList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/educator/courses/:id/reviews
export const getCourseReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
      return;
    }

    if (course.educatorId !== dbUser.id && dbUser.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not course owner' } });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total, ratingGroups] = await Promise.all([
      prisma.review.findMany({
        where: { courseId: id },
        skip,
        take: limit,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { courseId: id } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { courseId: id },
        _count: { rating: true },
      }),
    ]);

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingGroups.forEach((g: RatingGroup) => {
      breakdown[g.rating] = g._count.rating;
    });

    res.status(200).json({
      success: true,
      data: reviews,
      breakdown,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/reviews/:id/reply
export const replyToReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const id = req.params.id as string;
    const { reply } = req.body;

    if (!reply || typeof reply !== 'string') {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Reply text is required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    const review = await prisma.review.findUnique({
      where: { id },
      include: { course: { select: { educatorId: true } } },
    });

    if (!review) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } });
      return;
    }

    if (review.course?.educatorId !== dbUser.id && dbUser.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to reply to this review' } });
      return;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        reply,
        repliedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Review reply saved',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Public course review endpoints:
// POST /api/v1/courses/:id/reviews
export const addCourseReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const courseId = req.params.id as string;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Rating between 1 and 5 required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    const review = await prisma.review.create({
      data: {
        userId: dbUser.id,
        courseId,
        rating: Number(rating),
        comment: comment || '',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/courses/:id/reviews (Public)
export const getPublicCourseReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id as string;

    const reviews = await prisma.review.findMany({
      where: { courseId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
