import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from './wishlistController';

const router = Router();

router.get('/wishlist', requireAuth(), getWishlist);
router.post('/wishlist', requireAuth(), addToWishlist);
router.delete('/wishlist/:id', requireAuth(), removeFromWishlist);

export default router;
