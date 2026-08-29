import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../config/db';
import { AppError } from './errorHandler';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    // Server-side block enforcement check
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
      select: { isBlocked: true },
    });

    if (dbUser?.isBlocked) {
      const error: AppError = new Error('Your account has been suspended by an administrator.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_BLOCKED';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};
