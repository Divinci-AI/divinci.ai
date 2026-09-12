import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeDegradedStreak, DEFAULT_STREAK_THRESHOLD } from '../../src/status-degraded-streak.mjs';

const day = (date, status, topArea) => ({
  date, status,
  areaShares: topArea ? [{ id: topArea, share: 95 }, { id: 'product', share: 5 }] : [],
});

describe('computeDegradedStreak', () => {
  test('reproduces the exact symptom that started this investigation: two Degraded marketing days in a row', () => {
    const days = [
      day('2026-09-09', 'operational'),
      day('2026-09-10', 'operational'),
      day('2026-09-11', 'degraded', 'marketing'),
      day('2026-09-12', 'degraded', 'marketing'),
    ];
    const result = computeDegradedStreak(days);
    assert.equal(result.flagged, true);
    assert.equal(result.streak.length, 2);
    assert.deepEqual(result.streak.map((d) => d.date), ['2026-09-11', '2026-09-12']);
    assert.equal(result.streak[0].topArea, 'marketing');
  });

  test('a single degraded day does not flag at the default threshold', () => {
    const days = [
      day('2026-09-10', 'operational'),
      day('2026-09-11', 'operational'),
      day('2026-09-12', 'degraded', 'marketing'),
    ];
    const result = computeDegradedStreak(days);
    assert.equal(result.flagged, false);
    assert.equal(result.streak.length, 1);
  });

  test('an all-operational history never flags', () => {
    const days = [day('2026-09-10', 'operational'), day('2026-09-11', 'operational'), day('2026-09-12', 'operational')];
    assert.deepEqual(computeDegradedStreak(days), { flagged: false, streak: [] });
  });

  test('the streak stops at the first operational day looking backward — an old incident does not keep flagging forever', () => {
    const days = [
      day('2026-08-01', 'degraded', 'marketing'),
      day('2026-08-02', 'degraded', 'marketing'),
      day('2026-08-03', 'operational'),
      day('2026-08-04', 'degraded', 'marketing'),
    ];
    const result = computeDegradedStreak(days);
    assert.equal(result.streak.length, 1);
    assert.deepEqual(result.streak.map((d) => d.date), ['2026-08-04']);
  });

  test('a streak must END at the most recent day — a resolved incident from days ago does not still flag today', () => {
    const days = [
      day('2026-08-01', 'degraded', 'marketing'),
      day('2026-08-02', 'degraded', 'marketing'),
      day('2026-08-03', 'operational'),
    ];
    assert.deepEqual(computeDegradedStreak(days), { flagged: false, streak: [] });
  });

  test('no_data and unknown count as non-operational — a blind spot is not a free pass', () => {
    const days = [
      day('2026-09-11', 'no_data'),
      day('2026-09-12', 'unknown'),
    ];
    const result = computeDegradedStreak(days);
    assert.equal(result.flagged, true);
    assert.equal(result.streak.length, 2);
  });

  test('a custom threshold is honoured', () => {
    const days = [
      day('2026-09-10', 'degraded', 'marketing'),
      day('2026-09-11', 'degraded', 'marketing'),
      day('2026-09-12', 'degraded', 'marketing'),
    ];
    // 3 non-operational days: flags at threshold 3, not yet at threshold 4.
    assert.equal(computeDegradedStreak(days, { threshold: 4 }).flagged, false);
    assert.equal(computeDegradedStreak(days, { threshold: 3 }).flagged, true);
    assert.equal(computeDegradedStreak(days, { threshold: 3 }).streak.length, 3);
  });

  test('empty or missing input never throws', () => {
    assert.deepEqual(computeDegradedStreak([]), { flagged: false, streak: [] });
    assert.deepEqual(computeDegradedStreak(undefined), { flagged: false, streak: [] });
    assert.deepEqual(computeDegradedStreak(null), { flagged: false, streak: [] });
  });

  test('the default threshold is 2 — matches the complaint that started this ("these daily notes seem very similar")', () => {
    assert.equal(DEFAULT_STREAK_THRESHOLD, 2);
  });
});
