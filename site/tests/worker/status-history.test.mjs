/**
 * Contract tests for the status page's uptime history.
 *
 * Run with:  npm run test:worker
 *
 * These pin the two things a status page can most easily get wrong: claiming
 * a day was fine when it wasn't, and claiming a day was broken when one
 * sample blipped. Both are credibility failures, in opposite directions.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MIN_DEGRADED_MS,
  MIN_UNKNOWN_FRACTION,
  MAX_WINDOWS_PER_DAY,
  SAMPLE_INTERVAL_MS,
  applySample,
  buildHistoryView,
  rateDay,
} from '../../src/status-history.mjs';

const NOON = Date.parse('2026-08-04T12:00:00Z');
const DAY = '2026-08-04';
const fresh = () => ({ days: {}, lastSampleAt: 0 });

/** Feed n samples of `status`, one SAMPLE_INTERVAL apart, from `start`. */
function feed(rec, status, n, start = NOON) {
  for (let i = 0; i < n; i++) applySample(rec, status, start + i * SAMPLE_INTERVAL_MS);
  return rec;
}

// ── day rating ──────────────────────────────────────────────────────────

test('an outage colours the day immediately, however brief', () => {
  // 2026-08-02 was two outages of roughly 8 and 6 minutes. Both are under any
  // sane duration threshold and both must still show red — if we could not
  // serve requests at all, length is not the point.
  for (const status of ['major_outage', 'partial_outage']) {
    const rec = feed(fresh(), status, 1);
    assert.equal(rateDay(rec.days[DAY]), status);
  }
});

test('a single degraded sample does NOT colour the day', () => {
  // The 2026-08-04 case: 99.17% uptime rendered "Degraded" off one sample in
  // ~120. The day now rates operational — but see the tooltip test below, the
  // blip is still reported.
  const rec = feed(fresh(), 'operational', 5);
  applySample(rec, 'degraded', NOON + 60 * SAMPLE_INTERVAL_MS);
  assert.equal(rateDay(rec.days[DAY]), 'operational');
});

test('degraded that persists past the threshold DOES colour the day', () => {
  // Two consecutive samples ≈ 10 minutes of estimated duration.
  const rec = feed(fresh(), 'degraded', 2);
  const [w] = rec.days[DAY].windows;
  assert.ok(
    w.t - w.f + SAMPLE_INTERVAL_MS >= MIN_DEGRADED_MS,
    'two consecutive samples should clear the threshold',
  );
  assert.equal(rateDay(rec.days[DAY]), 'degraded');
});

test('a record written before window tracking falls back to worst-sample', () => {
  // Never claim a green day we cannot substantiate: with no windows stored we
  // have no duration evidence, so the old, harsher rule stands.
  assert.equal(
    rateDay({ ok: 119, degraded: 1, outage: 0, unknown: 0, worst: 'degraded' }),
    'degraded',
  );
  assert.equal(
    rateDay({ ok: 120, degraded: 0, outage: 0, unknown: 0, worst: 'operational' }),
    'operational',
  );
});

test('a day we largely failed to MEASURE does not claim to be operational', () => {
  // `unknown` opens no window, so the window rules alone would rate a
  // half-unmeasured day `operational` — inverting the STATUS_RANK principle
  // that missing data must never present as healthy.
  const rec = feed(fresh(), 'operational', 5);
  feed(rec, 'unknown', 20, NOON + 5 * SAMPLE_INTERVAL_MS);
  assert.equal(rateDay(rec.days[DAY]), 'unknown');
});

test('a single missed sample is not a blind spot', () => {
  // The bar exists so ordinary jitter does not repaint the day.
  const rec = feed(fresh(), 'operational', 40);
  applySample(rec, 'unknown', NOON + 41 * SAMPLE_INTERVAL_MS);
  const d = rec.days[DAY];
  assert.ok(d.unknown / (d.ok + d.unknown) < MIN_UNKNOWN_FRACTION);
  assert.equal(rateDay(d), 'operational');
});

test('unmeasured time cannot mask a real outage', () => {
  const rec = feed(fresh(), 'major_outage', 1);
  feed(rec, 'unknown', 30, NOON + 5 * SAMPLE_INTERVAL_MS);
  assert.equal(rateDay(rec.days[DAY]), 'major_outage');
});

