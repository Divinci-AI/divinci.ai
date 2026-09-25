const { test, expect } = require('@playwright/test');

/**
 * The TrustBench row card: the dates and judge behind each leaderboard row.
 *
 * Every response is stubbed: the API only allows the https://divinci.ai origin,
 * and a test of how dates render must not depend on what production holds.
 *
 *   cd site && npx playwright test tests/trustbench-row-card.spec.js --project=Desktop-Chrome
 *
 * ⚠️ Registered in playwright.config.js's Desktop-Chrome `testMatch` (an
 * allowlist: a spec missing from it silently never runs).
 */

const BOARD = {
  benchmark: {
    benchmarkId: 'bm_Q', slug: 'scored-qa-suite-x-llm-factual', version: '1.0.0',
    name: 'Nutrition Corpus — Retrieval QA (60)', description: '', metric: 'rubric-llm',
    higherIsBetter: true, rangeMin: 0, rangeMax: 1,
  },
  rows: [
    {
      rank: 1, providerId: 'cloudflare-workers-ai', modelId: '@cf/zai-org/glm-5.3-flash', displayName: 'GLM 5.3 Flash',
      score: 0.8125, runId: 'tr_MEDIAN', completedAt: '2026-09-25T05:04:50.000Z', signerKeyId: 'tbp-2026-04-26-001',
      runCount: 3, runsInWindow: 3, scoreRange: { min: 0.771, max: 0.817 }, benchmarkVersion: '1.0.0',
      retrievalStackId: 'divinci-pageindex+jev', retrievalStackLabel: 'Divinci PageIndex (tree reasoning, Jev node selection)',
      firstPublishedAt: '2026-09-25T02:19:30.000Z',
      runs: [
        { runId: 'tr_NEW', score: 0.7708, signedAt: '2026-09-25T09:35:10.000Z', publishedAt: '2026-09-25T09:34:55.000Z',
          answeredFrom: '2026-09-25T09:16:40.000Z', answeredTo: '2026-09-25T09:34:40.000Z', judgeModelId: 'gemini-3.8-flash', isMedian: false },
        { runId: 'tr_MEDIAN', score: 0.8125, signedAt: '2026-09-25T05:04:50.000Z', publishedAt: '2026-09-25T05:04:44.000Z',
          answeredFrom: '2026-09-25T04:46:40.000Z', answeredTo: '2026-09-25T05:04:30.000Z', judgeModelId: 'gemini-3.8-flash', isMedian: true },
        { runId: 'tr_OLD', score: 0.8167, signedAt: '2026-09-25T02:19:35.000Z',
          judgeModelId: 'gemini-3.8-flash', isMedian: false },
      ],
    },
    {
      // What the API sends before the per-run detail shipped: one date, no runs.
      rank: 2, providerId: 'cloudflare-workers-ai', modelId: '@cf/zai-org/glm-5.3-flash', displayName: 'GLM 5.3 Flash',
      score: 0.384, runId: 'tr_LEGACY', completedAt: '2026-09-19T12:00:00.000Z', runCount: 3, runsInWindow: 3,
      scoreRange: { min: 0.309, max: 0.428 }, benchmarkVersion: '1.0.0',
      retrievalStackId: 'divinci-pageindex', retrievalStackLabel: 'Divinci PageIndex (tree reasoning)',
    },
  ],
};

async function open(page) {
  await page.route('https://api.divinci.app/v1/trustbench/public/leaderboard*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ generatedAt: '2026-09-25T10:00:00.000Z', maxAgeSeconds: 60, boards: [BOARD] }) }));
  await page.goto('/trustbench/');
  await expect(page.locator('tr[data-card]')).toHaveCount(2);
}

const card = (page) => page.locator('#tb-card');

test.describe('desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('hovering a row shows every run behind its score, dated, with its judge', async ({ page }) => {
    await open(page);
    await page.locator('tr[data-card]').first().hover();
    const c = card(page);
    await expect(c).toBeVisible();
    await expect(c).toContainText('Runs behind this score');
    await expect(c).toContainText('median of 3');
    await expect(c.locator('li')).toHaveCount(3);
    // The answer window, in UTC, same-day form.
    await expect(c.locator('li').nth(1)).toContainText('Sep 25, 2026, 04:46–05:04 UTC');
    await expect(c.locator('li').nth(1)).toContainText('shown score');
    await expect(c).toContainText('gemini-3.8-flash');
    // A run whose publication was not recorded is dated by its signing time, and says so.
    await expect(c.locator('li').nth(2)).toContainText('Signed');
    await expect(c.locator('li').nth(2)).toContainText('not recorded');
    await expect(c).toContainText('First on this board Sep 25, 2026');
  });

  test('sits in the right margin, level with the row, when the margin has room', async ({ page }) => {
    await open(page);
    const row = page.locator('tr[data-card]').first();
    await row.hover();
    const cb = await card(page).boundingBox();
    const tb = await page.locator('.tb-table').first().boundingBox();
    const rb = await row.boundingBox();
    expect(cb.x).toBeGreaterThan(tb.x + tb.width);
    expect(Math.abs(cb.y - rb.y)).toBeLessThan(2);
  });

  test('a row from an older API response still gets a card, with its one date named for what it is', async ({ page }) => {
    await open(page);
    await page.locator('tr[data-card]').nth(1).hover();
    const c = card(page);
    await expect(c).toContainText('Signed');
    await expect(c).toContainText('Sep 19, 2026');
    await expect(c).toContainText('Answered');
    await expect(c).toContainText('not recorded');
  });

  test('keyboard: focusing a row opens the card, Escape closes it', async ({ page }) => {
    await open(page);
    await page.locator('tr[data-card]').first().focus();
    await expect(card(page)).toBeVisible();
    await expect(page.locator('tr[data-card]').first()).toHaveAttribute('aria-describedby', 'tb-card');
    await page.keyboard.press('Escape');
    await expect(card(page)).toBeHidden();
  });

  test('the page chat bubble is the Divinci Docs assistant', async ({ page }) => {
    await open(page);
    await expect(page.locator('#divinci-chat-js')).toHaveAttribute('data-release-id', '6a65545c024387461d48dd2e');
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tapping a row opens the card below it, inside the screen; tapping again closes it', async ({ page }) => {
    await open(page);
    const row = page.locator('tr[data-card]').first();
    await row.tap();
    const c = card(page);
    await expect(c).toBeVisible();
    const cb = await c.boundingBox();
    const rb = await row.boundingBox();
    expect(cb.y).toBeGreaterThanOrEqual(rb.y + rb.height);
    expect(cb.x).toBeGreaterThanOrEqual(0);
    expect(cb.x + cb.width).toBeLessThanOrEqual(390);
    await row.tap();
    await expect(c).toBeHidden();
  });
});

test.describe('embed', () => {
  test.use({ viewport: { width: 800, height: 700 } });

  test('the embedded board gets the same card, kept inside the frame', async ({ page }) => {
    await page.route('https://api.divinci.app/v1/trustbench/public/leaderboard/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(BOARD) }));
    await page.goto('/trustbench/embed/?board=' + BOARD.benchmark.slug);
    const row = page.locator('tr[data-card]').first();
    await row.hover();
    const c = card(page);
    await expect(c).toBeVisible();
    await expect(c).toContainText('Runs behind this score');
    const cb = await c.boundingBox();
    expect(cb.x).toBeGreaterThanOrEqual(0);
    expect(cb.x + cb.width).toBeLessThanOrEqual(800);
  });
});
