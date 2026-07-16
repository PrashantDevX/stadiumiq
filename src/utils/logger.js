/**
 * Minimal dependency-free structured logger.
 *
 * Emits single-line JSON in production (easy to ingest by Cloud Logging) and
 * readable text in development. Kept tiny on purpose — no external logging
 * dependency keeps the install small and the audit surface minimal.
 */
import { isProduction } from '../config.js';

function emit(level, message, meta) {
  const entry = { level, message, ...(meta ? { meta } : {}) };
  const line = isProduction
    ? JSON.stringify(entry)
    : `[${level.toUpperCase()}] ${message}${meta ? ' ' + JSON.stringify(meta) : ''}`;
  (level === 'error' ? console.error : console.log)(line);
}

export const logger = {
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};
