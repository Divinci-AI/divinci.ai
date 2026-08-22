/**
 * The RAG universe caption must state the coverage of BOTH layers.
 *
 * On 2026-08-19 the map showed 1,486 sites and said "Position is embedding
 * similarity". Only 145 sites had an embedding centroid. The other 1,341 had
 * no semantic edge and no link edge, so the force layout never moved them off
 * their starting point — and that point is `hashHost(host)`, a hash of the
 * domain name.
 *
 * An arbitrary-but-stable position is indistinguishable from a meaningful one:
 * the map looked like a finished picture of the corpus while nine tenths of it
 * was decoration. The endpoint had already returned `sitesWithCentroid` and
 * the caption simply did not use it.
 *
 * The link half got this right from the start ("link data covers N of M"), so
 * these tests hold the semantic half to the same standard.
 */
const fs = require('fs');
const path = require('path');

/** Source of one top-level `function name(...) { ... }`, by brace matching. */
function extractFn(name) {
    const start = SOURCE.indexOf(`function ${name}(`);
    if (start === -1) throw new Error(`${name}() not found — did the renderer move?`);
    let depth = 0;
    for (let i = SOURCE.indexOf('{', start); i < SOURCE.length; i++) {
        if (SOURCE[i] === '{') depth++;
        else if (SOURCE[i] === '}' && --depth === 0) return SOURCE.slice(start, i + 1);
    }
    throw new Error(`${name}() is unbalanced`);
}

const SOURCE = fs.readFileSync(
    path.join(__dirname, '../../static/js/www-rag-universe.js'),
    'utf8'
);

const STATS = {
    sites: 1486,
    linkEdges: 103,
    semanticEdges: 323,
    sitesWithLinkScan: 28,
    sitesWithCentroid: 145,
};

/** Pull `describe()` out of the browser IIFE and call it directly. */
function caption(stats) {
    // Brace-matched, not regex-matched. The previous version stopped at the
    // first two-space-indented `}`, so the moment `describe` contained a
    // nested function it extracted half a function and every caption test
    // failed for a reason that had nothing to do with the captions.
    const body = [extractFn('describe'), extractFn('ago'), extractFn('freshness')].join('\n');
    // eslint-disable-next-line no-new-func
    return new Function('stats', body + '\nreturn describe(stats);')(stats);
}

describe('the universe caption', () => {
    test('states embedding coverage, not just the tie count', () => {
        const text = caption(STATS);
        expect(text).toContain('145 of 1,486');
    });

    test('states link coverage', () => {
        expect(caption(STATS)).toContain('28 of 1,486');
    });

    test('never claims position is embedding similarity without qualifying it', () => {
        // The exact sentence that was wrong for 90% of the map.
        expect(caption(STATS).toLowerCase())
            .not.toContain('position is embedding similarity');
    });

    test('says the unmapped majority carries no positional meaning', () => {
        expect(caption(STATS).toLowerCase()).toContain('no meaning');
    });

    test('scales: with every site mapped it still reports coverage honestly', () => {
        // The caption must not hardcode the shortfall either — once the
        // backfill runs, "145 of 1486" becomes "1486 of 1486" and the sentence
        // has to still read correctly rather than apologising for nothing.
        const full = caption({ ...STATS, sitesWithCentroid: 1486, sitesWithLinkScan: 1486 });
        expect(full).toContain('1,486 of 1,486');
    });

    test('a dashed node is never described as linking nowhere', () => {
        expect(caption(STATS)).toContain('not that it links nowhere');
    });
});

