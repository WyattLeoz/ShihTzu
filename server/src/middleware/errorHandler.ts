import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { ZodError } from 'zod';
// Import removed - no longer using Anthropic
import logger from '../config/logger.js';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  error: Error | ValidationError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Validation errors from express-validator
  if ('array' in error && typeof error.array === 'function') {
    const validationErrors = error.array() as any[];
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validationErrors.map(e => ({
          field: e.path?.join('.') || e.param,
          message: e.msg,
        })),
      },
    });
    return;
  }

  // Validation errors from Zod
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // AI API errors (Gemini)
  if (error.message?.includes('API key not valid') || error.message?.includes('Gemini API')) {
    logger.error({ error: error.message }, 'Gemini API error');
    res.status(502).json({
      error: {
        code: 'AI_SERVICE_ERROR',
        message: 'AI service temporarily unavailable',
      },
    });
    return;
  }

  // Database errors
  if (error.message?.includes('duplicate key')) {
    logger.warn({ error: error.message }, 'Duplicate key violation');
    res.status(400).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this information already exists',
      },
    });
    return;
  }

  if (error.message?.includes('foreign key')) {
    logger.warn({ error: error.message }, 'Foreign key violation');
    res.status(400).json({
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced record does not exist',
      },
    });
    return;
  }

  // Generic database error
  if (error.message?.includes('database') || error.message?.includes('connection')) {
    logger.error({ error: error.message }, 'Database error');
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
      },
    });
    return;
  }

  // Log unexpected errors
  logger.error({ error: error.message, stack: error.stack }, 'Unhandled error');

  // Generic error response
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}