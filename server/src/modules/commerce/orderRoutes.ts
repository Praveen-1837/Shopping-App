import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { roleGuard } from '../../middleware/roleGuard';
import {
  updateOrderStatus,
  getMyOrders,
  getSellerOrders,
  getOrderDetail,
} from './orderController';

const router = Router();

// Customer Order History & Detail
router.get('/my-world/orders', requireAuth(), getMyOrders);
router.get('/orders/:id', requireAuth(), getOrderDetail);

// Seller Order Management Queue & Status Transition
router.get('/seller/orders', requireAuth(), roleGuard(['SELLER', 'FARMER', 'ARTISAN', 'ADMIN']), getSellerOrders);
router.patch('/orders/:id/status', requireAuth(), roleGuard(['SELLER', 'FARMER', 'ARTISAN', 'ADMIN']), updateOrderStatus);

export default router;
