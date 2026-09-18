import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const clerkId = auth.userId;
    const sessionClaims = auth.sessionClaims as any;
    const sessionRole = (sessionClaims?.publicMetadata?.role || sessionClaims?.role) as Role | undefined;

    // Look up user in local Postgres DB
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    const realEmail = sessionClaims?.email || sessionClaims?.primary_email;

    // Fallback sync if user not created yet
    if (!user) {
      const email = realEmail || `${clerkId}@example.com`;
      const name = sessionClaims?.name || sessionClaims?.full_name || 'User';
      const role = sessionRole || Role.CUSTOMER;

      user = await prisma.user.create({
        data: {
          clerkId,
          name,
          email,
          role,
        },
      });
    } else {
      const updateData: any = {};
      if (realEmail && user.email !== realEmail) {
        updateData.email = realEmail;
      }
      // CRITICAL FIX: Do NOT overwrite DB role with sessionRole.
      // The DB is the source of truth for roles. Admin approval updates DB. 
      // If we blindly trust the stale JWT token, we rollback admin approvals.
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { clerkId },
          data: updateData,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Dev utility to quickly update user role in PostgreSQL for local testing
export const devUpdateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
    }

    const { role } = req.body;
    if (!role || !Object.values(Role).includes(role as Role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: `Role must be one of: ${Object.values(Role).join(', ')}` },
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { clerkId: auth.userId } });

    const updatedUser = await prisma.user.upsert({
      where: { clerkId: auth.userId },
      update: { role: role as Role },
      create: {
        clerkId: auth.userId,
        name: 'Dev User',
        email: existingUser?.email || `${auth.userId}@example.com`,
        role: role as Role,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Role successfully updated to ${role} in Postgres DB`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const adminPing = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'pong',
    role: Role.ADMIN,
    timestamp: new Date().toISOString(),
  });
};
