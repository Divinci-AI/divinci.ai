/**
 * Unit tests for the WWW-RAG directory browser (static/js/www-rag-directory.js):
 * search, the domain/status/content filters, sorting, the cards/table views,
 * the URL state, and the CSV export.
 *
 * The real file is loaded and evaluated against jsdom rather than
 * reimplemented here, so a change to the widget is actually covered. The
 * markup below mirrors templates/www-rag.html; the ids and selectors it
 * depends on are additionally pinned against the BUILT page by
 * tests/unit/page-chat-config.test.mjs, so this copy cannot drift silently.
 */
const fs = require('fs');
const path = require('path');
const { PAYLOAD, SITES } = require('../fixtures/www-rag-directory');

const SOURCE = fs.readFileSync(
    path.join(__dirname, '../../static/js/www-rag-directory.js'),
    'utf8'
);

const MARKUP = `
<div id="www-rag-stats"></div>
<input type="search" id="www-rag-search">
<div id="www-rag-toolbar" hidden>
  <select id="www-rag-filter-tld">
    <option value="">All domains</option>
    <option value="com">.com</option>
    <option value="org">.org</option>
    <option value="gov">.gov</option>
    <option value="edu">.edu</option>
    <option value="io">.io</option>
    <option value="ai">.ai</option>
    <option value="net">.net</option>
    <option value="co">.co</option>
    <option value="dev">.dev</option>
    <option value="other">Other</option>
  </select>
  <select id="www-rag-filter-status">
    <option value="">Any status</option>
    <option value="chat">Chat-enabled</option>
    <option value="nochat">Not chat-enabled</option>
    <option value="claimed">Claimed</option>
    <option value="unclaimed">Unclaimed</option>
  </select>
  <select id="www-rag-filter-docs">
    <option value="">Pages and documents</option>
    <option value="files">Has documents</option>
    <option value="pages">Pages only</option>
  </select>
  <select id="www-rag-sort">
    <option value="chunkCount:desc">Most chunks</option>
    <option value="pageCount:desc">Most pages</option>
    <option value="fileCount:desc">Most documents</option>
    <option value="totalBytes:desc">Largest index</option>
    <option value="lastCrawledAt:desc">Recently crawled</option>
    <option value="host:asc">Site A–Z</option>
    <option value="host:desc">Site Z–A</option>
    <option value="" disabled>Custom order</option>
  </select>
  <button type="button" id="www-rag-reset">Reset</button>
  <span id="www-rag-count"></span>
  <button type="button" class="www-rag-viewbtn" data-www-rag-view="cards" aria-pressed="true">Cards</button>
  <button type="button" class="www-rag-viewbtn" data-www-rag-view="table" aria-pressed="false">Table</button>
  <button type="button" id="www-rag-export">Export CSV</button>
</div>
<div id="www-rag-status">Loading catalog…</div>
<div id="www-rag-grid"></div>`;

/** Everything the export path needs that jsdom does not implement. */
let capturedCsv;
let capturedDownload;

function stubDownloadPlumbing() {
    capturedCsv = null;
    capturedDownload = null;
    // Capture the CSV before it becomes an opaque Blob.
    global.Blob = function (parts) { capturedCsv = parts.join(''); };
    global.URL.createObjectURL = jest.fn(() => 'blob:stub');
    global.URL.revokeObjectURL = jest.fn();
    // Neuter the anchor click so jsdom does not try to navigate to blob:stub.
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        const node = realCreate(tag);
        if (tag === 'a') {
            node.click = () => { capturedDownload = node.download; };
        }
        return node;
    });
}

/**
 * A controllable IntersectionObserver.
 *
 * The widget uses one to top the list up as the visitor scrolls and another
 * to defer favicon requests until a row is on screen. setup.js installs a
 * mock that never fires, which would make every row invisible forever, so
 * each test says explicitly whether the page is scrolled into view.
 *
 *   onScreen: true  (default) — everything the widget observes is visible,
 *                               i.e. the visitor scrolled the whole list
 *   onScreen: false           — nothing has been reached yet; call
 *                               scrollIntoView() to simulate scrolling
 */
