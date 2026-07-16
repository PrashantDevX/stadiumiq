import { test } from 'node:test';
import assert from 'node:assert/strict';
import { respond } from '../src/services/assistant.js';

/** A fake Gemini client that replays a queued list of responses. */
function fakeClient(responses) {
  let i = 0;
  return {
    calls: 0,
    async generate() {
      this.calls += 1;
      return responses[Math.min(i++, responses.length - 1)];
    },
  };
}

test('runs the function-calling loop and returns the final text', async () => {
  const client = fakeClient([
    {
      text: '',
      functionCalls: [{ name: 'get_crowd_status', args: {} }],
      candidateContent: {
        role: 'model',
        parts: [{ functionCall: { name: 'get_crowd_status', args: {} } }],
      },
    },
    { text: 'It is moderately busy right now.', functionCalls: [], candidateContent: null },
  ]);

  const r = await respond({
    messages: [{ role: 'user', content: 'how busy is it?' }],
    context: { role: 'fan', venueId: 'metlife' },
    client,
  });

  assert.equal(r.mode, 'gemini');
  assert.deepEqual(r.toolsUsed, ['get_crowd_status']);
  assert.match(r.reply, /busy/);
  assert.equal(client.calls, 2);
});

test('returns a direct answer when no tool is needed', async () => {
  const client = fakeClient([{ text: 'Hello there!', functionCalls: [], candidateContent: null }]);
  const r = await respond({
    messages: [{ role: 'user', content: 'hi' }],
    context: { role: 'fan' },
    client,
  });
  assert.equal(r.reply, 'Hello there!');
  assert.equal(r.mode, 'gemini');
});

test('falls back to the offline engine when the model errors', async () => {
  const client = {
    async generate() {
      throw new Error('api unavailable');
    },
  };
  const r = await respond({
    messages: [{ role: 'user', content: 'how busy is it?' }],
    context: { role: 'fan', venueId: 'metlife' },
    client,
  });
  assert.equal(r.mode, 'offline_fallback');
  assert.ok(r.reply.length > 0);
});
