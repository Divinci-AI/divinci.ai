/**
 * Unit tests for the Open Web Vector Initiative page's live figures
 * (static/js/open-web-vectors.js).
 *
 * The page's claim is "measured, not projected". Two properties matter more
 * than any individual number:
 *
 *   1. every figure is refreshed from the public directory API, so none of
 *      them can quietly go stale;
 *   2. when that request fails, the dated snapshot in the HTML is left
 *      exactly as rendered — a page about honesty must not degrade into a
 *      row of dashes, and must not present stale figures as live ones.
 *
 * The markup mirrors templates/open-web-vectors.html, including the
 * server-rendered snapshot values, so a test that "passes" because nothing
 * was written would be visible as a snapshot value surviving.
 */
const fs = require('fs');
const path = require('path');
const { PAYLOAD, SITES } = require('../fixtures/www-rag-directory');

const SOURCE = fs.readFileSync(
    path.join(__dirname, '../../static/js/open-web-vectors.js'),
    'utf8'
);

const SNAPSHOT = {
    sites: '472',
    pages: '219,248',
    chunks: '1,106,599',
    bytes: '1.3 GB',
    endpoints: '410',
    median: '117',
};

const MARKUP = `
<div id="owv-stats">
  <span data-owv-stat="sites">${SNAPSHOT.sites}</span>
  <span data-owv-stat="pages">${SNAPSHOT.pages}</span>
  <span data-owv-stat="chunks">${SNAPSHOT.chunks}</span>
  <span data-owv-stat="bytes">${SNAPSHOT.bytes}</span>
  <span data-owv-stat="endpoints">${SNAPSHOT.endpoints}</span>
  <span data-owv-stat="median">${SNAPSHOT.median}</span>
</div>
<p><span data-owv-asof>Snapshot: 17 August 2026.</span></p>
<p><span data-owv-public-share>55%</span></p>
<div data-owv-bar>
  <span data-owv-seg="org" style="width:30.9%"></span>
  <span data-owv-seg="gov" style="width:15.7%"></span>
  <span data-owv-seg="edu" style="width:8.1%"></span>
  <span data-owv-seg="com" style="width:33.3%"></span>
  <span data-owv-seg="other" style="width:12.0%"></span>
</div>
<ul>
  <li><b data-owv-count="org">146</b></li>
  <li><b data-owv-count="gov">74</b></li>
  <li><b data-owv-count="edu">38</b></li>
  <li><b data-owv-count="com">157</b></li>
  <li><b data-owv-count="other">57</b></li>
</ul>
<p data-owv-fact="deepest">SNAPSHOT DEEPEST</p>
<p data-owv-fact="largest">SNAPSHOT LARGEST</p>
<div id="owv-examples">
  <p class="owv-examples-fallback"><a href="/www-rag/">Open the directory</a></p>
</div>`;

async function boot(payload = PAYLOAD, { ok = true, reject = false } = {}) {
    document.body.innerHTML = MARKUP;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn(() =>
        reject
            ? Promise.reject(new Error('network down'))
            : Promise.resolve({ ok, status: ok ? 200 : 503, json: async () => payload })
    );
    // eslint-disable-next-line no-eval
    eval(SOURCE);
    for (let i = 0; i < 6; i++) await Promise.resolve();
}

const stat = (name) => document.querySelector(`[data-owv-stat="${name}"]`).textContent;
const count = (name) => document.querySelector(`[data-owv-count="${name}"]`).textContent;
const segWidth = (name) => document.querySelector(`[data-owv-seg="${name}"]`).style.width;
const fact = (name) => document.querySelector(`[data-owv-fact="${name}"]`).textContent;
const examples = () => [...document.querySelectorAll('.owv-example')];

