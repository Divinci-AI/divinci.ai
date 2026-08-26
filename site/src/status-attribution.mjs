/**
 * Which AREA of the estate a bad day landed on — derived at the time, not
 * written up afterwards.
 *
 * WHY THIS EXISTS
 * `status-areas.mjs` can draw a day as five bands, and the incident list can
 * carry a note saying what broke. Both were fed by ONE source: a hand-edited
 * `data/status-incidents.toml` that needs a site deploy. So every day was a
 * plain amber block with no account of itself until a human went back and
 * attributed it — and the days nobody got round to (2026-08-20 onward, at the
 * time of writing) stayed blocks forever. A status page whose explanations
 * arrive days late, or never, is telling visitors nothing at the moment they
 * are asking.
 *
 * The evidence to attribute a day already exists and is already being
 * collected. `customer-health.mjs` asks Cloudflare, every five minutes, which
 * HOST and PATH each 5xx hit — that is precisely the dimension the day-rating
 * monitor lacks. This module classifies those same rows into the five public
 * areas and folds them into a per-day record, so the page can say "the
 * marketing site carried 94% of these errors; the product was not affected"
 * without anyone writing it down.
 *
 *   Cloudflare GraphQL (both zones)  →  attributeRows()
 *     →  KV `attribution:v1`  (5-min cron, production only)
 *     →  GET /api/status      (merged into each history day)
 *     →  bands + an auto note on /status
 *
 * ⚠️ WHAT THIS DOES NOT DO, ON PURPOSE
 *  - It never RE-RATES a day. Severity and the uptime percentage are a
 *    published series people compare across days; attribution is additive
 *    detail on top of the existing rating, exactly as status-areas.mjs
 *    already argues.
 *  - It never explains WHY. Errors have a shape, not a cause. The auto note
 *    says what was affected and how much; a human note in
 *    data/status-incidents.toml still says why, and still wins where present.
 *  - It never invents a breakdown. Too few events, or too many it could not
 *    classify, and it returns nothing — which the page renders as the plain
 *    solid bar it draws today. This page's failure mode has always been
 *    over-claiming; a confident wrong attribution would be a worse version of
 *    the same bug.
 */

import { fetchZone5xx, isCustomerHost, isCustomerPath, normalizeHost } from './customer-health.mjs';
import { AREA_IDS } from './status-areas.mjs';

export const ATTRIBUTION_KEY = 'attribution:v1';
export const ATTRIBUTION_DAYS = 90;

/**
 * Both Enterprise zones. divinci.app carries the product, its pre-production
 * hostnames and several internal services; divinci.ai carries the marketing
 * site, the SDK docs, the sales demos and internal tooling. Attributing from
 * one zone alone would file every marketing-site error under "unclassified"
 * and attribute nothing — which is how this started.
 */
export const ZONES = {
  product: '9b26e2c415f36b0f656204133c8ab87c',   // divinci.app
  marketing: 'bbca355451b61dd26605f616e68bd855', // divinci.ai
};

/** Hosts on the divinci.ai zone that are NOT the marketing site. */
const DOCS_HOSTS = new Set(['sdk.divinci.ai']);
const AI_INTERNAL_HOSTS = new Set(['fulcrum-acme.divinci.ai']);
/** Sales demos. Public, prospect-visible, and not the product. */
const DEMO_SUFFIX = '.demos.divinci.ai';

/** Non-production, on either zone. Mirrors customer-health.mjs's markers. */
const NONPROD_MARKERS = ['.stage.', '.dev.', '.local.', '.test.'];
const NONPROD_PREFIXES = ['stage.', 'dev.', 'staging.', 'test.', 'local.'];

const isNonProd = (h) =>
  NONPROD_MARKERS.some((m) => h.includes(m)) || NONPROD_PREFIXES.some((p) => h.startsWith(p));

