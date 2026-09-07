import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from './errorHandler';

export const roleGuard = (allowedRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const auth = getAuth(req);

      if (!auth || !auth.userId) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      // Query Postgres User table for blocked check & role
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: auth.userId },
      });

      if (dbUser?.isBlocked) {
        const error: AppError = new Error('Your account has been suspended by an administrator.');
        error.statusCode = 403;
        error.code = 'ACCOUNT_BLOCKED';
        return next(error);
      }

      // Attach user to req to eliminate duplicate DB lookups in subsequent controllers
      (req as any).dbUser = dbUser;

      const sessionClaims = auth.sessionClaims as any;
      const userRole =
        dbUser?.role ||
        sessionClaims?.publicMetadata?.role ||
        sessionClaims?.metadata?.role ||
        sessionClaims?.role;

      if (!userRole || !allowedRoles.includes(userRole as Role)) {
        const error: AppError = new Error(
          `Access denied. Role '${userRole || 'NONE'}' is not authorized to perform this action.`
        );
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        return next(error);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