describe('open web vectors — live figures', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
    });

    describe('headline stats', () => {
        test('every stat is replaced with the measured value', async () => {
            await boot();

            expect(stat('sites')).toBe('9');
            expect(stat('pages')).toBe('3,634');
            expect(stat('chunks')).toBe('54,975');
            expect(stat('bytes')).toBe('196 MB');
            expect(stat('endpoints')).toBe('8'); // delta.com has no releaseId
            expect(stat('median')).toBe('7'); // 9 page counts, middle value
        });

        test('the snapshot stamp is replaced so nothing reads as dated once it is live', async () => {
            await boot();
            expect(document.querySelector('[data-owv-asof]').textContent).toBe('Read live just now.');
        });

        test('a figure the API omits keeps its snapshot rather than blanking', async () => {
            const { totalBytes, ...rest } = PAYLOAD;
            await boot(rest);

            expect(stat('bytes')).toBe(SNAPSHOT.bytes);
            expect(stat('sites')).toBe('9'); // the rest still update
        });

        test('byte formatting matches the directory grid, unit for unit', async () => {
            // 200,000,000 bytes is "191 MB" in both places or the same corpus
            // is quoted two different sizes on two pages of the same site.
            await boot();
            expect(fact('largest')).toContain('191 MB');
        });
    });

    describe('composition', () => {
        test('bar segments and legend counts are derived from the payload', async () => {
            await boot();

            expect(count('org')).toBe('2'); // beta.org + sheet.org
            expect(count('com')).toBe('2');
            expect(count('gov')).toBe('1');
            expect(count('edu')).toBe('1');
            // .io is NOT a bucket on this page — only com/org/gov/edu are
            // named here, so epsilon.io lands in "other" alongside .museum
            // and the dotless host. (The directory's filter names more TLDs;
            // the two lists are deliberately different sizes.)
            expect(count('other')).toBe('3');
            expect(segWidth('org')).toBe('22.2%');
            expect(segWidth('gov')).toBe('11.1%');
        });

        test('the public-interest share counts org, gov and edu only', async () => {
            await boot();
            // 4 of 9 -> 44%
            expect(document.querySelector('[data-owv-public-share]').textContent).toBe('44%');
        });

        test('segment widths always total 100%', async () => {
            await boot();
            const total = ['org', 'gov', 'edu', 'com', 'other']
                .map((k) => parseFloat(segWidth(k)))
                .reduce((a, b) => a + b, 0);
            expect(Math.round(total)).toBe(100);
        });
    });

    describe('facts', () => {
        test('the deepest-crawl line names the three deepest sites', async () => {
            await boot();
            expect(fact('deepest')).toContain('epsilon.io, alpha.gov and beta.org');
        });

        test('it never claims sites "run past 0 pages"', async () => {
            // The third-deepest here has 100 pages, which floors to zero. The
            // sentence has to drop the number rather than print a nonsense one.
            await boot();

            expect(fact('deepest')).not.toMatch(/past 0 pages/);
            expect(fact('deepest')).toContain('are the deepest crawls in the index.');
        });

        test('it does use the round number once the third site clears 1,000', async () => {
            const sites = SITES.map((s) =>
                ['epsilon.io', 'alpha.gov', 'beta.org'].includes(s.host)
                    ? { ...s, pageCount: 4200 }
                    : s
            );
            await boot({ ...PAYLOAD, sites });

            expect(fact('deepest')).toContain('run past 4,000 pages each.');
        });

        test('the largest-corpus line is ranked by text, not by page count', async () => {
            await boot();
            // epsilon.io has both here; assert it reports bytes, which is the
            // ranking the sentence actually claims.
            expect(fact('largest')).toContain('epsilon.io');
            expect(fact('largest')).toContain('3,000 pages');
            expect(fact('largest')).toContain('191 MB');
        });
    });

    describe('live examples', () => {
        test('three chat-enabled sites replace the fallback link', async () => {
            await boot();

            expect(examples()).toHaveLength(3);
            expect(document.querySelector('.owv-examples-fallback')).toBeNull();
            expect(examples().map((e) => e.querySelector('.owv-example-host').textContent))
                .toEqual(['epsilon.io', 'alpha.gov', 'beta.org']);
        });

        test('a site with no chat endpoint is never offered as a demo', async () => {
            await boot();
            const hosts = examples().map((e) => e.querySelector('.owv-example-host').textContent);
            expect(hosts).not.toContain('delta.com');
        });

        test('links are chat URLs that cannot reach the opener', async () => {
            await boot();

            for (const a of document.querySelectorAll('.owv-example-link')) {
                expect(a.getAttribute('href')).toMatch(/^https:\/\/chat\.divinci\.app\/ai-release\//);
                expect(a.target).toBe('_blank');
                expect(a.rel).toContain('noopener');
            }
        });

        test('fewer than three demoable sites keeps the static fallback', async () => {
            await boot({
                ...PAYLOAD,
                sites: SITES.filter((s) => s.host === 'epsilon.io' || s.host === 'delta.com'),
            });

            expect(examples()).toHaveLength(0);
            expect(document.querySelector('.owv-examples-fallback')).not.toBeNull();
        });

        test('host names are written as text, never parsed as markup', async () => {
            const sites = SITES.map((s) =>
                s.host === 'epsilon.io' ? { ...s, host: '<img src=x onerror="alert(1)">' } : s
            );
            await boot({ ...PAYLOAD, sites });

            expect(document.querySelectorAll('#owv-examples img')).toHaveLength(0);
            expect(examples()[0].querySelector('.owv-example-host').textContent)
                .toBe('<img src=x onerror="alert(1)">');
        });
    });

    describe('when the directory cannot be reached', () => {
        test('a rejected request leaves the dated snapshot untouched', async () => {
            await boot(PAYLOAD, { reject: true });

            expect(stat('sites')).toBe(SNAPSHOT.sites);
            expect(stat('median')).toBe(SNAPSHOT.median);
            expect(document.querySelector('[data-owv-asof]').textContent)
                .toContain('Snapshot: 17 August 2026');
            expect(fact('deepest')).toBe('SNAPSHOT DEEPEST');
            expect(document.querySelector('.owv-examples-fallback')).not.toBeNull();
        });

        test('a non-2xx response is treated as a failure, not as data', async () => {
            await boot(PAYLOAD, { ok: false });

            expect(stat('sites')).toBe(SNAPSHOT.sites);
            expect(count('org')).toBe('146');
        });

        test('an empty catalogue does not zero the page out', async () => {
            await boot({ sites: [], totalSites: 0, totalPages: 0, totalChunks: 0, totalBytes: 0 });

            // Totals of zero ARE the measurement and are shown, but nothing
            // derived from an empty site list is written at all.
            expect(count('org')).toBe('146');
            expect(fact('deepest')).toBe('SNAPSHOT DEEPEST');
            expect(document.querySelector('.owv-examples-fallback')).not.toBeNull();
        });
    });

    describe('the page without this script', () => {
        test('nothing runs if the stats block is absent', async () => {
            document.body.innerHTML = '<div>unrelated page</div>';
            global.fetch = jest.fn();
            // eslint-disable-next-line no-eval
            eval(SOURCE);
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });
});
