/**
 * Pure detector for "the /status page has read Degraded for suspiciously
 * many days in a row" — the exact symptom that started the 2026-09-12
 * investigation ("these daily notes seem very similar").
 *
 * WHY A STREAK, NOT A SINGLE DAY. One degraded day is normal internet
 * weather and would make this alert on nothing else. Several in a row,
 * ending at the most recent day published, is what a human would notice by
 * scrolling the status page — this makes that noticing automatic instead of
 * depending on someone happening to look.
 *
 * `no_data` and `unknown` count as non-operational too — same "fails toward
 * inclusion" rule status-attribution.mjs applies elsewhere: a blind spot in
 * the rating is itself a thing worth flagging, not a free pass.
 */

export const DEFAULT_STREAK_THRESHOLD = 2;

/**
 * @param {Array<{date:string, status:string, areas?:string[], areaShares?:Array<{id:string,share:number}>}>} days
 *   `history.days` from GET /api/status, oldest first (as the endpoint returns them).
 * @param {{threshold?:number}} [opts]
 * @returns {{flagged:boolean, streak:Array<{date:string,status:string,topArea:string|null}>}}
 *   `streak` is the trailing run of non-operational days ending at the LAST
 *   day present, oldest first. Empty when the most recent day is operational.
 */
export function computeDegradedStreak(days, opts = {}) {
  const threshold = opts.threshold ?? DEFAULT_STREAK_THRESHOLD;
  const list = Array.isArray(days) ? days : [];

  const streak = [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const day = list[i];
    if (!day || day.status === 'operational') break;
    const top = (day.areaShares ?? []).slice().sort((a, b) => (b?.share ?? 0) - (a?.share ?? 0))[0];
    streak.unshift({ date: day.date, status: day.status, topArea: top?.id ?? null });
  }

  return { flagged: streak.length >= threshold, streak };
}