describe("the caption separates measured from drawn", () => {
    // The endpoint keeps only the strongest few link edges per site: the full
    // graph is ~10,545 edges, a megabyte of JSON and an unreadable hairball.
    // Reporting the DRAWN count as the finding would understate the measurement
    // by half — the same "a number without its coverage" error this caption was
    // rewritten to stop making, reintroduced by the fix for a different problem.
    const CAPPED = {
        sites: 1530, linkEdges: 5200, linkEdgesTotal: 10545, linkTopKPerSource: 6,
        semanticEdges: 1109, sitesWithLinkScan: 1065, sitesWithCentroid: 145,
    };

    test('reports the measured total, not the drawn subset', () => {
        const text = caption(CAPPED);
        expect(text).toContain('10,545 hyperlinks');
        expect(text).not.toContain('5,200 hyperlinks');
    });

    test('says the drawing is capped, and by how much', () => {
        expect(caption(CAPPED)).toContain('strongest 6 per site');
    });

    test('does not claim a cap when nothing was capped', () => {
        const uncapped = { ...CAPPED, linkEdges: 10545 };
        expect(caption(uncapped)).not.toContain('strongest');
    });

    test('survives a payload from before linkEdgesTotal existed', () => {
        // The page is served from cache and the API deploys separately, so the
        // two are briefly out of step. Rendering "undefined hyperlinks" during
        // that window would be a self-inflicted outage of the caption.
        const legacy = { sites: 1486, linkEdges: 103, semanticEdges: 323,
                         sitesWithLinkScan: 28, sitesWithCentroid: 145 };
        const text = caption(legacy);
        expect(text).toContain('103 hyperlinks');
        expect(text).not.toContain('undefined');
    });
});

describe("what the map encodes", () => {
    // Extract a helper out of the browser IIFE and call it directly.
    function fn(name) {
        const start = SOURCE.indexOf("function " + name + "(");
        if (start === -1) throw new Error(name + "() not found — did the renderer move?");
        const end = SOURCE.indexOf("\n  }", start);
        const body = SOURCE.slice(start, end + 4);
        // eslint-disable-next-line no-new-func
        return new Function(body + "\nreturn " + name + ";")();
    }

    describe("authorityOf", () => {
        // Size is pages indexed, which measures how hard WE crawled. Measured on
        // the live graph: www.w3.org has 15 pages and 294 inbound links while
        // ipac.caltech.edu draws among the largest nodes on 7,831 pages and ZERO
        // inbound. 18 of the 40 hosts with 40+ inbound render under 200 pages.
        const authorityOf = fn("authorityOf");

        test("a host nothing points at has no authority", () => {
            expect(authorityOf({ linkInDegree: 0 })).toBe(0);
            expect(authorityOf({})).toBe(0);
        });

        test("ranks the real hubs above the deeply-crawled", () => {
            const w3 = authorityOf({ linkInDegree: 294 });
            const ipac = authorityOf({ linkInDegree: 0 });
            expect(w3).toBeGreaterThan(ipac);
        });

        test("is bounded, so one outlier cannot swamp the canvas", () => {
            expect(authorityOf({ linkInDegree: 100000 })).toBeLessThanOrEqual(1);
            expect(authorityOf({ linkInDegree: 486 })).toBeLessThanOrEqual(1);
        });

        test("is monotonic in inbound links", () => {
            const seq = [1, 10, 40, 150, 300].map((d) => authorityOf({ linkInDegree: d }));
            expect(seq).toEqual([...seq].sort((a, b) => a - b));
        });

        test("a small hub outranks a large nobody for a label", () => {
            // The exact regression: label order was radius alone, so w3.org was
            // never named. Prominence = radius + authority*18 (see the sort).
            const prominence = (radius, inDeg) => radius + authorityOf({ linkInDegree: inDeg }) * 18;
            const w3 = prominence(5, 294);      // 15 pages
            const ipac = prominence(20, 0);     // 7,831 pages, nothing points at it
            expect(w3).toBeGreaterThan(ipac);
        });
    });

    describe("the holding belt", () => {
        test("its explanation is drawn in SCREEN space, not world space", () => {
            // The first version placed the words at the belt radius in world
            // coordinates. fit() frames the CONNECTED graph and lets the belt
            // run past the edges, so the label sat outside the viewport at the
            // default zoom and was only legible if you zoomed out — which is to
            // say never. Caught by looking at the deployed page, not by any
            // assertion, which is why this one exists.
            const after = SOURCE.slice(SOURCE.indexOf("ctx.restore()"));
            expect(after).toContain("their position means nothing");
            const before = SOURCE.slice(0, SOURCE.indexOf("ctx.restore()"));
            expect(before).not.toContain("position means nothing");
        });

        test("names how many sites are parked there", () => {
            expect(SOURCE).toContain("sim.orbitalCount");
        });

        test("is outlined and named on the canvas", () => {
            // 298 of 1,608 nodes have no edge of either kind and are parked at a
            // hash-derived angle. Drawn plainly they form a tidy arc that reads
            // as an arrangement. The caption said so in words; the pixels did not.
            expect(SOURCE).toContain("sim.beltRadius");
            expect(SOURCE).toMatch(/no links or embedding yet/);
        });

        test("orbital nodes are drawn dimmer than placed ones", () => {
            expect(SOURCE).toMatch(/n\.orbital \? 0\.45 : 1/);
        });
    });
});

