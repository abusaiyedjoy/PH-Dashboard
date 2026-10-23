import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/apiResponse';
import { ENV } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(message: string, statusCode = 400, errors?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * 404 handler for undefined endpoints.
 */
export function notFoundHandler(req: Request, res: Response) {
  sendError(res, `Cannot ${req.method} ${req.originalUrl} - Route not found`, 404);
}

/**
 * Global error handling middleware.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formatted = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 'Validation error. Please check your input.', 400, formatted);
  }

  // 2. Custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : 'unique field';
      return sendError(
        res,
        `Conflict: A record with this ${target} already exists.`,
        409
      );
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Requested resource was not found.', 404);
    }
  }

  // 4. Unexpected server error
  const isDev = ENV.NODE_ENV === 'development';
  console.error('Unhandled server error:', err);

  return sendError(
    res,
    isDev && err instanceof Error ? err.message : 'Internal server error occurred.',
    500
  );
}
