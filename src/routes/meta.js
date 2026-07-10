/**
 * Metadata & health endpoints.
 *   GET /api/health  — liveness + which AI mode is active.
 *   GET /api/meta    — venues, roles and languages to populate the UI.
 */
import { Router } from 'express';
import { listVenues } from '../services/venueService.js';
import { ROLES } from '../domain/roles.js';
import { LANGUAGES } from '../domain/languages.js';
import { config } from '../config.js';
import { isFirestoreReady } from '../services/firestore.js';

const router = Router();

/** Snapshot of which Google Cloud / Firebase services are live. */
function serviceStatus() {
  return {
    genAI: config.gemini.enabled ? 'gemini' : 'offline',
    model: config.gemini.enabled ? config.gemini.model : null,
    persistence: isFirestoreReady() ? 'firestore' : 'in-memory',
  };
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok', ...serviceStatus() });
});

router.get('/meta', (req, res) => {
  res.json({
    venues: listVenues(),
    roles: Object.values(ROLES).map(({ id, label, priorities }) => ({ id, label, priorities })),
    languages: LANGUAGES,
    aiMode: config.gemini.enabled ? 'gemini' : 'offline',
    model: config.gemini.enabled ? config.gemini.model : null,
    services: serviceStatus(),
  });
});

export default router;
