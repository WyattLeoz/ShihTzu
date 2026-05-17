import { Router, Response } from 'express';
import { body, query as queryValidator } from 'express-validator';
import { query } from '../config/db.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/broadcasts
router.post(
  '/',
  requireAuth,
  requireRole('gov_admin', 'supervisor'),
  [
    body('title').trim().isLength({ min: 1, max: 100 }),
    body('message').trim().isLength({ min: 1, max: 500 }),
    body('audience').isIn(['all', 'responders', 'zone']),
    body('zone').optional().trim(),
    body('incidentId').optional().isUUID(),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, message, audience, zone, incidentId } = req.body;

    if (audience === 'zone' && !zone) {
      res.status(400).json({
        error: {
          code: 'ZONE_REQUIRED',
          message: 'Zone is required when audience is "zone"',
        },
      });
      return;
    }

    const result = await query({
      text: `INSERT INTO broadcasts (title, message, audience, zone, sent_by, incident_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
      values: [title, message, audience, zone || null, req.user!.id, incidentId || null],
    });

    const broadcast = result.rows[0];

    // TODO: Send broadcast notifications via SSE
    // This would emit a broadcast_sent event to connected clients

    res.status(201).json({
      id: broadcast.id,
      title: broadcast.title,
      message: broadcast.message,
      audience: broadcast.audience,
      zone: broadcast.zone,
      sentBy: broadcast.sent_by,
      incidentId: broadcast.incident_id,
      createdAt: broadcast.created_at,
    });
  })
);

// GET /api/broadcasts
router.get(
  '/',
  optionalAuth,
  [
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 20, offset = 0 } = req.query as any;

    const result = await query({
      text: `SELECT
        b.*,
        sender.full_name as sender_name,
        sender.role as sender_role
       FROM broadcasts b
       LEFT JOIN users sender ON b.sent_by = sender.id
       ORDER BY b.created_at DESC
       LIMIT $1 OFFSET $2`,
      values: [limit, offset],
    });

    const countResult = await query({
      text: 'SELECT COUNT(*) as total FROM broadcasts',
      values: [],
    });

    res.json({
      broadcasts: result.rows.map((b: any) => ({
        id: b.id,
        title: b.title,
        message: b.message,
        audience: b.audience,
        zone: b.zone,
        sentBy: {
          id: b.sent_by,
          name: b.sender_name,
          role: b.sender_role,
        },
        incidentId: b.incident_id,
        createdAt: b.created_at,
      })),
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    });
  })
);

export default router;