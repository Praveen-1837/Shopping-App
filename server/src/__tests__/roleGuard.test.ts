import { Request, Response, NextFunction } from 'express';
import { roleGuard } from '../middleware/roleGuard';
import { Role } from '@prisma/client';

describe('roleGuard Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should call next() without error if user role is allowed', async () => {
    jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
      userId: 'clerk_test_123',
      sessionClaims: { publicMetadata: { role: Role.SELLER } },
    });

    const middleware = roleGuard([Role.SELLER, Role.ADMIN]);
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next(error) with 403 FORBIDDEN if user role is not allowed', async () => {
    jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
      userId: 'clerk_test_456',
      sessionClaims: { publicMetadata: { role: Role.CUSTOMER } },
    });

    const middleware = roleGuard([Role.SELLER, Role.ADMIN]);
    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const passedError = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(passedError).toBeDefined();
    expect(passedError.statusCode).toBe(403);
    expect(passedError.code).toBe('FORBIDDEN');
  });
});
