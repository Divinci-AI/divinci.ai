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
