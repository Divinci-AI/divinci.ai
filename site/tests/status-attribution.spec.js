const { test, expect } = require('@playwright/test');

/**
 * The status page's attribution, tested through the page that actually ships.
 *
 * WHY AN E2E AND NOT MORE UNIT TESTS. The rules are already unit-tested in
 * site/tests/worker/status-attribution.test.mjs, and templates/status.html's
 * copy of dayBands is pinned against the module by a parity test. Neither can
 * see the thing that matters most here: what a visitor ends up looking at.
 * Three of the assertions below are only reachable from the rendered DOM —
 * that an unattributed day stays a plain bar, that a hand-written note beats
 * the derived one all the way through to the chips, and that a note is
 * rendered as TEXT.
 *
 * Every response is stubbed. A status page test that depended on production
 * being degraded could only pass on a bad day, which is exactly backwards.
 *
 *   cd site && npx playwright test tests/status-attribution.spec.js --project=Desktop-Chrome
 *
 * ⚠️ Registered in playwright.config.js's Desktop-Chrome `testMatch`. That
 * list is an ALLOWLIST — a spec missing from it does not fail, it silently
 * never runs, which is indistinguishable from passing.
 */

// The PUBLIC areas — the only ones that band a bar. Pre-production and
// internal tooling left this list on 2026-08-26 along with the uptime number
// they used to move; they are asserted below in the sidecar instead.
const AREAS = [
  { id: 'product', name: 'Product', hint: 'Chat, API, embeds — what customers use' },
  { id: 'marketing', name: 'Marketing site', hint: 'divinci.ai and this status page' },
  { id: 'docs', name: 'Developer docs', hint: 'The SDK documentation site' },
];

const day = (date, extra = {}) => ({
  date, status: 'operational', worstSample: 'operational', uptimePct: 100, windows: [], ...extra,
});

/** A degraded day the collector attributed to internal tooling. */
const ATTRIBUTED = day('2026-08-25', {
  status: 'degraded', uptimePct: 97.93,
  windows: [{ status: 'degraded', from: '2026-08-25T06:00:00Z', to: '2026-08-25T06:15:00Z', minutes: 20, counted: true }],
  areas: ['marketing', 'docs'],
  areaShares: [{ id: 'marketing', share: 70.1 }, { id: 'docs', share: 29.9 }],
  areaBasis: 'incident',
  internalAreas: ['internal'],
  autoNote: {
    date: '2026-08-25', auto: true, areas: ['marketing', 'docs'], internalAreas: ['internal'],
    productAffected: false, internalOnly: false,
    title: 'Elevated errors, mostly on our marketing site',
    summary: 'Of the errors on customer-facing surfaces while this page was reporting a problem, most were on our marketing site (70%). The customer-facing product — chat, the API and embedded widgets — was not among the affected areas.',
  },
});

/** A day whose errors were ALL on systems no customer can reach. */
const INTERNAL_ONLY = day('2026-08-20', {
  status: 'major_outage', uptimePct: 66.17,
  windows: [{ status: 'major_outage', from: '2026-08-20T04:00:00Z', to: '2026-08-20T05:00:00Z', minutes: 65, counted: true }],
  areas: [], areaShares: [], areaBasis: 'day', internalAreas: ['internal'],
  autoNote: {
    date: '2026-08-20', auto: true, areas: [], internalAreas: ['internal'],
    productAffected: false, internalOnly: true,
    title: 'Internal systems only — no customer-facing surface affected',
    summary: 'The elevated errors this day were on systems no customer can reach — our own tooling and pre-production. Nothing customers use was affected, and this day does not count against the uptime figure above.',
  },
});

/** A degraded day the collector could NOT attribute — too few events. */
const UNATTRIBUTED = day('2026-08-24', { status: 'degraded', uptimePct: 99.1 });

function payload(days) {
  return {
    status: 'operational', updatedAt: new Date().toISOString(), source: 'datadog-monitors',
    areas: AREAS,
    components: [{ id: 'platform', name: 'Platform', description: 'x', status: 'operational' }],
    history: { days, since: '2026-07-26', uptimePct: 99.1, daysWithData: days.length },
  };
}

