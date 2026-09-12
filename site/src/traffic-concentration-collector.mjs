/**
 * The LIVE half of traffic-concentration.mjs: ask Cloudflare who is
 * responsible for the marketing zone's traffic right now, run the pure
 * detector against it, and publish the answer so a Datadog monitor — not a
 * human noticing the /status page's color — is what catches the next one.
 *
 * WHY THIS EXISTS (2026-09-12). The pure detector in traffic-concentration.mjs
 * was added the same day as the incident it describes, but with no live
 * caller: nothing queried Cloudflare on a schedule, so the next scanner would
 * still have needed a human to notice. This closes that gap by riding the
 * SAME 5-minute cron that already exists for collectCustomerHealth (see
 * worker.js `scheduled()`), so no new Cloudflare credential, no new cron
 * trigger, and no new cost — one more GraphQL query and one more Datadog
 * submission per tick, using the token and API key already provisioned.
 *
 * Deliberately mirrors customer-health.mjs's shape (same window/lag
 * constants, same "log what Datadog actually said" discipline, same
 * fail-loud-on-missing-secret behaviour) so the two collectors read as one
 * system rather than two ad-hoc scripts.
 */

import { ZONES } from './status-attribution.mjs';
import { keyFingerprint } from './customer-health.mjs';
import { detectDominantClient, DOMINANT_CLIENT_SHARE } from './traffic-concentration.mjs';

const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

/**
 * Same settle-lag reasoning as customer-health.mjs: Cloudflare's adaptive
 * dataset is a minute or two behind, so reading up to `now` would undercount
 * the freshest bucket and make the share read LOW right when it matters most.
 */
const COLLECT_LAG_MS = 3 * 60 * 1000;
const COLLECT_WINDOW_MS = 5 * 60 * 1000;

const TRAFFIC_BY_IP_QUERY = `query($zone:String!,$since:Time!,$until:Time!){
  viewer{zones(filter:{zoneTag:$zone}){
    httpRequestsAdaptiveGroups(
      limit:2000,
      filter:{datetime_geq:$since,datetime_leq:$until},
      orderBy:[count_DESC]
    ){ count dimensions{ clientIP } }
  }}
}`;

/**
 * Ask the marketing zone for its traffic over one window, grouped by
 * client IP. Split out from collectTrafficConcentration for the same reason
 * customer-health.mjs split out fetchZone5xx: so the GraphQL error-handling
 * discipline (200-with-errors is a failure; a missing field is not an empty
 * result) is written once and shared, not drifted between two copies.
 */
export async function fetchZoneTrafficByIP(zoneTag, { token, since, until, fetchImpl = fetch }) {
  const iso = (d) => `${d.toISOString().slice(0, 19)}Z`;
  const res = await fetchImpl(CF_GRAPHQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: TRAFFIC_BY_IP_QUERY,
      variables: { zone: zoneTag, since: iso(since), until: iso(until) },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`cloudflare graphql ${res.status}`);

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`cloudflare returned non-JSON (${res.status})`);
  }
  if (body.errors?.length) {
    throw new Error(`cloudflare graphql error: ${JSON.stringify(body.errors).slice(0, 200)}`);
  }
  const rows = body?.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups;
  if (!Array.isArray(rows)) throw new Error('unexpected cloudflare payload shape');
  return rows;
}

export function shouldCollect(env) {
  return (env?.ENVIRONMENT ?? '') === 'production';
}

export async function collectTrafficConcentration(env, opts = {}) {
  const now = opts.now ?? Date.now();
  const doFetch = opts.fetchImpl ?? fetch;
  const token = env.CF_ANALYTICS_TOKEN;
  const apiKey = env.DD_API_KEY;
  if (!token || !apiKey) {
    console.error('[traffic-concentration] not configured:',
      !token ? 'CF_ANALYTICS_TOKEN missing' : 'DD_API_KEY missing');
    return null;
  }

  const until = new Date(now - COLLECT_LAG_MS);
  const since = new Date(until.getTime() - COLLECT_WINDOW_MS);
  const iso = (d) => `${d.toISOString().slice(0, 19)}Z`;

  const rows = await fetchZoneTrafficByIP(ZONES.marketing, { token, since, until, fetchImpl: doFetch });
  const detectorRows = rows.map((r) => ({ key: r?.dimensions?.clientIP, count: r?.count }));
  const result = detectDominantClient(detectorRows);

  const ts = Math.floor(until.getTime() / 1000);
  const interval = COLLECT_WINDOW_MS / 1000;
  const tags = ['env:production', 'source:divinci-ai-site', 'managed_by:claude-code'];
  const share = result.top?.share ?? 0;

  const site = env.DD_SITE || 'us5.datadoghq.com';
  const submit = await doFetch(`https://api.${site}/api/v1/series`, {
    method: 'POST',
    headers: { 'DD-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      series: [
        // A gauge, not a count: this is a SHARE (0..1) of one window's
        // traffic, not something to sum across windows. Continuous by
        // construction — see collectCustomerHealth's "explicit zero" test for
        // why an absent point (rather than a published 0) is the failure a
        // no-data monitor needs to see.
        { metric: 'divinci.cf.marketing.top_client_share', type: 'gauge', interval,
          points: [[ts, share]], tags },
        { metric: 'divinci.cf.marketing.top_client_flagged', type: 'count', interval,
          points: [[ts, result.flagged ? 1 : 0]], tags },
      ],
    }),
    signal: AbortSignal.timeout(8000),
  });
  const submitBody = await submit.text().catch(() => '<unreadable>');
  if (!submit.ok) throw new Error(`datadog submit ${submit.status}: ${submitBody.slice(0, 200)}`);

  // One line, k=v, greppable — same triage convention as [customer-health]
  // and the platform's [*-failed] markers. The IP is logged deliberately: it
  // is the entire point of the check, and this is an operational log
  // (wrangler tail / Cloud Logging equivalent), not a customer-facing surface.
  console.log(`[traffic-concentration] window=${iso(since)}..${iso(until)} `
    + `total=${result.total} top_ip=${result.top?.key ?? 'none'} `
    + `top_count=${result.top?.count ?? 0} share=${share.toFixed(4)} `
    + `flagged=${result.flagged} threshold=${DOMINANT_CLIENT_SHARE} `
    + `dd_status=${submit.status} key_fp=${await keyFingerprint(apiKey)}`);

  return { ...result, share };
}
