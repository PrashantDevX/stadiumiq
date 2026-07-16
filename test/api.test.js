import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Force deterministic OFFLINE mode before the app (and its config) load, so the
// API test never depends on a network call or an API key.
process.env.GEMINI_API_KEY = '';
process.env.NODE_ENV = 'test';

const { createApp } = await import('../src/app.js');

let server;
let base;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
});

test('GET /api/health reports ok', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(res.headers.get('content-security-policy') ?? '', /default-src 'self'/);
});

test('GET /api/meta lists all 16 venues and the personas', async () => {
  const res = await fetch(`${base}/api/meta`);
  const body = await res.json();
  assert.equal(body.venues.length, 16);
  assert.ok(body.roles.length >= 4);
  assert.ok(body.languages.length >= 2);
});

test('POST /api/chat returns a non-empty reply', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'How do I get to section 114?' }],
      context: { role: 'fan', venueId: 'metlife' },
    }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(typeof body.reply, 'string');
  assert.ok(body.reply.length > 0);
});

test('POST /api/chat rejects an invalid body with 400', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [] }),
  });
  assert.equal(res.status, 400);
});

test('POST /api/chat uses the selected match timing for a crowd decision', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'How busy is it?' }],
      context: { role: 'fan', venueId: 'metlife', minutesToKickoff: 10 },
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.match(body.reply, /very_high/i);
  assert.match(body.reply, /21 min/i);
});

test('GET /api/schedule returns the tournament calendar', async () => {
  const res = await fetch(`${base}/api/schedule`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.tournament.finalVenueId, 'metlife');
  assert.ok(body.matches.length >= 5);
});

test('GET /api/venues/:id returns a merged venue profile with matches', async () => {
  const res = await fetch(`${base}/api/venues/metlife`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'MetLife Stadium');
  assert.ok(Array.isArray(body.operations.gates));
  assert.ok(body.matches.some((m) => m.round.includes('FINAL')));
});

test('GET /api/venues/:id/ops returns gate loads and incident summary', async () => {
  const res = await fetch(`${base}/api/venues/sofi/ops?minutesToKickoff=10`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.gates.length, 4);
  assert.ok(['high', 'very_high'].includes(body.overall.level));
  assert.ok(body.incidents);
  assert.ok(['normal', 'elevated', 'urgent', 'critical'].includes(body.actionPlan.status));
  assert.ok(body.actionPlan.actions.length > 0);
});

test('GET /api/venues/:id/ops distinguishes egress from an in-progress match', async () => {
  const during = await fetch(`${base}/api/venues/sofi/ops?minutesToKickoff=-45`);
  const egress = await fetch(`${base}/api/venues/sofi/ops?minutesToKickoff=-45&isEgress=true`);
  const duringBody = await during.json();
  const egressBody = await egress.json();
  assert.equal(duringBody.isEgress, false);
  assert.equal(egressBody.isEgress, true);
  assert.ok(egressBody.overall.waitMinutes > duringBody.overall.waitMinutes);
});

test('GET /api/venues/unknown returns 404', async () => {
  const res = await fetch(`${base}/api/venues/atlantis`);
  assert.equal(res.status, 404);
});

test('GET /api/unknown receives a safe JSON 404', async () => {
  const res = await fetch(`${base}/api/unknown`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'not_found', message: 'Resource not found.' });
});
