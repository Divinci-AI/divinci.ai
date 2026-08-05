/**
 * Per-service status components, pushed from GCP uptime checks.
 *
 * WHY A PUSH. The signal that actually distinguishes our services lives in
 * ~25 GCP uptime checks (content-matched, per-surface). The six Datadog
 * monitors this Worker already reads are all Cloudflare ZONE-WIDE metrics —
 * they cannot tell chat from API from embed, so splitting them into several
 * components would produce components that move in lockstep and mislabel the
 * cause. Rather than put a long-lived GCP service-account key into a public
 * Worker, a scheduled job reads GCP and POSTs a small summary here, exactly
 * like the www-rag activity feed already does.
 *
 *   GH Actions (every 10 min) → POST /api/status/components (Bearer)
 *                         → STATUS_HISTORY KV, key components:v1
 *                         → merged into GET /api/status
 *
 * ⚠️ THE PUSHED PAYLOAD IS UNTRUSTED INPUT THAT LANDS ON A PUBLIC PAGE.
 * Two rules follow, and both are load-bearing:
 *
 *  1. **No free text crosses the wire.** The pusher sends an `id` from a fixed
 *     allowlist; the human-readable name and description live HERE. A stolen
 *     push token can therefore mark us down — annoying, and visible — but
 *     cannot write arbitrary words onto divinci.ai.
 *  2. **No customer identifiers, ever.** 18 of the checks are per-customer
 *     (a named roster). This page is public, so those are collapsed into ONE
 *     aggregate with a COUNT and no names. The schema simply has nowhere to
 *     put a customer name, which is a stronger guarantee than remembering not
 *     to send one.
 */

/** Statuses a component may hold, ranked worst-last. Mirrors worker.js. */
const RANK = { operational: 0, unknown: 1, degraded: 2, partial_outage: 3, major_outage: 4 };
const VALID_STATUS = new Set(Object.keys(RANK));

export const COMPONENTS_KEY = 'components:v1';

/**
 * A push older than this is not trusted to describe the present. The page
 * shows `unknown` rather than the last thing it heard — a status page that
 * keeps saying "operational" because its feed died is worse than one that
 * admits it does not know.
 *
 * Generous relative to the 10-minute cadence: GitHub's scheduled workflows
 * drift, and routinely run several minutes late under load. This tolerates a
 * skipped run, not a dead feed.
 */
export const COMPONENTS_STALE_AFTER_MS = 35 * 60 * 1000;

/**
 * The allowlist. `id` is the ONLY component identity the wire format carries;
 * everything a reader sees comes from here.
 */
export const PUSHED_COMPONENTS = [
  { id: 'chat', name: 'Chat', description: 'The web app at chat.divinci.app' },
  { id: 'api', name: 'API', description: 'The public REST API' },
  { id: 'embed', name: 'Embed delivery', description: 'The embeddable widget script and client' },
  { id: 'realtime', name: 'Realtime', description: 'WebSocket connections for live chat' },
  { id: 'signin', name: 'Sign-in', description: 'Authentication and session bootstrap' },
  {
    id: 'customer-embeds',
    name: 'Customer embeds',
    description: 'Deployed customer chat surfaces',
    // Renders "9 of 9 embed surfaces responding". Deliberately a bare count:
    // naming them would publish the customer roster.
    counted: true,
  },
];

const BY_ID = new Map(PUSHED_COMPONENTS.map((c) => [c.id, c]));

const isCount = (v) => Number.isInteger(v) && v >= 0 && v <= 10000;

/**
 * Validate a pushed payload. Returns `{ok:true, value}` or `{ok:false, error}`.
 *
 * An allowlist, not a sanitizer — unrecognized ids and statuses are DROPPED
 * rather than coerced, because the output is rendered publicly and the input
 * is only as trustworthy as a bearer token in CI.
 */
export function sanitizeComponentsPush(input, nowMs) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'not an object' };

  const at = Date.parse(input.generatedAt);
  if (!Number.isFinite(at)) return { ok: false, error: 'generatedAt missing or unparseable' };
  // Reject timestamps outside a plausible window so a wrong clock or a replayed
  // body cannot pin the page to a moment of its choosing.
  if (at > nowMs + 5 * 60 * 1000) return { ok: false, error: 'generatedAt is in the future' };
  if (at < nowMs - 24 * 60 * 60 * 1000) return { ok: false, error: 'generatedAt is too old' };

  if (!Array.isArray(input.components)) return { ok: false, error: 'components must be an array' };

  const seen = new Set();
  const components = [];
  for (const raw of input.components) {
    if (!raw || typeof raw !== 'object') continue;
    const def = BY_ID.get(raw.id);
    if (!def) continue;                 // not on the allowlist
    if (seen.has(raw.id)) continue;     // first write wins; no duplicate rows
    if (!VALID_STATUS.has(raw.status)) continue;
    seen.add(raw.id);

    const entry = { id: raw.id, status: raw.status };
    if (def.counted && isCount(raw.ok) && isCount(raw.total) && raw.ok <= raw.total) {
      entry.ok = raw.ok;
      entry.total = raw.total;
    }
    components.push(entry);
  }

  if (!components.length) return { ok: false, error: 'no recognized components' };
  return { ok: true, value: { generatedAt: new Date(at).toISOString(), components } };
}

/**
 * Project a stored record into the public component list. Always returns one
 * entry per allowlisted component: a component the pusher stopped reporting
 * must read `unknown`, never silently vanish or hold its last good value.
 */
export function componentsView(record, nowMs) {
  const at = record && Number.isFinite(Date.parse(record.generatedAt))
    ? Date.parse(record.generatedAt)
    : null;
  const stale = at === null || nowMs - at > COMPONENTS_STALE_AFTER_MS;
  const pushed = new Map(
    (record && Array.isArray(record.components) ? record.components : []).map((c) => [c.id, c]),
  );

  return PUSHED_COMPONENTS.map((def) => {
    const got = stale ? null : pushed.get(def.id);
    const out = {
      id: def.id,
      name: def.name,
      description: def.description,
      status: got ? got.status : 'unknown',
    };
    if (def.counted && got && Number.isInteger(got.ok) && Number.isInteger(got.total)) {
      out.detail = `${got.ok} of ${got.total} embed surfaces responding`;
    }
    return out;
  });
}

/** Worst status across a component list, for the page's overall banner. */
export function worstOf(components) {
  let worst = 'operational';
  for (const c of components) {
    if ((RANK[c.status] ?? 1) > (RANK[worst] ?? 0)) worst = c.status;
  }
  return worst;
}
