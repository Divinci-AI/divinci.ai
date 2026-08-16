/**
 * Contract tests for the duration-aware monitor mapping.
 *
 * Run with:  npm run test:worker
 *
 * These pin the behaviour that was missing on 2026-08-16, when
 * `[CF] Origin unreachable 52x/530 (prod zones)` fired and self-resolved 68
 * times in 17 hours and the page published **43.12% uptime across 11 counted
 * windows** for a platform that was serving normally throughout. The user
 * spotted it before we did.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monitorStatus, softenStatus, rawMonitorStatus, SUSTAIN_MS } from '../../src/monitor-status.mjs';

// The real incident, to the second.
const CAUGHT_AT = Date.parse('2026-08-16T19:40:29Z');   // when the page was read
const ALERT_AT  = Date.parse('2026-08-16T19:38:30Z');   // ~2 min earlier
const CLEARED   = Date.parse('2026-08-16T19:41:11Z');   // 42s later

test('the real 2-minute flap does NOT read as a major outage', () => {
  assert.equal(
    monitorStatus('Alert', 'major_outage', ALERT_AT, CAUGHT_AT),
    'degraded',
  );
});

test('...but it is NOT hidden either — softened, never discarded', () => {
  // A flapping origin genuinely is a problem. Reporting `operational` through
  // a real flap would trade one lie for another.
  const s = monitorStatus('Alert', 'major_outage', ALERT_AT, CAUGHT_AT);
  assert.notEqual(s, 'operational');
});

test('a sustained alert still reads as a major outage', () => {
  const twentyMinutesAgo = CAUGHT_AT - 20 * 60 * 1000;
  assert.equal(
    monitorStatus('Alert', 'major_outage', twentyMinutesAgo, CAUGHT_AT),
    'major_outage',
  );
});

test('the boundary is exact', () => {
  const at = CAUGHT_AT - SUSTAIN_MS;
  const justUnder = CAUGHT_AT - SUSTAIN_MS + 1;
  assert.equal(monitorStatus('Alert', 'major_outage', at, CAUGHT_AT), 'major_outage');
  assert.equal(monitorStatus('Alert', 'major_outage', justUnder, CAUGHT_AT), 'degraded');
});

test('an unsustained degraded softens to operational', () => {
  assert.equal(monitorStatus('Warn', 'degraded', CAUGHT_AT - 1000, CAUGHT_AT), 'operational');
});

test('OK and unknown are unaffected by duration', () => {
  assert.equal(monitorStatus('OK', 'major_outage', CLEARED, CAUGHT_AT + 60000), 'operational');
  assert.equal(monitorStatus('No Data', 'major_outage', CAUGHT_AT - 1000, CAUGHT_AT), 'unknown');
  // `unknown` must not soften — it already means "we do not know", and
  // softening it would claim knowledge we do not have.
  assert.equal(softenStatus('unknown'), 'unknown');
});

test('a MISSING timestamp reports at full severity — never softens', () => {
  // We cannot show the state is brief, so we must not imply that it is. An
  // unknown duration must never be the reason an outage is hidden.
  for (const bad of [undefined, null, '', 'not-a-date', NaN]) {
    assert.equal(
      monitorStatus('Alert', 'major_outage', bad, CAUGHT_AT),
      'major_outage',
      `softened on ${String(bad)}`,
    );
  }
});

test('a FUTURE timestamp reports at full severity', () => {
  // Clock skew would otherwise make every alert look zero seconds old and
  // soften permanently — the failure would be silent and total.
  assert.equal(
    monitorStatus('Alert', 'major_outage', CAUGHT_AT + 60_000, CAUGHT_AT),
    'major_outage',
  );
});

test('the sustain window is not twitchier than this org\'s pager', () => {
  // The uptime alert policies use 600s window / 300s sustained. A status page
  // that goes red faster than the pager does is the thing being fixed.
  assert.equal(SUSTAIN_MS, 5 * 60 * 1000);
});

test('raw mapping is unchanged — only duration is new', () => {
  assert.equal(rawMonitorStatus('OK', 'major_outage'), 'operational');
  assert.equal(rawMonitorStatus('Alert', 'major_outage'), 'major_outage');
  assert.equal(rawMonitorStatus('Alert', 'degraded'), 'degraded');
  assert.equal(rawMonitorStatus('Warn', 'major_outage'), 'degraded');
  assert.equal(rawMonitorStatus('Skipped', 'major_outage'), 'unknown');
});

test('68 flaps in a day produce no outage windows', () => {
  // The actual shape of 2026-08-16: fire, self-resolve ~2 min later, 68 times.
  let outageReadings = 0;
  for (let i = 0; i < 68; i++) {
    const firedAt = CAUGHT_AT + i * 900_000;
    const readAt = firedAt + 120_000;   // page sampled 2 min into each flap
    if (monitorStatus('Alert', 'major_outage', firedAt, readAt) === 'major_outage') {
      outageReadings++;
    }
  }
  assert.equal(outageReadings, 0);
});
