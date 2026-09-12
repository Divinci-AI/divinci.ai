#!/usr/bin/env node
/**
 * "End test" for the exact symptom that started the 2026-09-12 investigation:
 * fetch the PUBLIC /api/status endpoint and fail if the trailing run of
 * non-operational days, ending today, is long enough that a human would
 * notice ("these daily notes seem very similar") before anyone has to
 * screenshot the status page to find out.
 *
 * No credential needed — this hits the same endpoint any visitor sees.
 * Safe to run from CI, a laptop cron, or by hand.
 *
 * Usage:
 *   node scripts/check-status-degraded-streak.mjs
 *   node scripts/check-status-degraded-streak.mjs --url https://staging.divinci.ai/api/status
 *   node scripts/check-status-degraded-streak.mjs --threshold 3
 *
 * ⚠️ Non-production environments are EXPECTED to fail this check by design,
 * not by bug: dev/staging never run the collector cron (see wrangler.jsonc,
 * "Lower environments"), so their history never grows and reads `no_data`
 * forever, which this check treats as non-operational. Point this at
 * production unless you are specifically diagnosing that inertness.
 *
 * Exit codes: 0 healthy, 1 flagged (streak at/above threshold), 2 could not
 * fetch or parse the endpoint.
 */

import { computeDegradedStreak, DEFAULT_STREAK_THRESHOLD } from '../src/status-degraded-streak.mjs';

function parseArgs(argv) {
  const args = { url: 'https://divinci.ai/api/status', threshold: DEFAULT_STREAK_THRESHOLD };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i] === '--threshold') args.threshold = Number(argv[++i]);
  }
  return args;
}

async function main() {
  const { url, threshold } = parseArgs(process.argv.slice(2));

  let body;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`[status-degraded-streak] ${url} returned HTTP ${res.status}`);
      process.exit(2);
    }
    body = await res.json();
  } catch (e) {
    console.error(`[status-degraded-streak] could not fetch/parse ${url}: ${e?.message ?? e}`);
    process.exit(2);
  }

  const days = body?.history?.days;
  if (!Array.isArray(days)) {
    console.error(`[status-degraded-streak] ${url} did not carry history.days — unexpected response shape.`);
    process.exit(2);
  }

  const { flagged, streak } = computeDegradedStreak(days, { threshold });
  if (!flagged) {
    const latest = days.at(-1);
    console.log(`[status-degraded-streak] OK — ${url} is not in a degraded streak `
      + `(latest day ${latest?.date ?? '?'}: ${latest?.status ?? '?'}, threshold ${threshold}).`);
    process.exit(0);
  }

  console.error(`[status-degraded-streak] FLAGGED — ${streak.length} non-operational day(s) `
    + `in a row on ${url} (threshold ${threshold}):`);
  for (const d of streak) console.error(`  - ${d.date}: ${d.status}${d.topArea ? ` (top area: ${d.topArea})` : ''}`);
  process.exit(1);
}

main();
