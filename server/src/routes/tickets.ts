import { Router } from 'express';
import { body, param } from 'express-validator';
import { query } from '../config/db.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/tickets/:id/updates
router.post(
  '/:id/updates',
  requireAuth,
  [
    param('id').isUUID(),
    body('content').trim().isLength({ min: 1, max: 1000 }),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { content } = req.body;

    // Verify incident exists
    const incidentResult = await query({
      text: 'SELECT id FROM incidents WHERE id = $1',
      values: [id],
    });

    if (incidentResult.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: 'Incident not found',
        },
      });
      return;
    }

    // Create update
    const result = await query({
      text: `INSERT INTO incident_updates (incident_id, author_id, update_type, content)
             VALUES ($1, $2, 'note', $3)
             RETURNING *`,
      values: [id, req.user!.id, content],
    });

    res.status(201).json({
      id: result.rows[0].id,
      updateType: result.rows[0].update_type,
      content: result.rows[0].content,
      createdAt: result.rows[0].created_at,
      author: {
        id: req.user!.id,
        name: req.user!.unit || 'Unknown',
      },
    });
  })
);

export default router;