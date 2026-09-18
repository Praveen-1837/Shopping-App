import { Role } from '@prisma/client';
import { roleGuard } from '../../middleware/roleGuard';
import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from './wishlistController';

const router = Router();

router.get('/wishlist', requireAuth(), roleGuard([Role.CUSTOMER]), getWishlist);
router.post('/wishlist', requireAuth(), roleGuard([Role.CUSTOMER]), addToWishlist);
router.delete('/wishlist/:id', requireAuth(), roleGuard([Role.CUSTOMER]), removeFromWishlist);

export default router;
