import { Router } from 'express';
import { roleGuard } from '../../middleware/roleGuard';
import { requireAuth } from '../../middleware/requireAuth';
import {
  getEducatorStats,
  getEducatorActivityFeed,
  getEducatorRevenueAnalytics,
  getCourseStudents,
  getCourseStudentDetail,
  getCourseReviews,
  replyToReview,
  addCourseReview,
  getPublicCourseReviews,
} from './educatorController';

const router = Router();

const EDUCATOR_ROLES = ['EDUCATOR', 'ADMIN'] as const;

// Educator Analytics & Dashboard
router.get('/educator/stats', roleGuard([...EDUCATOR_ROLES]), getEducatorStats);
router.get('/educator/activity-feed', roleGuard([...EDUCATOR_ROLES]), getEducatorActivityFeed);
router.get('/educator/analytics/revenue', roleGuard([...EDUCATOR_ROLES]), getEducatorRevenueAnalytics);

// Student Roster & Detailed Progress Breakdown
router.get('/educator/courses/:id/students', roleGuard([...EDUCATOR_ROLES]), getCourseStudents);
router.get('/educator/courses/:id/students/:studentId', roleGuard([...EDUCATOR_ROLES]), getCourseStudentDetail);

// Course Reviews Management
router.get('/educator/courses/:id/reviews', roleGuard([...EDUCATOR_ROLES]), getCourseReviews);
router.patch('/reviews/:id/reply', roleGuard([...EDUCATOR_ROLES]), replyToReview);

// Public Student Review Routes
router.post('/courses/:id/reviews', requireAuth, addCourseReview);
router.get('/courses/:id/reviews', getPublicCourseReviews);

export default router;
