import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role, RoleApplicationStatus } from '@prisma/client';
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

const applySchema = z.object({
  requestedRole: z.enum(['SELLER', 'FARMER', 'ARTISAN', 'EDUCATOR']),
  details: z.object({
    businessName: z.string().optional(),
    experience: z.string().optional(),
    reason: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
});

// POST /api/v1/onboarding/apply
export const applyForRole = async (req: Request, res: Response, next: NextFunction) => {
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
    const validatedData = applySchema.parse(req.body);

    // Check if user already has a pending application for this role
    const existing = await prisma.roleApplication.findFirst({
      where: {
        userId: dbUser.id,
        requestedRole: validatedData.requestedRole as Role,
        status: RoleApplicationStatus.PENDING,
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: { code: 'PENDING_APPLICATION_EXISTS', message: 'You already have a pending application for this role' },
      });
      return;
    }

    const application = await prisma.roleApplication.create({
      data: {
        userId: dbUser.id,
        requestedRole: validatedData.requestedRole as Role,
        details: validatedData.details || {},
        status: RoleApplicationStatus.PENDING,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Role application submitted successfully. Pending Admin review.',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/onboarding (Admin Only)
export const getPendingApplications = async (req: Request, res: Response, next: NextFunction) => {
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
    if (dbUser.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
      return;
    }

    const requestedRole = req.query.requestedRole as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (requestedRole) {
      if (requestedRole === 'SELLER' || requestedRole === 'ARTISAN') {
        where.requestedRole = { in: [Role.SELLER, Role.ARTISAN] };
      } else {
        where.requestedRole = requestedRole as Role;
      }
    }

    const [total, applications] = await Promise.all([
      prisma.roleApplication.count({ where }),
      prisma.roleApplication.findMany({
        where,
        include: {
          user: {
            select: { id: true, clerkId: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        items: applications,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/onboarding/:id (Admin Only)
export const reviewRoleApplication = async (req: Request, res: Response, next: NextFunction) => {
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
    if (dbUser.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
      return;
    }

    const id = req.params.id as string;
    const { status } = req.body; // 'APPROVED' | 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be APPROVED or REJECTED' },
      });
      return;
    }

    const application = await prisma.roleApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' },
      });
      return;
    }

    const updatedApp = await prisma.roleApplication.update({
      where: { id },
      data: { status: status as RoleApplicationStatus },
    });

    // If APPROVED, update user's publicMetadata in Clerk SDK & local DB
    if (status === 'APPROVED') {
      const requestedRole = application.requestedRole;

      // 1. Update Clerk publicMetadata via backend SDK
      try {
        await clerkClient.users.updateUserMetadata(application.user.clerkId, {
          publicMetadata: {
            role: requestedRole,
          },
        });
      } catch (clerkErr) {
        console.error('Failed to update Clerk publicMetadata:', clerkErr);
      }

      // 2. Update local DB User.role
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: requestedRole },
      });

      // 3. If role is FARMER or SELLER or ARTISAN, ensure a Producer record exists
      if (['FARMER', 'SELLER', 'ARTISAN'].includes(requestedRole)) {
        const businessName = (application.details as any)?.businessName || application.user.name || 'Organic Producer';
        await prisma.producer.upsert({
          where: { userId: application.userId },
          update: { name: businessName },
          create: {
            userId: application.userId,
            name: businessName,
            location: 'India',
            story: 'Sustainable local organic producer.',
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Role application ${status.toLowerCase()} successfully`,
      data: updatedApp,
    });
  } catch (error) {
    next(error);
  }
};
