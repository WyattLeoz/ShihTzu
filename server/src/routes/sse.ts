import { Router, Response } from 'express';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// Store active connections
const activeConnections = new Map<string, { res: Response; timer: NodeJS.Timeout }>();

// GET /api/sse
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const connectionId = `${userId}-${Date.now()}`;

  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);

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
    activeConnections.set(connectionId, { res, timer });

    logger.info({ connectionId, userId }, 'SSE connection established');

    // Clean up on disconnect
    req.on('close', () => {
      try {
        clearInterval(timer);
        logger.info({ connectionId }, 'SSE connection closed (close event)');
      } catch (error) {
        logger.error({ error, connectionId }, 'Error during SSE close cleanup');
      }
      activeConnections.delete(connectionId);
    });

    req.on('end', () => {
      try {
        clearInterval(timer);
        logger.info({ connectionId }, 'SSE connection closed (end event)');
      } catch (error) {
        logger.error({ error, connectionId }, 'Error during SSE end cleanup');
      }
      activeConnections.delete(connectionId);
    });

    // Handle request errors
    req.on('error', (error) => {
      logger.error({ error, connectionId }, 'SSE request error');
      try {
        clearInterval(timer);
      } catch (clearError) {
        logger.error({ error: clearError }, 'Error clearing timer');
      }
      activeConnections.delete(connectionId);
    });

    // Handle response errors
    res.on('error', (error) => {
      logger.error({ error, connectionId }, 'SSE response error');
      try {
        clearInterval(timer);
      } catch (clearError) {
        logger.error({ error: clearError }, 'Error clearing timer');
      }
      activeConnections.delete(connectionId);
    });

  } catch (error) {
    logger.error({ error, connectionId }, 'Error setting up SSE');
    try {
      res.end();
    } catch (endError) {
      logger.error({ error: endError }, 'Error ending SSE response');
    }
  }
});

// GET /api/sse/public (for public broadcasts)
router.get('/public', async (req, res: Response) => {
  const connectionId = `public-${Date.now()}`;

  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);

    // Send keepalive every 25 seconds
    const timer = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch (error) {
        // Connection might be closed
        clearInterval(timer);
      }
    }, 25000);

    logger.info({ connectionId }, 'Public SSE connection established');

    // Clean up on disconnect
    req.on('close', () => {
      try {
        clearInterval(timer);
        logger.info({ connectionId }, 'Public SSE connection closed (close event)');
      } catch (error) {
        logger.error({ error, connectionId }, 'Error during public SSE close cleanup');
      }
    });

    req.on('end', () => {
      try {
        clearInterval(timer);
        logger.info({ connectionId }, 'Public SSE connection closed (end event)');
      } catch (error) {
        logger.error({ error, connectionId }, 'Error during public SSE end cleanup');
      }
    });

    // Handle request errors
    req.on('error', (error) => {
      logger.error({ error, connectionId }, 'Public SSE request error');
      try {
        clearInterval(timer);
      } catch (clearError) {
        logger.error({ error: clearError }, 'Error clearing timer');
      }
    });

    // Handle response errors
    res.on('error', (error) => {
      logger.error({ error, connectionId }, 'Public SSE response error');
      try {
        clearInterval(timer);
      } catch (clearError) {
        logger.error({ error: clearError }, 'Error clearing timer');
      }
    });

  } catch (error) {
    logger.error({ error, connectionId }, 'Error setting up public SSE');
    try {
      res.end();
    } catch (endError) {
      logger.error({ error: endError }, 'Error ending public SSE response');
    }
  }
});

export default router;