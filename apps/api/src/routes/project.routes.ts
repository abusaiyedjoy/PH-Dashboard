import { Router } from 'express';
import { Role } from '@project-review-hub/database';
import { ProjectController } from '../controllers/project.controller';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { submissionRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Student-specific endpoints
router.post(
  '/',
  authenticate,
  requireRoles(Role.STUDENT),
  submissionRateLimiter,
  ProjectController.submit
);

router.get(
  '/my',
  authenticate,
  requireRoles(Role.STUDENT),
  ProjectController.getMyProjects
);

router.get(
  '/my/stats',
  authenticate,
  requireRoles(Role.STUDENT),
  ProjectController.getMyStats
);

// Mentor / Admin review endpoints
router.get(
  '/stats',
  authenticate,
  requireRoles(Role.MENTOR, Role.ADMIN),
  ProjectController.getGlobalStats
);

router.get(
  '/',
  authenticate,
  requireRoles(Role.MENTOR, Role.ADMIN),
  ProjectController.getAll
);

// Single project access (Student views own, Mentor/Admin views any)
router.get('/:id', authenticate, ProjectController.getById);

// Review action (Approve/Reject)
router.patch(
  '/:id/review',
  authenticate,
  requireRoles(Role.MENTOR, Role.ADMIN),
  ProjectController.review
);

export default router;
