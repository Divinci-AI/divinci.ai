/**
 * Live WWW-RAG crawl activity — validation + storage shape.
 *
 * The crawler is a laptop-local daemon (www-rag-router). It POSTs a small
 * snapshot of what it is doing every ~20s; divinci.ai/www-rag polls the GET
 * side and renders it. This module owns the wire contract for both.
 *
 * SECURITY NOTE, and the reason validation here is strict rather than
 * best-effort: every hostname in this payload originated in *crawled
 * third-party content* (a page's outbound links became a discovered seed).
 * It is then rendered on our own marketing site. Hosts are therefore matched
 * against a conservative DNS-name regex and DROPPED when they don't conform,
 * rather than escaped and passed through — escaping is a second line of
 * defence (the renderer uses textContent), not the first.
 *
 * Staleness is decided HERE, not in the browser, so every consumer agrees on
 * when the daemon counts as offline.
 */

/** States the daemon can report, in pass order. Anything else is rejected. */
export const ACTIVITY_STATES = ['growing', 'crawling', 'embedding', 'publishing', 'idle'];

export const ACTIVITY_KEY = 'wwwrag:activity:v1';

/** Caps. Small on purpose — this is a status strip, not a log drain. */
const MAX_RECENT = 12;
const MAX_IN_FLIGHT = 24;
const MAX_HOST_LEN = 100;
const MAX_COUNT = 1e9;

/**
 * A snapshot older than this is not "what we're crawling right now" any more.
 * The daemon reports every ~20s while a pass runs and once at pass end, so
 * three minutes of silence means the reporter (or the laptop) is gone.
 */
export const STALE_AFTER_MS = 3 * 60 * 1000;

/**
 * Conservative DNS hostname. Lowercase, at least one dot, no underscores, no
 * trailing dot, labels 1-63 chars. Deliberately narrower than the RFC.
 */
const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function isValidHost(value) {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > MAX_HOST_LEN) return false;
  return HOST_RE.test(value);
}

/** Finite non-negative integer, clamped. Returns null when unusable. */
function toCount(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(Math.floor(n), MAX_COUNT);
}

/** Epoch millis within a sane window — rejects seconds-vs-millis mix-ups. */
function toTimestamp(value, now) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const ms = Math.floor(n);
  // 2020-01-01 .. now + 1 day of clock skew.
  if (ms < 1577836800000 || ms > now + 86400000) return null;
  return ms;
}

function hostList(value, limit) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of value) {
    const host = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!isValidHost(host) || seen.has(host)) continue;
    seen.add(host);
    out.push(host);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Validate and normalise a reporter payload.
 * Returns { ok: true, value } or { ok: false, error } — never throws, and
 * never returns partially-trusted data.
 */
export function sanitizeActivity(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'body must be a JSON object' };
  }

  const state = typeof input.state === 'string' ? input.state.trim().toLowerCase() : '';
  if (!ACTIVITY_STATES.includes(state)) {
    return { ok: false, error: 'unknown state' };
  }

  const recent = [];
  if (Array.isArray(input.recent)) {
    for (const item of input.recent) {
      if (!item || typeof item !== 'object') continue;
      const host = typeof item.host === 'string' ? item.host.trim().toLowerCase() : '';
      if (!isValidHost(host)) continue;
      const entry = { host };
      const pages = toCount(item.pages);
      const chunks = toCount(item.chunks);
      const at = toTimestamp(item.at, now);
      if (pages !== null) entry.pages = pages;
      if (chunks !== null) entry.chunks = chunks;
      if (at !== null) entry.at = at;
      recent.push(entry);
      if (recent.length >= MAX_RECENT) break;
    }
  }

  const value = {
    state,
    updatedAt: now,
    inFlight: hostList(input.inFlight, MAX_IN_FLIGHT),
    recent,
  };

  const passStartedAt = toTimestamp(input.passStartedAt, now);
  if (passStartedAt !== null) value.passStartedAt = passStartedAt;

  // When the next pass is due. Genuinely in the future, so it gets a window of
  // its own rather than the +1-day clock-skew allowance the others use.
  const nextPassAt = toTimestamp(input.nextPassAt, now + 30 * 86400000);
  if (nextPassAt !== null) value.nextPassAt = nextPassAt;

  // ⚠️ NEVER clamp these to each other. Until 2026-08-20 this read
  // `value.done = Math.min(done, seeds)` — "a reporter that over-counts must
  // not render as 63 of 62". That rationale assumed `done` is a subset of
  // `seeds`. It is not: `seeds` is the REMAINING queue and `done` is a
  // tombstone set covering every host that refused us, failed, or was
  // withdrawn. `done` legitimately exceeds `seeds` and always will.
  //
  // So the clamp did not correct an over-count; it manufactured agreement.
  // With the real done far above the pending queue, min() pinned it to
  // exactly `seeds` — and the public page showed "5,509 of 5,509 sites this
  // pass", a number no counter ever produced. A sanitizer may drop a value it
  // cannot trust; it must never invent one that looks plausible.
  //
  // They are also accepted independently now. The old pairing existed so the
  // page could render "X of Y", which was itself the category error.
  const seeds = toCount(input.seeds);
  const done = toCount(input.done);
  if (seeds !== null) value.seeds = seeds;
  if (done !== null) value.done = done;

  // Truncation flags travel with their counts, and ONLY when the reporter
  // actually sent a boolean — an older worker sends nothing, and absent must
  // stay distinguishable from false so the page can show a cautious "+"
  // rather than a fabricated exact number.
  if (typeof input.seedsTruncated === 'boolean') value.seedsTruncated = input.seedsTruncated;
  if (typeof input.doneTruncated === 'boolean') value.doneTruncated = input.doneTruncated;

  for (const key of ['pagesThisPass', 'chunksThisPass', 'sitesThisPass']) {
    const n = toCount(input[key]);
    if (n !== null) value[key] = n;
  }

  return { ok: true, value };
}

/**
 * Shape the stored record for public consumption, downgrading to `offline`
 * when the daemon has gone quiet. `state` is what the page renders, so it
 * must never claim a crawl is in progress on the strength of a stale record.
 */
export function publicView(record, now = Date.now()) {
  if (!record || typeof record !== 'object' || typeof record.updatedAt !== 'number') {
    return { state: 'offline', ageSeconds: null, stale: true };
  }
  const ageMs = Math.max(0, now - record.updatedAt);
  const stale = ageMs > STALE_AFTER_MS;
  return {
    ...record,
    state: stale ? 'offline' : record.state,
    reportedState: record.state,
    ageSeconds: Math.round(ageMs / 1000),
    stale,
  };
}

/**
 * Constant-time string comparison. A plain `===` on a shared secret leaks its
 * length and a prefix-match timing signal; this is cheap enough to just do.
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  // Compare lengths without early-return, then fold the length check in.
  let diff = ba.length ^ bb.length;
  const len = Math.max(ba.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ba[i] || 0) ^ (bb[i] || 0);
  }
  return diff === 0;
}
