import { Router } from 'express';
import { roleGuard } from '../../middleware/roleGuard';
import {
  getAdminStats,
  getAdminStores,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminUsers,
  toggleUserBlockStatus,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  getAdminProducts,
  updateAdminProductStatus,
  deleteAdminProduct,
  getAdminSettings,
  updateAdminSettings,
  getCancellationRequests,
  approveCancellation,
  rejectCancellation,
  getAdminAnalytics,
} from './adminController';

const router = Router();

// Protect all admin endpoints with ADMIN roleGuard
router.use('/admin', roleGuard(['ADMIN']));

// Stats Endpoint
router.get('/admin/stats', getAdminStats);
router.get('/admin/analytics', getAdminAnalytics);

// Stores Directory Endpoint
router.get('/admin/stores', getAdminStores);

// Categories Endpoints
router.get('/admin/categories', getAdminCategories);
router.post('/admin/categories', createAdminCategory);
router.put('/admin/categories/:id', updateAdminCategory);
router.delete('/admin/categories/:id', deleteAdminCategory);

// User Management Endpoints
router.get('/admin/users', getAdminUsers);
router.patch('/admin/users/:id/block', toggleUserBlockStatus);

// Product Management Endpoints
router.get('/admin/products', getAdminProducts);
router.patch('/admin/products/:id/status', updateAdminProductStatus);
router.delete('/admin/products/:id', deleteAdminProduct);

// Admin Orders & Order Detail / Status Endpoints
router.get('/admin/orders', getAdminOrders);
router.get('/admin/orders/:id', getAdminOrderDetail);
router.patch('/admin/orders/:id/status', updateAdminOrderStatus);

// Admin Cancellation Requests
router.get('/admin/cancellation-requests', getCancellationRequests);
router.patch('/admin/orders/:id/approve-cancellation', approveCancellation);
router.patch('/admin/orders/:id/reject-cancellation', rejectCancellation);

// Site Settings Endpoints
router.get('/admin/settings', getAdminSettings);
router.put('/admin/settings', updateAdminSettings);

export default router;
