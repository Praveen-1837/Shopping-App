import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler } from '../middleware/errorHandler';
import { processOrderPayment } from '../modules/payments/paymentController';
import { getMyOrders } from '../modules/commerce/orderController';
import { prisma } from '../config/db';
import * as paymentService from '../modules/payments/payment.service';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

describe('Real-World Resilience & Failure Handling Tests', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('1. Zod Error 400 Validation Translation (Scenario 38)', () => {
    it('should format ZodError as HTTP 400 VALIDATION_ERROR with structured issues instead of 500', () => {
      const testSchema = z.object({
        email: z.string().email(),
        quantity: z.number().min(1),
      });

      let zodError: ZodError | null = null;
      try {
        testSchema.parse({ email: 'not-an-email', quantity: -5 });
      } catch (err: any) {
        zodError = err;
      }

      expect(zodError).toBeDefined();

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload or parameters',
            issues: expect.arrayContaining([
              expect.objectContaining({ field: 'email' }),
              expect.objectContaining({ field: 'quantity' }),
            ]),
          }),
        })
      );
    });
  });

  describe('2. Payment Idempotency & Duplicate Prevention (Scenarios 19, 20, 21, 32, 33)', () => {
    it('should return HTTP 200 immediately without re-charging or re-decrementing stock if order is already paid', async () => {
      jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
        userId: 'user_clerk_123',
      });

      const alreadyPaidOrder: any = {
        id: 'order_already_paid',
        userId: 'db_user_123',
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
        total: 500,
        items: [{ productId: 'prod_1', quantity: 2, itemType: 'PRODUCT' }],
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'db_user_123',
        clerkId: 'user_clerk_123',
        role: Role.CUSTOMER,
      } as any);

      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue(alreadyPaidOrder);

      const processPaymentSpy = jest.spyOn(paymentService, 'processPayment');
      const transactionSpy = jest.spyOn(prisma, '$transaction');

      mockReq.body = { orderId: 'order_already_paid' };

      await processOrderPayment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('duplicate prevented'),
          data: alreadyPaidOrder,
        })
      );

      // Verify no external charge and no database transaction occurred!
      expect(processPaymentSpy).not.toHaveBeenCalled();
      expect(transactionSpy).not.toHaveBeenCalled();
    });
  });

  describe('3. Payment Authorization Guard (Scenario 40)', () => {
    it('should reject payment with HTTP 403 FORBIDDEN if caller does not own the order', async () => {
      jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
        userId: 'attacker_clerk_999',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'attacker_db_id',
        clerkId: 'attacker_clerk_999',
        role: Role.CUSTOMER,
      } as any);

      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({
        id: 'victim_order_777',
        userId: 'legitimate_buyer_id',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        total: 1200,
        items: [],
      } as any);

      mockReq.body = { orderId: 'victim_order_777' };

      await processOrderPayment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'FORBIDDEN',
            message: 'You are not authorized to pay for this order',
          }),
        })
      );
    });

    it('should reject payment with HTTP 400 if order is already CANCELLED', async () => {
      jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
        userId: 'user_clerk_123',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'db_user_123',
        clerkId: 'user_clerk_123',
        role: Role.CUSTOMER,
      } as any);

      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({
        id: 'cancelled_order_888',
        userId: 'db_user_123',
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
        total: 500,
        items: [],
      } as any);

      mockReq.body = { orderId: 'cancelled_order_888' };

      await processOrderPayment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'ORDER_CANCELLED',
          }),
        })
      );
    });
  });

  describe('4. Atomic Stock Bounds Check (Scenario 22)', () => {
    it('should handle stock race condition gracefully and fail the order cleanly without negative stock', async () => {
      jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
        userId: 'user_clerk_123',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'db_user_123',
        clerkId: 'user_clerk_123',
        role: Role.CUSTOMER,
      } as any);

      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({
        id: 'order_stock_race',
        userId: 'db_user_123',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        total: 250,
        items: [{ productId: 'prod_limited', quantity: 5, itemType: 'PRODUCT' }],
      } as any);

      jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
        success: true,
        transactionId: 'TXN_TEST_123',
        paymentStatus: 'SUCCESS',
        message: 'Mock payment success',
        timestamp: new Date().toISOString(),
      });

      // Simulate atomic conditional update failure: 0 rows updated because stock < quantity
      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          product: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(txMock);
      });

      const orderUpdateSpy = jest.spyOn(prisma.order, 'update').mockResolvedValue({
        id: 'order_stock_race',
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.CANCELLED,
      } as any);

      mockReq.body = { orderId: 'order_stock_race' };

      await processOrderPayment(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'STOCK_UNAVAILABLE',
          }),
        })
      );

      // Verify the order was updated to CANCELLED with FAILED payment status
      expect(orderUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_stock_race' },
          data: expect.objectContaining({
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
          }),
        })
      );
    });
  });

  describe('5. Boundary Input Sanitization (Scenario 39)', () => {
    it('should safely fall back to page 1 and limit 10 when non-numeric pagination parameters are passed', async () => {
      jest.spyOn(require('@clerk/express'), 'getAuth').mockReturnValue({
        userId: 'user_clerk_123',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'db_user_123',
        clerkId: 'user_clerk_123',
        role: Role.CUSTOMER,
      } as any);

      const findManySpy = jest.spyOn(prisma.order, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.order, 'count').mockResolvedValue(0);

      mockReq.query = { page: 'invalid_page', limit: 'invalid_limit' };

      await getMyOrders(mockReq as Request, mockRes as Response, mockNext);

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // (1 - 1) * 10 = 0
          take: 10,
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
          }),
        })
      );
    });
  });
});
