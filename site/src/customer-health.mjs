/**
 * CUSTOMER-FACING edge errors, separated from everything else on the zone.
 *
 * WHY THIS EXISTS. The 90-day history on /status is sampled from ONE Datadog
 * monitor: `[CF] 5xx rate elevated (prod zones)`, which counts 5xx across the
 * whole Cloudflare zone. That zone carries the marketing site, the docs, the
 * status page itself, staging, dev, and internal tooling. So a dead internal
 * cron painted the public status page "Degraded" while customers were served
 * normally, and every such day needed a hand-written note explaining that the
 * product had in fact been fine.
 *
 * Measured over the 7 days to 2026-08-19, of 70,769 5xx on the two prod zones:
 *
 *   4,591   6.5%  customer-facing HOSTS (api/chat/embed/live/audio)
 *  33,516    47%  chunks-workflow (a dead tail-consumer cron; fixed 2026-08-17)
 *  21,512    30%  divinci.ai marketing site
 *  ~11,150    16%  staging / dev / email / status / fulcrum / docs
 *
 * ⚠️ AND HOST SCOPING ALONE IS NOT ENOUGH. Of those 4,591 on customer hosts,
 * 4,182 (91%) were OUR OWN automation calling our own API — the WWW-RAG daemon
 * (`submit-url` 503s, `run-sync-task` hangs), admin sweeps, hermes ticks. Real
 * customer-path 5xx were 550, i.e. 0.8% of what the monitor was watching.
 * Scoping by host and stopping there would still have been ~90% noise.
 *
 * ⛔ THIS CANNOT BE DONE IN DATADOG. `cloudflare.requests.status` carries no
 * hostname dimension — verified 2026-08-19 with grouped probe monitors:
 * `by {zone_name}` returns both zones, while `host` / `hostname` / `http_host`
 * / `client_request_host` each return No Data and zero groups. Datadog's
 * Cloudflare integration is zone-level. The hostname- and path-dimensioned data
 * exists only in Cloudflare's own `httpRequestsAdaptiveGroups` (both zones are
 * Enterprise), which is why the worker queries Cloudflare directly and submits
 * the result to Datadog as a custom metric.
 */

/**
 * Non-production hosts. Substring match, so `api.stage.divinci.app` and
 * `chunks-workflow.dev.divinci.app` are both caught.
 */
const NONPROD_MARKERS = ['.stage.', '.dev.', '.local.', '.test.'];

/** Bare-label non-prod hosts (`stage.divinci.app`), which the markers miss. */
const NONPROD_PREFIXES = ['stage.', 'dev.', 'staging.', 'test.', 'local.'];

/**
 * Production hosts that are NOT a customer surface. Each has its own alerting
 * where it deserves any:
 *   chunks-workflow  — internal ingestion pipeline
 *   status           — this status page; a status page reporting on itself is
 *                      circular, and its own 504s were 2,359 of one bad day
 *   r2               — legacy asset fallback; customers are served by the Worker
 *   hermes-webhooks  — internal agent automation
 *   email / webhook  — covered by the [email-send-failed] marker + its policy,
 *                      so counting them here would double-page
 */
const INTERNAL_HOSTS = new Set([
  'chunks-workflow.divinci.app',
  'status.divinci.app',
  'r2.divinci.app',
  'hermes-webhooks.divinci.app',
  'email.divinci.app',
  'webhook.divinci.app',
]);

/**
 * Paths that are our OWN automation hitting our OWN API. A 5xx here is a real
 * problem, but it is not a customer-visible outage and must never mark the
 * public status page degraded.
 *
 * ⚠️ This list fails toward INCLUSION: a path that is not listed counts as
 * customer-facing. That is deliberate — a new customer endpoint is covered the
 * day it ships, with no list to remember. The cost is that new INTERNAL
 * automation on a new prefix will register as customer traffic until it is
 * added here, which the `internal` counter exists to make visible.
 */
const INTERNAL_PATH_PREFIXES = [
  '/api/v1/www-rag',        // covers www-rag, www-rag-webhook, www-rag-directory
  '/api/v1/hermes-webhook',
  '/admin/',
  '/pyannote/',
  '/ffmpeg/',
];

/** Admin surfaces nested under a whitelabel, e.g. /white-label/_admin/... */
const INTERNAL_PATH_SUBSTRINGS = ['/_admin/'];

/**
 * Cloudflare reports the host as the client sent it, so the same origin appears
 * as both `api.divinci.app` and `api.divinci.app:8443`. Comparing raw strings
 * silently drops the port-suffixed variants.
 */
export function normalizeHost(host) {
  if (typeof host !== 'string') return '';
  return host.trim().toLowerCase().split(':')[0];
}