describe("map freshness", () => {
    // The jobs that rebuild these layers cannot report their own success: the
    // link refresh is triggered hourly but Cloudflare cuts the caller at 125s
    // while the work takes ~240s, so the trigger always sees a timeout. Nothing
    // schedules the semantic rebuild at all. Putting the age on the map means a
    // stale map says so, and nobody has to be on call for it.
    const BASE = {
        sites: 2525, linkEdges: 2646, linkEdgesTotal: 19087, linkTopKPerSource: 3,
        semanticEdges: 2547, sitesWithLinkScan: 2059, sitesWithCentroid: 1083,
    };
    const isoAgo = (mins) => new Date(Date.now() - mins * 60000).toISOString();

    test('reports both layers when both have been built', () => {
        const text = caption({ ...BASE, linkEdgesBuiltAt: isoAgo(40), semanticEdgesBuiltAt: isoAgo(19 * 60) });
        expect(text).toContain('Links rebuilt 40 minutes ago');
        expect(text).toContain('embeddings 19 hours ago');
    });

    test('a layer that has never been built says nothing rather than lying', () => {
        // null, not the epoch — otherwise the map claims it was refreshed in 1970.
        const text = caption({ ...BASE, linkEdgesBuiltAt: isoAgo(5), semanticEdgesBuiltAt: null });
        expect(text).toContain('Links rebuilt 5 minutes ago');
        expect(text).not.toContain('embeddings');
        expect(text).not.toContain('1970');
    });

    test('says nothing at all on a payload from before the field existed', () => {
        // The cached page and the API deploy separately, so they are briefly
        // out of step; "undefined ago" would be a self-inflicted outage.
        const text = caption(BASE);
        expect(text).not.toContain('rebuilt');
        expect(text).not.toContain('undefined');
        expect(text).not.toContain('NaN');
    });

    test('clock skew never prints a negative or future age', () => {
        const text = caption({ ...BASE, linkEdgesBuiltAt: isoAgo(-30), semanticEdgesBuiltAt: null });
        expect(text).toContain('just now');
        expect(text).not.toMatch(/-\d/);
    });

    test('a genuinely stale map reads as stale, in days', () => {
        const text = caption({ ...BASE, linkEdgesBuiltAt: isoAgo(6 * 24 * 60), semanticEdgesBuiltAt: null });
        expect(text).toContain('6 days ago');
    });

    test('garbage in the field is ignored, not rendered', () => {
        const text = caption({ ...BASE, linkEdgesBuiltAt: 'not-a-date', semanticEdgesBuiltAt: null });
        expect(text).not.toContain('rebuilt');
        expect(text).not.toContain('NaN');
    });
});

/**
 * ── THE MAP HAS TO SURVIVE THE CORPUS GROWING ──────────────────────────────
 *
 * On 2026-08-20 /www-rag crashed the tab. Not a leak and not the payload: the
 * force simulation was all-pairs, and the boot ran 600 steps SYNCHRONOUSLY
 * inside the fetch continuation. Measured against the live endpoint:
 *
 *     nodes    step()    600-step settle
 *       719     1.6 ms     1.0 s
 *     1,438     8.6 ms     5.2 s
 *     2,876    33   ms    19.8 s      ← in a browser: a 36,255 ms frozen frame
 *
 * ⚠️ Measure natively. An earlier revision quoted 256 ms/step and a 154 s
 * settle because the harness used `vm.createContext`, which is 6.8x slower
 * here on identical code and data. `new Function(src)(...)` compiles into the
 * current realm and carries no such penalty — and the browser numbers, which
 * were right all along, are the ones that actually matter.
 *
 * Nothing was wrong with that comment when it was written. It went stale, and
 * the directory adds ~150 sites a day, so it will go stale again. These tests
 * exist so the next person finds out from a red build instead of from a
 * visitor, and so "restore the simple all-pairs loop for clarity" fails loudly.
 */
