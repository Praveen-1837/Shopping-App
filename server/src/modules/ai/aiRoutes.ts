import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { chatWithAssistant, searchCatalog, searchByCategory } from './aiController';

const router = Router();

// Streaming AI Assistant Chat Endpoint
router.post('/ai/chat', requireAuth(), chatWithAssistant);

// AI Semantic Search Endpoint
router.get('/ai/search', searchCatalog);
router.post('/ai/search', searchCatalog);

// AI Explicit Category Search Endpoint (Change 4)
router.get('/ai/category-search', searchByCategory);
router.post('/ai/category-search', searchByCategory);

export default router;
