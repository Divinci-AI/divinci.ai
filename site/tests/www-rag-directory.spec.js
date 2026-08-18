/**
 * End-to-end tests for the WWW-RAG directory and the Open Web Vector
 * Initiative page.
 *
 * The directory API is stubbed with tests/fixtures/www-rag-directory.js for
 * three reasons: the live corpus grows daily (so no assertion about it can be
 * stable), api.divinci.app sends no CORS headers for localhost (so the real
 * request fails here anyway), and the fixture carries the awkward rows —
 * unmeasured counts, an unclaimed site with no chat endpoint, a description
 * Excel would execute — that the interesting assertions need.
 *
 * What this layer covers that the jsdom unit tests cannot:
 *   - the real Blob/anchor download path (jsdom has no Blob and no downloads)
 *   - the page-scoped Divinci agent actually booting from the built HTML
 *   - CSS-dependent behaviour: the table scrolling inside its own wrapper
 *     rather than the page, and the phone layout
 */

const { test, expect } = require('@playwright/test');
const { PAYLOAD } = require('./fixtures/www-rag-directory');

const DIRECTORY_API = '**/api/v1/www-rag-directory*';

/** Serve the fixture, and keep third-party requests out of the run. */
async function stubNetwork(page) {
    await page.route(DIRECTORY_API, (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body: JSON.stringify(PAYLOAD),
        })
    );
    // Favicons for fixture hosts, the crawl-activity endpoint, the universe
    // map and Turnstile are all irrelevant here and only add flake.
    await page.route('**/favicon.ico', (route) => route.abort());
    await page.route('**/challenges.cloudflare.com/**', (route) => route.abort());
    await page.route('**/www-rag-activity*', (route) => route.abort());
    await page.route('**/www-rag-universe*', (route) => route.abort());
}

async function openDirectory(page, query = '') {
    await stubNetwork(page);
    await page.goto(`/www-rag/${query}`);
    await expect(page.locator('#www-rag-toolbar')).toBeVisible();
}

