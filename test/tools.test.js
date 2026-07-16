import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeTool, TOOL_NAMES } from '../src/services/tools/index.js';

const fanCtx = { role: 'fan', venueId: 'metlife' };
const staffCtx = { role: 'staff', venueId: 'metlife' };

test('registry exposes all expected tools', () => {
  for (const name of [
    'get_venue_guide',
    'plan_route_to_seat',
    'get_crowd_status',
    'plan_transport',
    'get_accessibility_services',
    'find_amenities',
    'get_sustainability_tips',
    'get_safety_guidance',
    'report_incident',
    'get_operations_brief',
    'get_match_schedule',
  ]) {
    assert.ok(TOOL_NAMES.includes(name), `missing ${name}`);
  }
});

test('match schedule tool returns the final at MetLife', () => {
  const r = executeTool('get_match_schedule', {}, fanCtx);
  assert.match(r.finale, /2026-07-19/);
  assert.ok(r.matches.some((m) => m.round.includes('FINAL')));
});

test('match schedule can be filtered to one venue', () => {
  const r = executeTool('get_match_schedule', { venue: 'metlife' }, fanCtx);
  assert.equal(r.filteredBy, 'MetLife Stadium');
  assert.ok(r.matches.every((m) => m.venue === 'MetLife Stadium'));
});

test('plan_route_to_seat recommends a gate and steps', () => {
  const r = executeTool('plan_route_to_seat', { section: '114' }, fanCtx);
  assert.match(r.recommendedGate, /Gate [A-D]/);
  assert.ok(Array.isArray(r.steps) && r.steps.length >= 2);
});

test('plan_route_to_seat prioritises accessibility when mobility needs are set', () => {
  const r = executeTool('plan_route_to_seat', { section: '320', mobilityNeeds: true }, fanCtx);
  assert.equal(r.accessibleRoute, true);
  assert.ok(r.steps.some((s) => /elevator|accessible|step-free/i.test(s)));
});

test('authorization: a fan cannot report an incident', () => {
  const r = executeTool(
    'report_incident',
    { type: 'spill', zone: 'Gate C', description: 'water' },
    fanCtx,
  );
  assert.equal(r.error, 'not_authorized');
});

test('authorization: staff can report an incident and it is routed', () => {
  const r = executeTool(
    'report_incident',
    { type: 'medical', zone: 'Sec 130', description: 'fan unwell' },
    staffCtx,
  );
  assert.equal(r.logged, true);
  assert.match(r.incidentId, /^INC-\d{4}$/);
  assert.match(r.routedTo, /Medical/);
});

test('operations brief turns incident and crowd signals into a ranked action plan', () => {
  const r = executeTool('get_operations_brief', { minutesToKickoff: 10 }, staffCtx);
  assert.equal(r.actionPlan.status, 'urgent');
  assert.ok(r.actionPlan.actions.length > 0);
  assert.match(r.recommendation, /express entry capacity/i);
});

test('find_amenities surfaces dietary options', () => {
  const r = executeTool('find_amenities', { type: 'dietary' }, fanCtx);
  assert.match(r.results[0].detail, /Halal/);
});

test('accessibility tool leads with the matching need', () => {
  const r = executeTool('get_accessibility_services', { need: 'wheelchair' }, fanCtx);
  assert.match(r.services[0], /wheelchair|step-?free|ramp|elevator/i);
});

test('transport nudges away from driving toward transit', () => {
  const r = executeTool('plan_transport', { mode: 'parking' }, fanCtx);
  assert.match(r.sustainabilityNudge, /transit|rail|shuttle|emissions/i);
});

test('unknown venue returns a graceful error', () => {
  const r = executeTool('get_venue_guide', { venue: 'atlantis' }, { role: 'fan' });
  assert.equal(r.error, 'venue_not_found');
});

test('unknown tool is handled without throwing', () => {
  const r = executeTool('does_not_exist', {}, fanCtx);
  assert.equal(r.error, 'unknown_tool');
});
