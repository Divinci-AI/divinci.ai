#!/usr/bin/env node
/**
 * Re-rate the stored /status history under the CURRENT customer-facing rules.
 *
 * WHY (2026-09-17)
 * For three weeks the page showed a "Degraded" day most days. Replaying the
 * Cloudflare rows behind every one of them showed two kinds of 5xx that never
 * reached a customer (see isCloudflareSyntheticRequest and
 * MAX_ERRORS_PER_CLIENT in src/status-attribution.mjs): Cloudflare's own Early
 * Hints / prefetch fetches, and single scanners walking exploit paths. The live
 * collector no longer counts either. This script applies the same rules to the
 * days already recorded, so the series is one definition end to end.
 *
 * WHAT IT DOES
 * Every non-operational SAMPLE in history:v1 is re-evaluated against its own
 * five-minute Cloudflare window, the one the cron would have read when it took
 * the sample ([t - 8m, t - 3m]). A sample whose customer-facing count, under
 * the current rules, is below the degraded threshold becomes operational.
 *
 * ⚠️ IT CAN ONLY CLEAR SAMPLES, NEVER ADD THEM. Only samples the pipeline
 * actually recorded as bad are re-read; the other ~280 buckets a day are not
 * evaluated. Evaluating every bucket would be a different measurement (288
 * chances a day to catch a transient instead of the pipeline's own), not a
 * correction of this one.
 *
 * ⚠️ AN OUTAGE SAMPLE IS KEPT when its window still carries a degraded-level
 * customer-facing count. The rules above were written for "elevated errors",
 * which rates degraded at most; an outage came from a direct measurement and
 * is not downgraded by a count that corroborates it. One whose window shows no
 * customer-facing errors at all is cleared like any other.
 *
 * ⚠️ DAYS WITH A DOCUMENTED CUSTOMER-FACING OUTAGE ARE NOT REPLAYED (--keep).
 * An error COUNT cannot disprove an outage. A request that hangs produces no
 * 5xx until the edge gives up on it, and at a quiet hour a real product
 * outage can leave fewer errors in five minutes than the threshold needs.
 * 2026-08-02 is exactly that: two product outages, written up in
 * data/status-incidents.toml, that the count rule alone would erase. Those
 * days came from direct probes of the customer path, which is stronger
 * evidence than anything this script reads, so they are left as recorded.
 *
 * Sample times inside a window are reconstructed as f, f+5m, ..., t. That is
 * exact for the cron-sampled era and approximate for the earlier eras (the
 * traffic-sampled days, and the days rebuilt from GCP uptime checks on
 * 2026-08-16).
 *
 * USAGE
 *   CLOUDFLARE_ANALYTICS_TOKEN=... node scripts/rerate-status-history.mjs \
 *     --in history.json --out history.rerated.json [--report report.json] \
 *     [--keep 2026-08-02 ...]
 *
 * Reads and writes FILES only. Writing to KV is a separate, deliberate step:
 * back up history:v1 first, then `wrangler kv key put`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fetchZone5xx } from '../src/customer-health.mjs';
import {
  ATTRIBUTION_5XX_QUERY,
  ZONES,
  attributeRows,
  ratingForCount,
} from '../src/status-attribution.mjs';
import { AREA_IDS } from '../src/status-areas.mjs';
import {
  SAMPLE_INTERVAL_MS,
  STATUS_RANK,
  buildHistoryView,
  worstStatus,
} from '../src/status-history.mjs';

const LAG_MS = 3 * 60 * 1000;
const WINDOW_MS = 5 * 60 * 1000;

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Cloudflare's GraphQL budget is roughly 300 queries per five minutes, and a
 * full replay needs several hundred. Pace every call, and on a depleted
 * budget wait the budget out rather than failing mid-record.
 */
async function fetchPaced(zone, opts) {
  for (let attempt = 0; ; attempt++) {
    await sleep(1100);
    try {
      return await fetchZone5xx(zone, opts);
    } catch (e) {
      if (!/Rate limiter budget depleted/.test(String(e?.message)) || attempt >= 5) throw e;
      console.error(`  rate limited; waiting 5 minutes (attempt ${attempt + 1})`);
      await sleep(5 * 60 * 1000 + 5000);
    }
  }
}

