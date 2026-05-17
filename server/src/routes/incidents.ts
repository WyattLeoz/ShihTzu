import { Router, Request, Response } from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { query, transaction } from '../config/db.js';
import logger from '../config/logger.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Helper: Generate ticket number
function generateTicketNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
  return `INC-${dateStr}-${timeStr}`;
}

// GET /api/incidents
router.get(
  '/',
  optionalAuth,
  [
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).toInt(),
    queryValidator('status').optional().isIn(['open', 'triaging', 'dispatched', 'on_scene', 'resolved', 'closed']),
    queryValidator('type').optional().isIn(['medical', 'flood', 'fire', 'road', 'infrastructure', 'civil', 'other']),
    queryValidator('severity').optional().isIn(['1', '2', '3']),
    queryValidator('startDate').optional().isISO8601(),
    queryValidator('endDate').optional().isISO8601(),
    queryValidator('q').optional().trim(),
    queryValidator('sortBy').optional().isIn(['created_at', 'severity', 'ai_score']),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      limit = 20,
      offset = 0,
      status,
      type,
      severity,
      startDate,
      endDate,
      q,
      sortBy = 'created_at',
    } = req.query as any;

    let conditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(parseInt(severity));
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    if (q) {
      conditions.push(`to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $${paramIndex++})`);
      params.push(q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderClause = sortBy === 'created_at'
      ? 'ORDER BY created_at DESC'
      : sortBy === 'severity'
        ? 'ORDER BY severity ASC, created_at DESC'
        : 'ORDER BY ai_triage_data->\'options\'->0->\'confidence\' DESC NULLS LAST, created_at DESC';

    const result = await query({
      text: `
        SELECT
          id,
          ticket_number,
          type,
          title,
          description,
          location_text,
          location_lat,
          location_lng,
          severity,
          status,
          reported_by,
          assigned_to,
          ai_triage_data,
          approved_option,
          created_at,
          updated_at
        FROM incidents
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `,
      values: [...params, limit, offset],
    });

    // Get total count
    const countResult = await query({
      text: `SELECT COUNT(*) as total FROM incidents ${whereClause}`,
      values: params,
    });

    res.json({
      incidents: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    });
  })
);

// POST /api/incidents
router.post(
  '/',
  requireAuth,
  [
    body('type').isIn(['medical', 'flood', 'fire', 'road', 'infrastructure', 'civil', 'other']),
    body('title').trim().isLength({ min: 10, max: 120 }),
    body('description').trim().isLength({ min: 20 }),
    body('locationText').trim().isLength({ min: 1 }),
    body('locationLat').optional().isFloat({ min: -90, max: 90 }),
    body('locationLng').optional().isFloat({ min: -180, max: 180 }),
    body('severity').optional().isIn(['1', '2', '3']),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      type,
      title,
      description,
      locationText,
      locationLat,
      locationLng,
      severity = '2',
    } = req.body;

    const ticketNumber = generateTicketNumber();

    await transaction(async (client) => {
      // Create incident
      const incidentResult = await client.query({
        text: `INSERT INTO incidents
               (ticket_number, type, title, description, location_text, location_lat, location_lng, severity, status, reported_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9)
               RETURNING *`,
        values: [
          ticketNumber,
          type,
          title,
          description,
          locationText,
          locationLat || null,
          locationLng || null,
          parseInt(severity),
          req.user!.id,
        ],
      });

      const incident = incidentResult.rows[0];

      // Create initial timeline entry
      await client.query({
        text: `INSERT INTO incident_updates (incident_id, author_id, update_type, content, metadata)
               VALUES ($1, $2, 'system', $3, $4)`,
        values: [
          incident.id,
          req.user!.id,
          `Incident ${ticketNumber} reported via QuickAid`,
          JSON.stringify({ type, severity }),
        ],
      });

      return incident;
    });

    res.status(201).json({ message: 'Incident created', ticketNumber });
  })
);

// GET /api/incidents/:id
router.get(
  '/:id',
  requireAuth,
  [param('id').isUUID()],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const incidentResult = await query({
      text: `SELECT
        i.*,
        reporter.email as reporter_email,
        reporter.full_name as reporter_name,
        assignee.email as assignee_email,
        assignee.full_name as assignee_name,
        assignee.unit as assignee_unit
       FROM incidents i
       LEFT JOIN users reporter ON i.reported_by = reporter.id
       LEFT JOIN users assignee ON i.assigned_to = assignee.id
       WHERE i.id = $1`,
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

    const incident = incidentResult.rows[0];

    // Get timeline
    const timelineResult = await query({
      text: `SELECT
        iu.*,
        author.full_name as author_name,
        author.role as author_role
       FROM incident_updates iu
       LEFT JOIN users author ON iu.author_id = author.id
       WHERE iu.incident_id = $1
       ORDER BY iu.created_at ASC`,
      values: [id],
    });

    res.json({
      incident: {
        id: incident.id,
        ticketNumber: incident.ticket_number,
        type: incident.type,
        title: incident.title,
        description: incident.description,
        locationText: incident.location_text,
        locationLat: incident.location_lat,
        locationLng: incident.location_lng,
        severity: incident.severity,
        status: incident.status,
        aiTriageData: incident.ai_triage_data,
        approvedOption: incident.approved_option,
        approvedBy: incident.approved_by,
        approvedAt: incident.approved_at,
        resolvedAt: incident.resolved_at,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        reportedBy: incident.reported_by ? {
          id: incident.reported_by,
          email: incident.reporter_email,
          name: incident.reporter_name,
        } : null,
        assignedTo: incident.assigned_to ? {
          id: incident.assigned_to,
          email: incident.assignee_email,
          name: incident.assignee_name,
          unit: incident.assignee_unit,
        } : null,
      },
      timeline: timelineResult.rows.map((entry: any) => ({
        id: entry.id,
        updateType: entry.update_type,
        content: entry.content,
        metadata: entry.metadata,
        createdAt: entry.created_at,
        author: entry.author_name ? {
          name: entry.author_name,
          role: entry.author_role,
        } : null,
      })),
    });
  })
);

