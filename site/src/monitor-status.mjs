/**
 * Turning a Datadog monitor state into a status-page status — with a DURATION
 * requirement.
 *
 * WHY THIS EXISTS. The `platform` component mapped `overall_state` straight to
 * a page status, so a monitor that went Alert for two minutes painted the whole
 * page **Major Outage** and banked an outage window into the 90-day history.
 *
 * Measured 2026-08-16: `[CF] Origin unreachable 52x/530 (prod zones)` fired and
 * self-resolved **68 times in 17 hours** (3–8/hour, every one resolved). The
 * page was caught mid-flap at 19:40:29Z and read `major_outage`; the monitor
 * went OK at 19:41:11Z, 42 seconds later. The day's published figure was
 * **43.12% uptime across 11 counted windows** while the platform was serving
 * normally the entire time. The user noticed before we did, which is the
 * clearest possible evidence the number was wrong.
 *
 * This is the same defect that was fixed for the GCP-derived `customer-embeds`
 * component earlier the same day (one flaky probe painting a MAJOR OUTAGE) —
 * fixed there, missed here, because the two halves of the page compute status
 * by completely different routes.
 *
 * ⚠️ THE FIX IS NOT "IGNORE SHORT ALERTS". An unsustained bad state is
 * DOWNGRADED, never discarded: a flapping origin genuinely is a problem, it is
 * just not a major outage. So a 2-minute `Alert` on an origin-unreachable
 * monitor reads `degraded` and only becomes `major_outage` once it persists.
 * Reporting `operational` through a real flap would trade one lie for another.
 *
 * The thresholds deliberately echo this org's own alert policies, which use a
 * 600s window with 300s sustained before paging — a status page should not be
 * twitchier than the pager.
 */

/** How long a bad state must persist before it is reported at full severity. */
export const SUSTAIN_MS = 5 * 60 * 1000;

/** Ranked worst-last. Mirrors STATUS_RANK in status-history.mjs. */
const RANK = { operational: 0, unknown: 1, degraded: 2, partial_outage: 3, major_outage: 4 };

/**
 * One step less severe. `unknown` is left alone — it already means "we do not
 * know", and softening it would claim knowledge we do not have.
 */
export function softenStatus(status) {
  switch (status) {
    case 'major_outage': return 'degraded';
    case 'partial_outage': return 'degraded';
    case 'degraded': return 'operational';
    default: return status;
  }
}

/** The raw mapping, with no duration applied. */
export function rawMonitorStatus(overallState, onAlert) {
  switch (overallState) {
    case 'OK': return 'operational';
    case 'Alert': return onAlert;
    case 'Warn': return 'degraded';
    // 'No Data' / 'Skipped' / 'Unknown' / anything unrecognized: we genuinely
    // do not know, so say so.
    default: return 'unknown';
  }
}

/**
 * Map a monitor to a page status, softening a bad state that has not yet
 * persisted for `sustainMs`.
 *
 * `stateModifiedAt` is Datadog's `overall_state_modified` — when the monitor
 * last CHANGED state, which is exactly how long the current state has held.
 *
 * ⚠️ An unparseable or missing timestamp does NOT soften. We cannot show that
 * the state is brief, so we report it at full severity: an unknown duration
 * must never be the reason an outage is hidden. That is the same fail-toward-
 * the-alarm rule the capacity checker uses.
 */
export function monitorStatus(
  overallState, onAlert, stateModifiedAt, now = Date.now(), sustainMs = SUSTAIN_MS,
) {
  const raw = rawMonitorStatus(overallState, onAlert);
  if ((RANK[raw] ?? 0) <= RANK.unknown) return raw;

  const changedAt = typeof stateModifiedAt === 'number'
    ? stateModifiedAt
    : Date.parse(stateModifiedAt ?? '');
  if (!Number.isFinite(changedAt)) return raw;

  const heldFor = now - changedAt;
  // A timestamp in the future is a clock problem, not a brief alert. Treat it
  // as unmeasurable rather than as "zero seconds old", which would soften
  // every alert on a skewed clock.
  if (heldFor < 0) return raw;

  return heldFor < sustainMs ? softenStatus(raw) : raw;
}
