import { test, expect, Page, Request, BrowserContext } from '@playwright/test';

/**
 * GDPR Gating E2E Tests — Instantly / Leadsy.ai visitor-identification tag
 *
 * Asserts the inline gating script in site/templates/base.html behaves correctly
 * across all gating branches.
 *
 * The gating script picks an EU signal in this order:
 *   1. <meta name="cf-country" content="XX"> populated by the Cloudflare Worker
 *      from request.cf.country (ISO 3166-1 alpha-2)
 *   2. Intl.DateTimeFormat().resolvedOptions().timeZone (fallback for local dev)
 *
 * We intercept the HTML response with page.route() to deterministically set the
 * cf-country meta value per test, so the same tests run identically against
 * staging.divinci.ai (where the meta is normally populated to the visitor's
 * country) and local zola serve (where it's empty).
 *
 *   BASE_URL=https://staging.divinci.ai npx playwright test gdpr-gating
 *   BASE_URL=http://127.0.0.1:1112 npx playwright test gdpr-gating   # with `zola serve --port 1112`
 */

// Each test rewrites the HTML response on its first request, which is rate-
// and timing-sensitive against a remote host. Retry on flake so CI is stable.
test.describe.configure({ retries: 2 });

const LEADSY_URL_RE = /https:\/\/r2\.leadsy\.ai\/tag\.js/;
const HUBSPOT_URL_RE = /js\.hs-scripts\.com\/48021503\.js/;

const SAVED_CONSENT_YES = {
  analytics: true,
  marketing: true,
  timestamp: '2026-05-25T00:00:00.000Z',
  version: '1.0',
  userLocation: 'EU',
};

const NO_LEADSY_WAIT_MS = 2000;

/**
 * Rewrite the <meta name="cf-country" content="..."> tag on every HTML response
 * so the inline gating script sees the country we want for this test.
 * Pass `country: ''` to force the timezone-fallback path.
 */
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
    // Match both the minified `<meta name=cf-country>` (local zola) and the
    // worker-injected `<meta name=cf-country content="US">`; replace either.
    body = body.replace(
      /<meta\s+name=["']?cf-country["']?[^>]*>/g,
      `<meta name=cf-country content="${country}">`,
    );
    return route.fulfill({ response, body });
  });
}

async function tagInDom(page: Page): Promise<boolean> {
  return page.evaluate(() => !!document.getElementById('vtag-ai-js'));
}

async function tagElementCount(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('#vtag-ai-js').length);
}

async function hsTagInDom(page: Page): Promise<boolean> {
  return page.evaluate(() => !!document.getElementById('hs-script-loader'));
}

test.describe('GDPR gating — cf.country primary signal', () => {
  test('non-EU country (US): tag loads immediately', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'US');
    const page = await context.newPage();

    const seen = page.waitForRequest(LEADSY_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await seen, 'leadsy request should fire for non-EU').not.toBeNull();
    expect(await tagInDom(page)).toBe(true);

    await context.close();
  });

  test('EU country (DE) + no consent: tag does NOT load', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req: Request) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NO_LEADSY_WAIT_MS);
    expect(requests).toEqual([]);
    expect(await tagInDom(page)).toBe(false);

    await context.close();
  });

  test('EU country (DE) + explicit-reject saved consent: tag does NOT load', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    await context.addInitScript((consent) => {
      try { localStorage.setItem('divinci-gdpr-consent', JSON.stringify(consent)); } catch (e) {}
    }, { ...SAVED_CONSENT_YES, analytics: false, marketing: false });
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req: Request) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NO_LEADSY_WAIT_MS);
    expect(requests).toEqual([]);
    expect(await tagInDom(page)).toBe(false);

    await context.close();
  });

  test('EU country (DE) + saved marketing consent: tag loads', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    await context.addInitScript((consent) => {
      try { localStorage.setItem('divinci-gdpr-consent', JSON.stringify(consent)); } catch (e) {}
    }, SAVED_CONSENT_YES);
    const page = await context.newPage();

    const seen = page.waitForRequest(LEADSY_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await seen).not.toBeNull();
    expect(await tagInDom(page)).toBe(true);

    await context.close();
  });

  test('EU country (DE) + in-session consent event: tag loads after dispatch', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    expect(await tagInDom(page)).toBe(false);

    const seen = page.waitForRequest(LEADSY_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('divinci:marketing-consent-granted'));
    });
    expect(await seen).not.toBeNull();
    expect(await tagInDom(page)).toBe(true);

    await context.close();
  });

  test('double-dispatch of consent event does NOT load tag twice', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('divinci:marketing-consent-granted'));
      window.dispatchEvent(new CustomEvent('divinci:marketing-consent-granted'));
      window.dispatchEvent(new CustomEvent('divinci:marketing-consent-granted'));
    });
    await page.waitForTimeout(500);
    expect(await tagElementCount(page)).toBe(1);

    await context.close();
  });

  test('unknown country (XX) treated as EU (safer default)', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'XX');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req: Request) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NO_LEADSY_WAIT_MS);
    expect(requests).toEqual([]);
    expect(await tagInDom(page)).toBe(false);

    await context.close();
  });

  test('Tor exit (T1) treated as EU (safer default)', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'T1');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req: Request) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NO_LEADSY_WAIT_MS);
    expect(requests).toEqual([]);
    expect(await tagInDom(page)).toBe(false);

    await context.close();
  });
});