test.describe('WWW-RAG directory', () => {
    test('loads the catalogue into the cards view', async ({ page }) => {
        await openDirectory(page);

        await expect(page.locator('.www-rag-card')).toHaveCount(9);
        await expect(page.locator('#www-rag-count')).toHaveText('9 sites');
        await expect(page.locator('#www-rag-export')).toHaveText('Export CSV (9)');
    });

    test('search and filters narrow the list together', async ({ page }) => {
        await openDirectory(page);

        await page.fill('#www-rag-search', 'o');
        await page.selectOption('#www-rag-filter-tld', 'org');
        await expect(page.locator('#www-rag-count')).toHaveText('2 of 9 sites');

        await page.selectOption('#www-rag-filter-status', 'claimed');
        await expect(page.locator('.www-rag-card-host')).toHaveText(['beta.org']);

        await page.click('#www-rag-reset');
        await expect(page.locator('#www-rag-count')).toHaveText('9 sites');
    });

    test('the table view sorts from its column headers', async ({ page }) => {
        await openDirectory(page);
        await page.click('[data-www-rag-view="table"]');

        await expect(page.locator('.www-rag-table tbody tr')).toHaveCount(9);
        await page.getByRole('button', { name: 'Pages' }).click();
        await expect(page.locator('.www-rag-row-host').first()).toHaveText('epsilon.io');

        await page.getByRole('button', { name: 'Pages' }).click();
        await expect(page.locator('.www-rag-row-host').first()).toHaveText('constructor');
        await expect(page.locator('.www-rag-table th').nth(2)).toHaveAttribute('aria-sort', 'ascending');
    });

    test('a deep link restores the whole browsing state', async ({ page }) => {
        await openDirectory(page, '?q=o&tld=org&sort=host:asc&view=table');

        await expect(page.locator('#www-rag-search')).toHaveValue('o');
        await expect(page.locator('#www-rag-filter-tld')).toHaveValue('org');
        await expect(page.locator('.www-rag-row-host')).toHaveText(['beta.org', 'sheet.org']);
    });

    test('the state is written back into the URL as it changes', async ({ page }) => {
        await openDirectory(page);

        await page.selectOption('#www-rag-filter-status', 'nochat');
        await page.click('[data-www-rag-view="table"]');
        await expect(page).toHaveURL(/status=nochat/);
        await expect(page).toHaveURL(/view=table/);
    });

    test('exporting downloads a CSV of exactly what is on screen', async ({ page }) => {
        await openDirectory(page);
        await page.selectOption('#www-rag-filter-tld', 'org');
        await page.selectOption('#www-rag-sort', 'host:asc');

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#www-rag-export'),
        ]);
        expect(download.suggestedFilename()).toBe('divinci-www-rag-directory.csv');

        const stream = await download.createReadStream();
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const csv = Buffer.concat(chunks).toString('utf8');

        const rows = csv.trim().split('\r\n');
        expect(rows).toHaveLength(3); // header + the two .org sites
        expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM, so Excel reads UTF-8
        expect(rows[0]).toContain('"Host","Title","Description"');
        expect(rows[1]).toContain('beta.org');
        expect(rows[2]).toContain('sheet.org');
        // The formula-shaped description arrives quoted AND defused.
        expect(csv).toContain(`"'=cmd|'/c calc'!A1"`);
        expect(csv).not.toContain('"=cmd');
    });

    test('untrusted site text never becomes markup', async ({ page }) => {
        await openDirectory(page);

        // Scoped to the results: the hero poster carries its own legitimate
        // onerror fallback, so a page-wide assertion would fail on real markup.
        await expect(page.locator('#www-rag-grid img[onerror]')).toHaveCount(0);
        await expect(page.locator('#www-rag-grid script')).toHaveCount(0);
        await expect(page.getByText('<img src=x onerror=', { exact: false })).toBeVisible();
    });

    test('the wide table scrolls inside itself, not the page', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openDirectory(page);
        await page.click('[data-www-rag-view="table"]');

        const overflow = await page.evaluate(() => {
            const wrap = document.querySelector('.www-rag-table-wrap');
            return {
                page: document.documentElement.scrollWidth - window.innerWidth,
                tableScrolls: wrap.scrollWidth > wrap.clientWidth,
                reachable: wrap.getAttribute('tabindex') === '0',
            };
        });
        expect(overflow.page).toBeLessThanOrEqual(0);
        expect(overflow.tableScrolls).toBe(true);
        expect(overflow.reachable).toBe(true);
    });

    test('a large catalogue is drawn in chunks as the visitor scrolls', async ({ page }) => {
        // 300 rows: more than one chunk, so the sentinel has to do real work.
        const many = {
            ...PAYLOAD,
            totalSites: 300,
            sites: Array.from({ length: 300 }, (_, i) => ({
                ...PAYLOAD.sites[3],
                host: `site-${String(i).padStart(4, '0')}.gov`,
                title: `site ${i}`,
                description: `site number ${i}`,
                chunkCount: 300 - i,
            })),
        };
        await page.route(DIRECTORY_API, (r) =>
            r.fulfill({ status: 200, contentType: 'application/json',
                        headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(many) }));
        await page.route('**/favicon.ico', (r) => r.abort());
        await page.goto('/www-rag/');
        await expect(page.locator('#www-rag-toolbar')).toBeVisible();

        // The count is about the RESULT; the DOM is about what has been drawn.
        await expect(page.locator('#www-rag-count')).toHaveText('300 sites');
        await expect(page.locator('#www-rag-export')).toHaveText('Export CSV (300)');
        const first = await page.locator('.www-rag-card').count();
        expect(first).toBeLessThan(300);
        expect(first).toBeGreaterThan(0);

        // Scrolling to the bottom tops it up, repeatedly, until it is complete.
        for (let i = 0; i < 6; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(250);
            if ((await page.locator('.www-rag-card').count()) === 300) break;
        }
        await expect(page.locator('.www-rag-card')).toHaveCount(300);
    });

    test('icons are only requested for rows the visitor actually reaches', async ({ page }) => {
        // Half the catalogue has no pipeline-hosted icon and falls back to the
        // LISTED SITE's own origin, so every drawn row is a GET that hands a
        // third party the visitor's IP. Icons must follow the viewport.
        //
        // The fixture points them at a resolvable host on purpose: Chromium
        // fails a request to a non-resolving name before it becomes something
        // route() can observe, which makes "no request" indistinguishable from
        // "request we could not see".
        const asked = new Set();
        await page.route('**/fixture-icon-*.png', (route) => {
            asked.add(route.request().url());
            return route.abort();
        });
        await page.route(DIRECTORY_API, (r) =>
            r.fulfill({
                status: 200, contentType: 'application/json',
                headers: { 'access-control-allow-origin': '*' },
                body: JSON.stringify({
                    ...PAYLOAD,
                    totalSites: 200,
                    sites: Array.from({ length: 200 }, (_, i) => ({
                        ...PAYLOAD.sites[3],
                        host: `icon-${String(i).padStart(3, '0')}.divinci.ai`,
                        faviconUrl: `https://divinci.ai/fixture-icon-${i}.png`,
                    })),
                }),
            })
        );

        await page.setViewportSize({ width: 1280, height: 700 });
        await page.goto('/www-rag/');
        await expect(page.locator('#www-rag-toolbar')).toBeVisible();
        await page.waitForTimeout(800);

        const early = asked.size;
        expect(early).toBeGreaterThan(0); // what IS on screen still gets its icon
        expect(early).toBeLessThan(50); // …and nothing like the whole catalogue

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200);
        expect(asked.size).toBeGreaterThan(early); // scrolling reveals more
    });

    test('the initiative band links through to the initiative page', async ({ page }) => {
        await openDirectory(page);

        await page.click('.www-rag-owv-link');
        await expect(page).toHaveURL(/\/open-web-vectors\/$/);
        await expect(page.locator('h1')).toContainText('The web is only legible');
    });
});

