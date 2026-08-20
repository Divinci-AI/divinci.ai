/**
 * End-to-end tests for "The RAG universe" — the force-directed map on /www-rag.
 *
 * ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 *
 * On 2026-08-20 this section crashed the page. The force simulation was
 * all-pairs (1.5·n² evaluations per tick) and the boot ran 600 ticks
 * SYNCHRONOUSLY inside the fetch continuation. At the live corpus of 2,876
 * sites that is ~20 s of unyielding main thread measured natively; in a real
 * browser it showed as a single 36,255 ms frozen frame and an empty black box.
 * The directory adds ~150 sites a day, so it had been getting worse daily and
 * would have kept doing so.
 *
 * www-rag-directory.spec.js deliberately aborts `**\/www-rag-universe*` to keep
 * its own runs stable, so until this file the map had NO browser coverage at
 * all — which is how a section that freezes the tab shipped and stayed shipped.
 *
 * What this layer covers that the jsdom unit tests cannot:
 *   - real main-thread blocking, via PerformanceObserver longtask entries.
 *     A unit test can count algorithmic work; only a browser can tell you the
 *     page stayed responsive while doing it.
 *   - the IntersectionObserver deferral, which needs real layout and scrolling.
 *     The first version of that deferral observed the `hidden` <section>
 *     itself — an element with no layout box, which IntersectionObserver never
 *     reports as intersecting, so the map would simply never have loaded.
 *   - that the animation actually STOPS, observed as pixels, not as a promise.
 *   - that hostile hostnames from crawled third-party pages stay on the canvas.
 *
 * The payload is generated (tests/fixtures/www-rag-universe.js) rather than
 * checked in because the parameter that matters is the NODE COUNT, and a
 * fixture frozen at one size stops testing the failure the moment the live
 * corpus grows past it. api.divinci.app also sends no CORS headers for
 * localhost, so the real request could not run here anyway.
 */

const { test, expect } = require('@playwright/test');
const { makeUniverse } = require('./fixtures/www-rag-universe');
const { PAYLOAD: DIRECTORY_PAYLOAD } = require('./fixtures/www-rag-directory');

const UNIVERSE_API = '**/api/v1/www-rag-universe*';
const SURFACE = { r: 0x0b, g: 0x0b, b: 0x12 };   // the canvas background

/** Serve a universe of `n` sites and keep every other request out of the run. */
async function stubUniverse(page, n, opts) {
    const body = JSON.stringify(makeUniverse(n, opts));
    await page.route(UNIVERSE_API, (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body,
        })
    );
    await quietenPage(page);
}

/** The rest of /www-rag is not under test here and only adds flake. */
async function quietenPage(page) {
    await page.route('**/api/v1/www-rag-directory*', (route) => route.abort());
    await page.route('**/www-rag-activity*', (route) => route.abort());
    await page.route('**/favicon.ico', (route) => route.abort());
    await page.route('**/challenges.cloudflare.com/**', (route) => route.abort());
}

/** Record long tasks from the very first script, before anything else runs. */
async function recordLongTasks(page) {
    await page.addInitScript(() => {
        window.__longTasks = [];
        try {
            new PerformanceObserver((l) => {
                for (const e of l.getEntries()) window.__longTasks.push(Math.round(e.duration));
            }).observe({ entryTypes: ['longtask'] });
            window.__longTaskObserverWorks = true;
        } catch (e) {
            // A guard that cannot measure must never be read as a pass.
            window.__longTaskObserverWorks = false;
        }
    });
}

const canvas = (page) => page.locator('#www-rag-universe-canvas');

