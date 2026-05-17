import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';
import { env } from '../config/env.js';

// Much higher limits for development
const isDevelopment = env.NODE_ENV === 'development';

export const generalRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDevelopment ? 10000 : 100, // Much higher limit in development
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 10000 : 10, // Much higher limit in development
  message: {
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI triage requests limited to 10 per minute',
    },
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'AI rate limit exceeded');
    res.status(429).json({
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI triage requests limited to 10 per minute',
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 10000 : 5, // Much higher limit in development
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Auth rate limit exceeded');
    res.status(429).json({
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later',
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});