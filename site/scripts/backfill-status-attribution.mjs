#!/usr/bin/env node
/**
 * Attribute the days that went by BEFORE the collector existed.
 *
 * The cron in src/worker.js attributes each five-minute window as it happens,
 * so from now on a bad day explains itself at the time. The days already on
 * the page do not: 2026-08-20 onward are bare amber blocks with no account of
 * themselves, which is exactly the complaint this work started from.
 *
 * Cloudflare keeps the host- and path-dimensioned data long enough to fix
 * that once. This script asks for it, classifies it with the SAME functions
 * the live collector uses (never a second copy of the mapping), and writes
 * the result into the same KV record the Worker reads.
 *
 * PRECISION. For each day it runs two kinds of query:
 *   - the whole day, which becomes the fallback basis; and
 *   - each window the sampler actually rated bad, which becomes the incident
 *     basis — the same distinction the live collector draws, so a backfilled
 *     day and a collected one mean the same thing on the page.
 *
 * A day that flapped into dozens of windows is left on the day basis rather
 * than firing dozens of queries; the note says which basis it used, so that
 * is visible to a reader rather than hidden.
 *
 * Usage:
 *   CLOUDFLARE_ANALYTICS_TOKEN=… node scripts/backfill-status-attribution.mjs [--days 14] [--apply]
 *
 * Without --apply it prints what it would write and touches nothing. With it,
 * the record is written through `wrangler kv key put`, and days already
 * present are left alone — the live collector owns those.
 */
import { execFileSync } from 'node:child_process';

// wrangler prefers CLOUDFLARE_API_TOKEN over the browser OAuth session, and
// the token in this shell is not the one with KV write — same `env -u` dance
// the deploy scripts do. Deleting the key beats setting it to undefined:
// execFileSync stringifies an undefined value into the literal "undefined".
const WRANGLER_ENV = { ...process.env };
delete WRANGLER_ENV.CLOUDFLARE_API_TOKEN;
import { attributeRows, attributionForDay, autoNote, ZONES, ATTRIBUTION_KEY } from '../src/status-attribution.mjs';

const KV_NAMESPACE = '4d3eb9e275804f3090b9c0f96154381d'; // STATUS_HISTORY, production
const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';
const MAX_WINDOW_QUERIES = 12;

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const days = Number(args[args.indexOf('--days') + 1]) || 14;
const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN || process.env.CF_ANALYTICS_TOKEN;
if (!token) {
  console.error('CLOUDFLARE_ANALYTICS_TOKEN is required (Infisical: prod, path /).');
  process.exit(2);
}

const QUERY = `query($zone:String!,$since:Time!,$until:Time!){
  viewer{zones(filter:{zoneTag:$zone}){
    httpRequestsAdaptiveGroups(limit:2000,filter:{datetime_geq:$since,datetime_leq:$until,edgeResponseStatus_geq:500},orderBy:[count_DESC])
    { count dimensions{ clientRequestHTTPHost clientRequestPath } }
  }}}`;

const iso = (d) => `${new Date(d).toISOString().slice(0, 19)}Z`;

async function rowsFor(since, until) {
  const out = [];
  for (const zone of Object.values(ZONES)) {
    const res = await fetch(CF_GRAPHQL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { zone, since: iso(since), until: iso(until) } }),
    });
    const body = await res.json();
    if (body.errors?.length) throw new Error(JSON.stringify(body.errors).slice(0, 300));
    out.push(...(body?.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? []));
  }
  return out;
}

// The sampler's own record of WHEN each day was bad — the public API serves it.
const status = await (await fetch('https://divinci.ai/api/status', { headers: { Accept: 'application/json' } })).json();
const history = new Map((status.history?.days ?? []).map((d) => [d.date, d]));

const record = { days: {}, updatedAt: Date.now() };
const today = new Date().toISOString().slice(0, 10);

for (let i = days; i >= 0; i--) {
  const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
  const day = history.get(date);
  if (!day) continue;
  if (!['degraded', 'partial_outage', 'major_outage'].includes(day.status)) continue;

  const dayStart = Date.parse(`${date}T00:00:00Z`);
  const dayEnd = Math.min(Date.parse(`${date}T23:59:59Z`), Date.now() - 3 * 60 * 1000);
  const whole = attributeRows(await rowsFor(dayStart, dayEnd));

  const windows = (day.windows ?? []).filter((w) => w.counted !== false);
  let inc = { areas: {}, total: 0, unclassified: 0 };
  if (windows.length && windows.length <= MAX_WINDOW_QUERIES) {
    for (const w of windows) {
      const t = attributeRows(await rowsFor(Date.parse(w.from), Date.parse(w.to) + 5 * 60 * 1000));
      for (const [k, v] of Object.entries(t.areas)) inc.areas[k] = (inc.areas[k] || 0) + v;
      inc.total += t.total;
      inc.unclassified += t.unclassified;
    }
  }

  const d = {
    total: whole.total, areas: whole.areas, unclassified: whole.unclassified,
    inc: inc.areas, incTotal: inc.total, incUnclassified: inc.unclassified,
    windows: windows.length,
    // Marked so a reader of the record — or of a future bug report — can tell
    // a reconstructed day from one observed live. They are the same numbers
    // from the same source, but they are not the same evidence.
    backfilled: true,
  };
  record.days[date] = d;

  const a = attributionForDay(d);
  const note = a ? autoNote(date, a, day) : null;
  console.log(`${date} ${day.status.padEnd(14)} total=${String(whole.total).padStart(6)} `
    + `basis=${a ? a.basis : '—'} ${a ? a.areas.map((x) => `${x.id}:${x.share}%`).join(' ') : 'NOT ATTRIBUTABLE'}`);
  if (note) console.log(`         ${note.title}`);
  if (date === today) console.log('         (partial: today is still being collected live)');
}

if (!apply) {
  console.log('\nDry run. Re-run with --apply to write.');
  process.exit(0);
}

// Merge rather than replace: the live collector may already own today, and
// clobbering its record would throw away ticks nobody can re-derive.
let existing = {};
try {
  existing = JSON.parse(execFileSync('npx', [
    'wrangler', 'kv', 'key', 'get', ATTRIBUTION_KEY,
    '--namespace-id', KV_NAMESPACE, '--remote',
  ], { encoding: 'utf8', env: WRANGLER_ENV }));
} catch { /* no record yet — expected on the first run */ }

const merged = { ...existing, days: { ...(record.days), ...(existing.days ?? {}) }, updatedAt: Date.now() };
const kept = Object.keys(existing.days ?? {}).filter((d) => d in record.days);
if (kept.length) console.log(`\nleft alone (already collected): ${kept.join(', ')}`);

execFileSync('npx', [
  'wrangler', 'kv', 'key', 'put', ATTRIBUTION_KEY, JSON.stringify(merged),
  '--namespace-id', KV_NAMESPACE, '--remote',
], { stdio: 'inherit', env: WRANGLER_ENV });
console.log(`\nwrote ${Object.keys(merged.days).length} days to ${ATTRIBUTION_KEY}`);
