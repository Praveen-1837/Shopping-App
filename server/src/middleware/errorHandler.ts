import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  issues?: any[];
}

export const errorHandler = (
  err: AppError | ZodError | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle Zod schema validation errors safely with 400 Bad Request
  if (err instanceof ZodError || err.name === 'ZodError') {
    const formattedErrors = err.issues?.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })) || [];

    console.warn(`[Validation Warning] 400 - Validation Failed:`, formattedErrors);

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or parameters',
        issues: formattedErrors,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected error occurred';

  console.error(`[Error] ${errorCode} - ${message}`, err);

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  });
};
