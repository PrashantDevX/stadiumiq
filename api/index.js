/**
 * Vercel serverless entry point.
 *
 * Vercel routes every `/api/*` request here (see vercel.json); the exported
 * Express app handles it exactly as it does locally. Static files in /public
 * are served by Vercel's CDN directly, so this function only ever sees API
 * traffic. One codebase, three run targets: `npm start` locally, this adapter
 * on Vercel, and the Dockerfile on Cloud Run.
 */
import { createApp } from '../src/app.js';
import { initFirebase, persistIncident } from '../src/services/firestore.js';
import { incidentStore } from '../src/services/incidentStore.js';

const app = createApp();

// Connect Cloud Firestore if configured (fire-and-forget on cold start).
initFirebase().then((db) => {
  if (db) incidentStore.setSink(persistIncident);
});

export default app;
