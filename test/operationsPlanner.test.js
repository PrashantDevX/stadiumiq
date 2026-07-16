import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOperationalPlan } from '../src/services/operationsPlanner.js';

const noIncidents = { bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } };

test('keeps standard operations for a quiet venue with no incidents', () => {
  const plan = buildOperationalPlan({
    crowd: { level: 'low', waitMinutes: 0 },
    incidents: noIncidents,
  });
  assert.equal(plan.status, 'normal');
  assert.equal(plan.requiresEscalation, false);
  assert.match(plan.actions[0], /standard staffing/i);
});

test('raises urgent gate action for a peak-arrival crowd', () => {
  const plan = buildOperationalPlan({
    crowd: { level: 'very_high', waitMinutes: 21 },
    incidents: noIncidents,
  });
  assert.equal(plan.status, 'urgent');
  assert.equal(plan.requiresEscalation, true);
  assert.match(plan.actions.join(' '), /express entry capacity/i);
});

test('puts a critical medical incident ahead of crowd management', () => {
  const plan = buildOperationalPlan({
    crowd: { level: 'high', waitMinutes: 18 },
    incidents: { bySeverity: { low: 0, medium: 0, high: 0, critical: 1 } },
    activeIncidents: [
      {
        type: 'medical',
        zone: 'Section 130',
        severity: 'critical',
        routedTo: 'Medical / first-aid team',
        status: 'open',
      },
    ],
  });
  assert.equal(plan.status, 'critical');
  assert.match(plan.actions[0], /incident command.*Medical/i);
});
