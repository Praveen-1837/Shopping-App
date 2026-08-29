import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { z } from 'zod';

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

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  price: z.number().min(0),
  discountPrice: z.number().nullable().optional(),
  durationMins: z.number().min(1),
  category: z.string().optional().default('General'),
  published: z.boolean().optional().default(false),
  visibility: z.enum(['PUBLIC', 'INVITE_ONLY']).optional().default('PUBLIC'),
  previewVideo: z.string().optional(),
  certificate: z.boolean().optional().default(false),
  modules: z.any(),
});

const updateCourseSchema = createCourseSchema.partial();

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);
    if (!['EDUCATOR', 'ADMIN'].includes(dbUser.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only educators or admins can create courses' },
      });
    }

    const validatedData = createCourseSchema.parse(req.body);

    const course = await prisma.course.create({
      data: {
        educatorId: dbUser.id,
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        discountPrice: validatedData.discountPrice !== undefined ? validatedData.discountPrice : null,
        durationMins: validatedData.durationMins,
        category: validatedData.category,
        published: validatedData.published ?? false,
        visibility: validatedData.visibility || 'PUBLIC',
        previewVideo: validatedData.previewVideo || null,
        certificate: validatedData.certificate ?? false,
        modules: validatedData.modules as any,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, educatorId, includeUnpublished, page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by published status unless explicit includeUnpublished parameter passed by owner
    if (includeUnpublished !== 'true') {
      where.published = true;
      where.visibility = 'PUBLIC';
    }

    if (category) where.category = category as string;
    if (educatorId) where.educatorId = educatorId as string;

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          educator: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        educator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Course '${id}' not found` },
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
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

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Course '${id}' not found` },
      });
    }

    if (course.educatorId !== dbUser.id && dbUser.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to update this course' },
      });
    }

    const validatedData = updateCourseSchema.parse(req.body);

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.discountPrice !== undefined && { discountPrice: validatedData.discountPrice }),
        ...(validatedData.durationMins !== undefined && { durationMins: validatedData.durationMins }),
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.published !== undefined && { published: validatedData.published }),
        ...(validatedData.visibility && { visibility: validatedData.visibility }),
        ...(validatedData.previewVideo !== undefined && { previewVideo: validatedData.previewVideo }),
        ...(validatedData.certificate !== undefined && { certificate: validatedData.certificate }),
        ...(validatedData.modules && { modules: validatedData.modules as any }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
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

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Course '${id}' not found` },
      });
    }

    if (course.educatorId !== dbUser.id && dbUser.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to delete this course' },
      });
    }

    await prisma.course.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLearning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    const progresses = await prisma.courseProgress.findMany({
      where: { userId: dbUser.id },
      include: {
        course: {
          include: {
            educator: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: progresses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string; // courseId
    const { moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'moduleId is required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Course '${id}' not found` },
      });
    }

    let progress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: dbUser.id,
          courseId: course.id,
        },
      },
    });

    if (!progress) {
      progress = await prisma.courseProgress.create({
        data: {
          userId: dbUser.id,
          courseId: course.id,
          completedModules: [],
          progressPercent: 0,
          certificateIssued: false,
        },
      });
    }

    const completed = new Set(progress.completedModules);
    completed.add(moduleId);
    const updatedCompletedModules = Array.from(completed);

    // Count total lessons across sections or modules array
    const rawModules: any = course.modules;
    let totalLessonsCount = 1;

    if (rawModules?.sections && Array.isArray(rawModules.sections)) {
      let count = 0;
      rawModules.sections.forEach((sec: any) => {
        if (sec.lessons && Array.isArray(sec.lessons)) {
          count += sec.lessons.length;
        }
      });
      totalLessonsCount = Math.max(1, count);
    } else if (Array.isArray(rawModules)) {
      totalLessonsCount = Math.max(1, rawModules.length);
    }

    const progressPercent = Math.min(
      100,
      Math.round((updatedCompletedModules.length / totalLessonsCount) * 100)
    );
    const certificateIssued = progressPercent === 100 ? true : progress.certificateIssued;

    const updatedProgress = await prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedModules: updatedCompletedModules,
        progressPercent,
        certificateIssued,
      },
      include: {
        course: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: progressPercent === 100 ? 'Course completed! Certificate unlocked!' : 'Module progress updated',
      data: updatedProgress,
    });
  } catch (error) {
    next(error);
  }
};
