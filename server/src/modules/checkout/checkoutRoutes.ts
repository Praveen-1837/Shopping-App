import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  createCheckoutOrder,
  getUserOrders,
  getOrderById,
} from './checkoutController';

const router = Router();

router.post('/checkout', requireAuth(), createCheckoutOrder);
router.get('/orders', requireAuth(), getUserOrders);
router.get('/orders/:id', requireAuth(), getOrderById);

export default router;
