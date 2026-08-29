import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { processOrderPayment } from './paymentController';

const router = Router();

router.post('/payments/process', requireAuth(), processOrderPayment);

export default router;
