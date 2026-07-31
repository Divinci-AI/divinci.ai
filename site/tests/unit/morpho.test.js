/**
 * Unit tests for the morpho glyph core (static/js/morpho.js).
 *
 * The real file is loaded and evaluated against jsdom rather than
 * reimplemented, so a change to the generator is actually covered.
 */
const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(path.join(__dirname, '../../static/js/morpho.js'), 'utf8');

/** jsdom has no canvas backend, so stand in a recording 2D context. */
function stubCanvas() {
    const calls = { strokeRect: 0, arc: 0, fill: 0, clearRect: 0, alphas: [] };
    const ctx = {
        set globalAlpha(v) { calls.alphas.push(v); },
        get globalAlpha() { return 1; },
        lineWidth: 1,
        strokeStyle: '',
        fillStyle: '',
        clearRect: () => { calls.clearRect++; },
        strokeRect: () => { calls.strokeRect++; },
        beginPath: () => {},
        arc: () => { calls.arc++; },
        fill: () => { calls.fill++; },
    };
    const canvas = { width: 0, height: 0, style: {}, getContext: () => ctx, setAttribute: () => {} };
    return { canvas, calls };
}

function load({ reducedMotion = false } = {}) {
    window.matchMedia = jest.fn().mockImplementation(q => ({
        matches: reducedMotion && q.indexOf('reduce') !== -1,
        media: q, addListener: jest.fn(), removeListener: jest.fn(),
        addEventListener: jest.fn(), removeEventListener: jest.fn(),
    }));
    window.requestAnimationFrame = jest.fn(() => 1);
    delete window.DivinciMorpho;
    // eslint-disable-next-line no-eval
    eval(SOURCE);
    return window.DivinciMorpho;
}

