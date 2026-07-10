/**
 * Server bootstrap — the executable entry point (`npm start`).
 */
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { initFirebase, persistIncident } from './services/firestore.js';
import { incidentStore } from './services/incidentStore.js';

const app = createApp();

// Connect Cloud Firestore if configured; route incident persistence to it.
initFirebase().then((db) => {
  if (db) incidentStore.setSink(persistIncident);
});

app.listen(config.port, () => {
  logger.info(`StadiumIQ listening on http://localhost:${config.port}`, {
    env: config.env,
    aiMode: config.gemini.enabled ? `gemini (${config.gemini.model})` : 'offline (no API key)',
    persistence: config.firebase.enabled ? 'firestore' : 'in-memory',
  });
});
