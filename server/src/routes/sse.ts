import { Router, Response } from 'express';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';

const router = Router();

// Store active connections
const activeConnections = new Map<string, { res: Response; pool: Pool; timer: NodeJS.Timeout }>();

// GET /api/sse
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const connectionId = `${userId}-${Date.now()}`;

  // Create a new pool connection for this client
  const pool = new (await import('../config/db.js')).default;

  try {
    await pool.query('SELECT NOW()');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);

    // Listen to PostgreSQL NOTIFY channels
    // TODO: Fix unhandled rejection in LISTEN commands
    // await pool.query('LISTEN incident_updates');
    // await pool.query('LISTEN timeline_updates');

    pool.on('notification', (msg) => {
      try {
        const payload = JSON.parse(msg.payload);

        let eventType: string;
        if (msg.channel === 'incident_updates') {
          eventType = 'incident_updated';
        } else if (msg.channel === 'timeline_updates') {
          eventType = 'timeline_added';
        } else {
          eventType = 'unknown';
        }

        res.write(`data: ${JSON.stringify({ type: eventType, payload })}\n\n`);
      } catch (error) {
        console.error('Error processing notification:', error);
        // Don't crash on notification errors
      }
    });

    // Send keepalive every 25 seconds
    const timer = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch (error) {
        // Connection might be closed
        clearInterval(timer);
      }
    }, 25000);

    // Store connection
    activeConnections.set(connectionId, { res, pool, timer });

    // Clean up on disconnect
    req.on('close', async () => {
      try {
        clearInterval(timer);
        // TODO: Fix unhandled rejection in LISTEN commands
        // await pool.query('UNLISTEN incident_updates');
        // await pool.query('UNLISTEN timeline_updates');
        await pool.end();
      } catch (error) {
        console.error('Error during SSE cleanup:', error);
      }
      activeConnections.delete(connectionId);
    });

    req.on('end', async () => {
      try {
        clearInterval(timer);
        // TODO: Fix unhandled rejection in LISTEN commands
        // await pool.query('UNLISTEN incident_updates');
        // await pool.query('UNLISTEN timeline_updates');
        await pool.end();
      } catch (error) {
        console.error('Error during SSE cleanup:', error);
      }
      activeConnections.delete(connectionId);
    });

    // Handle request errors
    req.on('error', (error) => {
      console.error('SSE request error:', error);
      clearInterval(timer);
      activeConnections.delete(connectionId);
    });

    // Handle response errors
    res.on('error', (error) => {
      console.error('SSE response error:', error);
      clearInterval(timer);
      activeConnections.delete(connectionId);
    });

  } catch (error) {
    console.error('Error setting up SSE:', error);
    try {
      await pool.end();
    } catch (endError) {
      console.error('Error closing pool:', endError);
    }
    res.end();
  }
});

// GET /api/sse/public (for public broadcasts)
router.get('/public', async (req, res: Response) => {
  const connectionId = `public-${Date.now()}`;

  // Create a new pool connection for this client
  const pool = new (await import('../config/db.js')).default;

  try {
    await pool.query('SELECT NOW()');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);

    // Listen to broadcasts (we'd need a broadcast trigger, for now we can simulate)
    // In production, add a broadcast trigger and listen here

    // Send keepalive every 25 seconds
    const timer = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch (error) {
        // Connection might be closed
        clearInterval(timer);
      }
    }, 25000);

    // Clean up on disconnect
    req.on('close', async () => {
      try {
        clearInterval(timer);
        await pool.end();
      } catch (error) {
        console.error('Error during public SSE cleanup:', error);
      }
    });

    req.on('end', async () => {
      try {
        clearInterval(timer);
        await pool.end();
      } catch (error) {
        console.error('Error during public SSE cleanup:', error);
      }
    });

    // Handle request errors
    req.on('error', (error) => {
      console.error('Public SSE request error:', error);
      clearInterval(timer);
    });

    // Handle response errors
    res.on('error', (error) => {
      console.error('Public SSE response error:', error);
      clearInterval(timer);
    });

  } catch (error) {
    console.error('Error setting up public SSE:', error);
    try {
      await pool.end();
    } catch (endError) {
      console.error('Error closing pool:', endError);
    }
    res.end();
  }
});

export default router;