describe('morpho glyph core', () => {
    afterEach(() => { delete window.DivinciMorpho; });

    describe('structure is a pure function of the hostname', () => {
        test('the same host always grows the same structure', () => {
            const m = load();
            const a = m._buildStructure('kubernetes.io');
            const b = m._buildStructure('kubernetes.io');
            expect(a.cells).toEqual(b.cells);
            expect(a.seams).toEqual(b.seams);
        });

        test('reloading the page does not reshuffle a site glyph', () => {
            const first = load()._buildStructure('docs.python.org');
            const second = load()._buildStructure('docs.python.org');
            expect(second.cells).toEqual(first.cells);
        });

        test('different hosts get visibly different structures', () => {
            const m = load();
            const hosts = ['kubernetes.io', 'huggingface.co', 'pytorch.org', 'arxiv.org', 'nejm.org'];
            const shapes = hosts.map(h => JSON.stringify(m._buildStructure(h).cells));
            expect(new Set(shapes).size).toBe(hosts.length);
        });

        test('no host ever renders as a bare undivided cell', () => {
            // Regression: generation N only considers leaves from N-1, so when
            // the first split was left to chance a failed roll (28% of hosts)
            // froze the structure at one cell forever — and every such host
            // drew the same empty box. Sample widely; this must never recur.
            const m = load();
            for (let i = 0; i < 400; i++) {
                const { leaves } = m._buildStructure(`site${i}.example${i % 7}.org`);
                expect(leaves.length).toBeGreaterThanOrEqual(4);
            }
        });

        test('a realistic set of crawled hosts is all-distinct', () => {
            const m = load();
            const hosts = [
                'kubernetes.io', 'huggingface.co', 'pytorch.org', 'arxiv.org', 'nejm.org',
                'clinicaltrials.gov', 'britannica.com', 'archive.org', 'usa.gov',
                'pubmed.ncbi.nlm.nih.gov', 'docs.python.org', 'wiki.python.org',
            ];
            const shapes = hosts.map(h => JSON.stringify(m._buildStructure(h).cells));
            expect(new Set(shapes).size).toBe(hosts.length);
        });

        test('near-identical hostnames still diverge', () => {
            // FNV-1a avalanches, so a one-character difference must not
            // produce a near-identical glyph.
            const m = load();
            const a = JSON.stringify(m._buildStructure('docs.python.org').cells);
            const b = JSON.stringify(m._buildStructure('docs.python.com').cells);
            expect(a).not.toEqual(b);
        });
    });

    describe('generated structure is well formed', () => {
        test('no cell escapes the unit square', () => {
            const m = load();
            for (const host of ['kubernetes.io', 'a.co', 'pubmed.ncbi.nlm.nih.gov']) {
                for (const c of m._buildStructure(host).cells) {
                    expect(c.x).toBeGreaterThanOrEqual(0);
                    expect(c.y).toBeGreaterThanOrEqual(0);
                    expect(c.x + c.w).toBeLessThanOrEqual(1.0001);
                    expect(c.y + c.h).toBeLessThanOrEqual(1.0001);
                    expect(c.w).toBeGreaterThan(0);
                    expect(c.h).toBeGreaterThan(0);
                }
            }
        });

        test('the tiling is complete at EVERY growth level, not just the last', () => {
            // Regression: the structure used to keep only final leaves, so
            // drawing a partially-grown glyph skipped every region that went
            // on to subdivide — the parent covering it no longer existed and
            // the glyph rendered full of holes. Cells alive at generation g
            // (born <= g < died) must always partition the square exactly.
            const m = load();
            for (let i = 0; i < 120; i++) {
                const { cells } = m._buildStructure(`site${i}.example.org`);
                for (let g = 0; g <= 4; g++) {
                    const alive = cells.filter(c => c.born <= g && c.died > g);
                    expect(alive.length).toBeGreaterThan(0);
                    expect(alive.reduce((s, c) => s + c.w * c.h, 0)).toBeCloseTo(1, 9);
                }
            }
        });

        test('every seam belongs to a real generation', () => {
            const m = load();
            const { seams } = m._buildStructure('kubernetes.io');
            for (const s of seams) {
                expect(s.gen).toBeGreaterThanOrEqual(1);
                expect(s.gen).toBeLessThanOrEqual(4);
            }
        });

        test('an empty hostname still produces a drawable structure', () => {
            const m = load();
            const { cells } = m._buildStructure('');
            expect(cells.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('growth reflects how much was actually indexed', () => {
        test('more pages means a more complex glyph', () => {
            const m = load();
            expect(m.growthForPages(500)).toBeGreaterThan(m.growthForPages(50));
            expect(m.growthForPages(50)).toBeGreaterThan(m.growthForPages(5));
        });

        test('a site with nothing new still shows a seed, not an empty box', () => {
            const m = load();
            expect(m.growthForPages(0)).toBeGreaterThan(0);
            expect(m.growthForPages(0)).toBeLessThan(m.growthForPages(1));
        });

        test('growth stays within 0..1 for absurd inputs', () => {
            const m = load();
            for (const n of [0, 1, 1e6, -5, NaN, undefined, null, 'lots']) {
                const g = m.growthForPages(n);
                expect(g).toBeGreaterThanOrEqual(0);
                expect(g).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('rendering', () => {
        test('draws cells and ports onto the canvas', () => {
            const m = load();
            const { canvas, calls } = stubCanvas();
            const g = m.createGlyph(canvas, { host: 'kubernetes.io', size: 26, growth: 1 });
            expect(g).not.toBeNull();
            expect(calls.strokeRect).toBeGreaterThan(1);
            expect(calls.arc).toBeGreaterThan(0);
        });

        test('caps devicePixelRatio so a dozen glyphs stay cheap', () => {
            const original = window.devicePixelRatio;
            window.devicePixelRatio = 4;
            const m = load();
            const { canvas } = stubCanvas();
            m.createGlyph(canvas, { host: 'kubernetes.io', size: 26 });
            expect(canvas.width).toBe(52); // 26 * min(4, 2)
            window.devicePixelRatio = original;
        });

        test('an inactive glyph asks for no animation frames', () => {
            const m = load();
            const { canvas } = stubCanvas();
            const g = m.createGlyph(canvas, { host: 'arxiv.org', active: false, growth: 0.5 });
            expect(g.draw(Date.now())).toBe(false);
            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        });

        test('an active glyph animates', () => {
            const m = load();
            const { canvas } = stubCanvas();
            const g = m.createGlyph(canvas, { host: 'arxiv.org', active: true });
            expect(g.draw(Date.now())).toBe(true);
            expect(window.requestAnimationFrame).toHaveBeenCalled();
        });

        test('reduced motion renders the finished structure and never animates', () => {
            const m = load({ reducedMotion: true });
            const { canvas, calls } = stubCanvas();
            const g = m.createGlyph(canvas, { host: 'arxiv.org', active: true });
            expect(g.draw(Date.now())).toBe(false);
            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
            expect(calls.strokeRect).toBeGreaterThan(1); // still drawn, just still
        });

        test('destroy() removes the glyph from the shared loop', () => {
            const m = load();
            const a = m.createGlyph(stubCanvas().canvas, { host: 'a.example.com', active: true });
            const b = m.createGlyph(stubCanvas().canvas, { host: 'b.example.com', active: true });
            a.destroy();
            // Idempotent — the strip may release an already-released glyph.
            expect(() => a.destroy()).not.toThrow();
            expect(b.draw(Date.now())).toBe(true);
        });

        test('a canvas with no 2D context degrades instead of throwing', () => {
            const m = load();
            expect(m.createGlyph({ getContext: () => null, style: {} }, { host: 'x.co' })).toBeNull();
            expect(m.createGlyph(null, { host: 'x.co' })).toBeNull();
            expect(m.createGlyph(undefined, {})).toBeNull();
        });
    });
});
