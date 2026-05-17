import { Router } from 'express';
import { body } from 'express-validator';
import { query } from '../config/db.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/volunteers
router.post(
  '/',
  requireAuth,
  [
    body('fullName').trim().isLength({ min: 1 }),
    body('phone').trim().isLength({ min: 8 }),
    body('skills').isArray().withMessage('Skills must be an array'),
    body('skills.*').isIn(['first_aid', 'cpr', 'medical_support', 'vehicle', 'heavy_lifting', 'transport', 'translation', 'psychological_support']),
    body('postalDistrict').optional().trim(),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fullName, phone, skills, postalDistrict } = req.body;

    // Check if volunteer with same phone exists
    const existing = await query({
      text: 'SELECT id FROM volunteers WHERE phone = $1',
      values: [phone],
    });

    if (existing.rows.length > 0) {
      res.status(400).json({
        error: {
          code: 'VOLUNTEER_EXISTS',
          message: 'A volunteer with this phone number already exists',
        },
      });
      return;
    }

    const result = await query({
      text: `INSERT INTO volunteers (user_id, full_name, phone, skills, postal_district)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      values: [req.user!.id, fullName, phone, skills, postalDistrict || null],
    });

    const volunteer = result.rows[0];
    res.status(201).json({
      id: volunteer.id,
      fullName: volunteer.full_name,
      phone: volunteer.phone,
      skills: volunteer.skills,
      postalDistrict: volunteer.postal_district,
      isAvailable: volunteer.is_available,
      createdAt: volunteer.created_at,
    });
  })
);

export default router;