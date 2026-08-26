/**
 * Which AREA of the estate a bad day actually touched.
 *
 * WHY THIS EXISTS
 * The 90-day bar is coloured by ONE Datadog monitor — `[CF] 5xx rate elevated
 * (prod zones)` (20807649), the only monitor in STATUS_COMPONENTS. That monitor
 * counts 5xx across the whole Cloudflare zone, and the zone carries far more
 * than the product: the marketing site, the docs site, staging and dev
 * hostnames, and internal tooling all live there too.
 *
 * So a day could read "Degraded" on a public status page because our own
 * marketing site was timing out. Measured over the 16 non-green days from
 * 2026-07-31 to 2026-08-17, the customer-facing product accounted for between
 * 1% and 12% of the 5xx on EVERY one of them; the majority share was the
 * marketing site on ten of those days, pre-production on three, and internal
 * tooling on two.
 *
 * That is a real reporting defect, and the honest fix has two halves:
 *   1. Say so per day — the notes in data/status-incidents.toml.
 *   2. Show it — a day is drawn as BANDS, one per area, so a reader can see
 *      that one strip is amber and the rest are green rather than inferring a
 *      whole-estate outage from a single amber bar.
 *
 * ⚠️ This deliberately does NOT change what the bar's SEVERITY or the uptime
 * percentage mean. Those are a published series people compare across days;
 * redefining them mid-series would make the same number mean two things with
 * no way for a reader to tell (the same reasoning that keeps the pushed GCP
 * components out of the history — see worker.js). Bands are additive detail
 * layered on the existing rating, never a re-rating.
 */

/**
 * Fixed order, most customer-facing first, so the top band is always the one a
 * reader cares about most and the shape is comparable across days.
 */
export const AREAS = [
  { id: 'product', name: 'Product', hint: 'Chat, API, embeds — what customers use' },
  { id: 'marketing', name: 'Marketing site', hint: 'divinci.ai and this status page' },
  { id: 'docs', name: 'Developer docs', hint: 'The SDK documentation site' },
  { id: 'preprod', name: 'Pre-production', hint: 'Staging and dev — not customer traffic' },
  { id: 'internal', name: 'Internal tooling', hint: 'Systems only Divinci staff reach' },
];

export const AREA_IDS = AREAS.map(a => a.id);
const AREA_SET = new Set(AREA_IDS);

/** Is this a severity that should tint a band? */
const isBad = (s) => s === 'degraded' || s === 'partial_outage' || s === 'major_outage';

/**
 * The bands to draw for one day.
 *
 * Returns `null` when we have no per-area evidence, which the caller must
 * render as the plain solid bar. That is not a cosmetic fallback: claiming
 * "only pre-production was affected" on a day we never attributed would be
 * inventing detail, and this page's whole problem has been over-claiming.
 *
 * TWO SOURCES, one rule. A human note in data/status-incidents.toml is
 * preferred, because someone who knew what happened wrote it and it can name
 * an area the error counts never saw. Where there is no note, the day's own
 * `areas` — derived at the time from where the errors actually landed, see
 * status-attribution.mjs — is used instead. That fallback is the difference
 * between a day explaining itself now and a day staying a featureless amber
 * block until somebody gets round to writing it up, which for most days meant
 * never.
 *
 * @param {object} day    a history day ({ date, status, areas? })
 * @param {string[]} areas  area ids named by the human note for that date
 */
export function dayBands(day, areas) {
  const status = day && day.status;
  if (!isBad(status)) return null;

  let source = Array.isArray(areas) && areas.length ? areas : null;
  if (!source && day && Array.isArray(day.areas) && day.areas.length) source = day.areas;
  if (!source) return null;

  // Unknown ids are dropped rather than trusted — the notes file is
  // hand-edited, and a typo must not silently paint a band that means nothing.
  const named = new Set(source.filter(a => AREA_SET.has(a)));
  if (named.size === 0) return null;

  return AREAS.map(a => ({
    id: a.id,
    name: a.name,
    // An area the note did not name was not implicated on that day.
    status: named.has(a.id) ? status : 'operational',
  }));
}

/**
 * Was the customer-facing product itself implicated? This is the question a
 * visitor is actually asking, and it deserves a direct answer rather than
 * being left to inference from five bands.
 */
export function productAffected(areas) {
  return Array.isArray(areas) && areas.includes('product');
}
