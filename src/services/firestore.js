/**
 * Cloud Firestore integration — zero-dependency REST client.
 *
 * When `FIREBASE_PROJECT_ID` is set, incidents logged by staff/volunteers are
 * persisted to Cloud Firestore so the operational picture survives restarts and
 * is shared across instances. We talk to the Firestore REST API directly using
 * only Node's built-in `crypto` and `fetch` — no heavy SDK, no extra
 * dependencies, and therefore no added vulnerability surface.
 *
 * Credentials:
 *   - Locally: a service-account JSON via GOOGLE_APPLICATION_CREDENTIALS.
 *   - On Cloud Run / GCP: the instance metadata server (no key file needed).
 *
 * Everything degrades gracefully: if Firebase is not configured or a write
 * fails, the app keeps using the in-memory store and never throws to the user.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from './../config.js';
import { logger } from '../utils/logger.js';

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const METADATA_TOKEN_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

let ready = false;
let serviceAccount = null; // { client_email, private_key } or null → metadata
let cachedToken = null; // { token, expiresAt }

/** base64url-encode a string or Buffer. */
function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Build a signed JWT assertion for the OAuth2 service-account flow. */
function createAssertion({ client_email, private_key }) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: client_email,
      scope: FIRESTORE_SCOPE,
      aud: OAUTH_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(private_key);
  return `${signingInput}.${base64url(signature)}`;
}

/** Obtain (and cache) an access token from the chosen credential source. */
async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  let token;
  let expiresIn = 3600;

  if (serviceAccount) {
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: createAssertion(serviceAccount),
      }),
    });
    if (!res.ok) throw new Error(`token exchange failed (${res.status})`);
    const data = await res.json();
    token = data.access_token;
    expiresIn = data.expires_in ?? 3600;
  } else {
    const res = await fetch(METADATA_TOKEN_URL, { headers: { 'Metadata-Flavor': 'Google' } });
    if (!res.ok) throw new Error(`metadata token failed (${res.status})`);
    const data = await res.json();
    token = data.access_token;
    expiresIn = data.expires_in ?? 3600;
  }

  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

/**
 * Initialize Firestore access and verify connectivity by minting a token.
 * @returns {Promise<{ready:true}|null>}
 */
export async function initFirebase() {
  if (!config.firebase.enabled) return null;
  try {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (keyPath && fs.existsSync(keyPath)) {
      const raw = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      serviceAccount = { client_email: raw.client_email, private_key: raw.private_key };
    } else {
      serviceAccount = null; // fall back to metadata credentials (Cloud Run)
    }

    await getAccessToken(); // verify we can actually authenticate
    ready = true;
    logger.info('Cloud Firestore connected (REST)', { projectId: config.firebase.projectId });
    return { ready };
  } catch (err) {
    ready = false;
    logger.warn('Firestore unavailable — incidents will stay in-memory only', {
      error: err.message,
    });
    return null;
  }
}

/** True once Firestore is connected. */
export function isFirestoreReady() {
  return ready;
}

/** Convert a plain object into Firestore REST typed fields. */
export function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    } else if (key === 'createdAt') {
      fields[key] = { timestampValue: String(value) };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return fields;
}

/**
 * Persist a single incident (fire-and-forget). Failures are logged, never
 * thrown, so a Firestore hiccup can't break the user-facing response.
 */
export async function persistIncident(incident) {
  if (!ready) return;
  try {
    const token = await getAccessToken();
    const url =
      `https://firestore.googleapis.com/v1/projects/${config.firebase.projectId}` +
      `/databases/(default)/documents/${config.firebase.incidentsCollection}` +
      `?documentId=${encodeURIComponent(incident.id)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(incident) }),
    });
    if (!res.ok) throw new Error(`write failed (${res.status})`);
  } catch (err) {
    logger.warn('Failed to persist incident to Firestore', { id: incident.id, error: err.message });
  }
}