describe("the simulation has to scale with the corpus", () => {
    /** Load the browser IIFE with a stubbed DOM and pull out its test hook. */
    function loadSim(countCalls) {
        const vm = require('vm');
        const ctx2d = new Proxy({}, {
            get: (t, k) => (k in t ? t[k] : () => {}),
            set: (t, k, v) => ((t[k] = v), true),
        });
        const el = () => ({
            hidden: true, style: {}, width: 0, height: 0,
            getContext: () => ctx2d,
            getBoundingClientRect: () => ({ width: 1200, height: 620, left: 0, top: 0 }),
            addEventListener: () => {},
            set textContent(v) {}, get textContent() { return ''; },
        });
        // Count Math.sqrt as a deterministic, machine-independent proxy for the
        // work a step does: every force actually applied takes exactly one, and
        // rejected quadtree cells take none. Wall-clock would make this test
        // flaky on a loaded machine; a call count is exact.
        const calls = { sqrt: 0 };
        const MathProxy = Object.create(Math);
        MathProxy.sqrt = (x) => { calls.sqrt++; return Math.sqrt(x); };
        const sandbox = {
            module: { exports: { __wwwRagUniverseTestHook: true } },
            Math: countCalls ? MathProxy : Math,
            Date, JSON, Error, isFinite, Infinity, Float64Array, Int32Array,
            console,
            document: { getElementById: el, createElement: el, hidden: false },
            window: {
                devicePixelRatio: 2,
                matchMedia: () => ({ matches: false }),
                addEventListener: () => {},
            },
            requestAnimationFrame: () => {},
            // Never resolves: the hook is all this test wants, and a resolved
            // fetch would start the real boot sequence underneath it.
            fetch: () => new Promise(() => {}),
        };
        sandbox.globalThis = sandbox;
        vm.createContext(sandbox);
        vm.runInContext(SOURCE, sandbox);
        return { api: sandbox.module.exports, calls };
    }

    /** A deterministic corpus of n sites with a realistic edge density. */
    function corpus(n) {
        const nodes = [];
        for (let i = 0; i < n; i++) {
            nodes.push({
                host: `site-${i}.example`, releaseId: `r${i}`,
                pageCount: (i % 97) + 1, chunkCount: (i % 401) + 1,
                linkScanPages: i % 3 === 0 ? 5 : 0,
                linkOutDegree: i % 5 === 0 ? 2 : 0,
                linkInDegree: i % 7 === 0 ? 11 : 0,
            });
        }
        // ~2 edges per node, matching the live graph's 11k edges over 2.9k sites.
        const linkEdges = [], semanticEdges = [];
        for (let i = 0; i < n; i++) {
            linkEdges.push({ source: `site-${i}.example`, target: `site-${(i * 7 + 3) % n}.example`, pages: (i % 40) + 1 });
            semanticEdges.push({ source: `site-${i}.example`, target: `site-${(i * 13 + 5) % n}.example`, similarity: 0.45 + ((i % 50) / 100) });
        }
        return { nodes, linkEdges, semanticEdges, stats: {} };
    }

    function workFor(n, steps) {
        const { api, calls } = loadSim(true);
        const sim = api.build(corpus(n));
        calls.sqrt = 0;                       // exclude build()
        for (let i = 0; i < steps; i++) api.step(sim);
        return calls.sqrt;
    }

    test("doubling the corpus must not quadruple the work", () => {
        const STEPS = 12;
        const small = workFor(700, STEPS);
        const large = workFor(1400, STEPS);
        const ratio = large / small;
        // An all-pairs simulation lands at ~4.0 here — that is the regression
        // this catches. Barnes-Hut plus a neighbourhood grid measures ~2.2.
        // 3.0 leaves generous headroom for tuning THETA or the grid without
        // being loose enough to let the quadratic loop back in.
        expect(ratio).toBeLessThan(3.0);
        // And it must still be doing the work — a step that silently stopped
        // computing forces would sail through the bound above.
        expect(small).toBeGreaterThan(700);
    });

    test("nothing runs the whole settle in one blocking go", () => {
        // The exact line whose 600 synchronous ticks froze the tab.
        expect(SOURCE).not.toMatch(/for\s*\(\s*var\s+i\s*=\s*0;\s*i\s*<\s*600;\s*i\+\+\s*\)\s*step\(/);
        // The settle must yield to the browser between slices, and must be
        // bounded by wall-clock rather than only by a step count — a step
        // budget is unbounded work, so a corpus twice this size simply takes
        // twice as long to appear.
        expect(SOURCE).toContain("SETTLE_BUDGET_MS");
        expect(SOURCE).toMatch(/requestAnimationFrame\(slice\)/);
    });

    test("the repulsion pass is not all-pairs", () => {
        // `step` used to carry two nested loops over every node. If you are
        // here because this failed: check the live node count at
        // https://api.divinci.app/api/v1/www-rag-universe before deciding an
        // all-pairs loop is affordable. It was ~170 when that was last true.
        const start = SOURCE.indexOf("function step(sim)");
        const body = SOURCE.slice(start, SOURCE.indexOf("\n  }", start));
        expect(body).not.toMatch(/for\s*\([^)]*j\s*=\s*i\s*\+\s*1;\s*j\s*<\s*n(odes\.length)?;/);
        expect(SOURCE).toContain("buildTree(nodes)");
        expect(SOURCE).toContain("buildGrid(nodes");
    });

    test("the simulation cools to a stop", () => {
        // THE BUG THIS EXISTS FOR. step() ended with
        //   sim.alpha = Math.max(0.06, sim.alpha * 0.994)
        // and that floor meant the layout could never converge: every frame
        // kept injecting the same energy, so it settled into a permanent creep
        // rather than coming to rest.
        //
        // That made the renderer's "has anything moved a visible pixel" rule
        // load-bearing on something it could not deliver. The rule fired while
        // the corpus was small enough that 0.06 of energy moved a node less
        // than an eighth of a screen pixel, and silently stopped firing as the
        // corpus grew: measured against the live 4,667-node graph, motion
        // plateaued at 0.243 screen px/frame — permanently above the threshold
        // — so the loop ran its full 2,400-frame cap on EVERY page view. About
        // 40 s of a pinned core, plus ~21,500 antialiased strokes rasterised
        // 2,400 times. That is what froze a colleague's laptop.
        //
        // Restoring the floor is therefore not a tuning choice, it is the
        // regression. Same corpus, 3,000 steps:
        //
        //   floor 0.06   -> alpha 0.060000, meanSpeed 0.104249   (never rests)
        //   floor 0.001  -> alpha 0.001000, meanSpeed 0.003187   (at rest)
        const { api } = loadSim(false);
        const sim = api.build(corpus(400));
        for (let i = 0; i < 3000; i++) api.step(sim);
        expect(sim.alpha).toBeLessThan(0.005);
        expect(sim.meanSpeed).toBeLessThan(0.02);
    });

    test("frames to rest do not scale with the corpus", () => {
        // Per-frame cost is O(n) and always will be — something has to draw
        // every node. What must NOT grow with the corpus is how many frames
        // are spent before the thing stops moving, or the page gets slower
        // twice over: more work per frame AND more frames. Measured against
        // the live payload with the floor removed: 553 frames at 4,667 nodes,
        // 588 at 9,334 — flat. With the floor: the cap, at every size.
        function framesToRest(n) {
            const { api } = loadSim(false);
            const sim = api.build(corpus(n));
            let peak = 0;
            for (let i = 0; i < 4000; i++) {
                api.step(sim);
                if (i < 25) peak = Math.max(peak, sim.meanSpeed);
                else if (sim.meanSpeed < peak * 0.01) return i;
            }
            return Infinity;
        }
        const small = framesToRest(400);
        const large = framesToRest(1600);
        expect(large).toBeLessThan(4000);
        // Four times the corpus must not cost appreciably more frames. Loose
        // enough that a layout-tuning change does not trip it, tight enough
        // that "it never converges" cannot pass.
        expect(large).toBeLessThan(small * 1.6);
    });

    test("the animation loop can always terminate", () => {
        // The old loop called requestAnimationFrame unconditionally, OUTSIDE
        // its own budget check, so a callback stayed registered for the life of
        // the page. Every reschedule must sit after the guards that can stop it.
        const start = SOURCE.indexOf("function loop()");
        const body = SOURCE.slice(start, SOURCE.indexOf("})();", start));
        const reschedule = body.indexOf("requestAnimationFrame(loop)");
        expect(reschedule).toBeGreaterThan(-1);
        expect(body.slice(0, reschedule)).toMatch(/return;/);
        // And it stops on what a viewer can SEE, in screen pixels. That used to
        // be the ONLY thing that could end the run, because the layout could
        // not converge; it is now a cheap early exit on top of a simulation
        // that cools on its own. Both are kept — see "the simulation cools to
        // a stop" for why the second one cannot be relied on alone.
        expect(SOURCE).toContain("IMPERCEPTIBLE_PX");
        // A backstop, not the normal path. If this ever needs raising, the
        // simulation has stopped converging and raising it is the wrong fix.
        expect(SOURCE).toMatch(/var MAX_FRAMES = \d{3};/);
    });

    test("one malformed row cannot take out the whole map", () => {
        // Hostnames and counts reach the payload from crawled third-party
        // pages. Bucketing edges by a quantised score introduced a way for a
        // null similarity to become a NaN array index and throw out of
        // build(), which the caller turns into "endpoint unavailable" — the
        // entire section gone because one row was junk.
        const { api } = loadSim(false);
        const graph = corpus(40);
        graph.semanticEdges[0].similarity = null;
        graph.semanticEdges[1].similarity = "definitely-not-a-number";
        delete graph.semanticEdges[2].similarity;
        graph.linkEdges[0].pages = null;
        graph.nodes[3].pageCount = "seventeen";

        let sim;
        expect(() => { sim = api.build(graph); }).not.toThrow();
        expect(sim.nodes).toHaveLength(40);
        expect(() => api.step(sim)).not.toThrow();
    });

    test("an edge naming a prototype key resolves to no node at all", () => {
        // The host->node map is keyed by untrusted hostnames. On a plain `{}`,
        // a lookup for a host that does not exist but happens to name an
        // inherited member — "constructor", "toString", "valueOf" — returns a
        // FUNCTION off Object.prototype instead of undefined. The `if (!s)`
        // guard passes it, and the spring then reads `.x` off a function: NaN,
        // which propagates into the real node on the other end of the edge and
        // spreads through the layout from there.
        //
        // Note the edges below reference hosts that are NOT in the node list —
        // that is the whole point. An earlier version of this test also
        // declared them as nodes, which shadowed the inherited members and
        // made it pass with or without the fix.
        const { api } = loadSim(false);
        const graph = corpus(30);
        const real = graph.nodes[5].host;
        graph.linkEdges.push({ source: "constructor", target: real, pages: 3 });
        graph.semanticEdges.push({ source: real, target: "valueOf", similarity: 0.9 });
        graph.semanticEdges.push({ source: "toString", target: real, similarity: 0.8 });

        let sim;
        expect(() => { sim = api.build(graph); }).not.toThrow();
        for (let i = 0; i < 5; i++) api.step(sim);

        expect(sim.nodes).toHaveLength(30);
        // If a prototype member were treated as a node, the spring on the other
        // end of that edge would read `.x` off a function and write NaN back
        // into a real node — so this is where the damage shows up.
        expect(sim.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
        // Nothing that is not a node may end up in an edge.
        const endpoints = sim.semantic.concat(sim.links);
        expect(endpoints.every((e) => typeof e.s === "object" && typeof e.t === "object")).toBe(true);
    });

    test("the deferral observes a sentinel, never the hidden section", () => {
        // The section ships `hidden`; a display:none element has no layout box,
        // so IntersectionObserver never reports it intersecting and the
        // universe would never load at all. Caught by running it, not reading it.
        expect(SOURCE).not.toMatch(/io\.observe\(\s*section\s*\)/);
        expect(SOURCE).toMatch(/io\.observe\(\s*sentinel\s*\)/);
    });
});
