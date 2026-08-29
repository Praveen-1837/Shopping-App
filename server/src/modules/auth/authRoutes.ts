import { Router } from 'express';
import express from 'express';
import { requireAuth } from '@clerk/express';
import { handleClerkWebhook } from './webhookController';
import { getMe, adminPing, devUpdateRole } from './authController';
import { roleGuard } from '../../middleware/roleGuard';
import { Role } from '@prisma/client';

const router = Router();

// Clerk Webhook endpoint - requires raw body for Svix signature verification
router.post(
  '/webhooks/clerk',
  express.raw({ type: 'application/json' }),
  handleClerkWebhook
);

// Protected route to fetch logged-in user profile from Postgres
router.get('/me', requireAuth(), getMe);

// Dev helper to update role in DB directly for local testing without webhooks
router.patch('/dev/role', requireAuth(), devUpdateRole);

// Role-gated route accessible only to ADMIN role
router.get('/admin/ping', requireAuth(), roleGuard([Role.ADMIN]), adminPing);

export default router;
