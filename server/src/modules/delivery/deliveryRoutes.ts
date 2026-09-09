import { Router } from 'express';
import { getDeliveryOrders } from './deliveryController';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.get('/orders', requireAuth, getDeliveryOrders);

export default router;
