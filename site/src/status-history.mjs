/**
 * 90-day uptime history for the public status page — the pure logic half.
 *
 * Split out of worker.js (same reasoning as www-rag-activity.mjs) so the
 * sampling and day-rating rules can be tested directly against Node's runner
 * instead of being re-implemented in a test that proves nothing about the
 * code actually shipped. worker.js keeps only the KV read/write around these.
 *
 * Shape of the stored record — ONE rolled-up KV value, not a key per day,
 * which would mean 90 reads per request:
 *
 *   {
 *     since: "2026-07-26",
 *     lastSampleAt: 1785900000000,
 *     days: {
 *       "2026-08-04": {
 *         ok: 119, degraded: 1, outage: 0, unknown: 0,
 *         worst: "degraded",                       // raw worst SAMPLE
 *         windows: [                               // when it was bad
 *           { s: "degraded", f: <ms>, t: <ms> }
 *         ]
 *       }
 *     }
 *   }
 */

// Ranked worst-last. `unknown` deliberately outranks `operational` so missing
// data never presents as healthy.
export const STATUS_RANK = {
  operational: 0,
  unknown: 1,
  degraded: 2,
  partial_outage: 3,
  major_outage: 4,
};
export const worstStatus = (a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a);

export const HISTORY_KEY = 'history:v1';
export const HISTORY_DAYS = 90;
export const SAMPLE_INTERVAL_MS = 5 * 60 * 1000;

export const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

// ── Rating a whole day from its samples ──────────────────────────────────
//
// A day used to be coloured by its single worst sample, so one bad sample in
// ~120 painted the whole bar amber — 2026-08-04 read "Degraded" at 99.17%.
// That is not wrong so much as unreadable: it gives an 8-minute blip and a
// day-long brownout the same colour, and a reader has no way to tell them
// apart.
//
// So severity now has to CLEAR A DURATION BAR, and the bar depends on how bad
// the thing was:
//
//   - An OUTAGE counts immediately. If we could not serve requests at all,
//     the duration is beside the point; the page must say so. (2026-08-02 was
//     two roughly 8- and 6-minute outages — both under any sane duration
//     threshold, and both absolutely worth showing red.)
//   - DEGRADED must persist for MIN_DEGRADED_MS before it colours the day.
//     Below that the day rates operational and the tooltip still says exactly
//     what happened, so nothing is hidden — it is just not shouted.
//
// Durations are ESTIMATED from sampling, and the estimate is deliberately
// generous: each sample is treated as covering SAMPLE_INTERVAL_MS, so a lone
// degraded sample counts as ~5 minutes rather than zero. We would rather
// over-state a blip than miss one.
export const MIN_DEGRADED_MS = 10 * 60 * 1000;

// Windows per day are capped so one flapping day cannot grow the record
// without bound. Far above any real incident count.
export const MAX_WINDOWS_PER_DAY = 24;

/** Estimated wall-clock length of a sampled window, in ms. */
export const windowDurationMs = (w) => w.t - w.f + SAMPLE_INTERVAL_MS;

/** Does this window, on its own, justify colouring the day? */
export const windowIsRatable = (w) =>
  w.s === 'degraded' ? windowDurationMs(w) >= MIN_DEGRADED_MS : true;

/**
 * The status a day should be RENDERED as. `worst` stays in the record as the
 * raw worst-sample fact; this is the presentation rule on top of it.
 */
export function rateDay(d) {
  const windows = Array.isArray(d.windows) ? d.windows : [];
  if (!windows.length) {
    // Written before window tracking landed: fall back to the old
    // worst-sample rule rather than silently claiming a green day we cannot
    // substantiate.
    return d.worst || 'operational';
  }
  let rated = 'operational';
  for (const w of windows) {
    if (windowIsRatable(w)) rated = worstStatus(rated, w.s);
  }
  return rated;
}

/**
 * Fold one sample into the record, in place. Returns true if the record
 * changed and should be written back, false if the sample was rate-limited
 * away.
 *
 * Rate-limits writes to one per SAMPLE_INTERVAL_MS, EXCEPT that a worsening
 * status always samples immediately — otherwise a short outage that starts
 * and ends between two intervals leaves no trace at all.
 */