async function open(page, days) {
  await page.route('**/api/status*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload(days)) }));
  await page.goto('/status/');
  await expect(page.locator('#status-history-bars .status-bar').first()).toBeVisible();
}

test.describe('uptime bars', () => {
  test('an attributed day is drawn as bands, not one block', async ({ page }) => {
    await open(page, [ATTRIBUTED]);
    const bar = page.locator('#status-history-bars .status-bar').first();
    await expect(bar).toHaveAttribute('data-banded', '1');
    await expect(bar.locator('.status-band')).toHaveCount(AREAS.length);
    // The tinted strips must be the attributed ones, in taxonomy order.
    const tinted = await bar.locator('.status-band').evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-s')));
    expect(tinted).toEqual(['operational', 'degraded', 'degraded']);
  });

  test('a day we could not attribute stays a plain bar', async ({ page }) => {
    // The page's failure mode has always been over-claiming. An invented
    // "only pre-production" breakdown would be a worse version of that bug,
    // so the absence of evidence has to be visible as an absence.
    await open(page, [UNATTRIBUTED]);
    const bar = page.locator('#status-history-bars .status-bar').first();
    await expect(bar).not.toHaveAttribute('data-banded', '1');
    await expect(bar.locator('.status-band')).toHaveCount(0);
  });

  test('the band key appears only when something on screen is banded', async ({ page }) => {
    await open(page, [UNATTRIBUTED]);
    await expect(page.locator('#status-areas-key')).toBeHidden();
    await open(page, [ATTRIBUTED]);
    await expect(page.locator('#status-areas-key')).toBeVisible();
  });
});

test.describe('the non-sighted path', () => {
  test('the bar\'s accessible name carries the whole account, not just a colour', async ({ page }) => {
    // The hover card is a sighted-reader affordance and hover does not exist
    // on touch. Everything it says has to be in the accessible name too, or
    // the attribution is invisible to a screen reader and to a phone — which
    // between them are most of the people who read a status page in anger.
    await open(page, [ATTRIBUTED]);
    const label = await page.locator('#status-history-bars .status-bar').first()
      .getAttribute('aria-label');
    expect(label).toContain('2026-08-25');
    expect(label).toContain('Degraded');
    expect(label).toContain('Affected: Marketing site, Developer docs');
    expect(label).toContain('The product (chat, API, embeds) was not affected.');
    expect(label).toContain('automatic');
  });

  test('an unattributed day does not claim an attribution it does not have', async ({ page }) => {
    await open(page, [UNATTRIBUTED]);
    const label = await page.locator('#status-history-bars .status-bar').first()
      .getAttribute('aria-label');
    expect(label).toContain('Degraded');
    expect(label).not.toContain('Affected:');
    expect(label).not.toContain('was not affected');
  });
});

test.describe('incident notes', () => {
  test('an automatic note is shown, labelled, and says whether customers were hit', async ({ page }) => {
    await open(page, [ATTRIBUTED]);
    const incident = page.locator('.status-incident').first();
    await expect(incident.locator('.status-incident-auto')).toHaveText('automatic');
    await expect(incident.locator('.status-incident-note')).toContainText('was not among the affected areas');
    // Every area is listed — what was checked and found fine, not only what broke.
    await expect(incident.locator('.status-incident-chip')).toHaveCount(AREAS.length);
    await expect(incident.locator('.status-incident-chip[data-hit="1"]')).toHaveCount(2);
  });

  test('a day that was internal-only says so, and bands nothing', async ({ page }) => {
    // The case the page could never state before: a day it rated a MAJOR
    // OUTAGE that no customer could have experienced. Leaving it as a bare red
    // bar reads as an outage nobody bothered to write up.
    await open(page, [INTERNAL_ONLY]);
    const bar = page.locator('#status-history-bars .status-bar').first();
    await expect(bar).not.toHaveAttribute('data-banded', '1');
    const incident = page.locator('.status-incident').first();
    await expect(incident.locator('.status-incident-chip')).toHaveCount(0);
    await expect(incident.locator('.status-incident-note'))
      .toContainText('does not count against the uptime figure');
  });

  test('a hand-written note beats the derived one, all the way to the bands', async ({ page }) => {
    // 2026-08-19 carries a real note in data/status-incidents.toml attributing
    // it to internal tooling. Here the API claims the product at 88%. The
    // human wins twice over: their title is shown instead of the derived one,
    // AND their attribution replaces it — so nothing bands, because internal
    // tooling is not a public area. Banding "Product" underneath a note that
    // says otherwise would have the page contradict itself in two places at
    // once, which is worse than either being wrong alone.
    await open(page, [day('2026-08-19', {
      status: 'degraded', uptimePct: 93.85, areas: ['product'],
      areaShares: [{ id: 'product', share: 88 }],
      autoNote: { date: '2026-08-19', auto: true, title: 'DERIVED NOTE', summary: 'derived', areas: ['product'] },
    })]);
    const incident = page.locator('.status-incident').first();
    await expect(incident.locator('.status-incident-note-title'))
      .toHaveText(/Status monitoring reported a problem that was not happening/);
    await expect(incident.locator('.status-incident-auto')).toHaveCount(0);
    await expect(incident).not.toContainText('DERIVED NOTE');
    await expect(incident.locator('.status-incident-chip')).toHaveCount(0);
    await expect(page.locator('#status-history-bars .status-bar').first())
      .not.toHaveAttribute('data-banded', '1');
  });

});

test.describe('the internal-systems sidecar', () => {
  test('internal areas are reported apart, and never as a band', async ({ page }) => {
    await open(page, [ATTRIBUTED]);
    // Not a strip on the bar...
    const strips = await page.locator('#status-history-bars .status-bar').first()
      .locator('.status-band').evaluateAll((els) => els.length);
    expect(strips).toBe(AREAS.length);
    // ...and not a chip in the incident either. Scoped to the newest incident:
    // the list also carries every hand-written note date from
    // data/status-incidents.toml, so a page-wide count means nothing.
    const chips = page.locator('.status-incident').first().locator('.status-incident-chip');
    await expect(chips).toHaveCount(AREAS.length);
    // A negative assertion has to be phrased over the SET: `.not.toContainText`
    // on a multi-element locator is a strict-mode violation, not a passing test.
    await expect(chips.filter({ hasText: 'Internal tooling' })).toHaveCount(0);
    await expect(chips.filter({ hasText: 'Pre-production' })).toHaveCount(0);
    // It appears here, and only here.
    const card = page.locator('#status-internal-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('not counted');
    await expect(card.locator('.status-internal-day')).toHaveCount(1);
    await expect(card.locator('.status-internal-day').first()).toContainText('Internal tooling');
  });

  test('a GREEN day still reports internal trouble', async ({ page }) => {
    // The case that makes the sidecar worth having. Internal systems no longer
    // move the rating, so from now on their problems land on days that are
    // otherwise, correctly, green. If the sidecar only rode along with bad
    // days it would show the legacy ones and then never fill again.
    await open(page, [day('2026-08-27', { internalAreas: ['preprod', 'internal'] })]);
    const bar = page.locator('#status-history-bars .status-bar').first();
    await expect(bar).toHaveAttribute('data-s', 'operational');
    await expect(bar).not.toHaveAttribute('data-banded', '1');
    const row = page.locator('#status-internal-card .status-internal-day').first();
    await expect(row).toContainText('2026-08-27');
    await expect(row).toContainText('Pre-production and Internal tooling');
  });

  test('a long sidecar is capped, and the remainder is counted not dropped', async ({ page }) => {
    // "No more days" and "we stopped listing" must never look the same.
    const many = Array.from({ length: 12 }, (_, i) =>
      day(`2026-08-${String(i + 1).padStart(2, '0')}`, { internalAreas: ['internal'] }));
    await open(page, many);
    const rows = page.locator('#status-internal-card .status-internal-day');
    await expect(rows).toHaveCount(9);            // 8 days + the tally
    await expect(rows.last()).toContainText('and 4 earlier days');
  });

  test('the sidecar stays hidden when there is nothing in it', async ({ page }) => {
    // An empty card explaining what we would have told you is just clutter.
    await open(page, [UNATTRIBUTED]);
    await expect(page.locator('#status-internal-card')).toBeHidden();
  });

  test('a hand-written note naming an internal area lands in the sidecar', async ({ page }) => {
    // 2026-08-19's real note names internal tooling — written when internal
    // tooling was still a band. It has to keep working now that it is not.
    await open(page, [day('2026-08-19', { status: 'degraded', uptimePct: 93.85 })]);
    const card = page.locator('#status-internal-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.status-internal-day')).toContainText('2026-08-19');
    await expect(card.locator('.status-internal-day')).toContainText('Internal tooling');
  });
});

test.describe('what a note may never do', () => {
  test('note text is rendered as text, never as markup', async ({ page }) => {
    // The note is composed in the Worker from area ids and numbers, so this
    // payload cannot occur today. It is asserted anyway: the defence is the
    // render boundary (textContent), and this is the test that fails if
    // someone reaches for innerHTML later.
    await open(page, [day('2026-08-25', {
      status: 'degraded',
      areas: ['product'],
      autoNote: {
        date: '2026-08-25', auto: true, areas: ['product'],
        title: '<img src=x onerror="window.__xss=1">',
        summary: '<script>window.__xss=1</script>ordinary text',
      },
    })]);
    const incident = page.locator('.status-incident').first();
    await expect(incident.locator('.status-incident-note')).toContainText('ordinary text');
    await expect(incident.locator('img, script')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test('no hostname, path or error count reaches the page', async ({ page }) => {
    // The public claim is "which area, what share". Hosts and paths are
    // attacker-supplied, and absolute counts would publish a running measure
    // of our request volume. Neither has any business on this page — and the
    // API is what must not carry them, so this asserts the whole chain.
    await open(page, [ATTRIBUTED]);
    const card = await page.locator('#status-incidents-card').innerText();
    for (const forbidden of ['divinci.app', '.com', 'http', '5xx', '/api/']) {
      expect(card, `leaked ${forbidden}`).not.toContain(forbidden);
    }
  });
});
