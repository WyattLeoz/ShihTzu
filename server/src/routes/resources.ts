import { Router, Response } from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { query } from '../config/db.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/resources/hospitals
router.get(
  '/hospitals',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await query({
      text: `SELECT
        id,
        name,
        short_name,
        address,
        lat,
        lng,
        total_beds,
        available_beds,
        icu_available,
        trauma_bays,
        last_updated_at,
        created_at
       FROM hospitals
       ORDER BY name`,
    });

    res.json({
      hospitals: result.rows.map((h: any) => ({
        id: h.id,
        name: h.name,
        shortName: h.short_name,
        address: h.address,
        lat: h.lat,
        lng: h.lng,
        totalBeds: h.total_beds,
        availableBeds: h.available_beds,
        icuAvailable: h.icu_available,
        traumaBays: h.trauma_bays,
        lastUpdatedAt: h.last_updated_at,
        createdAt: h.created_at,
      })),
    });
  })
);

// PATCH /api/resources/hospitals/:id
router.patch(
  '/hospitals/:id',
  requireAuth,
  requireRole('gov_admin'),
  [
    param('id').isUUID(),
    body('availableBeds').optional().isInt({ min: 0, max: 5000 }),
    body('icuAvailable').optional().isInt({ min: 0, max: 200 }),
    body('traumaBays').optional().isInt({ min: 0, max: 50 }),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { availableBeds, icuAvailable, traumaBays } = req.body;

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let valueIndex = 1;

    if (availableBeds !== undefined) {
      updateFields.push(`available_beds = $${valueIndex++}`);
      updateValues.push(availableBeds);
    }

    if (icuAvailable !== undefined) {
      updateFields.push(`icu_available = $${valueIndex++}`);
      updateValues.push(icuAvailable);
    }

    if (traumaBays !== undefined) {
      updateFields.push(`trauma_bays = $${valueIndex++}`);
      updateValues.push(traumaBays);
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update',
        },
      });
      return;
    }

    updateFields.push('last_updated_at = NOW()');
    updateValues.push(id);

    const result = await query({
      text: `UPDATE hospitals
             SET ${updateFields.join(', ')}
             WHERE id = $${valueIndex}
             RETURNING *`,
      values: updateValues,
    });

    if (result.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'HOSPITAL_NOT_FOUND',
          message: 'Hospital not found',
        },
      });
      return;
    }

    const hospital = result.rows[0];
    res.json({
      id: hospital.id,
      name: hospital.name,
      shortName: hospital.short_name,
      availableBeds: hospital.available_beds,
      icuAvailable: hospital.icu_available,
      traumaBays: hospital.trauma_bays,
      lastUpdatedAt: hospital.last_updated_at,
    });
  })
);

// GET /api/resources/volunteers
router.get(
  '/volunteers',
  requireAuth,
  [
    queryValidator('skill').optional().trim(),
    queryValidator('available').optional().isIn(['true', 'false']),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { skill, available } = req.query as any;

    let conditions: string[] = ['is_available = true'];
    let params: any[] = [];
    let paramIndex = 1;

    if (available !== undefined) {
      conditions[0] = `is_available = $${paramIndex++}`;
      params.push(available === 'true');
    }

    if (skill) {
      conditions.push(`$${paramIndex++} = ANY(skills)`);
      params.push(skill);
    }

    const result = await query({
      text: `SELECT
        id,
        user_id,
        full_name,
        phone,
        skills,
        postal_district,
        is_available,
        last_active_at,
        created_at,
        updated_at
       FROM volunteers
       WHERE ${conditions.join(' AND ')}
       ORDER BY last_active_at DESC NULLS LAST, created_at DESC`,
      values: params,
    });

    res.json({
      volunteers: result.rows.map((v: any) => ({
        id: v.id,
        userId: v.user_id,
        fullName: v.full_name,
        phone: v.phone,
        skills: v.skills,
        postalDistrict: v.postal_district,
        isAvailable: v.is_available,
        lastActiveAt: v.last_active_at,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
    });
  })
);

export default router;