export function isCustomerHost(host) {
  const h = normalizeHost(host);
  // A row we cannot read is counted, never hidden. Classifying an unparseable
  // host as "internal" would file a real customer 5xx under the number nobody
  // alerts on — a silent drop wearing the costume of a clean signal.
  if (!h) return true;
  if (!h.endsWith('divinci.app')) return false;      // divinci.ai is marketing + docs
  if (NONPROD_MARKERS.some(m => h.includes(m))) return false;
  if (NONPROD_PREFIXES.some(p => h.startsWith(p))) return false;
  return !INTERNAL_HOSTS.has(h);
}

export function isCustomerPath(path) {
  if (typeof path !== 'string' || path === '') return true; // unknown ⇒ count it
  const p = path.toLowerCase();
  if (INTERNAL_PATH_PREFIXES.some(prefix => p.startsWith(prefix))) return false;
  return !INTERNAL_PATH_SUBSTRINGS.some(s => p.includes(s));
}

/**
 * Split Cloudflare 5xx rows into the customer-facing count and the internal
 * count. BOTH are returned and both are published: the internal number is what
 * makes the exclusion list visible, so it cannot quietly grow to swallow a real
 * customer signal without anyone noticing.
 */
export function summarize(rows) {
  let customer = 0;
  let internal = 0;
  for (const row of rows ?? []) {
    const count = Number(row?.count);
    if (!Number.isFinite(count) || count <= 0) continue;
    const dims = row.dimensions ?? {};
    if (isCustomerHost(dims.clientRequestHTTPHost) && isCustomerPath(dims.clientRequestPath)) {
      customer += count;
    } else {
      internal += count;
    }
  }
  return { customer, internal };
}

// ── Customer-facing edge errors → Datadog custom metric ──────────────────
//
// Cloudflare knows which HOST and PATH each 5xx hit; Datadog does not (its
// Cloudflare integration is zone-level — see customer-health.mjs for the
// proof). So we ask Cloudflare, classify here, and publish the answer to
// Datadog as a custom metric that a monitor — and therefore the pager AND the
// /status history — can finally point at.
//
// ⚠️ THIS RUNS ON A CRON, NOT ON REQUEST TRAFFIC. The 90-day history is
// sampled opportunistically from /api/status hits because a missed sample only
// costs resolution. This is different: it feeds a PAGER, and a pager that goes
// blind whenever the marketing site is quiet at 4am is worse than no pager.
// If the cron stops, the metric stops, and the monitor's no-data notification
// is what says so.

const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

/** divinci.app. The divinci.ai zone is marketing, docs and internal tooling. */
const CUSTOMER_ZONE_TAG = '9b26e2c415f36b0f656204133c8ab87c';

/**
 * Cloudflare's adaptive dataset settles a minute or two behind real time, so
 * we always read a window that has stopped changing. Reading up to `now` would
 * undercount every bucket and make the metric quietly read low — the failure
 * mode that looks like good news.
 */
const COLLECT_LAG_MS = 3 * 60 * 1000;
const COLLECT_WINDOW_MS = 5 * 60 * 1000;

const CUSTOMER_5XX_QUERY = `query($zone:String!,$since:Time!,$until:Time!){
  viewer{zones(filter:{zoneTag:$zone}){
    httpRequestsAdaptiveGroups(
      limit:2000,
      filter:{datetime_geq:$since,datetime_leq:$until,edgeResponseStatus_geq:500},
      orderBy:[count_DESC]
    ){ count dimensions{ clientRequestHTTPHost clientRequestPath } }
  }}
}`;

/**
 * Whether THIS deployment may publish the metric.
 *
 * ⚠️ This is the only thing standing between one signal and three. dev,
 * staging and production run the SAME code from the same file; if two of them
 * submit, every value the pager reads is doubled — and a doubled count reads
 * as a traffic increase, not as a bug, so nobody would go looking.
 *
 * Fails CLOSED on an unknown environment. An unset ENVIRONMENT means we cannot
 * tell which deployment this is, and guessing "probably production" is how the
 * duplicate submission happens. The cost of being wrong in this direction is
 * visible: the metric goes absent and the monitor's no-data notification says
 * so. The cost of being wrong in the other direction is silent.
 */