test.describe('Open Web Vector Initiative page', () => {
    test('replaces every snapshot figure with a measured one', async ({ page }) => {
        await stubNetwork(page);
        await page.goto('/open-web-vectors/');

        await expect(page.locator('[data-owv-stat="sites"]')).toHaveText('9');
        await expect(page.locator('[data-owv-stat="pages"]')).toHaveText('3,634');
        await expect(page.locator('[data-owv-stat="endpoints"]')).toHaveText('8');
        await expect(page.locator('[data-owv-asof]')).toHaveText('Read live just now.');
        await expect(page.locator('[data-owv-public-share]')).toHaveText('44%');
    });

    test('offers three working chat endpoints as demos', async ({ page }) => {
        await stubNetwork(page);
        await page.goto('/open-web-vectors/');

        await expect(page.locator('.owv-example')).toHaveCount(3);
        const links = page.locator('.owv-example-link');
        for (let i = 0; i < 3; i++) {
            await expect(links.nth(i)).toHaveAttribute(
                'href', /^https:\/\/chat\.divinci\.app\/ai-release\//
            );
            await expect(links.nth(i)).toHaveAttribute('rel', /noopener/);
        }
        // delta.com has no release and must never be offered as a live demo.
        await expect(page.locator('#owv-examples')).not.toContainText('delta.com');
    });

    test('keeps its dated snapshot when the directory is unreachable', async ({ page }) => {
        await page.route(DIRECTORY_API, (route) => route.abort());
        await page.goto('/open-web-vectors/');

        await expect(page.locator('[data-owv-stat="sites"]')).toHaveText('472');
        await expect(page.locator('[data-owv-asof]')).toContainText('Snapshot:');
        await expect(page.locator('.owv-examples-fallback')).toBeVisible();
    });

    test('reads without horizontal overflow on a phone', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await stubNetwork(page);
        await page.goto('/open-web-vectors/');

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
        // The pipeline restacks rather than shrinking its type to nothing.
        await expect(page.locator('.owv-pipe')).toHaveCSS('flex-direction', 'column');
    });

    test('body text on the dark bands is actually legible', async ({ page }) => {
        // Bare <p> inherits nothing useful here: a global rule paints it the
        // site's heading green, which on these bands is near-invisible.
        await stubNetwork(page);
        await page.goto('/open-web-vectors/');

        const colours = await page.evaluate(() => ({
            principle: getComputedStyle(document.querySelector('.owv-principle p')).color,
            callout: getComputedStyle(document.querySelector('.owv-callout-body p')).color,
            texture: getComputedStyle(document.querySelector('.owv-principle')).backgroundImage,
        }));
        expect(colours.principle).toBe('rgb(182, 182, 210)');
        expect(colours.callout).toBe('rgb(182, 182, 210)');
        // …and the site-wide [class*="card"] paper texture is not painted over
        // the dark surface, which is why these are not called "…-card".
        expect(colours.texture).toBe('none');
    });
});

