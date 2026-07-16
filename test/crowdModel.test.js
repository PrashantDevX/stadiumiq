import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateCrowd } from '../src/services/crowdModel.js';

test('crowd is low well before kickoff', () => {
  const r = estimateCrowd({ minutesToKickoff: 240 });
  assert.equal(r.level, 'low');
  assert.equal(r.waitMinutes, 0);
});

test('crowd peaks just before kickoff', () => {
  const r = estimateCrowd({ minutesToKickoff: 10 });
  assert.equal(r.level, 'very_high');
  assert.ok(r.waitMinutes > 15);
});

test('express gates are never busier than standard for the same time', () => {
  const order = { low: 0, moderate: 1, high: 2, very_high: 3 };
  const standard = estimateCrowd({ minutesToKickoff: 60, gateFlow: 'standard' });
  const express = estimateCrowd({ minutesToKickoff: 60, gateFlow: 'express' });
  assert.ok(order[express.level] <= order[standard.level]);
});

test('post-match egress surge is modelled', () => {
  const r = estimateCrowd({ minutesToKickoff: -5, isEgress: true });
  assert.equal(r.level, 'very_high');
});

test('an in-progress match is not mistaken for post-match egress', () => {
  const r = estimateCrowd({ minutesToKickoff: -45, isEgress: false });
  assert.equal(r.level, 'moderate');
  assert.ok(r.waitMinutes < 10);
});

test('wait estimate is a non-negative integer', () => {
  const r = estimateCrowd({ minutesToKickoff: 45 });
  assert.ok(Number.isInteger(r.waitMinutes));
  assert.ok(r.waitMinutes >= 0);
});
