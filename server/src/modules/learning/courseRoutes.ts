import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { roleGuard } from '../../middleware/roleGuard';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getMyLearning,
  updateCourseProgress,
} from './courseController';

const router = Router();

// Public Course Catalog Routes
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);

// Protected My Learning Routes
router.get('/my-learning', requireAuth(), getMyLearning);
router.patch('/courses/:id/progress', requireAuth(), updateCourseProgress);

// Educator / Admin Management Routes
router.post('/courses', requireAuth(), roleGuard(['EDUCATOR', 'ADMIN']), createCourse);
router.put('/courses/:id', requireAuth(), roleGuard(['EDUCATOR', 'ADMIN']), updateCourse);
router.delete('/courses/:id', requireAuth(), roleGuard(['EDUCATOR', 'ADMIN']), deleteCourse);

export default router;
