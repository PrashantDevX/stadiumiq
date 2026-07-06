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

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', aiMode: config.gemini.enabled ? 'gemini' : 'offline' });
});

router.get('/meta', (req, res) => {
  res.json({
    venues: listVenues(),
    roles: Object.values(ROLES).map(({ id, label, priorities }) => ({ id, label, priorities })),
    languages: LANGUAGES,
    aiMode: config.gemini.enabled ? 'gemini' : 'offline',
    model: config.gemini.enabled ? config.gemini.model : null,
  });
});

export default router;
