import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent, answerOffline } from '../src/services/offlineEngine.js';

test('routes a seat question to navigation and extracts the section', () => {
  const { tool, args } = classifyIntent('How do I get to section 114?');
  assert.equal(tool, 'plan_route_to_seat');
  assert.equal(args.section, '114');
});

test('routes a food question to amenities with dietary focus', () => {
  const { tool, args } = classifyIntent('Where can I find halal food?');
  assert.equal(tool, 'find_amenities');
  assert.equal(args.type, 'dietary');
});

test('routes a crowd question to crowd status', () => {
  assert.equal(classifyIntent('How busy is it right now?').tool, 'get_crowd_status');
});

test('routes an accessibility question to accessibility services', () => {
  assert.equal(classifyIntent('Is there wheelchair access?').tool, 'get_accessibility_services');
});

test('routes a transport question to transport planning', () => {
  assert.equal(classifyIntent('Best way to get there by train?').tool, 'plan_transport');
});

test('emergency wording routes to safety guidance', () => {
  assert.equal(classifyIntent('There is a medical emergency!').tool, 'get_safety_guidance');
});

test('answerOffline produces a non-empty reply and records the tool used', () => {
  const r = answerOffline({
    text: 'How do I get to section 114?',
    context: { role: 'fan', venueId: 'metlife' },
  });
  assert.equal(r.mode, 'offline');
  assert.ok(r.reply.length > 0);
  assert.deepEqual(r.toolsUsed, ['plan_route_to_seat']);
});

test('non-English selection adds a language note in offline mode', () => {
  const r = answerOffline({
    text: 'How busy is it?',
    context: { role: 'fan', venueId: 'metlife', language: 'es' },
  });
  assert.match(r.reply, /Offline mode replies in English/);
});

test('match timing changes crowd advice in the same user context', () => {
  const r = answerOffline({
    text: 'How busy is it?',
    context: { role: 'fan', venueId: 'metlife', minutesToKickoff: 10 },
  });
  assert.match(r.reply, /very_high/i);
  assert.match(r.reply, /21 min/i);
});
