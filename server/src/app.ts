import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { prisma } from './config/db';
import authRoutes from './modules/auth/authRoutes';
import productRoutes from './modules/commerce/productRoutes';
import cartRoutes from './modules/cart/cartRoutes';
import checkoutRoutes from './modules/checkout/checkoutRoutes';
import paymentRoutes from './modules/payments/paymentRoutes';
import courseRoutes from './modules/learning/courseRoutes';
import orderRoutes from './modules/commerce/orderRoutes';
import aiRoutes from './modules/ai/aiRoutes';
import producerRoutes from './modules/content/producerRoutes';
import marketplaceRoutes from './modules/marketplace/marketplaceRoutes';
import wishlistRoutes from './modules/commerce/wishlistRoutes';
import adminRoutes from './modules/admin/adminRoutes';
import sellerRoutes from './modules/seller/sellerRoutes';
import educatorRoutes from './modules/educator/educatorRoutes';
import userRoutes from './modules/user/userRoutes';
import bannerRoutes from './modules/content/bannerRoutes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

dotenv.config();

const app = express();

// Serve static uploaded files locally
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Enable CORS
app.use(

  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Global Clerk Authentication Middleware
app.use(clerkMiddleware());

// Body parser for JSON (Note: /webhooks/clerk uses raw parser handled in authRoutes)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/webhooks/clerk') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Swagger API Documentation Route (Phase 10)
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint (Phase 1)
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'not_configured_or_unreachable';
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Shopping App Backend API',
    version: '1.0.0',
    database: dbStatus,
  });
});

// Mount Module Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', checkoutRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', courseRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', aiRoutes);
app.use('/api/v1', producerRoutes);
app.use('/api/v1', bannerRoutes);
app.use('/api/v1', marketplaceRoutes);
app.use('/api/v1', wishlistRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1', sellerRoutes);
app.use('/api/v1', educatorRoutes);
app.use('/api/v1', userRoutes);

// 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
