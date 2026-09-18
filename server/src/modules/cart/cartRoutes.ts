import { Role } from '@prisma/client';
import { roleGuard } from '../../middleware/roleGuard';
import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  getCart,
  addToCart,
  patchCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cartController';

const router = Router();

router.get('/cart', requireAuth(), roleGuard([Role.CUSTOMER]), getCart);
router.post('/cart/items', requireAuth(), roleGuard([Role.CUSTOMER]), addToCart);
router.patch('/cart/items/:productId', requireAuth(), roleGuard([Role.CUSTOMER]), patchCartItem);
router.patch('/cart/items', requireAuth(), roleGuard([Role.CUSTOMER]), patchCartItem);
router.put('/cart/items/:productId', requireAuth(), roleGuard([Role.CUSTOMER]), updateCartItem);
router.put('/cart/items', requireAuth(), roleGuard([Role.CUSTOMER]), updateCartItem);
router.delete('/cart/items/:productId', requireAuth(), roleGuard([Role.CUSTOMER]), removeCartItem);
router.delete('/cart/items', requireAuth(), roleGuard([Role.CUSTOMER]), removeCartItem);
router.delete('/cart/clear', requireAuth(), roleGuard([Role.CUSTOMER]), clearCart);
router.delete('/cart', requireAuth(), roleGuard([Role.CUSTOMER]), clearCart);

export default router;
