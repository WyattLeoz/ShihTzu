import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import logger from '../config/logger.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { authRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Helper functions
function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      unit: user.unit,
    },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(): string {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post(
  '/register',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().isLength({ min: 1 }).withMessage('Full name is required'),
    body('role').isIn(['citizen', 'responder', 'supervisor', 'gov_admin']),
    body('unit').optional().trim(),
    body('phone').optional().trim(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName, role, unit, phone } = req.body;

    // Check if user exists
    const existingUser = await query({
      text: 'SELECT id FROM users WHERE email = $1',
      values: [email],
    });

    if (existingUser.rows.length > 0) {
      res.status(400).json({
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists',
        },
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Create user
    const result = await query({
      text: `INSERT INTO users (email, password_hash, full_name, role, unit, phone)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, full_name, role, unit, is_active`,
      values: [email, passwordHash, fullName, role, unit, phone],
    });

    const user = result.rows[0];
    const accessToken = generateAccessToken(user);

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        unit: user.unit,
        isActive: user.is_active,
      },
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const result = await query({
      text: 'SELECT * FROM users WHERE email = $1 AND is_active = true',
      values: [email],
    });

    if (result.rows.length === 0) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Update last login
    await query({
      text: 'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      values: [user.id],
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        unit: user.unit,
        isActive: user.is_active,
      },
    });
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token required',
        },
      });
      return;
    }

    try {
      // Verify refresh token
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

      // For simplicity, we'll issue a new token without verifying user
      // In production, you might want to track refresh tokens in the database
      const newAccessToken = jwt.sign(
        {},
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      logger.warn({ error }, 'Invalid refresh token');
      res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const result = await query({
      text: `SELECT id, email, full_name, role, unit, phone, is_active, last_login_at, created_at
             FROM users WHERE id = $1`,
      values: [req.user.id],
    });

    if (result.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      unit: user.unit,
      phone: user.phone,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    });
  })
);

export default router;