/** Scroll the map into view and wait for it to be revealed. */
async function revealUniverse(page) {
    await page.goto('/www-rag/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('#www-rag-universe-section')).toBeVisible();
    await expect(canvas(page)).toHaveCSS('opacity', '1', { timeout: 20000 });
}

/** How many pixels are something other than the background. */
function paintedPixels(page) {
    return page.evaluate(({ r, g, b }) => {
        const c = document.getElementById('www-rag-universe-canvas');
        const ctx = c.getContext('2d');
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let painted = 0;
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] !== r || d[i + 1] !== g || d[i + 2] !== b) painted++;
        }
        return painted;
    }, SURFACE);
}

test.describe('The RAG universe', () => {
    test('renders the map once the endpoint answers', async ({ page }) => {
        await stubUniverse(page, 400);
        await revealUniverse(page);

        // Something is actually drawn — every other assertion in this file
        // would pass against a section that renders a blank rectangle.
        expect(await paintedPixels(page)).toBeGreaterThan(2000);

        // The caption states the coverage of BOTH layers; the numbers come
        // from the payload's stats, so they track the fixture.
        await expect(page.locator('#www-rag-universe-caption'))
            .toContainText('400 sites');
        await expect(page.locator('#www-rag-universe-caption'))
            .toContainText('Size is pages indexed');
    });

    test('stays hidden when the endpoint is unavailable', async ({ page }) => {
        // An empty black box on a marketing page is worse than no box.
        await page.route(UNIVERSE_API, (route) => route.fulfill({ status: 503, body: 'nope' }));
        await quietenPage(page);
        await page.goto('/www-rag/');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2500);
        await expect(page.locator('#www-rag-universe-section')).toBeHidden();
    });

    // ⚠️ A DELIBERATELY SHORT VIEWPORT, and it is worth knowing why.
    //
    // The map is the fourth section on /www-rag and starts ~850 px down, above
    // the directory — which is the tall part, and which scrolls inside its own
    // fixed-height wrapper, so no amount of catalogue makes the page longer.
    // At 1280x720 the map is 133 px below the fold and at 1080p it is already
    // on screen: both inside the 600 px rootMargin, so on any normal viewport
    // the fetch fires at load and there is no deferral left to observe.
    //
    // So this exercises the MECHANISM rather than a production scenario: that
    // the request is driven by the observer and is not issued unconditionally,
    // and that the observer watches something with a layout box. The first
    // version of it watched the `hidden` <section>, which has none, so it never
    // fired and the map never loaded at all.
    test.describe('deferred loading', () => {
        test.use({ viewport: { width: 1280, height: 200 } });

    test('is not fetched until it is nearly in view', async ({ page }) => {
        const hits = [];
        // Match the API, not the script: /js/www-rag-universe.js contains the
        // same substring and is loaded unconditionally by the page.
        page.on('request', (r) => { if (r.url().includes('/api/v1/www-rag-universe')) hits.push(r.url()); });
        await stubUniverse(page, 200);

        await page.goto('/www-rag/');
        await page.waitForLoadState('networkidle');

        // Precondition, asserted rather than assumed: if the page ever gets
        // short enough that the map is on screen at load, the deferral is
        // untestable here and this should say so plainly instead of passing
        // for the wrong reason.
        const gap = await page.evaluate(() => {
            const s = document.getElementById('www-rag-universe-section');
            // getBoundingClientRect on a `hidden` element is all zeros, so
            // measure from the element before it — which is exactly why the
            // deferral observes a sentinel rather than the section itself.
            const probe = s.previousElementSibling || s;
            return probe.getBoundingClientRect().top - window.innerHeight;
        });
        expect(gap, 'the map must start well below the fold for this test to mean anything')
            .toBeGreaterThan(600);
        expect(hits, 'the payload must be driven by the observer, not fetched unconditionally').toHaveLength(0);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(canvas(page)).toHaveCSS('opacity', '1', { timeout: 20000 });
        expect(hits.length).toBe(1);
    });
    });

    test('a corpus larger than today\'s never blocks the main thread', async ({ page }) => {
        // THE regression test. 3,000 sites is just past the live corpus, which
        // the old all-pairs code turned into ~170 s of frozen tab — so a
        // regression here does not merely exceed the bound below, it blows the
        // test timeout outright.
        test.setTimeout(90000);
        await recordLongTasks(page);
        await stubUniverse(page, 3000);
        await revealUniverse(page);

        expect(await paintedPixels(page)).toBeGreaterThan(2000);

        const { works, tasks } = await page.evaluate(() => ({
            works: window.__longTaskObserverWorks,
            tasks: window.__longTasks,
        }));
        expect(works, 'longtask is unsupported here, so this test proves nothing').toBe(true);

        const longest = tasks.length ? Math.max(...tasks) : 0;
        // The old code produced a single 36,255 ms task at 2,876 nodes, and
        // 17,920 ms under this very fixture. The fixed one reveals in a single
        // ~56 ms task and then nothing over 50 ms at all — production measured
        // zero. 1,000 ms sits far above the real ceiling and ~18x below the
        // failure, so it discriminates without being flaky on a loaded runner.
        expect(longest, `long tasks (ms): ${tasks.join(', ')}`).toBeLessThan(1000);
    });

    test('the animation stops instead of burning a core forever', async ({ page }) => {
        // This layout never converges — the alpha floor keeps feeding it, so it
        // settles into a permanent creep of 0.08 screen px per frame. The old
        // loop rendered that invisible motion for 2,400 frames and left a
        // requestAnimationFrame callback registered for the life of the page.
        // Observed as pixels, because that is the claim: the picture is final.
        test.setTimeout(60000);
        await stubUniverse(page, 400);
        await revealUniverse(page);

        await expect
            .poll(async () => {
                const a = await canvas(page).evaluate((c) => c.toDataURL());
                await new Promise((r) => setTimeout(r, 600));
                const b = await canvas(page).evaluate((c) => c.toDataURL());
                return a === b;
            }, { timeout: 40000, message: 'the canvas never stopped changing' })
            .toBe(true);
    });

    test('a hostile hostname stays on the canvas and never becomes HTML', async ({ page }) => {
        // Hostnames reach the payload from crawled third-party pages, so they
        // are untrusted input. They are only ever drawn with fillText, never
        // written into the DOM — this holds that line across the renderer
        // rewrite, where the label path was reworked.
        const hostile = [
            '<img src=x onerror="window.__xss=1">.example',
            '"><script>window.__xss=2<\/script>.example',
            'javascript:alert(1).example',
        ];
        await stubUniverse(page, 300, { hosts: hostile });
        await revealUniverse(page);

        const result = await page.evaluate(() => ({
            xss: window.__xss,
            // Scoped to a token only OUR payload carries. `img[onerror]` alone
            // matches the page's own hero-poster fallback in www-rag.html,
            // which is legitimate — an assertion that fails on unrelated,
            // correct markup gets deleted by the next person, not fixed.
            injected: document.querySelectorAll('[onerror*="__xss"], img[src="x"]').length,
            // The hostile strings must appear nowhere in the document at all —
            // not as markup, not escaped as text. They belong to canvas pixels.
            inHtml: document.documentElement.innerHTML.includes('__xss')
                || document.documentElement.innerHTML.includes('javascript:alert'),
        }));
        expect(result.xss).toBeUndefined();
        expect(result.injected).toBe(0);
        expect(result.inHtml).toBe(false);
    });
});

test.describe('The RAG universe, with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('arrives as a settled still frame and never animates', async ({ page }) => {
        await stubUniverse(page, 400);
        await revealUniverse(page);

        expect(await paintedPixels(page)).toBeGreaterThan(2000);

        // No animation loop is started at all in this mode, so the very first
        // frame after reveal is already the last one.
        const a = await canvas(page).evaluate((c) => c.toDataURL());
        await page.waitForTimeout(1200);
        const b = await canvas(page).evaluate((c) => c.toDataURL());
        expect(a).toBe(b);
    });
});
