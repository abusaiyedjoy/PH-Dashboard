import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

export default router;
