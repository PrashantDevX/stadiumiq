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
