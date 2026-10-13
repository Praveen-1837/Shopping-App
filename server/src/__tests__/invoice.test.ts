import { Request, Response, NextFunction } from 'express';
import { generateInvoice } from '../modules/seller/sellerController';
import { prisma } from '../config/db';
import { getAuth } from '@clerk/express';
import { PassThrough } from 'stream';

jest.mock('@clerk/express', () => ({
  ...jest.requireActual('@clerk/express'),
  getAuth: jest.fn(),
}));

jest.mock('../config/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Invoice Generation Endpoint (generateInvoice)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;
  let headers: Record<string, string>;

  beforeEach(() => {
    headers = {};
    mockReq = {
      params: { id: 'test-order-123' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockImplementation((key: string, val: string) => {
        headers[key] = val;
      }),
    };
    nextFn = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 when no auth credentials provided', async () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: null });

    await generateInvoice(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
  });

  it('should return 404 when order does not exist', async () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: 'user_clerk_1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'db-user-1',
      clerkId: 'user_clerk_1',
      role: 'CUSTOMER',
    });
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    await generateInvoice(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      })
    );
  });

  it('should return 403 when requesting user is neither buyer, admin, nor owning seller', async () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: 'user_unrelated' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'db-user-unrelated',
      clerkId: 'user_unrelated',
      role: 'CUSTOMER',
    });
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-order-123',
      userId: 'different-buyer-id',
      total: '500',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      createdAt: new Date(),
      items: [
        {
          id: 'item-1',
          quantity: 1,
          price: '500',
          product: { title: 'Product 1', sellerId: 'different-seller-id' },
          course: null,
        },
      ],
      deliveryAddress: {
        recipientName: 'Alice',
        streetAddress: '123 Street',
        city: 'City',
        state: 'State',
        postalCode: '123456',
      },
    });

    await generateInvoice(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      })
    );
  });

  it('should generate PDF document when user is the buyer who placed the order', async () => {
    (getAuth as jest.Mock).mockReturnValue({ userId: 'buyer_clerk' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'buyer-user-id',
      clerkId: 'buyer_clerk',
      role: 'CUSTOMER',
    });
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-order-123',
      userId: 'buyer-user-id',
      total: '500',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'Razorpay',
      createdAt: new Date(),
      user: {
        id: 'buyer-user-id',
        name: 'Buyer Bob',
        email: 'buyer@example.com',
        phone: '+919876543210',
      },
      items: [
        {
          id: 'item-1',
          quantity: 2,
          price: '250',
          product: { title: 'Fresh Organic Apples', sellerId: 'seller-id-1' },
          course: null,
        },
      ],
      deliveryAddress: {
        recipientName: 'Buyer Bob',
        streetAddress: '42 Greenway Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
      },
    });

    // Provide a stream mock for response pipe
    const passThrough = new PassThrough();
    mockRes.on = jest.fn().mockImplementation((event, handler) => {
      passThrough.on(event, handler);
      return mockRes;
    });
    mockRes.emit = jest.fn().mockImplementation((event, ...args) => {
      return passThrough.emit(event, ...args);
    });
    mockRes.write = jest.fn().mockImplementation((chunk) => {
      return passThrough.write(chunk);
    });
    mockRes.end = jest.fn().mockImplementation(() => {
      passThrough.end();
      return mockRes;
    });

    await generateInvoice(mockReq as Request, mockRes as Response, nextFn);

    expect(headers['Content-Type']).toBe('application/pdf');
    expect(headers['Content-Disposition']).toContain('Invoice-TEST-ORD.pdf');
    expect(headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
  });
});
