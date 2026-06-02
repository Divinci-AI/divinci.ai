import { test, expect, BrowserContext } from '@playwright/test';

/**
 * GDPR Banner + Cookie Smoke Tests
 *
 * These tests exercise the REAL banner UI (vs. gdpr-gating.spec.ts which
 * synthetically dispatches the consent event). They verify:
 *
 *   - Clicking "Accept All" on the GDPR banner triggers the
 *     divinci:marketing-consent-granted event, which loads the Instantly tag.
 *   - Clicking "Reject All" does NOT load the tag.
 *   - We inventory the cookies set after the leadsy/trovo chain runs, so the
 *     privacy policy stays accurate about what's actually stored.
 *
 *   BASE_URL=https://divinci.ai npx playwright test gdpr-banner-smoke
 */

test.describe.configure({ retries: 2 });

const LEADSY_URL_RE = /https:\/\/r2\.leadsy\.ai\/tag\.js/;

async function rewriteCfCountry(context: BrowserContext, country: string) {
  await context.route('**', async (route) => {
    let response;
    try {
      response = await route.fetch();
    } catch (e) {
      return route.continue();
    }
    const ct = response.headers()['content-type'] || '';
    if (!ct.includes('text/html')) {
      return route.fulfill({ response });
    }
    let body = await response.text();
    body = body.replace(
      /<meta\s+name=["']?cf-country["']?[^>]*>/g,
      `<meta name=cf-country content="${country}">`,
    );
    return route.fulfill({ response, body });
  });
}

test.describe('GDPR banner — real UI flow', () => {
  test('EU user: clicking "Accept All" loads the Instantly tag', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for the banner to appear (it's added by gdpr-compliance.js after detectUserLocation)
    const banner = page.locator('#gdpr-cookie-banner');
    await banner.waitFor({ state: 'visible', timeout: 5000 });

    // Verify the tag has NOT loaded yet
    const tagBeforeClick = await page.evaluate(() => !!document.getElementById('vtag-ai-js'));
    expect(tagBeforeClick).toBe(false);

    // Click "Accept All"
    const leadsyRequest = page.waitForRequest(LEADSY_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.click('#gdpr-accept-all');

    // The tag should load and the leadsy request should fire
    expect(await leadsyRequest, 'leadsy tag.js should be requested after Accept All').not.toBeNull();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => !!document.getElementById('vtag-ai-js'))).toBe(true);

    // The consent should be saved in localStorage with marketing=true
    const consent = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('divinci-gdpr-consent') || '{}')
    );
    expect(consent.marketing).toBe(true);
    expect(consent.analytics).toBe(true);

    await context.close();
  });

  test('EU user: clicking "Reject All" does NOT load the Instantly tag', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#gdpr-cookie-banner').waitFor({ state: 'visible', timeout: 5000 });
    await page.click('#gdpr-reject-all');
    await page.waitForTimeout(2000);

    expect(requests).toEqual([]);
    expect(await page.evaluate(() => !!document.getElementById('vtag-ai-js'))).toBe(false);

    const consent = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('divinci-gdpr-consent') || '{}')
    );
    expect(consent.marketing).toBe(false);

    await context.close();
  });

  test('EU user: customize panel can grant only analytics (not marketing)', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#gdpr-cookie-banner').waitFor({ state: 'visible', timeout: 5000 });
    await page.click('#gdpr-customize');
    await page.check('#gdpr-analytics');
    // explicitly do NOT check #gdpr-marketing
    await page.click('#gdpr-save-preferences');
    await page.waitForTimeout(2000);

    expect(requests, 'no leadsy request when only analytics granted').toEqual([]);

    const consent = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('divinci-gdpr-consent') || '{}')
    );
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(false);

    await context.close();
  });

  test('non-EU user: banner does NOT appear, tag loads immediately', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'US');
    const page = await context.newPage();

    const leadsyRequest = page.waitForRequest(LEADSY_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await leadsyRequest).not.toBeNull();

    // Banner should NOT be in the DOM for non-EU
    const bannerVisible = await page.locator('#gdpr-cookie-banner').isVisible().catch(() => false);
    expect(bannerVisible).toBe(false);

    await context.close();
  });
});

test.describe('GDPR cookies — inventory after consent', () => {
  test('inventory cookies set after leadsy/trovo chain executes', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'US');
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for leadsy + trovo chain to complete (trovo-tag fires an iframe)
    await page.waitForRequest(/r2\.leadsy\.ai/, { timeout: 10000 }).catch(() => null);
    await page.waitForRequest(/trovo-tag/, { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(3000);

    const cookies = await context.cookies();
    const firstPartyCookies = cookies.filter(c => c.domain.includes('divinci.ai'));
    const leadsyCookies = cookies.filter(c => c.domain.includes('leadsy.ai'));
    const trovoCookies = cookies.filter(c => c.domain.includes('trovo-tag.com'));

    console.log('\n=== COOKIE INVENTORY ===');
    console.log('First-party (divinci.ai):', firstPartyCookies.map(c => `${c.name}=${c.value.slice(0, 30)} (${c.domain})`));
    console.log('Leadsy (leadsy.ai):', leadsyCookies.map(c => `${c.name}=${c.value.slice(0, 30)} (${c.domain})`));
    console.log('Trovo-tag (trovo-tag.com):', trovoCookies.map(c => `${c.name}=${c.value.slice(0, 30)} (${c.domain})`));
    console.log('Total cookies:', cookies.length);
    console.log('========================\n');

    // No assertion — this test always passes; its purpose is to dump cookies
    // into the test report so we can audit what trackers actually set.
    expect(cookies.length).toBeGreaterThanOrEqual(0);

    await context.close();
  });
});