test.describe('GDPR gating — timezone fallback (cf-country empty)', () => {
  test('non-EU timezone + empty cf-country: tag loads', async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: 'America/New_York' });
    await rewriteCfCountry(context, '');
    const page = await context.newPage();

    const seen = page.waitForRequest(LEADSY_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await seen).not.toBeNull();
    expect(await tagInDom(page)).toBe(true);

    await context.close();
  });

  test('EU timezone + empty cf-country: tag does NOT load', async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: 'Europe/Berlin' });
    await rewriteCfCountry(context, '');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req: Request) => {
      if (LEADSY_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NO_LEADSY_WAIT_MS);
    expect(requests).toEqual([]);
    expect(await tagInDom(page)).toBe(false);

    await context.close();
  });
});

test.describe('GDPR gating — divinciIsEUUser() function', () => {
  // Navigate once, then mutate the meta tag in-DOM and call divinciIsEUUser()
  // for each country code. Much faster + less flaky than 30+ sequential loads.
  test('returns true for all EU/EEA/UK/CH country codes', async ({ browser }) => {
    const euCodes = ['DE','FR','IT','ES','NL','PL','PT','GR','SE','FI','IE','LU','MT','CY','EE','LV','LT','SK','SI','HR','BG','RO','AT','BE','DK','CZ','HU','GB','NO','IS','LI','CH'];
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (const cc of euCodes) {
      const result = await page.evaluate((country) => {
        let meta = document.querySelector('meta[name="cf-country"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'cf-country');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', country);
        return window.divinciIsEUUser?.();
      }, cc);
      expect(result, `divinciIsEUUser() should be true for ${cc}`).toBe(true);
    }
    await context.close();
  });

  test('returns false for representative non-EU country codes', async ({ browser }) => {
    const nonEuCodes = ['US','CA','MX','BR','AR','JP','KR','CN','IN','AU','ZA','RU','TR','SG','HK'];
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (const cc of nonEuCodes) {
      const result = await page.evaluate((country) => {
        let meta = document.querySelector('meta[name="cf-country"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'cf-country');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', country);
        return window.divinciIsEUUser?.();
      }, cc);
      expect(result, `divinciIsEUUser() should be false for ${cc}`).toBe(false);
    }
    await context.close();
  });

  test('timezone fallback: returns true for EU timezones when cf-country empty', async ({ browser }) => {
    const euZones = ['Europe/Berlin','Europe/London','Europe/Lisbon','Europe/Tallinn','Europe/Malta','Asia/Nicosia','Atlantic/Reykjavik','Europe/Zurich'];
    for (const tz of euZones) {
      const context = await browser.newContext({ timezoneId: tz });
      await rewriteCfCountry(context, '');
      const page = await context.newPage();
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(() => window.divinciIsEUUser?.());
      expect(result, `divinciIsEUUser() should be true for TZ ${tz}`).toBe(true);
      await context.close();
    }
  });

  test('timezone fallback: returns false for non-EU timezones when cf-country empty', async ({ browser }) => {
    const nonEuZones = ['America/New_York','America/Los_Angeles','Asia/Tokyo','Asia/Singapore','Australia/Sydney','Africa/Johannesburg'];
    for (const tz of nonEuZones) {
      const context = await browser.newContext({ timezoneId: tz });
      await rewriteCfCountry(context, '');
      const page = await context.newPage();
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(() => window.divinciIsEUUser?.());
      expect(result, `divinciIsEUUser() should be false for TZ ${tz}`).toBe(false);
      await context.close();
    }
  });
});

test.describe('HubSpot gating — same policy as Instantly', () => {
  test('non-EU country (US): HubSpot tag loads immediately', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'US');
    const page = await context.newPage();

    const seen = page.waitForRequest(HUBSPOT_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await seen, 'hubspot tracker should load for non-EU').not.toBeNull();
    expect(await hsTagInDom(page)).toBe(true);

    await context.close();
  });

  test('EU country (DE) + no consent: HubSpot tag does NOT load', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    const requests: string[] = [];
    page.on('request', (req: Request) => {
      if (HUBSPOT_URL_RE.test(req.url())) requests.push(req.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(NO_LEADSY_WAIT_MS);
    expect(requests).toEqual([]);
    expect(await hsTagInDom(page)).toBe(false);

    await context.close();
  });

  test('EU country (DE) + marketing consent: HubSpot tag loads', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    await context.addInitScript((consent) => {
      try { localStorage.setItem('divinci-gdpr-consent', JSON.stringify(consent)); } catch (e) {}
    }, SAVED_CONSENT_YES);
    const page = await context.newPage();

    const seen = page.waitForRequest(HUBSPOT_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await seen).not.toBeNull();
    expect(await hsTagInDom(page)).toBe(true);

    await context.close();
  });

  test('EU country (DE) + in-session consent event: HubSpot loads after dispatch', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expect(await hsTagInDom(page)).toBe(false);

    const seen = page.waitForRequest(HUBSPOT_URL_RE, { timeout: 5000 }).catch(() => null);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('divinci:marketing-consent-granted'));
    });
    expect(await seen).not.toBeNull();
    expect(await hsTagInDom(page)).toBe(true);

    await context.close();
  });

  test('granting consent loads BOTH Instantly AND HubSpot from the same event', async ({ browser }) => {
    const context = await browser.newContext();
    await rewriteCfCountry(context, 'DE');
    const page = await context.newPage();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Neither loaded yet
    expect(await tagInDom(page)).toBe(false);
    expect(await hsTagInDom(page)).toBe(false);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('divinci:marketing-consent-granted'));
    });
    await page.waitForTimeout(800);

    expect(await tagInDom(page), 'leadsy should load on consent').toBe(true);
    expect(await hsTagInDom(page), 'hubspot should load on consent').toBe(true);

    await context.close();
  });
});

declare global {
  interface Window {
    divinciIsEUUser?: () => boolean;
    divinciGateOnMarketingConsent?: (loader: () => void) => void;
  }
}
