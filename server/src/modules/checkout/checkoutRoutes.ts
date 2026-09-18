import { Role } from '@prisma/client';
import { roleGuard } from '../../middleware/roleGuard';
import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  createCheckoutOrder,
  getUserOrders,
  getOrderById,
} from './checkoutController';

const router = Router();

router.post('/checkout', requireAuth(), roleGuard([Role.CUSTOMER]), createCheckoutOrder);
router.get('/orders', requireAuth(), roleGuard([Role.CUSTOMER]), getUserOrders);
router.get('/orders/:id', requireAuth(), roleGuard([Role.CUSTOMER]), getOrderById);

export default router;