// PATCH /api/incidents/:id
router.patch(
  '/:id',
  requireAuth,
  requireRole('responder', 'supervisor', 'gov_admin'),
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 10, max: 120 }),
    body('description').optional().trim().isLength({ min: 20 }),
    body('locationText').optional().trim().isLength({ min: 1 }),
    body('locationLat').optional().isFloat({ min: -90, max: 90 }),
    body('locationLng').optional().isFloat({ min: -180, max: 180 }),
    body('assignedTo').optional().isUUID(),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let valueIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      locationText: 'location_text',
      locationLat: 'location_lat',
      locationLng: 'location_lng',
      assignedTo: 'assigned_to',
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && fieldMap[key]) {
        updateFields.push(`${fieldMap[key]} = $${valueIndex++}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields to update',
        },
      });
      return;
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    await transaction(async (client) => {
      // Update incident
      await client.query({
        text: `UPDATE incidents SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
        values: updateValues,
      });

      // Log changes to timeline
      const changes = Object.keys(updates).join(', ');
      await client.query({
        text: `INSERT INTO incident_updates (incident_id, author_id, update_type, content, metadata)
               VALUES ($1, $2, 'field_update', $3, $4)`,
        values: [
          id,
          req.user!.id,
          `Updated fields: ${changes}`,
          JSON.stringify(updates),
        ],
      });
    });

    res.json({ message: 'Incident updated' });
  })
);

// PATCH /api/incidents/:id/approve
router.patch(
  '/:id/approve',
  requireAuth,
  requireRole('responder', 'supervisor', 'gov_admin'),
  [param('id').isUUID(), body('option').isInt({ min: 1, max: 3 })],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { option } = req.body;

    await transaction(async (client) => {
      // Get incident and verify AI data exists
      const incidentResult = await client.query({
        text: 'SELECT * FROM incidents WHERE id = $1',
        values: [id],
      });

      if (incidentResult.rows.length === 0) {
        throw new Error('INCIDENT_NOT_FOUND');
      }

      const incident = incidentResult.rows[0];

      if (!incident.ai_triage_data) {
        throw new Error('NO_AI_DATA');
      }

      // Update incident
      await client.query({
        text: `UPDATE incidents
               SET approved_option = $1,
                   approved_by = $2,
                   approved_at = NOW(),
                   status = 'dispatched',
                   updated_at = NOW()
               WHERE id = $3`,
        values: [option, req.user!.id, id],
      });

      // Log to timeline
      await client.query({
        text: `INSERT INTO incident_updates (incident_id, author_id, update_type, content, metadata)
               VALUES ($1, $2, 'dispatch', $3, $4)`,
        values: [
          id,
          req.user!.id,
          `Option ${option} approved and dispatched`,
          JSON.stringify({ option, approvedBy: req.user!.id }),
        ],
      });

      // TODO: Send notifications (would call notifications service here)
      logger.info({ incidentId: id, option }, 'Notifications would be sent here');
    });

    res.json({ message: 'Option approved and dispatched' });
  })
);

// PATCH /api/incidents/:id/status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('responder', 'supervisor', 'gov_admin'),
  [
    param('id').isUUID(),
    body('status').isIn(['triaging', 'dispatched', 'on_scene', 'resolved', 'closed']),
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    // Get current status
    const currentResult = await query({
      text: 'SELECT status FROM incidents WHERE id = $1',
      values: [id],
    });

    if (currentResult.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'INCIDENT_NOT_FOUND',
          message: 'Incident not found',
        },
      });
      return;
    }

    const currentStatus = currentResult.rows[0].status;

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      open: ['triaging', 'dispatched', 'resolved', 'closed'],
      triaging: ['dispatched', 'resolved', 'closed'],
      dispatched: ['on_scene', 'resolved', 'closed'],
      on_scene: ['resolved', 'closed'],
      resolved: ['closed'],
      closed: [],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition from ${currentStatus} to ${status}`,
        },
      });
      return;
    }

    await transaction(async (client) => {
      // Update status
      await client.query({
        text: `UPDATE incidents
               SET status = $1,
                   ${status === 'resolved' ? 'resolved_at = NOW(),' : ''}
                   updated_at = NOW()
               WHERE id = $2`,
        values: [status, id],
      });

      // Log to timeline
      await client.query({
        text: `INSERT INTO incident_updates (incident_id, author_id, update_type, content, metadata)
               VALUES ($1, $2, 'status_change', $3, $4)`,
        values: [
          id,
          req.user!.id,
          `Status changed from ${currentStatus} to ${status}`,
          JSON.stringify({ from: currentStatus, to: status }),
        ],
      });
    });

    res.json({ message: 'Status updated', status });
  })
);

export default router;