// ── windows ─────────────────────────────────────────────────────────────

test('consecutive same-status samples extend one window, not many', () => {
  const rec = feed(fresh(), 'degraded', 4);
  assert.equal(rec.days[DAY].windows.length, 1);
});

test('a gap splits the window so two incidents do not read as one', () => {
  const rec = fresh();
  applySample(rec, 'major_outage', NOON);
  // Well past the contiguity allowance — a separate incident.
  applySample(rec, 'major_outage', NOON + 60 * 60 * 1000);
  assert.equal(rec.days[DAY].windows.length, 2);
});

test('unknown never opens a window — not measured is not down', () => {
  const rec = feed(fresh(), 'unknown', 3);
  assert.deepEqual(rec.days[DAY].windows, [], 'tracked, but no window opened');
  assert.equal(rateDay(rec.days[DAY]), 'unknown');
});

test('an EMPTY windows array is not the same as no window tracking', () => {
  // The distinction the legacy fallback hangs on. A tracked-and-clean day
  // must rate operational; a day with no array at all has no duration
  // evidence and defers to worst-sample.
  assert.equal(rateDay({ ok: 100, degraded: 0, outage: 0, unknown: 1, worst: 'unknown', windows: [] }), 'operational');
  assert.equal(rateDay({ ok: 100, degraded: 0, outage: 0, unknown: 1, worst: 'unknown' }), 'unknown');
});

test('windows per day are capped', () => {
  const rec = fresh();
  // Alternate so every outage sample opens a fresh window.
  for (let i = 0; i < MAX_WINDOWS_PER_DAY + 10; i++) {
    applySample(rec, 'major_outage', NOON + i * 3 * SAMPLE_INTERVAL_MS);
    applySample(rec, 'operational', NOON + (i * 3 + 1) * SAMPLE_INTERVAL_MS);
  }
  assert.ok(rec.days[DAY].windows.length <= MAX_WINDOWS_PER_DAY);
});

// ── sampling ────────────────────────────────────────────────────────────

test('samples inside the interval are rate-limited away', () => {
  const rec = fresh();
  assert.equal(applySample(rec, 'operational', NOON), true);
  assert.equal(applySample(rec, 'operational', NOON + 1000), false);
  assert.equal(rec.days[DAY].ok, 1);
});

test('a WORSENING status always samples immediately', () => {
  // Otherwise a short outage that starts and ends between two intervals
  // leaves no trace at all.
  const rec = fresh();
  applySample(rec, 'operational', NOON);
  assert.equal(applySample(rec, 'major_outage', NOON + 1000), true);
  assert.equal(rec.days[DAY].outage, 1);
});

// ── the rendered view ───────────────────────────────────────────────────

test('a day rated operational still REPORTS the blip it swallowed', () => {
  // The softer rating is only defensible if the evidence stays visible —
  // otherwise it reads as "we never noticed".
  const rec = feed(fresh(), 'operational', 5);
  applySample(rec, 'degraded', NOON + 60 * SAMPLE_INTERVAL_MS);

  const view = buildHistoryView(rec, NOON + 12 * 60 * 60 * 1000);
  const day = view.days.find((d) => d.date === DAY);

  assert.equal(day.status, 'operational', 'bar is green');
  assert.equal(day.worstSample, 'degraded', 'but the worst sample is preserved');
  assert.equal(day.windows.length, 1);
  assert.equal(day.windows[0].counted, false, 'flagged as below the threshold');
  assert.ok(day.windows[0].minutes >= 1);
  assert.ok(day.uptimePct < 100, 'and the percentage still reflects it');
});

test('days with no samples are no_data, never a green bar', () => {
  const view = buildHistoryView(fresh(), NOON);
  assert.ok(view.days.every((d) => d.status === 'no_data'));
  assert.equal(view.daysWithData, 0);
  assert.equal(view.uptimePct, null);
});

test('unknown samples are excluded from the uptime denominator', () => {
  // "We could not measure" is not downtime and must not be priced as such.
  const rec = feed(fresh(), 'operational', 4);
  feed(rec, 'unknown', 4, NOON + 4 * SAMPLE_INTERVAL_MS);

  const view = buildHistoryView(rec, NOON + 12 * 60 * 60 * 1000);
  const day = view.days.find((d) => d.date === DAY);
  assert.equal(day.uptimePct, 100);
});