/**
 * The area one Cloudflare row belongs to, or `null` when we cannot tell.
 *
 * ⚠️ `null` is a real answer and must stay one. Folding an unrecognised host
 * into a plausible-looking bucket is how a breakdown becomes fiction: the
 * numbers still add to 100% and nothing on the page hints that a third of
 * them were guesses. Unclassified rows are counted separately, and enough of
 * them suppress attribution for that day entirely.
 */
export function areaForRow(host, path) {
  const h = normalizeHost(host);
  if (!h) return null;

  if (isNonProd(h)) return 'preprod';

  if (h === 'divinci.ai' || h === 'www.divinci.ai') return 'marketing';
  if (h.endsWith('.divinci.ai')) {
    if (DOCS_HOSTS.has(h)) return 'docs';
    if (AI_INTERNAL_HOSTS.has(h)) return 'internal';
    if (h.endsWith(DEMO_SUFFIX)) return 'marketing';
    // Unknown host on the marketing zone. Defaulting to `marketing` rather
    // than `internal` keeps a new public surface visible from the day it
    // ships — the same "fails toward inclusion" rule customer-health.mjs
    // applies to its internal-path list, for the same reason.
    return 'marketing';
  }

  if (h.endsWith('divinci.app')) {
    // isCustomerHost already excludes the internal hosts and non-prod names;
    // reusing it is what keeps this classification and the pager's
    // customer-5xx metric from ever disagreeing about what "the product" is.
    if (!isCustomerHost(h)) return 'internal';
    // A customer host reached by our own automation is internal traffic on a
    // customer surface — 91% of customer-host 5xx, measured. Filing that as
    // product impact would put a "the product was affected" verdict on the
    // public page for a daemon of ours retrying.
    return isCustomerPath(path) ? 'product' : 'internal';
  }

  return null;
}

const emptyCounts = () => {
  const c = {};
  for (const id of AREA_IDS) c[id] = 0;
  return c;
};

/**
 * Fold Cloudflare 5xx rows into per-area counts.
 *
 * @param {Array<{count:number, dimensions:{clientRequestHTTPHost?:string, clientRequestPath?:string}}>} rows
 * @returns {{areas:Record<string,number>, total:number, unclassified:number}}
 */
export function attributeRows(rows) {
  const areas = emptyCounts();
  let unclassified = 0;
  let total = 0;
  for (const row of rows ?? []) {
    const count = Number(row?.count);
    if (!Number.isFinite(count) || count <= 0) continue;
    const dims = row.dimensions ?? {};
    const area = areaForRow(dims.clientRequestHTTPHost, dims.clientRequestPath);
    total += count;
    if (area && area in areas) areas[area] += count;
    else unclassified += count;
  }
  return { areas, total, unclassified };
}

// ── The stored record ────────────────────────────────────────────────────
//
//   {
//     updatedAt: <ms>,
//     days: {
//       "2026-08-26": {
//         total: 4310, unclassified: 0,
//         areas:    { product: 41, marketing: 4077, ... },   // whole day
//         inc:      { product: 0,  marketing: 3900, ... },   // while rated bad
//         incTotal: 3900, incUnclassified: 0,
//         windows: 6                                          // seen bad ticks
//       }
//     }
//   }
//
// TWO baskets, not one, and the distinction is the whole point. A day's total
// includes the quiet hours; the incident basket only counts the five-minute
// ticks during which the status sampler had an open non-operational window.
// Attributing from the day total would let a noisy-but-healthy subsystem take
// the blame for a short outage somewhere else.

export const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);

const addInto = (target, src) => {
  for (const id of AREA_IDS) target[id] = (target[id] || 0) + (src[id] || 0);
};

/**
 * Fold one collection tick into the record, in place.
 *
 * @param {object} rec               the stored record (mutated)
 * @param {object} tick              attributeRows() output for this window
 * @param {object} opts
 * @param {number} opts.now          window end, ms
 * @param {boolean} opts.duringIncident  was the page reporting trouble then?
 */
