import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    unit?: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fall back to query parameter (for SSE connections)
    if (!token && req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
        unit?: string;
      };

      req.user = decoded;
      next();
    } catch (error) {
      logger.warn({ error }, 'Invalid or expired token');
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
      return;
    }
  } catch (error) {
    logger.error({ error }, 'Auth middleware error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      return;
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fall back to query parameter (for SSE connections)
    if (!token && req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
        unit?: string;
      };

      req.user = decoded;
    } catch (error) {
      // Silently fail for optional auth
      logger.debug({ error }, 'Optional auth: invalid token');
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Optional auth middleware error');
    next();
  }
}