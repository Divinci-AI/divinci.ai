/**
 * Is one client responsible for an outsized share of a zone's traffic?
 *
 * WHY THIS EXISTS (2026-09-12). A single residential IP
 * (74.110.128.177 — a WordPress-vulnerability scanner spoofing a plain
 * Firefox UA, see notebooks/2026-09-12-marketing-site-522-storm.md) went
 * from <1% to 85.7% of all divinci.ai zone traffic over 30 days, saturating
 * edge capacity for the site's hottest static assets and producing a 522
 * storm that painted the public /status page "Degraded" for two days before
 * a human noticed. Nothing detected the CONCENTRATION itself — only the
 * downstream 5xx, and only once someone happened to look.
 *
 * This is the pure, testable half of that detector: given counts per client
 * over some window, does any one of them cross a share of the total worth
 * flagging? The live half (querying Cloudflare's GraphQL analytics on a
 * schedule) is NOT implemented yet — see the notebook's "Tests and guards to
 * add" section. This module exists so that live half has something correct
 * to call, and so the threshold logic can be verified without a network
 * call.
 *
 * ⚠️ Deliberately mirrors status-attribution.mjs's shape: a `MIN_*` floor so
 * a quiet zone with two visitors doesn't "detect" a 50%-share false alarm,
 * and a share-based (not absolute) threshold since zone traffic volume varies
 * enormously day to day.
 */

/**
 * Below this many total requests in the window, no verdict is possible —
 * two requests from the same visitor is not "concentration", it is a normal
 * quiet period. Mirrors MIN_BASIS_EVENTS in status-attribution.mjs.
 */
export const MIN_BASIS_REQUESTS = 500;

/**
 * A single client above this share of total requests is worth flagging.
 * Calibration note: legitimate concentration happens (a company's shared NAT
 * egress, a heavy API consumer) but rarely exceeds this in a public
 * marketing-site zone with organic traffic. This incident's client reached
 * 85.7% over 30 days and >99% in the worst 5-minute windows — 20% catches it
 * with wide margin and should be revisited against real non-incident
 * baselines once the live collector has run for a while, the same way
 * DEGRADED_5XX_PER_WINDOW in status-attribution.mjs was recalibrated after
 * its first measurement.
 */
export const DOMINANT_CLIENT_SHARE = 0.20;

/**
 * @param {Array<{key:string, count:number}>} rows  per-client counts for one
 *   window — `key` is normally an IP, but the same shape works for ASN or
 *   any other client dimension.
 * @returns {{flagged:boolean, total:number, top:{key:string,count:number,share:number}|null}}
 *   `flagged` is false whenever there isn't enough traffic to judge, even if
 *   one row happens to be 100% of a tiny total — see MIN_BASIS_REQUESTS.
 */
export function detectDominantClient(rows) {
  const total = (rows ?? []).reduce((sum, r) => sum + (Number(r?.count) || 0), 0);
  if (total < MIN_BASIS_REQUESTS) return { flagged: false, total, top: null };

  const ranked = (rows ?? [])
    .map((r) => ({ key: r.key, count: Number(r.count) || 0, share: (Number(r.count) || 0) / total }))
    .sort((a, b) => b.count - a.count);
  const top = ranked[0] ?? null;
  if (!top) return { flagged: false, total, top: null };

  return { flagged: top.share >= DOMINANT_CLIENT_SHARE, total, top };
}
