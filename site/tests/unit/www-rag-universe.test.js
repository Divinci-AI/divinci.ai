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
    const body = SOURCE.match(/function describe\(stats\)[\s\S]*?\n {2}\}/);
    if (!body) throw new Error('describe() not found — did the renderer move?');
    // eslint-disable-next-line no-new-func
    return new Function('stats', body[0] + '\nreturn describe(stats);')(stats);
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
