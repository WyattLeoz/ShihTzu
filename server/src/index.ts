import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initDb, closeDb } from './config/db.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalRateLimit } from './middleware/rateLimit.js';

import authRouter from './routes/auth.js';
import incidentsRouter from './routes/incidents.js';
import ticketsRouter from './routes/tickets.js';
import resourcesRouter from './routes/resources.js';
import broadcastsRouter from './routes/broadcasts.js';
import volunteersRouter from './routes/volunteers.js';
import geminiRouter from './services/gemini.js';
import sseRouter from './routes/sse.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, ip: req.ip }, 'Incoming request');
  next();
});

// Rate limiting
app.use('/api', generalRateLimit);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/broadcasts', broadcastsRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/ai', geminiRouter);
app.use('/api/sse', sseRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
let server: any;

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal');

  server.close(async (err: any) => {
    if (err) {
      logger.error({ error: err }, 'Error closing server');
      process.exit(1);
    }

    logger.info('Server closed');

    try {
      await closeDb();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error closing database');
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start server
async function startServer() {
  try {
    await initDb();

    server = app.listen(env.PORT, () => {
      logger.info({
        port: env.PORT,
        environment: env.NODE_ENV,
        corsOrigin: env.CORS_ORIGIN,
      }, 'QuickAid server started');
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught exception');
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled rejection');
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();