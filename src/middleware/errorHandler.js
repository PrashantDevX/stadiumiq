/**
 * Centralized error handling.
 *
 * Never leaks stack traces or internal messages to clients in production — a
 * basic but important security practice. Full detail is logged server-side.
 */
import { logger } from '../utils/logger.js';
import { isProduction } from '../config.js';

/** 404 handler for unmatched routes. */
export function notFound(req, res) {
  res.status(404).json({ error: 'not_found', message: 'Resource not found.' });
}

// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature.
export function errorHandler(err, req, res, next) {
  logger.error('Unhandled request error', { path: req.path, error: err.message });
  res.status(err.status ?? 500).json({
    error: 'internal_error',
    message: isProduction ? 'Something went wrong. Please try again.' : err.message,
  });
}
