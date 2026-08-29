import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getProducerProfile, updateProducerProfile, updateProductTraceability } from './producerController';

const router = Router();

// Public Producer Profile View
router.get('/producers/:id', getProducerProfile);

// Protected Producer Profile & Product Traceability Updates
router.put('/producers/:id', requireAuth(), updateProducerProfile);
router.patch('/products/:id/traceability', requireAuth(), updateProductTraceability);

export default router;
