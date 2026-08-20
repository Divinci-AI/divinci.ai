/**
 * A synthetic universe payload, sized on demand.
 *
 * Generated rather than checked in because the interesting parameter IS the
 * node count: the page crashed on 2026-08-20 because the force simulation was
 * all-pairs and the corpus had grown to 2,876 sites, adding ~150 a day. A
 * fixture frozen at any one size stops testing the thing that broke the moment
 * the live corpus passes it.
 *
 * Deterministic — no randomness anywhere, so a failure reproduces exactly.
 */

/** A corpus of `n` sites with ~2 edges each, matching the live graph's density. */
function makeUniverse(n, opts) {
    const options = opts || {};
    const nodes = [];
    for (let i = 0; i < n; i++) {
        nodes.push({
            host: `site-${i}.example`,
            title: `site-${i}`,
            releaseId: `release${i}`,
            faviconUrl: null,
            thumbnailUrl: null,
            claimed: false,
            pageCount: (i % 97) + 1,
            chunkCount: (i % 401) + 1,
            // A third have been link-scanned, so all three node states appear.
            linkScanPages: i % 3 === 0 ? 5 : 0,
            hasCentroid: i % 4 !== 0,
            linkOutDegree: i % 5 === 0 ? 2 : 0,
            linkInDegree: i % 7 === 0 ? 11 : 0,
        });
    }
    if (options.hosts) options.hosts.forEach((h, k) => { if (nodes[k]) nodes[k].host = h; });

    const linkEdges = [];
    const semanticEdges = [];
    for (let i = 0; i < n; i++) {
        linkEdges.push({
            source: nodes[i].host,
            target: nodes[(i * 7 + 3) % n].host,
            pages: (i % 40) + 1,
        });
        semanticEdges.push({
            source: nodes[i].host,
            target: nodes[(i * 13 + 5) % n].host,
            similarity: 0.45 + ((i % 50) / 100),
        });
    }
    // A handful with no edge of either kind, so the holding belt is exercised.
    for (let i = 0; i < n; i++) {
        if (i % 29 !== 0) continue;
        for (let e = linkEdges.length - 1; e >= 0; e--) {
            if (linkEdges[e].source === nodes[i].host || linkEdges[e].target === nodes[i].host) linkEdges.splice(e, 1);
        }
        for (let e = semanticEdges.length - 1; e >= 0; e--) {
            if (semanticEdges[e].source === nodes[i].host || semanticEdges[e].target === nodes[i].host) semanticEdges.splice(e, 1);
        }
    }

    return {
        generatedAt: '2026-08-20T16:00:00.000Z',
        stats: {
            sites: n,
            sitesWithCentroid: nodes.filter((x) => x.hasCentroid).length,
            sitesWithLinkScan: nodes.filter((x) => x.linkScanPages > 0).length,
            linkEdges: linkEdges.length,
            linkEdgesTotal: linkEdges.length * 4,
            linkTopKPerSource: 3,
            semanticEdges: semanticEdges.length,
            semanticMinCosine: 0.45,
            semanticSource: 'materialized',
            linkEdgesBuiltAt: '2026-08-20T16:02:43.751Z',
            semanticEdgesBuiltAt: '2026-08-20T16:04:48.781Z',
        },
        nodes,
        linkEdges,
        semanticEdges,
    };
}

module.exports = { makeUniverse };
