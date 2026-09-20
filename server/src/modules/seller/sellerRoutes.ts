import { Router } from 'express';
import { roleGuard } from '../../middleware/roleGuard';
import {
  getSellerSalesAnalytics,
  getAnalytics,
  getSellerAlerts,
  getSellerProfile,
  updateSellerProfile,
  generatePackingSlip,
  generateInvoice,
  createProduct,
  getSellerOrders,
} from './sellerController';

const router = Router();

const SELLER_ROLES = ['SELLER', 'FARMER', 'ARTISAN', 'ADMIN'] as const;

// Seller analytics & alerts
router.get('/seller/analytics', roleGuard([...SELLER_ROLES]), getAnalytics);
router.get('/seller/analytics/sales', roleGuard([...SELLER_ROLES]), getSellerSalesAnalytics);
router.get('/seller/alerts', roleGuard([...SELLER_ROLES]), getSellerAlerts);

// Store branding profile
router.get('/seller/profile', roleGuard([...SELLER_ROLES]), getSellerProfile);
router.put('/seller/profile', roleGuard([...SELLER_ROLES]), updateSellerProfile);

import { requireAuth } from '@clerk/express';

// Order Packing Slip & Invoice PDF Downloads
router.get('/orders/:id/packing-slip', roleGuard([...SELLER_ROLES]), generatePackingSlip);
router.get('/orders/:id/invoice', requireAuth(), generateInvoice);

// NEW ROUTES
router.post('/seller/product', roleGuard([...SELLER_ROLES]), createProduct);
router.get('/seller/orders', roleGuard([...SELLER_ROLES]), getSellerOrders);

export default router;