let observerState;
function installObserver(onScreen) {
    observerState = { onScreen, pending: [] };
    global.IntersectionObserver = function (cb) {
        const self = this;
        this.observe = (el) => {
            if (observerState.onScreen) cb([{ target: el, isIntersecting: true }], self);
            else observerState.pending.push({ cb, el, self });
        };
        this.unobserve = () => {};
        this.disconnect = () => {};
    };
}

/** Simulate the visitor scrolling everything into view. */
function scrollIntoView() {
    observerState.onScreen = true;
    for (const { cb, el, self } of observerState.pending.splice(0)) {
        cb([{ target: el, isIntersecting: true }], self);
    }
}

/** Mount the markup, stub fetch with `payload`, run the widget, settle. */
async function boot(payload = PAYLOAD, { ok = true, url = 'http://localhost/www-rag/', onScreen = true } = {}) {
    window.history.replaceState({}, '', url);
    document.body.innerHTML = MARKUP;
    stubDownloadPlumbing();
    installObserver(onScreen);
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        text: async () => JSON.stringify(payload),
    });
    // eslint-disable-next-line no-eval
    eval(SOURCE);
    // fetch -> text -> JSON.parse -> render
    for (let i = 0; i < 6; i++) await Promise.resolve();
}

const $ = (id) => document.getElementById(id);
const countText = () => $('www-rag-count').textContent;
const hostsInOrder = () =>
    [...document.querySelectorAll('.www-rag-card-host')].map((n) => n.textContent);
const rowHosts = () =>
    [...document.querySelectorAll('.www-rag-row-host')].map((n) => n.textContent);
const search = (value) => {
    $('www-rag-search').value = value;
    $('www-rag-search').dispatchEvent(new Event('input', { bubbles: true }));
};
const choose = (id, value) => {
    $(id).value = value;
    $(id).dispatchEvent(new Event('change', { bubbles: true }));
};
const showTable = () => document.querySelector('[data-www-rag-view="table"]').click();
const sortHeader = (label) =>
    [...document.querySelectorAll('.www-rag-sort-btn')]
        .find((b) => b.textContent.indexOf(label) === 0)
        .click();
const params = () => new URLSearchParams(window.location.search);