export function applySample(rec, status, now) {
  if (!rec.days) rec.days = {};
  const k = dayKey(now);

  const today = rec.days[k];
  const worsened =
    !today ||
    (today.worst &&
      today.worst !== status &&
      STATUS_RANK[status] > STATUS_RANK[today.worst]);
  if (!worsened && rec.lastSampleAt && now - rec.lastSampleAt < SAMPLE_INTERVAL_MS) {
    return false;
  }

  const d = rec.days[k] || {
    ok: 0,
    degraded: 0,
    outage: 0,
    unknown: 0,
    worst: 'operational',
  };
  if (status === 'operational') d.ok++;
  else if (status === 'degraded') d.degraded++;
  else if (status === 'unknown') d.unknown++;
  else d.outage++; // partial_outage | major_outage
  d.worst = worstStatus(d.worst || 'operational', status);

  // Track WHEN it was bad, not just how often. Consecutive samples of the
  // same non-operational status extend one window; anything else opens a new
  // one. `unknown` is NOT a window — we did not measure, which is not the
  // same as being down, and the tooltip must not imply otherwise.
  if (status !== 'operational' && status !== 'unknown') {
    if (!Array.isArray(d.windows)) d.windows = [];
    const last = d.windows[d.windows.length - 1];
    // Allow one missed sample before splitting, so ordinary jitter in the
    // traffic-driven sampling doesn't shred a single incident into five.
    const contiguous =
      last && last.s === status && now - last.t <= SAMPLE_INTERVAL_MS * 2.5;
    if (contiguous) last.t = now;
    else if (d.windows.length < MAX_WINDOWS_PER_DAY) {
      d.windows.push({ s: status, f: now, t: now });
    }
  }

  rec.days[k] = d;
  rec.lastSampleAt = now;
  if (!rec.since) rec.since = k;

  // Prune anything outside the window so the record can't grow unbounded.
  const cutoff = dayKey(now - HISTORY_DAYS * 86400000);
  for (const key of Object.keys(rec.days)) {
    if (key < cutoff) delete rec.days[key];
  }
  return true;
}

/**
 * Project the stored record into the shape the status page renders: one entry
 * per day across the whole window, oldest first.
 */
export function buildHistoryView(rec, now) {
  if (!rec || !rec.days) return { days: [], since: null, uptimePct: null, daysWithData: 0 };

  const out = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const k = dayKey(now - i * 86400000);
    const d = rec.days[k];
    if (!d) {
      // No samples that day: explicitly "no data", NOT a green bar.
      out.push({ date: k, status: 'no_data', worstSample: null, uptimePct: null, windows: [] });
      continue;
    }
    // `unknown` samples are excluded from the denominator — they mean we could
    // not measure, which is not the same as downtime.
    const measured = d.ok + d.degraded + d.outage;
    const windows = Array.isArray(d.windows) ? d.windows : [];
    out.push({
      date: k,
      // What the bar is coloured by: severity that cleared its duration bar.
      status: measured === 0 ? 'no_data' : rateDay(d),
      // The raw worst sample, kept so the tooltip can say "we saw X briefly"
      // on a day rated operational. Without it the softer rating would look
      // like we simply never noticed.
      worstSample: measured === 0 ? null : d.worst || 'operational',
      uptimePct: measured === 0 ? null : Math.round((d.ok / measured) * 10000) / 100,
      windows: windows.map((w) => ({
        status: w.s,
        from: new Date(w.f).toISOString(),
        to: new Date(w.t).toISOString(),
        // Estimated, for the reasons on windowDurationMs. Exposed in minutes
        // because that is the unit the tooltip reads in.
        minutes: Math.max(1, Math.round(windowDurationMs(w) / 60000)),
        counted: windowIsRatable(w),
      })),
    });
  }

  const withData = out.filter((x) => x.uptimePct !== null);
  const overallPct = withData.length
    ? Math.round((withData.reduce((s, x) => s + x.uptimePct, 0) / withData.length) * 100) / 100
    : null;

  return {
    days: out,
    since: rec.since || null,
    uptimePct: overallPct,
    daysWithData: withData.length,
  };
}
