import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { getSellerAnalytics, getEducatorAnalytics } from './analyticsController';
import { applyForRole, getPendingApplications, reviewRoleApplication } from './onboardingController';

const router = Router();

// Dashboard Analytics Endpoints
router.get('/seller/analytics', requireAuth(), getSellerAnalytics);
router.get('/educator/analytics', requireAuth(), getEducatorAnalytics);

// Role Onboarding Endpoints
router.post('/onboarding/apply', requireAuth(), applyForRole);
router.get('/admin/onboarding', requireAuth(), getPendingApplications);
router.patch('/admin/onboarding/:id', requireAuth(), reviewRoleApplication);

export default router;