describe('www-rag directory', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
    });

    describe('loading the catalogue', () => {
        test('renders every site and reveals the toolbar', async () => {
            await boot();

            expect($('www-rag-toolbar').hidden).toBe(false);
            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(SITES.length);
            expect(countText()).toBe('9 sites');
            expect($('www-rag-status').className).toContain('hidden');
            expect($('www-rag-stats').textContent).toContain('9 curated sites');
            expect($('www-rag-stats').textContent).toContain('3,634 pages');
        });

        test('a failed request explains itself and leaves the toolbar hidden', async () => {
            await boot(PAYLOAD, { ok: false });

            expect($('www-rag-status').textContent).toContain("Couldn't load the directory");
            expect($('www-rag-toolbar').hidden).toBe(true);
            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(0);
        });

        test('domain options are pruned to the TLDs the catalogue actually has', async () => {
            await boot();

            const values = [...$('www-rag-filter-tld').options].map((o) => o.value);
            expect(values).toEqual(['', 'com', 'org', 'gov', 'edu', 'io', 'other']);
            // .ai / .net / .co / .dev would have been guaranteed-empty filters.
            expect(values).not.toContain('net');
        });
    });

    describe('search and filters', () => {
        test('search matches host, title and description', async () => {
            await boot();

            search('epsilon');
            expect(countText()).toBe('1 of 9 sites');
            expect(hostsInOrder()).toEqual(['epsilon.io']);

            search('handbook'); // description only
            expect(hostsInOrder()).toEqual(['epsilon.io']);

            search('GAMMA-EDU'); // title, case-insensitive
            expect(hostsInOrder()).toEqual(['gamma.edu']);
        });

        test('the domain filter buckets anything unlisted into "other"', async () => {
            await boot();

            choose('www-rag-filter-tld', 'org');
            expect(hostsInOrder().sort()).toEqual(['beta.org', 'sheet.org']);

            choose('www-rag-filter-tld', 'other');
            expect(hostsInOrder().sort()).toEqual(['constructor', 'theta.example.museum']);
        });

        test('the status filter separates chat, claim and their negatives', async () => {
            await boot();

            choose('www-rag-filter-status', 'nochat');
            expect(hostsInOrder()).toEqual(['delta.com']);

            choose('www-rag-filter-status', 'chat');
            expect(countText()).toBe('8 of 9 sites');
            expect(hostsInOrder()).not.toContain('delta.com');

            choose('www-rag-filter-status', 'claimed');
            expect(hostsInOrder()).toEqual(['beta.org']);

            choose('www-rag-filter-status', 'unclaimed');
            expect(countText()).toBe('8 of 9 sites');
        });

        test('the content filter splits sites that carry documents', async () => {
            await boot();

            choose('www-rag-filter-docs', 'files');
            expect(hostsInOrder().sort()).toEqual(['beta.org', 'epsilon.io', 'theta.example.museum']);

            choose('www-rag-filter-docs', 'pages');
            expect(countText()).toBe('6 of 9 sites');
        });

        test('filters compose with the search box', async () => {
            await boot();

            search('a'); // matches most rows
            choose('www-rag-filter-tld', 'gov');
            expect(hostsInOrder()).toEqual(['alpha.gov']);
        });

        test('no matches says so and disables the export', async () => {
            await boot();

            search('nothing-matches-this');
            expect($('www-rag-status').textContent).toContain('No sites match');
            expect($('www-rag-export').disabled).toBe(true);
            expect(countText()).toBe('0 of 9 sites');
        });

        test('reset clears the query, all three filters and the sort', async () => {
            await boot();

            search('beta');
            choose('www-rag-filter-tld', 'org');
            choose('www-rag-filter-status', 'claimed');
            $('www-rag-reset').click();

            expect($('www-rag-search').value).toBe('');
            expect(countText()).toBe('9 sites');
            expect($('www-rag-sort').value).toBe('chunkCount:desc');
            expect(params().toString()).toBe('');
        });
    });

    describe('sorting', () => {
        test('defaults to most chunks first', async () => {
            await boot();
            expect(hostsInOrder()[0]).toBe('epsilon.io');
        });

        test('sites with no measured value sort last in BOTH directions', async () => {
            // gamma.edu and constructor have chunkCount null. "Unknown" is not
            // "zero": ascending must not lead with them.
            await boot();

            choose('www-rag-sort', 'chunkCount:desc');
            expect(hostsInOrder().slice(-2).sort()).toEqual(['constructor', 'gamma.edu']);

            showTable();
            sortHeader('Chunks'); // desc -> asc
            expect($('www-rag-sort').value).toBe('');
            expect(rowHosts()[0]).toBe('delta.com'); // the smallest REAL count (5)
            expect(rowHosts().slice(-2).sort()).toEqual(['constructor', 'gamma.edu']);
        });

        test('ties break on host so the order never shuffles between renders', async () => {
            await boot();

            choose('www-rag-sort', 'fileCount:desc');
            const first = hostsInOrder();
            search(''); // force a re-render with the same inputs
            expect(hostsInOrder()).toEqual(first);
            // The six sites with fileCount 0 are alphabetical among themselves.
            const zeroes = first.slice(3);
            expect(zeroes).toEqual([...zeroes].sort());
        });

        test('a header click toggles direction and mirrors into the select', async () => {
            await boot();
            showTable();

            sortHeader('Pages'); // new key -> its default direction (desc)
            expect($('www-rag-sort').value).toBe('pageCount:desc');
            expect(rowHosts()[0]).toBe('epsilon.io');

            sortHeader('Pages'); // same key -> flip
            expect(rowHosts()[0]).toBe('constructor'); // 0 pages
            // pageCount:asc has no option, so the select shows "Custom order"
            // rather than silently blanking.
            expect($('www-rag-sort').value).toBe('');
            expect($('www-rag-sort').selectedOptions[0].textContent).toBe('Custom order');
        });

        test('aria-sort marks only the active column', async () => {
            await boot();
            showTable();
            sortHeader('Pages');

            const sorts = [...document.querySelectorAll('.www-rag-table th')].map((th) =>
                th.getAttribute('aria-sort')
            );
            expect(sorts.filter((s) => s === 'descending')).toHaveLength(1);
            expect(sorts.filter((s) => s === 'none')).toHaveLength(5);
        });
    });

    describe('table view', () => {
        test('renders one row per visible site with an accessible wrapper', async () => {
            await boot();
            showTable();

            expect(document.querySelectorAll('.www-rag-table tbody tr')).toHaveLength(9);
            const wrap = document.querySelector('.www-rag-table-wrap');
            expect(wrap.getAttribute('role')).toBe('region');
            expect(wrap.getAttribute('tabindex')).toBe('0');
            expect(wrap.getAttribute('aria-label')).toBeTruthy();
        });

        test('the actions column is named for screen readers, not on screen', async () => {
            await boot();
            showTable();

            const last = [...document.querySelectorAll('.www-rag-table th')].pop();
            expect(last.textContent).toBe('Actions');
            expect(last.querySelector('.sr-only')).not.toBeNull();
        });

        test('status chips state chat and claim independently', async () => {
            await boot();
            showTable();

            const chip = (host) => {
                const row = [...document.querySelectorAll('.www-rag-table tbody tr')].find(
                    (r) => r.querySelector('.www-rag-row-host').textContent === host
                );
                return row.querySelector('.www-rag-row-status').textContent;
            };
            expect(chip('beta.org')).toBe('LiveClaimed'); // claimed AND chat-enabled
            expect(chip('delta.com')).toBe('No chat');
            // A site with documents still reads as Live — the "Docs" chip used
            // to pre-empt it, and the Files column already carries that fact.
            expect(chip('epsilon.io')).toBe('Live');
        });

        test('unmeasured counts render as an em dash, never as zero', async () => {
            await boot();
            showTable();

            const row = [...document.querySelectorAll('.www-rag-table tbody tr')].find(
                (r) => r.querySelector('.www-rag-row-host').textContent === 'gamma.edu'
            );
            const cells = [...row.querySelectorAll('td')].map((c) => c.textContent);
            expect(cells[2]).toBe('20'); // pages
            expect(cells[4]).toBe('—'); // chunks: null
            expect(cells[5]).toBe('—'); // size: null
        });
    });

    describe('URL state', () => {
        test('every control is mirrored into the query string', async () => {
            await boot();

            search('beta');
            choose('www-rag-filter-tld', 'org');
            choose('www-rag-filter-status', 'claimed');
            choose('www-rag-filter-docs', 'files');
            choose('www-rag-sort', 'host:asc');
            showTable();

            const p = params();
            expect(p.get('q')).toBe('beta');
            expect(p.get('tld')).toBe('org');
            expect(p.get('status')).toBe('claimed');
            expect(p.get('docs')).toBe('files');
            expect(p.get('sort')).toBe('host:asc');
            expect(p.get('view')).toBe('table');
        });

        test('the default sort and the cards view stay out of the URL', async () => {
            await boot();

            search('beta');
            expect(params().get('sort')).toBeNull();
            expect(params().get('view')).toBeNull();
        });

        test('a deep link restores search, filters, sort and view', async () => {
            await boot(PAYLOAD, {
                url: 'http://localhost/www-rag/?q=o&tld=org&sort=host:asc&view=table',
            });

            expect($('www-rag-search').value).toBe('o');
            expect($('www-rag-filter-tld').value).toBe('org');
            expect($('www-rag-sort').value).toBe('host:asc');
            expect(rowHosts()).toEqual(['beta.org', 'sheet.org']);
        });

        test('the legacy ?search= alias is honoured and folded into ?q=', async () => {
            await boot(PAYLOAD, { url: 'http://localhost/www-rag/?search=epsilon' });

            expect($('www-rag-search').value).toBe('epsilon');
            search('epsilon'); // any interaction rewrites the URL
            expect(params().get('search')).toBeNull();
            expect(params().get('q')).toBe('epsilon');
        });

        test('an unknown sort key in the URL is ignored, not applied', async () => {
            await boot(PAYLOAD, { url: 'http://localhost/www-rag/?sort=__proto__:asc' });

            expect($('www-rag-sort').value).toBe('chunkCount:desc');
            expect(hostsInOrder()[0]).toBe('epsilon.io');
        });

        test('a filter value that is not an option is ignored', async () => {
            await boot(PAYLOAD, { url: 'http://localhost/www-rag/?status=anything' });

            expect($('www-rag-filter-status').value).toBe('');
            expect(countText()).toBe('9 sites');
        });

        test('a domain filter with no sites left drops out of the URL too', async () => {
            // ".net" is pruned because no site has it; the URL must not keep
            // claiming a filter the page is no longer applying.
            await boot(PAYLOAD, { url: 'http://localhost/www-rag/?tld=net' });

            expect($('www-rag-filter-tld').value).toBe('');
            expect(params().get('tld')).toBeNull();
            expect(countText()).toBe('9 sites');
        });
    });

    describe('CSV export', () => {
        const rows = () => capturedCsv.trim().split('\r\n');
        const cells = (row) => row.split('","').map((c) => c.replace(/^"|"$/g, ''));

        test('exports every visible row with a header and a UTF-8 BOM', async () => {
            await boot();
            $('www-rag-export').click();

            expect(capturedCsv.charCodeAt(0)).toBe(0xfeff);
            expect(rows()).toHaveLength(10); // header + 9 sites
            expect(rows()[0]).toContain('"Host","Title","Description"');
            expect(capturedDownload).toBe('divinci-www-rag-directory.csv');
        });

        test('the export follows the current filter and sort, and says so', async () => {
            await boot();
            choose('www-rag-filter-tld', 'org');
            choose('www-rag-sort', 'host:asc');

            expect($('www-rag-export').textContent).toBe('Export CSV (2)');
            $('www-rag-export').click();

            const body = rows().slice(1);
            expect(body).toHaveLength(2);
            expect(cells(body[0])[0]).toContain('beta.org');
            expect(cells(body[1])[0]).toContain('sheet.org');
        });

        test('a description Excel would execute is neutralised', async () => {
            await boot();
            search('sheet.org');
            $('www-rag-export').click();

            const row = rows()[1];
            // The apostrophe forces Excel and Sheets to treat it as text.
            expect(row).toContain(`"'=cmd|'/c calc'!A1"`);
            expect(row).not.toContain('"=cmd');
        });

        test('quotes inside a value are doubled, not left to break the row', async () => {
            await boot({
                ...PAYLOAD,
                sites: [{ ...SITES[0], description: 'He said "hello", loudly' }],
            });
            $('www-rag-export').click();

            expect(rows()[1]).toContain('"He said ""hello"", loudly"');
            expect(rows()).toHaveLength(2); // still one row, not two
        });

        test('unmeasured values export empty rather than as zero', async () => {
            await boot();
            search('gamma.edu');
            $('www-rag-export').click();

            const c = cells(rows()[1]);
            expect(c[3]).toBe('20'); // pages
            expect(c[5]).toBe(''); // chunks: null, NOT "0"
            expect(c[6]).toBe(''); // bytes: null
        });

        test('booleans and derived links are written in full', async () => {
            await boot();
            search('beta.org');
            $('www-rag-export').click();

            const row = rows()[1];
            expect(row).toContain('"yes"'); // chat-enabled / claimed
            expect(row).toContain('https://chat.divinci.app/ai-release/rel-beta');
        });
    });

    describe('untrusted site data', () => {
        test('titles and descriptions are written as text, never parsed as markup', async () => {
            await boot();

            expect(document.querySelector('script[src="x"]')).toBeNull();
            expect(document.querySelectorAll('img[onerror]')).toHaveLength(0);
            const card = [...document.querySelectorAll('.www-rag-card')].find((c) =>
                c.textContent.includes('evil.com')
            );
            expect(card.textContent).toContain('<img src=x onerror=');
        });

        test('the same holds in the table view', async () => {
            await boot();
            showTable();

            expect(document.querySelectorAll('img[onerror]')).toHaveLength(0);
            expect(document.body.innerHTML).not.toContain('<script>alert');
        });

        test('a host that is not a hostname gets no origin favicon request', async () => {
            await boot();

            // "constructor" has no dot, so https://constructor/favicon.ico is
            // not a thing we should ever ask for.
            const srcs = [...document.querySelectorAll('.www-rag-card-favicon-img')].map(
                (i) => i.getAttribute('src')
            );
            expect(srcs.some((s) => s && s.includes('constructor'))).toBe(false);
            expect(srcs).toContain('https://gamma.edu/favicon.ico');
            expect(srcs).toContain('https://cdn.example/epsilon.png');
        });

        test('a host that collides with Object.prototype is not confused for a cached icon', async () => {
            await boot();

            const card = [...document.querySelectorAll('.www-rag-card')].find((c) =>
                c.textContent.includes('constructor')
            );
            expect(card.querySelector('.www-rag-card-monogram')).not.toBeNull();
            expect(card.querySelector('.www-rag-card-monogram').tagName).toBe('SPAN');
        });

        test('an icon URL the crawled site chose is vetted before it is fetched', async () => {
            // faviconUrl comes from the crawled page's own <link rel="icon">,
            // so the listed site picks it. An unvetted value lets any site in
            // the directory beacon every visitor's browser.
            const hostile = [
                'javascript:alert(1)',
                'data:image/svg+xml,<svg onload="alert(1)"></svg>',
                'http://tracker.example/beacon.gif', // downgrade
                '//tracker.example/beacon.gif', // protocol-relative
                '/local/path.png', // relative, would resolve to our origin
                { toString: () => 'https://tracker.example/x.png' }, // not a string
            ];
            await boot({
                ...PAYLOAD,
                sites: hostile.map((faviconUrl, i) => ({
                    ...SITES[4], // delta.com: no origin fallback of its own worth confusing
                    host: `h${i}.example`,
                    faviconUrl,
                })),
            });

            const srcs = [...document.querySelectorAll('.www-rag-card-favicon-img')].map((i) =>
                i.getAttribute('src')
            );
            expect(srcs.some((s) => s && s.includes('tracker.example'))).toBe(false);
            expect(srcs.some((s) => s && s.startsWith('javascript:'))).toBe(false);
            expect(srcs.some((s) => s && s.startsWith('data:'))).toBe(false);
            // Each row still falls back to its own origin icon, which IS vetted.
            expect(srcs).toContain('https://h0.example/favicon.ico');
        });

        test('a valid https icon is still used', async () => {
            await boot();
            const srcs = [...document.querySelectorAll('.www-rag-card-favicon-img')].map((i) =>
                i.getAttribute('src')
            );
            expect(srcs).toContain('https://cdn.example/epsilon.png');
        });

        test('outbound action links cannot reach the opener', async () => {
            await boot();

            const links = [...document.querySelectorAll('.www-rag-card-action')];
            expect(links.length).toBeGreaterThan(0);
            for (const a of links) {
                expect(a.target).toBe('_blank');
                expect(a.rel).toContain('noopener');
                expect(a.href.startsWith('https://chat.divinci.app/')).toBe(true);
            }
        });
    });

    describe('drawing a catalogue that keeps growing', () => {
        // The corpus is continuous and self-feeding — 221 sites in July, 472
        // in August. These assert the separation that keeps that survivable:
        // `visible` is the answer to the query, and how much of it has been
        // drawn is a rendering detail nothing else may depend on.
        const many = (n) => ({
            ...PAYLOAD,
            totalSites: n,
            sites: Array.from({ length: n }, (_, i) => ({
                ...SITES[3],
                host: `site-${String(i).padStart(4, '0')}.gov`,
                title: `site ${i}`,
                description: `site number ${i}`,
                chunkCount: n - i,
            })),
        });

        test('only the first chunk is drawn before the visitor scrolls', async () => {
            await boot(many(300), { onScreen: false });

            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(120);
            // …but the page reports the size of the RESULT, not of the DOM.
            expect(countText()).toBe('300 sites');
            expect($('www-rag-export').textContent).toBe('Export CSV (300)');
        });

        test('scrolling tops the list up to the full result', async () => {
            await boot(many(300), { onScreen: false });
            scrollIntoView();

            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(300);
        });

        test('the export covers every match, not just what has been drawn', async () => {
            await boot(many(300), { onScreen: false });
            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(120);

            $('www-rag-export').click();
            expect(capturedCsv.trim().split('\r\n')).toHaveLength(301); // header + 300
        });

        test('the table view is drawn in chunks too', async () => {
            await boot(many(300), { onScreen: false });
            showTable();

            expect(document.querySelectorAll('.www-rag-table tbody tr')).toHaveLength(120);
            // One header, whatever the row count.
            expect(document.querySelectorAll('.www-rag-table thead tr')).toHaveLength(1);
            scrollIntoView();
            expect(document.querySelectorAll('.www-rag-table tbody tr')).toHaveLength(300);
        });

        test('filtering redraws from the top rather than appending', async () => {
            await boot(many(300), { onScreen: false });
            scrollIntoView();
            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(300);

            search('site-0007'); // an exact host, not a numeric prefix
            expect(hostsInOrder()).toEqual(['site-0007.gov']);
            expect(countText()).toBe('1 of 300 sites');
        });

        test('sorting still orders the whole result, not just the drawn part', async () => {
            await boot(many(300), { onScreen: false });
            choose('www-rag-sort', 'host:desc');

            // The last host by name must be first even though it was never
            // in the first chunk of the previous order.
            expect(hostsInOrder()[0]).toBe('site-0299.gov');
        });

        test('without IntersectionObserver the whole list is drawn at once', async () => {
            document.body.innerHTML = MARKUP;
            stubDownloadPlumbing();
            delete global.IntersectionObserver;
            global.fetch = jest.fn().mockResolvedValue({
                ok: true, status: 200, text: async () => JSON.stringify(many(300)),
            });
            // eslint-disable-next-line no-eval
            eval(SOURCE);
            for (let i = 0; i < 6; i++) await Promise.resolve();

            expect(document.querySelectorAll('.www-rag-card')).toHaveLength(300);
            expect(document.querySelectorAll('.www-rag-card-favicon-img[src]')).toHaveLength(300);
        });
    });

    describe('what the visitor never sees is never fetched', () => {
        test('a row that was never scrolled to makes no request to its host', async () => {
            await boot(PAYLOAD, { onScreen: false });

            const withSrc = [...document.querySelectorAll('.www-rag-card-favicon-img')].filter(
                (i) => i.getAttribute('src')
            );
            expect(withSrc).toHaveLength(0);
            // The monogram is already there, so there is no empty box either.
            expect(document.querySelectorAll('.www-rag-card-monogram').length).toBeGreaterThan(0);
        });

        test('the icon loads as soon as the row comes into view', async () => {
            await boot(PAYLOAD, { onScreen: false });
            scrollIntoView();

            const srcs = [...document.querySelectorAll('.www-rag-card-favicon-img')].map((i) =>
                i.getAttribute('src')
            );
            expect(srcs).toContain('https://gamma.edu/favicon.ico');
            expect(srcs).toContain('https://cdn.example/epsilon.png');
        });
    });

    describe('re-rendering', () => {
        test('a favicon is requested once per host, not once per keystroke', async () => {
            await boot();

            const first = document.querySelector('.www-rag-card-favicon');
            search('e');
            search('ep');
            search('');
            // Same element, moved back into the new tree — so no second
            // request, and a decoded icon never flickers back to its monogram.
            expect(document.querySelector('.www-rag-card-favicon')).toBe(first);
        });
    });
});
