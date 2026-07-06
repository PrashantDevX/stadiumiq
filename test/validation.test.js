import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateChatRequest, LIMITS } from '../src/utils/validation.js';

test('accepts a valid request and defaults context', () => {
  const r = validateChatRequest({ messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(r.ok, true);
  assert.equal(r.value.context.role, 'fan');
  assert.equal(r.value.context.language, 'en');
});

test('rejects empty messages', () => {
  const r = validateChatRequest({ messages: [] });
  assert.equal(r.ok, false);
});

test('rejects a non-object body', () => {
  assert.equal(validateChatRequest(null).ok, false);
  assert.equal(validateChatRequest('nope').ok, false);
});

test('requires the last message to be from the user', () => {
  const r = validateChatRequest({
    messages: [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ],
  });
  assert.equal(r.ok, false);
});

test('truncates over-long content instead of failing', () => {
  const long = 'a'.repeat(LIMITS.maxContentLength + 500);
  const r = validateChatRequest({ messages: [{ role: 'user', content: long }] });
  assert.equal(r.ok, true);
  assert.equal(r.value.messages[0].content.length, LIMITS.maxContentLength);
});

test('invalid role and language fall back to defaults', () => {
  const r = validateChatRequest({
    messages: [{ role: 'user', content: 'hi' }],
    context: { role: 'hacker', language: 'zz' },
  });
  assert.equal(r.value.context.role, 'fan');
  assert.equal(r.value.context.language, 'en');
});

test('minutesToKickoff is clamped to a sane range', () => {
  const r = validateChatRequest({
    messages: [{ role: 'user', content: 'hi' }],
    context: { minutesToKickoff: 99999 },
  });
  assert.equal(r.value.context.minutesToKickoff, LIMITS.maxMinutes);
});
