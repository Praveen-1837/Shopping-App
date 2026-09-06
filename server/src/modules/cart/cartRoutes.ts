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
router.patch('/cart/items', requireAuth(), patchCartItem);
router.put('/cart/items/:productId', requireAuth(), updateCartItem);
router.put('/cart/items', requireAuth(), updateCartItem);
router.delete('/cart/items/:productId', requireAuth(), removeCartItem);
router.delete('/cart/items', requireAuth(), removeCartItem);
router.delete('/cart/clear', requireAuth(), clearCart);
router.delete('/cart', requireAuth(), clearCart);

export default router;
