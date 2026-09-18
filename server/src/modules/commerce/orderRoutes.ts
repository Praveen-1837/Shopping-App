import { Role } from '@prisma/client';
import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { roleGuard } from '../../middleware/roleGuard';
import {
  updateOrderStatus,
  getMyOrders,
  getSellerOrders,
  getOrderDetail,
  getOrderTransitions,
  requestCancellation
} from './orderController';

const router = Router();

// Order transition rules (Publicly available to build UI, avoids /orders/:id wildcard collision)
router.get('/order-transitions', getOrderTransitions);

// Customer Order History & Detail
router.get('/my-world/orders', requireAuth(), roleGuard([Role.CUSTOMER]), getMyOrders);
router.get('/orders/:id', requireAuth(), roleGuard([Role.CUSTOMER]), getOrderDetail);

// Seller Order Management Queue & Status Transition
router.get('/seller/orders', requireAuth(), roleGuard(['SELLER', 'FARMER', 'ARTISAN', 'ADMIN']), getSellerOrders);
router.patch('/orders/:id/status', requireAuth(), roleGuard(['SELLER', 'FARMER', 'ARTISAN', 'DELIVERY_PARTNER', 'ADMIN']), updateOrderStatus);
router.post('/orders/:id/request-cancellation', requireAuth(), roleGuard(['SELLER', 'FARMER', 'ARTISAN']), requestCancellation);

export default router;
