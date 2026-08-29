import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { chatWithAssistant } from './aiController';

const router = Router();

// Streaming AI Assistant Chat Endpoint
router.post('/ai/chat', requireAuth(), chatWithAssistant);

export default router;
