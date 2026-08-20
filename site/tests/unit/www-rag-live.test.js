/**
 * Unit tests for the live crawl strip (static/js/www-rag-live.js).
 *
 * The real file is loaded and evaluated against jsdom rather than
 * reimplemented here, so a change to the renderer is actually covered.
 */
const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(
    path.join(__dirname, '../../static/js/www-rag-live.js'),
    'utf8'
);

const MARKUP = `
<div id="www-rag-live" hidden>
  <div class="www-rag-live-head">
    <span id="www-rag-live-dot"></span>
    <span id="www-rag-live-headline"></span>
    <span id="www-rag-live-detail"></span>
  </div>
  <div id="www-rag-live-inflight" hidden></div>
  <div id="www-rag-live-recent" hidden></div>
</div>`;

/** Mount the markup, stub fetch with `payload`, run the widget, settle. */
async function boot(payload, { ok = true } = {}) {
    document.body.innerHTML = MARKUP;
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 500,
        text: async () => JSON.stringify(payload),
    });
    // eslint-disable-next-line no-eval
    eval(SOURCE);
    // Let the fetch promise chain resolve (fetch -> text -> render).
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

const $ = (id) => document.getElementById(id);
const root = () => $('www-rag-live');

describe('www-rag live crawl strip', () => {
    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        delete global.fetch;
    });

    describe('honesty about what is actually running', () => {
        test('renders a live crawl with progress and in-flight hosts', async () => {
            await boot({
                state: 'crawling',
                stale: false,
                ageSeconds: 8,
                seeds: 62,
                seedsTruncated: false,
                done: 41,
                sitesThisPass: 27,
                inFlight: ['kubernetes.io', 'huggingface.co'],
                recent: [{ host: 'pydata.org', pages: 118, chunks: 2456 }],
            });

            expect(root().hidden).toBe(false);
            expect(root().getAttribute('data-state')).toBe('crawling');
            expect($('www-rag-live-headline').textContent).toBe('Crawling now');
            // NOT "41 of 62 sites this pass", which this test used to pin.
            // `done` (41) is a tombstone set, `seeds` (62) is the remaining
            // queue — disjoint sets, so "X of Y" was never progress through Y.
            expect($('www-rag-live-detail').textContent).toBe('27 sites in the last 24h · 62 queued');
            expect($('www-rag-live-inflight').textContent).toContain('kubernetes.io');
            expect($('www-rag-live-recent').textContent).toContain('pydata.org');
            expect($('www-rag-live-recent').textContent).toContain('2,456 chunks');
        });

        test('a truncated queue count is shown as a floor, not as a number', async () => {
            // The bug this replaced: on 2026-08-20 the page read "5,509 of
            // 5,509 sites this pass" because BOTH counters had hit the
            // worker's 5,000-key listing cap. Two independently-counted
            // prefixes printing the same figure is the signature of
            // truncation — the value was where counting stopped, not a count.
            await boot({
                state: 'crawling', stale: false, ageSeconds: 8,
                seeds: 5509, seedsTruncated: true, done: 5509,
                sitesThisPass: 1139,
                inFlight: ['kubernetes.io'], recent: [],
            });

            const detail = $('www-rag-live-detail').textContent;
            expect(detail).toBe('1,139 sites in the last 24h · 5,509+ queued');
            expect(detail).not.toContain('of 5,509');
            expect(detail).not.toContain('this pass');
        });

        test('a worker too old to report truncation still never fabricates an exact count', async () => {
            // An absent flag is unknown, not false. During a rollout the page
            // is fed by whichever worker version answered, and a count shown
            // as slightly-too-cautious is recoverable where a fabricated one
            // is not.
            await boot({
                state: 'crawling', stale: false, ageSeconds: 8,
                seeds: 5509, done: 5509, sitesThisPass: 1139,
                inFlight: ['kubernetes.io'], recent: [],
            });

            expect($('www-rag-live-detail').textContent).toBe('1,139 sites in the last 24h · 5,509+ queued');
        });

        test('the queue is omitted entirely rather than shown as zero', async () => {
            await boot({
                state: 'crawling', stale: false, ageSeconds: 8,
                seeds: 0, seedsTruncated: false, done: 12, sitesThisPass: 40,
                inFlight: ['kubernetes.io'], recent: [],
            });

            expect($('www-rag-live-detail').textContent).toBe('40 sites in the last 24h');
        });

        test('an offline snapshot never shows a live-crawl animation', async () => {
            // The endpoint downgrades stale records; the strip must follow it
            // rather than keep animating on the last reported state.
            await boot({ state: 'offline', reportedState: 'crawling', stale: true, ageSeconds: 7200 });

            expect($('www-rag-live-headline').textContent).toBe('Crawler offline');
            expect($('www-rag-live-dot').className).toContain('www-rag-live-dot-offline');
            expect($('www-rag-live-dot').className).not.toContain('crawling');
            expect($('www-rag-live-detail').textContent).toBe('last active 2h ago');
        });

        test('in-flight hosts are hidden outside the crawl phase', async () => {
            // started−completed is meaningless once crawling ends; rendering it
            // would claim we are fetching sites that finished long ago.
            await boot({
                state: 'publishing',
                ageSeconds: 5,
                inFlight: ['kubernetes.io'],
                recent: [{ host: 'pydata.org', pages: 3, chunks: 9 }],
            });
            expect($('www-rag-live-inflight').hidden).toBe(true);
            expect($('www-rag-live-recent').hidden).toBe(false);
        });

        test('the whole strip stays hidden when nothing has ever been reported', async () => {
            await boot({ state: 'offline', stale: true, ageSeconds: null });
            expect(root().hidden).toBe(true);
        });

        test('an unknown future state degrades to offline, not to a blank label', async () => {
            await boot({ state: 'teleporting', ageSeconds: 4 });
            expect(root().getAttribute('data-state')).toBe('offline');
            expect($('www-rag-live-headline').textContent).toBe('Crawler offline');
        });
    });

    describe('idle state', () => {
        test('counts down to the next pass', async () => {
            await boot({
                state: 'idle',
                ageSeconds: 12,
                nextPassAt: Date.now() + 72 * 60 * 1000,
                recent: [{ host: 'arxiv.org', pages: 25, chunks: 872 }],
            });
            expect($('www-rag-live-headline').textContent).toBe('Idle between passes');
            expect($('www-rag-live-detail').textContent).toBe('next pass in 1h 12m');
            expect($('www-rag-live-recent').textContent).toContain('Last indexed');
        });

        test('an overdue pass reads as imminent, not as negative time', async () => {
            await boot({ state: 'idle', ageSeconds: 12, nextPassAt: Date.now() - 240000 });
            expect($('www-rag-live-detail').textContent).toBe('next pass starting');
        });
    });

    describe('untrusted content', () => {
        test('hostnames are written as text, never parsed as markup', async () => {
            // The endpoint drops non-DNS hosts, but this is the second line of
            // defence: even if one got through it must not become an element.
            await boot({
                state: 'crawling',
                ageSeconds: 3,
                inFlight: ['<img src=x onerror=alert(1)>'],
                recent: [{ host: '<script>alert(1)</script>', pages: 1, chunks: 1 }],
            });
            expect(document.querySelector('#www-rag-live img')).toBeNull();
            expect(document.querySelector('#www-rag-live script')).toBeNull();
            expect($('www-rag-live-inflight').textContent).toContain('<img src=x');
        });

        test('a malformed recent entry is skipped rather than crashing the strip', async () => {
            await boot({
                state: 'crawling',
                ageSeconds: 3,
                recent: [{ nope: true }, { host: 'good.example.com', pages: 2, chunks: 4 }],
            });
            expect($('www-rag-live-recent').textContent).toContain('good.example.com');
            expect($('www-rag-live-recent').querySelectorAll('li').length).toBe(1);
        });

        test('a site with no new pages says so instead of showing a bare host', async () => {
            await boot({ state: 'crawling', ageSeconds: 3, recent: [{ host: 'usa.gov' }] });
            expect($('www-rag-live-recent').textContent).toContain('no new pages');
        });

        test('an unchanged site reads as "no new pages", not "0 pages · 0 chunks"', async () => {
            // The crawl is incremental; zeroes are the normal re-visit result,
            // and rendering them as counts makes a healthy pass look broken.
            await boot({
                state: 'crawling',
                ageSeconds: 3,
                recent: [{ host: 'discuss.pytorch.org', pages: 0, chunks: 0 }],
            });
            expect($('www-rag-live-recent').textContent).toContain('no new pages');
            expect($('www-rag-live-recent').textContent).not.toContain('0 pages');
        });

        test('counts are pluralised on both units', async () => {
            await boot({
                state: 'crawling',
                ageSeconds: 3,
                recent: [{ host: 'pypi.org', pages: 1, chunks: 1 }, { host: 'nasa.gov', pages: 2, chunks: 5 }],
            });
            var text = $('www-rag-live-recent').textContent;
            expect(text).toContain('1 page · 1 chunk');
            expect(text).not.toContain('1 pages');
            expect(text).not.toContain('1 chunks');
            expect(text).toContain('2 pages · 5 chunks');
        });
    });

    describe('failure handling', () => {
        test('a failed request leaves the last good render in place', async () => {
            // A network blip must not flip a healthy "Crawling now" to offline.
            document.body.innerHTML = MARKUP;
            global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
            jest.spyOn(console, 'warn').mockImplementation(() => {});
            // eslint-disable-next-line no-eval
            eval(SOURCE);
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(root().hidden).toBe(true); // never rendered, so still hidden
            expect(console.warn).toHaveBeenCalled();
            console.warn.mockRestore();
        });

        test('a non-2xx response is treated as a failure, not as data', async () => {
            jest.spyOn(console, 'warn').mockImplementation(() => {});
            await boot({ state: 'crawling' }, { ok: false });
            expect($('www-rag-live-headline').textContent).toBe('');
            console.warn.mockRestore();
        });
    });
});
