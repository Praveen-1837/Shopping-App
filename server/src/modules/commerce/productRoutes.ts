import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { roleGuard } from '../../middleware/roleGuard';
import { Role } from '@prisma/client';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategoryPreviews,
  getProductReviews,
  addProductReview,
} from './productController';
import { upload, handleImageUpload } from './uploadService';

const router = Router();

const SELLER_ROLES: Role[] = [Role.SELLER, Role.FARMER, Role.ARTISAN, Role.ADMIN];

// Image Upload Endpoint
router.post(
  '/products/upload-image',
  requireAuth(),
  roleGuard(SELLER_ROLES),
  upload.single('image'),
  handleImageUpload
);

// Product CRUD & Preview Endpoints
router.post('/products', requireAuth(), roleGuard(SELLER_ROLES), createProduct);
router.get('/products', getProducts);
router.get('/products/category-previews', getCategoryPreviews);
router.get('/products/:id', getProductById);
router.put('/products/:id', requireAuth(), roleGuard(SELLER_ROLES), updateProduct);
router.delete('/products/:id', requireAuth(), roleGuard(SELLER_ROLES), deleteProduct);

// Product Review Endpoints
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', requireAuth(), addProductReview);

export default router;
