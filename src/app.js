/**
 * Express application factory.
 *
 * Exported separately from the server bootstrap so tests can exercise the API
 * in-process (no port binding). Security middleware (helmet, CORS, rate limit,
 * body-size cap) is wired here so every route inherits it.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import metaRoutes from './routes/meta.js';
import chatRoutes from './routes/chat.js';
import venueRoutes from './routes/venues.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Behind Vercel / Cloud Run there is exactly one trusted proxy hop; this
  // lets express-rate-limit key on the real client IP instead of the proxy's.
  app.set('trust proxy', 1);

  // --- Security headers (helmet) with a tight Content-Security-Policy. ---
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  // --- CORS: explicit allow-list, or open in development. ---
  app.use(
    cors({
      origin: config.cors.origin === '*' ? true : config.cors.origin.split(',').map((s) => s.trim()),
    }),
  );

  // --- Body parsing with a hard size cap (bounds abuse). ---
  app.use(express.json({ limit: '128kb' }));

  // --- Rate limiting on the API surface. ---
  app.use(
    '/api',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'rate_limited', message: 'Too many requests — please slow down.' },
    }),
  );

  // --- Routes ---
  app.use('/api', metaRoutes);
  app.use('/api', chatRoutes);
  app.use('/api', venueRoutes);
  app.use('/api', notFound); // JSON 404 for unknown API paths

  // --- Static frontend ---
  app.use(express.static(PUBLIC_DIR, { maxAge: '1h', extensions: ['html'] }));

  // --- Error handler (last) ---
  app.use(errorHandler);

  return app;
}
