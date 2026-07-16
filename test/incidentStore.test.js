import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { IncidentStore } from '../src/services/incidentStore.js';
import { toFirestoreFields } from '../src/services/firestore.js';

let store;
beforeEach(() => {
  store = new IncidentStore();
});

test('assigns sequential ids and routes by type', () => {
  const a = store.add({ venueId: 'metlife', type: 'medical', zone: 'S130', description: 'x' });
  const b = store.add({ venueId: 'metlife', type: 'spill', zone: 'Gate C', description: 'y' });
  assert.equal(a.id, 'INC-0001');
  assert.equal(b.id, 'INC-0002');
  assert.match(a.routedTo, /Medical/);
});

test('unknown type and severity are normalized', () => {
  const i = store.add({
    venueId: 'sofi',
    type: 'nonsense',
    zone: 'z',
    description: 'd',
    severity: 'boom',
  });
  assert.equal(i.type, 'other');
  assert.equal(i.severity, 'medium');
});

test('summary aggregates open incidents by severity', () => {
  store.add({ venueId: 'sofi', type: 'crowd', zone: 'A', description: 'd', severity: 'high' });
  store.add({ venueId: 'sofi', type: 'crowd', zone: 'B', description: 'd', severity: 'critical' });
  const s = store.summary({ venueId: 'sofi' });
  assert.equal(s.open, 2);
  assert.equal(s.bySeverity.high, 1);
  assert.equal(s.bySeverity.critical, 1);
});

test('a registered sink receives the persisted incident (fire-and-forget)', async () => {
  const seen = [];
  store.setSink((incident) => {
    seen.push(incident.id);
    return Promise.resolve();
  });
  const i = store.add({ venueId: 'metlife', type: 'security', zone: 'gate', description: 'd' });

  // Sink runs on the microtask queue; let it flush.
  await Promise.resolve();
  assert.deepEqual(seen, [i.id]);
});

test('a throwing sink never breaks add()', () => {
  store.setSink(() => {
    throw new Error('firestore down');
  });
  assert.doesNotThrow(() =>
    store.add({ venueId: 'sofi', type: 'other', zone: 'z', description: 'd' }),
  );
});

test('Firestore field serializer maps JS types to REST typed values', () => {
  const incident = store.add({ venueId: 'metlife', type: 'medical', zone: 'S1', description: 'd' });
  const fields = toFirestoreFields(incident);
  assert.deepEqual(fields.id, { stringValue: incident.id });
  assert.deepEqual(fields.venueId, { stringValue: 'metlife' });
  assert.ok(fields.createdAt.timestampValue, 'createdAt should be a timestampValue');
  // booleans and integers use the correct wrappers
  const typed = toFirestoreFields({ flag: true, count: 3, ratio: 1.5 });
  assert.deepEqual(typed.flag, { booleanValue: true });
  assert.deepEqual(typed.count, { integerValue: '3' });
  assert.deepEqual(typed.ratio, { doubleValue: 1.5 });
});
