import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDominantClient, MIN_BASIS_REQUESTS, DOMINANT_CLIENT_SHARE,
} from '../../src/traffic-concentration.mjs';

describe('detectDominantClient', () => {
  test('flags the 2026-09-12 incident shape: one IP at 85.7% of 30-day traffic', () => {
    const rows = [
      { key: '74.110.128.177', count: 5_310_000 },
      { key: '198.51.100.7', count: 400_000 },
      { key: '203.0.113.4', count: 490_000 },
    ];
    const result = detectDominantClient(rows);
    assert.equal(result.flagged, true);
    assert.equal(result.top.key, '74.110.128.177');
    assert.ok(result.top.share > 0.85 && result.top.share < 0.86, result.top.share);
  });

  test('does not flag ordinary organic traffic spread across many clients', () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ key: `10.0.0.${i}`, count: 100 }));
    const result = detectDominantClient(rows);
    assert.equal(result.flagged, false);
  });

  test('a quiet window with too little traffic never flags, even at 100% share', () => {
    // Two requests from the same visitor is not "concentration" — it's a
    // normal quiet period. Mirrors MIN_BASIS_EVENTS in status-attribution.mjs.
    const rows = [{ key: '10.0.0.1', count: 2 }];
    const result = detectDominantClient(rows);
    assert.equal(result.flagged, false);
    assert.equal(result.total, 2);
  });

  test('right at the MIN_BASIS_REQUESTS floor, a dominant share does flag', () => {
    // The dominant count must itself be the LARGEST single row, so the rest
    // of the traffic is spread thin rather than lumped into one bigger row.
    const dominant = Math.ceil(MIN_BASIS_REQUESTS * DOMINANT_CLIENT_SHARE);
    const remaining = MIN_BASIS_REQUESTS - dominant;
    const rows = [
      { key: 'attacker', count: dominant },
      ...Array.from({ length: 20 }, (_, i) => ({ key: `visitor-${i}`, count: Math.floor(remaining / 20) })),
    ];
    const result = detectDominantClient(rows);
    assert.equal(result.top.key, 'attacker');
    assert.ok(result.top.share >= DOMINANT_CLIENT_SHARE, result.top.share);
    assert.equal(result.flagged, true);
  });

  test('just under the share threshold is not flagged', () => {
    // Same shape: the "big" row must actually be the top row, so the rest is
    // spread across many smaller clients rather than one bigger lump.
    const rows = [
      { key: 'big-but-not-dominant', count: 1999 },
      ...Array.from({ length: 9 }, (_, i) => ({ key: `visitor-${i}`, count: 889 })),
    ];
    const result = detectDominantClient(rows);
    assert.equal(result.total, 1999 + 9 * 889);
    assert.equal(result.top.key, 'big-but-not-dominant');
    assert.ok(result.top.share < DOMINANT_CLIENT_SHARE, result.top.share);
    assert.equal(result.flagged, false);
  });

  test('empty input never throws and never flags', () => {
    assert.deepEqual(detectDominantClient([]), { flagged: false, total: 0, top: null });
    assert.deepEqual(detectDominantClient(undefined), { flagged: false, total: 0, top: null });
  });
});
