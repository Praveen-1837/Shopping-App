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

router.get('/cart', requireAuth(), getCart);
router.post('/cart/items', requireAuth(), addToCart);
router.patch('/cart/items/:productId', requireAuth(), patchCartItem);
router.put('/cart/items', requireAuth(), updateCartItem);
router.delete('/cart/items/:productId', requireAuth(), removeCartItem);
router.delete('/cart', requireAuth(), clearCart);

export default router;