export function applyAttribution(rec, tick, { now, duringIncident }) {
  if (!rec.days) rec.days = {};
  const k = dayKey(now);
  const d = rec.days[k] || {
    total: 0,
    unclassified: 0,
    areas: emptyCounts(),
    inc: emptyCounts(),
    incTotal: 0,
    incUnclassified: 0,
    windows: 0,
  };
  // Defensive: a record written by an older shape must not throw here and
  // take the whole cron down with it.
  if (!d.areas) d.areas = emptyCounts();
  if (!d.inc) d.inc = emptyCounts();

  addInto(d.areas, tick.areas);
  d.total += tick.total;
  d.unclassified += tick.unclassified;

  if (duringIncident) {
    addInto(d.inc, tick.areas);
    d.incTotal += tick.total;
    d.incUnclassified += tick.unclassified;
    d.windows += 1;
  }

  rec.days[k] = d;
  rec.updatedAt = now;

  const cutoff = dayKey(now - ATTRIBUTION_DAYS * 86400000);
  for (const key of Object.keys(rec.days)) {
    if (key < cutoff) delete rec.days[key];
  }
  return rec;
}

// ── Turning counts into a claim ──────────────────────────────────────────

/**
 * An area has to carry at least this share of the basis before it is named.
 * Below it, the area is listed as unaffected rather than banded — a handful
 * of errors on a surface that serves millions is not an incident on that
 * surface, and banding it would make every day look like everything broke.
 */
export const MIN_AREA_SHARE = 0.10;

/**
 * Too few events to divide up. A day rated degraded off a dozen errors has no
 * meaningful breakdown, and inventing one from three of them would be noise
 * presented as a finding.
 */
export const MIN_BASIS_EVENTS = 20;

/**
 * If we could not classify this much of the basis, we do not report a
 * breakdown at all. The shares of what remains might be perfectly accurate —
 * but we cannot know that, and a chart that omits half its input while
 * looking complete is the failure this module exists to avoid.
 */
export const MAX_UNCLASSIFIED_SHARE = 0.35;

/**
 * What one day's counts support, or `null` when they support nothing.
 *
 * Prefers the incident basket — what was failing WHILE the page was reporting
 * trouble — and falls back to the whole day only when no incident tick was
 * captured. The sampler is traffic-driven, so a quiet-hour incident can leave
 * no tick at all; the day total is a weaker but honest substitute, and the
 * `basis` field says which one was used so the page never implies more
 * precision than it has.
 */
