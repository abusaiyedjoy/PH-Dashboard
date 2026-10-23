import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { loginRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Public routes
router.post('/signup', AuthController.signup);
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/logout', AuthController.logout);

// Authenticated route
router.get('/me', authenticate, AuthController.getMe);

export default router;