/**
 * First 8 hex of sha256(key) — an IDENTITY, never the key.
 *
 * ⚠️ A LENGTH cannot tell two keys apart, and that is exactly what went wrong
 * on 2026-08-19: this worker held a VALID Datadog API key belonging to a
 * DIFFERENT org. Intake returned `202 {"status":"ok"}` for every submission
 * and filed the points where nobody could see them, while the same worker read
 * monitors from the correct org (Datadog's read APIs are scoped by the
 * APPLICATION key). Both keys were 32 characters, so `key_len` said they were
 * the same. A fingerprint makes "which credential is this actually" answerable
 * from the log line, which is the only place the question was visible.
 *
 * Safe to log: 8 hex of a hash is not reversible and is not a credential —
 * the same comparison this repo already uses to verify a secret write
 * (`shasum -a256 | cut -c1-16`). Never log the key itself.
 */
export async function keyFingerprint(key) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(key)));
    return [...new Uint8Array(buf)].slice(0, 4).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "unavailable";
  }
}

export function shouldCollect(env) {
  return (env?.ENVIRONMENT ?? "") === "production";
}

/**
 * Ask one zone for its 5xx, grouped by host and path.
 *
 * Extracted so the /status attribution collector can ask the SAME question of
 * the marketing zone without a second copy of the query and the second copy of
 * the error handling that would drift from it. Both callers depend on the two
 * non-obvious behaviours here:
 *   - Cloudflare answers a GraphQL error with HTTP 200 and an `errors` array,
 *     so the status code alone proves nothing about whether we got data;
 *   - a missing `httpRequestsAdaptiveGroups` is an unexpected payload, NOT an
 *     empty result — treating it as zero would publish a reassuring number
 *     from a broken query.
 *
 * @returns {Promise<Array<{count:number, dimensions:object}>>}
 */
export async function fetchZone5xx(zoneTag, { token, since, until, fetchImpl = fetch }) {
  const iso = (d) => `${d.toISOString().slice(0, 19)}Z`;
  const res = await fetchImpl(CF_GRAPHQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CUSTOMER_5XX_QUERY,
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

export async function collectCustomerHealth(env, opts = {}) {
  const now = opts.now ?? Date.now();
  const doFetch = opts.fetchImpl ?? fetch;
  const token = env.CF_ANALYTICS_TOKEN;
  const apiKey = env.DD_API_KEY;
  if (!token || !apiKey) {
    // Say which one, out loud. A collector that no-ops on a missing secret and
    // logs nothing is indistinguishable from one that is working.
    console.error('[customer-health] not configured:',
      !token ? 'CF_ANALYTICS_TOKEN missing' : 'DD_API_KEY missing');
    return null;
  }

  const until = new Date(now - COLLECT_LAG_MS);
  const since = new Date(until.getTime() - COLLECT_WINDOW_MS);
  const iso = (d) => `${d.toISOString().slice(0, 19)}Z`;

  const rows = await fetchZone5xx(CUSTOMER_ZONE_TAG, { token, since, until, fetchImpl: doFetch });

  const { customer, internal } = summarize(rows);
  const ts = Math.floor(until.getTime() / 1000);
  const interval = COLLECT_WINDOW_MS / 1000;
  const tags = ['env:production', 'source:divinci-ai-site', 'managed_by:claude-code'];

  const site = env.DD_SITE || 'us5.datadoghq.com';
  const submit = await doFetch(`https://api.${site}/api/v1/series`, {
    method: 'POST',
    headers: { 'DD-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      series: [
        // What pages, and what the public status history is sampled from.
        { metric: 'divinci.cf.customer.errors_5xx', type: 'count', interval,
          points: [[ts, customer]], tags },
        // Published on purpose: this is our OWN automation failing against our
        // OWN API, and it is ~90% of the raw number. Keeping it visible is what
        // stops the exclusion list quietly growing until it swallows a real
        // customer signal.
        { metric: 'divinci.cf.internal.errors_5xx', type: 'count', interval,
          points: [[ts, internal]], tags },
      ],
    }),
    signal: AbortSignal.timeout(8000),
  });
  // Log what Datadog ACTUALLY said. A 202 is not proof of ingestion — the
  // intake accepts a payload and can still drop it — so the status and body
  // are recorded rather than assumed.
  const submitBody = await submit.text().catch(() => '<unreadable>');
  if (!submit.ok) throw new Error(`datadog submit ${submit.status}: ${submitBody.slice(0, 200)}`);
  console.log(`[customer-health] datadog status=${submit.status} `
    + `body=${submitBody.slice(0, 120)} site=${site} key_fp=${await keyFingerprint(apiKey)}`);

  // One line, k=v, greppable. Mirrors the [*-failed] marker convention used
  // across the platform.
  console.log(`[customer-health] window=${iso(since)}..${iso(until)} `
    + `customer_5xx=${customer} internal_5xx=${internal} rows=${rows.length}`);
  return { customer, internal, rows: rows.length };
}