test.describe('page-scoped Divinci agent', () => {
    /**
     * Complete the Free-Chat Gate handshake without the network.
     *
     * Turnstile is stubbed in the page rather than loaded: the real script
     * is a third-party request that makes the run slow and flaky, and its
     * token is the one thing standing between the widget and a send() call.
     * `sent` collects every request body the widget posts, so the assertion
     * can be about what travels rather than about a particular field name.
     */
    async function stubGate(page, sent = [], reply = 'stubbed reply') {
        await page.addInitScript(() => {
            window.turnstile = {
                render: (_el, opts) => {
                    setTimeout(() => opts.callback && opts.callback('turnstile-test-token'), 0);
                    return 'stub-widget';
                },
                getResponse: () => 'turnstile-test-token',
                reset: () => {},
                remove: () => {},
            };
        });
        await page.route('**/free-chat-gate/**', (route) => {
            const url = route.request().url();
            const post = route.request().postData();
            if (post) sent.push(post);
            const body = url.includes('/config')
                ? { mode: 'captcha-only', turnstileSiteKey: '1x00000000000000000000AA' }
                : url.includes('/start')
                    ? { status: 'ready', mode: 'captcha-only', nextStep: 'chat', token: 'gate-test-token' }
                    // The SDK reads the answer off the LAST transcript entry,
                    // not off a top-level `reply` field — a stub that returns
                    // one renders an empty assistant bubble.
                    : {
                        remaining: 3,
                        signiture: 'stub-signature',
                        transcript: [{
                            prompt: (() => { try { return JSON.parse(post || '{}').newPrompt || ''; } catch { return ''; } })(),
                            promptTimestamp: 0,
                            response: reply,
                            responseTimestamp: 0,
                            context: [],
                        }],
                    };
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: { 'access-control-allow-origin': '*' },
                body: JSON.stringify(body),
            });
        });
        return sent;
    }

    /** Open the panel on a conversation with no restored history. */
    async function openFreshPanel(page, url) {
        await page.goto(url);
        await page.evaluate(() => {
            Object.keys(localStorage)
                .filter((k) => k.startsWith('divinci-chat'))
                .forEach((k) => localStorage.removeItem(k));
        });
        await page.reload();
        // On pages with a tall hero the launcher stays hidden until the
        // visitor scrolls past it.
        await page.evaluate(() => window.scrollTo(0, 1200));
        await page.locator('.dvc-bubble').click();
    }

    const CASES = [
        {
            url: '/www-rag/',
            greeting: 'This is the WWW-RAG Directory',
            starter: 'Claim my site',
        },
        {
            url: '/open-web-vectors/',
            greeting: 'This is the Open Web Vector Initiative',
            starter: 'How does the gate work?',
        },
    ];

    for (const { url, greeting, starter } of CASES) {
        test(`${url} opens with its own greeting and starters`, async ({ page }) => {
            await stubNetwork(page);
            await stubGate(page);
            await openFreshPanel(page, url);
            const panel = page.locator('.dvc-panel');
            await expect(panel.locator('.dvc-msg-assistant')).toContainText(greeting);
            await expect(panel.getByRole('button', { name: starter })).toBeVisible();
        });
    }

    test('the page context rides on the wire, not on screen', async ({ page }) => {
        await stubNetwork(page);
        const sent = await stubGate(page);
        await openFreshPanel(page, '/www-rag/');

        const input = page.locator('.dvc-panel input, .dvc-panel textarea').first();
        await input.fill('how do I claim my site');
        await input.press('Enter');

        await expect.poll(() => sent.join('\n')).toContain('how do I claim my site');
        // The release is site-wide, so the page's framing has to travel with
        // the prompt — asserted against the raw body rather than a field name,
        // so an SDK rename does not read as a behaviour change.
        expect(sent.join('\n')).toContain('WWW-RAG Directory');
        // …and the visitor sees only what they typed.
        await expect(page.locator('.dvc-msg-user')).toHaveText('how do I claim my site');
    });

    test('a hostile assistant reply cannot become markup', async ({ page }) => {
        // The release answers out of a corpus of CRAWLED third-party pages, so
        // a page in that corpus can try to steer what the model emits. The
        // widget renders replies as markdown into innerHTML, which makes this
        // the one place that steering could turn into script on our origin.
        // Tested against the real committed bundle, not the TypeScript.
        const hostile = [
            '<img src=x onerror="window.__pwned=1">',
            '[click me](javascript:window.__pwned=2)',
            '[quote break](https://evil.example" onmouseover="window.__pwned=3)',
            '`<script>window.__pwned=4</script>`',
            '```',
            '<script>window.__pwned=5</script>',
            '```',
            '<iframe src="https://evil.example"></iframe>',
            'A legitimate [link](https://divinci.ai/docs/) must still work.',
        ].join('\n');

        await stubNetwork(page);
        await stubGate(page, [], hostile);
        await openFreshPanel(page, '/www-rag/');

        const input = page.locator('.dvc-panel input, .dvc-panel textarea').first();
        await input.fill('tell me about this');
        await input.press('Enter');
        await expect(page.locator('.dvc-msg-assistant').last()).toContainText('legitimate');

        const result = await page.evaluate(() => {
            const msg = [...document.querySelectorAll('.dvc-msg-assistant')].pop();
            return {
                pwned: window.__pwned,
                imgs: msg.querySelectorAll('img').length,
                iframes: msg.querySelectorAll('iframe').length,
                scripts: msg.querySelectorAll('script').length,
                handlers: [...msg.querySelectorAll('*')].filter((el) =>
                    [...el.attributes].some((a) => a.name.startsWith('on'))).length,
                schemes: [...msg.querySelectorAll('a')].map((a) => a.protocol),
                anchors: [...msg.querySelectorAll('a')].map((a) => ({ href: a.href, rel: a.rel })),
                text: msg.textContent,
            };
        });

        expect(result.pwned).toBeUndefined();
        expect(result.imgs).toBe(0);
        expect(result.iframes).toBe(0);
        expect(result.scripts).toBe(0);
        expect(result.handlers).toBe(0);
        // Only the http(s) link survived as an anchor at all.
        expect(result.schemes.every((s) => s === 'https:' || s === 'http:')).toBe(true);
        expect(result.anchors).toHaveLength(1);
        expect(result.anchors[0].href).toBe('https://divinci.ai/docs/');
        expect(result.anchors[0].rel).toContain('noopener');
        // The markup the model emitted is shown as text, which is the point.
        expect(result.text).toContain('<img src=x onerror=');
        expect(result.text).toContain('<script>window.__pwned=5</script>');
    });

    test('the homepage keeps the site-wide assistant', async ({ page }) => {
        await stubGate(page);
        await openFreshPanel(page, '/');

        await expect(page.locator('.dvc-panel .dvc-msg-assistant')).toContainText(
            "Hi, I'm Divinci!"
        );
        await expect(page.locator('.dvc-panel')).not.toContainText('WWW-RAG Directory');
    });
});