export function attributionForDay(d) {
  if (!d) return null;

  const useIncident = (d.incTotal || 0) >= MIN_BASIS_EVENTS;
  const basis = useIncident ? 'incident' : 'day';
  const counts = useIncident ? d.inc : d.areas;
  const total = useIncident ? d.incTotal : d.total;
  const unclassified = useIncident ? d.incUnclassified : d.unclassified;

  if (!counts || !Number.isFinite(total) || total < MIN_BASIS_EVENTS) return null;
  if (unclassified / total > MAX_UNCLASSIFIED_SHARE) return null;

  const ranked = AREA_IDS
    .map((id) => ({ id, count: counts[id] || 0, share: (counts[id] || 0) / total }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);

  // The leader is always named even if it is under the share floor: something
  // carried these errors, and reporting "no area reached 10%" on a day the
  // page calls degraded would be a non-answer.
  const named = ranked.filter((a, i) => i === 0 || a.share >= MIN_AREA_SHARE);
  if (!named.length) return null;

  return {
    basis,
    total,
    unclassified,
    areas: named.map((a) => ({ id: a.id, count: a.count, share: Math.round(a.share * 1000) / 10 })),
  };
}

/**
 * Project the stored record into `{ [date]: attribution }`. Days that support
 * no claim are simply absent, which the page reads as "not attributed".
 */
export function attributionView(rec) {
  const out = {};
  if (!rec || !rec.days) return out;
  for (const [date, d] of Object.entries(rec.days)) {
    const a = attributionForDay(d);
    if (a) out[date] = a;
  }
  return out;
}

// ── The note ─────────────────────────────────────────────────────────────

const AREA_PHRASE = {
  product: 'the product (chat, API and embeds)',
  marketing: 'our marketing site',
  docs: 'the developer documentation site',
  preprod: 'pre-production, which carries no customer traffic',
  internal: 'internal tooling, which only Divinci staff reach',
};

const pct = (n) => (n >= 99.5 ? '>99' : n < 1 ? '<1' : String(Math.round(n)));

/**
 * The sentence the page shows when nobody has written one.
 *
 * Composed HERE from area ids and numbers, never from anything that crossed a
 * wire — the same rule status-components.mjs sets for the pushed payload, and
 * for the same reason: this text lands on a public page.
 *
 * It deliberately reads as a description, not a diagnosis. "Most of these
 * errors were on our marketing site" is something the data supports. "The
 * marketing site was down because of X" is not, and no amount of counting
 * will make it so — that stays a human's job, and a human note supersedes
 * this one wherever it exists.
 */
export function autoNote(date, attribution, day) {
  if (!attribution || !attribution.areas.length) return null;

  const hit = attribution.areas;
  const lead = hit[0];
  const productHit = hit.some((a) => a.id === 'product');

  const parts = hit.map((a) => `${AREA_PHRASE[a.id] || a.id} (${pct(a.share)}%)`);
  const where =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;

  const scope =
    attribution.basis === 'incident'
      ? 'while this page was reporting a problem'
      : 'across the whole day';

  const lines = [
    `Elevated error responses ${scope} were concentrated on ${where}.`,
    productHit
      ? 'The product was among the affected areas, so some customer requests will have failed.'
      : 'The customer-facing product — chat, the API and embedded widgets — was not among the affected areas.',
  ];

  if (attribution.basis === 'day') {
    lines.push(
      'We could not isolate the exact minutes this page was reporting a problem, '
        + 'so this breakdown covers the whole day and may include unrelated errors.',
    );
  }

  const minutes = (day && Array.isArray(day.windows) ? day.windows : [])
    .filter((w) => w.counted !== false)
    .reduce((s, w) => s + (Number(w.minutes) || 0), 0);
  if (minutes > 0) {
    lines.push(`Recorded degradation totalled roughly ${minutes} minute${minutes === 1 ? '' : 's'}.`);
  }

  lines.push(
    'This note was written automatically from error attribution at the time. '
      + 'It says what was affected, not why — where a cause is known we add it by hand.',
  );

  return {
    date,
    auto: true,
    title:
      lead.id === 'product'
        ? 'Elevated errors on customer-facing services'
        : `Elevated errors, mostly on ${AREA_PHRASE[lead.id] || lead.id}`,
    areas: hit.map((a) => a.id),
    productAffected: productHit,
    summary: lines.join(' '),
  };
}

// ── Collection ───────────────────────────────────────────────────────────

/**
 * Same lag and window as the customer-health collector, and for the same
 * reason: Cloudflare's adaptive dataset settles a minute or two behind real
 * time, so reading up to `now` undercounts every bucket — the failure mode
 * that looks like good news.
 */
export const COLLECT_LAG_MS = 3 * 60 * 1000;
export const COLLECT_WINDOW_MS = 5 * 60 * 1000;

/**
 * How recently the status sampler must have seen trouble for this tick to
 * count as "during an incident". The sampler is traffic-driven and can miss a
 * beat, so this tolerates two of its five-minute intervals — the same
 * allowance applySample() makes before it splits one incident into two.
 */
export const INCIDENT_RECENCY_MS = 12 * 60 * 1000;

/**
 * Was the page reporting a problem at `now`, according to the history record?
 *
 * Deliberately reads the SAMPLER's own record rather than re-deriving trouble
 * from the error counts: the bar's colour comes from the sampler, so
 * attribution must be scoped by the same clock the colour is. Otherwise the
 * page could show a breakdown for minutes it never called bad.
 */
export function incidentOpenAt(historyRecord, now) {
  const day = historyRecord?.days?.[dayKey(now)];
  const windows = Array.isArray(day?.windows) ? day.windows : [];
  if (!windows.length) return false;
  const last = windows[windows.length - 1];
  return Number.isFinite(last?.t) && now - last.t <= INCIDENT_RECENCY_MS;
}

/**
 * One collection tick: ask both zones what failed, classify it, and fold the
 * answer into `attribution:v1`.
 *
 * Errors are thrown to the caller, which logs and swallows them — a failed
 * attribution tick must never take down the customer-health metric that runs
 * beside it, and the visible consequence of repeated failure is the right one:
 * days stop being attributed and render as the plain bars they did before.
 */
export async function collectAttribution(env, opts = {}) {
  const now = opts.now ?? Date.now();
  const doFetch = opts.fetchImpl ?? fetch;
  const fetchRows = opts.fetchRows;           // tests inject; production uses HTTP
  const token = env.CF_ANALYTICS_TOKEN;
  const kv = env.STATUS_HISTORY;

  if (!kv) {
    console.error('[status-attribution] not configured: STATUS_HISTORY binding missing');
    return null;
  }
  if (!token && !fetchRows) {
    console.error('[status-attribution] not configured: CF_ANALYTICS_TOKEN missing');
    return null;
  }

  const until = new Date(now - COLLECT_LAG_MS);
  const since = new Date(until.getTime() - COLLECT_WINDOW_MS);

  // ⛔ ALL zones or none. Promise.all rejects the tick if either zone fails,
  // and that is the behaviour we want: attributing from the product zone
  // alone would put 100% of the shares on product, pre-production and
  // internal tooling, because every marketing-site error would simply be
  // absent. A partial read does not degrade the answer, it inverts it — and
  // it would do so on a PUBLIC page, in the direction of over-claiming
  // customer impact. A skipped tick costs resolution; a partial one lies.
  const zoneTags = Object.values(ZONES);
  const rowsPerZone = fetchRows
    ? await fetchRows({ zoneTags, since, until })
    : await Promise.all(
        zoneTags.map((z) =>
          fetchZone5xx(z, { token, since, until, fetchImpl: doFetch }),
        ),
      );
  const rows = rowsPerZone.flat();

  const tick = attributeRows(rows);

  // Nothing failed anywhere. Writing a zero tick would churn KV every five
  // minutes for no information — and, worse, would let a long quiet stretch
  // dilute an incident's share on a day that had one.
  if (tick.total === 0) return { ...tick, wrote: false };

  const history = await readJson(kv, HISTORY_KEY_FOR_INCIDENTS);
  const duringIncident = incidentOpenAt(history, now);

  const rec = (await readJson(kv, ATTRIBUTION_KEY)) || { days: {} };
  applyAttribution(rec, tick, { now: until.getTime(), duringIncident });
  await kv.put(ATTRIBUTION_KEY, JSON.stringify(rec));

  // One line, k=v, greppable — the same marker convention the platform uses.
  console.log(
    `[status-attribution] window=${since.toISOString()}..${until.toISOString()} `
      + `total=${tick.total} unclassified=${tick.unclassified} incident=${duringIncident ? 1 : 0} `
      + AREA_IDS.map((id) => `${id}=${tick.areas[id]}`).join(' '),
  );
  return { ...tick, duringIncident, wrote: true };
}

/**
 * The history key, duplicated as a constant rather than imported, because
 * status-history.mjs is the day-RATING module and importing it here would
 * make the attribution collector depend on the rating rules it must not
 * touch. One string, pinned by a test that imports both.
 */
export const HISTORY_KEY_FOR_INCIDENTS = 'history:v1';

async function readJson(kv, key) {
  try {
    return await kv.get(key, 'json');
  } catch (e) {
    // A KV read failure is not a reason to lose the tick: attribution still
    // lands, it just cannot scope itself to the incident window.
    console.error(`[status-attribution] KV read failed (${key}):`, e?.message ?? e);
    return null;
  }
}
