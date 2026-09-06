import { Router } from 'express';
import { roleGuard } from '../../middleware/roleGuard';
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
} from './bannerController';

const router = Router();

// Public Banner Route
router.get('/banners', getActiveBanners);

// Admin Banner Management Routes
router.get('/admin/banners', roleGuard(['ADMIN']), getAllBanners);
router.post('/admin/banners', roleGuard(['ADMIN']), createBanner);
router.put('/admin/banners/:id', roleGuard(['ADMIN']), updateBanner);
router.delete('/admin/banners/:id', roleGuard(['ADMIN']), deleteBanner);
router.patch('/admin/banners/:id/toggle', roleGuard(['ADMIN']), toggleBannerActive);

export default router;
