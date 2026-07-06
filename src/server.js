/**
 * Server bootstrap — the executable entry point (`npm start`).
 */
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`StadiumIQ listening on http://localhost:${config.port}`, {
    env: config.env,
    aiMode: config.gemini.enabled ? `gemini (${config.gemini.model})` : 'offline (no API key)',
  });
});
