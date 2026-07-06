/**
 * Deterministic crowd-density model.
 *
 * Real venues would stream this from turnstile counters and CCTV analytics.
 * Here we model the well-known match-day arrival/egress curve as a pure
 * function of "minutes to kickoff" so the behaviour is explainable and unit
 * testable (no randomness, no clock dependence). Negative values mean the match
 * is under way or finished; large negatives model the post-final-whistle surge.
 */

/** @typedef {'low'|'moderate'|'high'|'very_high'} CrowdLevel */

const LEVELS = ['low', 'moderate', 'high', 'very_high'];

const ADVICE = {
  low: 'Concourses are quiet — a great time to move around, grab food, or find your seat.',
  moderate: 'Steady flow. Allow a few extra minutes at security and concessions.',
  high: 'Busy. Use express or less-central gates and expect queues at popular concessions.',
  very_high: 'Peak crowd. Avoid the main gates, follow steward directions, and keep to the wider concourse routes.',
};

/**
 * @param {object} input
 * @param {number} input.minutesToKickoff  Positive = before KO, negative = after.
 * @param {'central'|'standard'|'express'} [input.gateFlow='standard']
 * @param {boolean} [input.isEgress=false]  True to model post-match exit surge.
 * @returns {{ level: CrowdLevel, score: number, waitMinutes: number, advice: string }}
 */
export function estimateCrowd({ minutesToKickoff = 60, gateFlow = 'standard', isEgress = false }) {
  const t = Number(minutesToKickoff);

  // Base 0..3 score along the arrival curve.
  let score;
  if (isEgress || t <= 0) {
    // Egress surge is sharpest right after the whistle, then eases.
    const sinceEnd = Math.abs(t);
    score = sinceEnd <= 20 ? 3 : sinceEnd <= 45 ? 2 : 1;
  } else if (t <= 15) score = 3;
  else if (t <= 45) score = 2.5;
  else if (t <= 90) score = 1.5;
  else if (t <= 120) score = 1;
  else score = 0;

  // Central gates concentrate flow; express lanes relieve it.
  if (gateFlow === 'central') score += 0.5;
  if (gateFlow === 'express') score -= 0.5;

  score = Math.max(0, Math.min(3, score));
  const level = LEVELS[Math.round(score)];

  // Rough queue estimate in minutes, monotonic in score.
  const waitMinutes = Math.round(score * 7);

  return { level, score: Math.round(score * 100) / 100, waitMinutes, advice: ADVICE[level] };
}
