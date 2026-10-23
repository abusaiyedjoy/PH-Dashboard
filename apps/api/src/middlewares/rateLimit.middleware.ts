import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ENV } from '../config/env';

/**
 * Rate limiter for project submission endpoint.
 * Policy: 5 submissions per minute per authenticated student.
 */
export const submissionRateLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS, // 1 minute
  max: ENV.RATE_LIMIT_MAX_SUBMISSIONS,
  keyGenerator: (req: Request) => {
    // Rate limit by authenticated user ID if available, otherwise IP
    return req.user?.id || req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message:
        'Too many project submissions. Please wait 1 minute before submitting another project.',
    });
  },
});

/**
 * Rate limiter for user login endpoint.
 * Policy: 5 login attempts per 15 minutes per IP to deter brute-force attacks.
 * In automated test runs, skip to allow extensive suite assertions.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENV.RATE_LIMIT_MAX_LOGIN,
  skip: () => ENV.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message:
        'Too many login attempts from this address. Please try again after 15 minutes.',
    });
  },
});

/**
 * General API rate limiter for standard endpoints.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: () => ENV.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please slow down your requests.',
    });
  },
});
