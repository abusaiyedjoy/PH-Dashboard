import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import { sendSuccess } from '../utils/apiResponse';
import { ENV } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = signupSchema.parse(req.body);
      const { user, token } = await AuthService.signup(validated);

      // Set HttpOnly cookie for browser clients
      res.cookie('auth_token', token, COOKIE_OPTIONS);

      sendSuccess(res, { user, token }, 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const { user, token } = await AuthService.login(validated);

      // Set HttpOnly cookie for browser clients
      res.cookie('auth_token', token, COOKIE_OPTIONS);

      sendSuccess(res, { user, token }, 200);
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      sendSuccess(res, { message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
}