async function customerCountAt(sampleMs, token) {
  const until = new Date(sampleMs - LAG_MS);
  const since = new Date(until.getTime() - WINDOW_MS);
  const perZone = [];
  // Sequential, not Promise.all: pacing is per call.
  for (const z of Object.values(ZONES)) {
    perZone.push(await fetchPaced(z, { token, since, until, query: ATTRIBUTION_5XX_QUERY }));
  }
  const tick = attributeRows(perZone.flat());
  const customer = AREA_IDS.reduce((s, id) => s + (tick.areas[id] || 0), 0);
  return { customer, excluded: tick.excluded, areas: tick.areas };
}

/**
 * The sample times a window stood for: f, then every interval, and always t.
 * Cron drift makes t - f a little short of a whole number of intervals, so
 * stepping alone would drop the window's last sample.
 */
function sampleTimes(w) {
  const out = [];
  for (let t = w.f; t < w.t - SAMPLE_INTERVAL_MS / 2; t += SAMPLE_INTERVAL_MS) out.push(t);
  out.push(w.t);
  return out;
}

/** Rebuild windows from time-ordered non-operational samples, as applySample does. */
function rebuildWindows(samples) {
  const windows = [];
  for (const { t, s } of samples.sort((a, b) => a.t - b.t)) {
    const last = windows[windows.length - 1];
    if (last && last.s === s && t - last.t <= SAMPLE_INTERVAL_MS * 2.5) last.t = t;
    else windows.push({ s, f: t, t });
  }
  return windows;
}

async function main() {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  const inPath = arg('--in');
  const outPath = arg('--out');
  if (!token || !inPath || !outPath) {
    console.error('usage: CLOUDFLARE_ANALYTICS_TOKEN=... rerate-status-history.mjs --in <file> --out <file> [--report <file>]');
    process.exit(2);
  }

  const keep = new Set(process.argv.flatMap((a, i) => (process.argv[i - 1] === '--keep' ? [a] : [])));
  const rec = JSON.parse(await readFile(inPath, 'utf8'));
  const next = structuredClone(rec);
  const report = [];

  for (const [date, day] of Object.entries(rec.days).sort()) {
    if (!Array.isArray(day.windows) || day.windows.length === 0) continue;
    if (keep.has(date)) {
      console.log(`${date}  kept as recorded (--keep)`);
      continue;
    }

    const kept = [];
    const detail = [];

    for (const w of day.windows) {
      for (const t of sampleTimes(w)) {
        const { customer, excluded } = await customerCountAt(t, token);
        const keep = ratingForCount(customer) === 'degraded';
        detail.push({ at: new Date(t).toISOString(), was: w.s, customer, excluded, kept: keep });
        if (keep) kept.push({ t, s: w.s });
      }
    }

    // The windows ARE the record of when the day was bad, so the counters are
    // set from what survived in them. Anything the counters held beyond the
    // reconstructed samples had no surviving window to stand for and returns
    // to ok, like a cleared sample.
    const d = next.days[date];
    const keptDeg = kept.filter((k) => k.s === 'degraded').length;
    const keptOut = kept.length - keptDeg;
    const cleared = ((d.degraded || 0) - keptDeg) + ((d.outage || 0) - keptOut);
    d.degraded = keptDeg;
    d.outage = keptOut;
    d.ok = (d.ok || 0) + Math.max(0, cleared);
    d.windows = rebuildWindows(kept);

    let worst = 'operational';
    if ((d.unknown || 0) > 0) worst = worstStatus(worst, 'unknown');
    for (const w of d.windows) worst = worstStatus(worst, w.s);
    if ((d.degraded || 0) > 0) worst = worstStatus(worst, 'degraded');
    d.worst = worst;

    report.push({ date, before: { ...summary(day) }, after: summary(d), detail });
    console.log(`${date}  ${fmt(summary(day))}  →  ${fmt(summary(d))}`);
  }

  const now = Date.now();
  const before = buildHistoryView(rec, now);
  const after = buildHistoryView(next, now);
  const bad = (v) => v.days.filter((x) => STATUS_RANK[x.status] >= STATUS_RANK.degraded).length;
  console.log(`\noverall uptime ${before.uptimePct}% → ${after.uptimePct}%; `
    + `days rated degraded or worse ${bad(before)} → ${bad(after)}`);

  await writeFile(outPath, JSON.stringify(next));
  const reportPath = arg('--report');
  if (reportPath) await writeFile(reportPath, JSON.stringify(report, null, 2));
}

const summary = (d) => ({ ok: d.ok, degraded: d.degraded, outage: d.outage, unknown: d.unknown, worst: d.worst, windows: (d.windows || []).length });
const fmt = (s) => `${s.worst.padEnd(14)} deg=${s.degraded} out=${s.outage} win=${s.windows}`;

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
