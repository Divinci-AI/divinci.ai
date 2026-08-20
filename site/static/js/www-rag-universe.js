/**
 * WWW-RAG Universe — the crawled corpus as a force-directed map, for /www-rag.
 *
 * Three encodings, each doing a job the others cannot:
 *   · POSITION — semantic similarity between per-site embedding centroids, so
 *                topical neighbourhoods emerge as spatial clusters.
 *   · SIZE     — pages indexed for that site.
 *   · COLOUR   — what we KNOW about a site's hyperlinks: linked, scanned but
 *                isolated, or never scanned.
 *
 * Bright directed edges are real hyperlinks found while crawling; the faint web
 * behind them is embedding similarity. Keeping those visually distinct is the
 * whole point — one is a fact about the web, the other a fact about our index.
 *
 * Two rules, the same ones www-rag-live.js works to:
 *
 *  1. NEVER IMPLY DATA WE DO NOT HAVE. Most of the corpus has no link data at
 *     all (Turso-published sites create no page records), so a site with no
 *     edges is usually UNSCANNED, not isolated. Those render as dashed hollow
 *     rings and the caption states the coverage outright. A dashed node means
 *     "unknown"; it must never be mistaken for "links to nothing".
 *  2. HOSTNAMES ARE UNTRUSTED. They reach the payload from crawled third-party
 *     pages. They are only ever drawn to canvas or written via textContent —
 *     never innerHTML.
 *
 * ── EVERYTHING HERE IS SIZED FOR A CORPUS THAT GROWS ~150 SITES/DAY ─────────
 *
 * This file used to run a plain O(n²) simulation, with a comment justifying it:
 * "O(n²) over ~170 nodes is ~14k evaluations — cheaper than building a
 * Barnes-Hut tree at this size." True at 170. The endpoint returned 1,608 when
 * that line was last touched and 2,876 on 2026-08-20, and the boot ran the
 * whole settle SYNCHRONOUSLY:
 *
 *     nodes    step()      600-step settle (blocking the main thread)
 *       719     1.6 ms       1.0 s
 *     1,438     8.6 ms       5.2 s
 *     2,876    33   ms      19.8 s
 *
 * And in a real browser, which is the number that matters: a single
 * **36,255 ms frozen frame**, 15 requestAnimationFrame callbacks in 55 s, and
 * an empty black box where the map should be.
 *
 * ⚠️ MEASURE IN THE CURRENT REALM, NOT IN A vm CONTEXT. The first pass at this
 * quoted 256 ms/step and a 154 s settle, because the harness ran the file
 * through `vm.createContext`. Verified afterwards on identical code and data:
 * a vm context is **6.8x slower** here than plain node, so every absolute
 * figure was inflated ~7x and even the speedup ratio was wrong, since the two
 * implementations are penalised differently. Use `new Function(src)(...)`,
 * which compiles into the current realm and lets the JIT specialise the way a
 * browser would — or trust the browser numbers, which were right all along.
 *
 * That is the page crash. Not memory — an unyielding main thread that Chrome's
 * unresponsive-tab killer and iOS Safari's watchdog both terminate.
 *
 * So the growth curve itself is the thing to fix, not the constant:
 *
 *   · REPULSION is Barnes-Hut over a quadtree — O(n log n). The long-range
 *     1/d² term is the only one that needs every pair; distant clusters are
 *     summarised by their centroid and body COUNT (the force is per-body and
 *     mass-independent, so count is the right aggregate, not mass).
 *   · CONTACT and DE-OVERLAP only ever act below ~55 px, so they run against a
 *     uniform hash grid — O(n) expected — instead of scanning every pair to
 *     discard 99.9% of them. De-overlap alone was two thirds of the old cost:
 *     two full n² passes, against repulsion's one.
 *   · THE SETTLE IS CHUNKED across frames with a time budget. Even a fast
 *     simulation must never hold the thread for seconds at a time.
 *   · DRAWING IS BATCHED BY STYLE. ~14,000 individual stroke()/fill() calls a
 *     frame will miss 60 fps on their own; bucketing by alpha band collapses
 *     that to a few dozen paths.
 *   · THE LOOP STOPS, and stops rescheduling, once the motion falls below what
 *     a viewer can see — measured in screen pixels, not world units.
 *
 * If you are tempted to reintroduce an all-pairs loop "for clarity", check the
 * live node count first: scripts/../tests/unit/www-rag-universe.test.js pins
 * the complexity, and the endpoint adds another ~150 nodes tomorrow.
 *
 * DELIBERATELY FRAMEWORK-AGNOSTIC, same as morpho.js: the core touches nothing
 * but a <canvas> and its 2D context. The signed-in app at chat.divinci.app runs
 * the same layout from TypeScript (pages/WwwRagDirectory/Universe/force-layout.ts)
 * and still carries BOTH all-pairs loops — it needs this same treatment.
 *
 * The section stays hidden unless the endpoint answers with a usable graph. An
 * empty box on a marketing page is worse than no box.
 */
(function () {
  "use strict";

  var API_URL = "https://api.divinci.app/api/v1/www-rag-universe";
  var CHAT_BASE = "https://chat.divinci.app/ai-release/";

  // Palette validated for colour-vision deficiency against the #0b0b12 surface
  // (CVD ΔE 19.6, normal-vision ΔE 20.9, both ≥3:1 contrast). Only TWO hues are
  // in play on purpose: colouring by topic cluster would need ten or more and
  // could not pass, and a force layout already carries clustering in position.
  var SURFACE = "#0b0b12";
  var NODE_LINKED = "#3987e5";
  var NODE_SCANNED = "#199e70";
  var NODE_UNSCANNED = "#6b6b78";
  // Deliberately the dimmest thing on the canvas and NOT one of the two hues:
  // the belt boundary is chrome, not data, and must not read as a third
  // category competing with linked/scanned.
  var BELT_EDGE = "#3a3a46";
  var EDGE_LINK = "#3987e5";
  var EDGE_SEMANTIC = "#7d7d95";
  var TEXT = "#c3c2b7";

  // Style buckets. Edge alpha and width are continuous functions of one scalar
  // (similarity, or link weight), so quantising that scalar into bands lets one
  // path carry thousands of segments. 7 bands is below the threshold where the
  // banding is visible at these alphas and above where it flattens the ramp.
  var BANDS = 7;

  var section = document.getElementById("www-rag-universe-section");
  var canvas = document.getElementById("www-rag-universe-canvas");
  var caption = document.getElementById("www-rag-universe-caption");
  if (!section || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var now = (window.performance && window.performance.now)
    ? function () { return window.performance.now(); }
    : function () { return Date.now(); };

  /* ---------------------------------------------------------------- layout */

  // FNV-1a. Seeds each node's start position from its hostname so the same
  // corpus always lays out the same way — a visitor reloading sees the same
  // universe, and a layout regression is reproducible.
  function hashHost(host) {
    var h = 0x811c9dc5;
    for (var i = 0; i < host.length; i++) {
      h ^= host.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function radiusFor(node) {
    var corpus = Math.max(node.pageCount || 0, node.chunkCount || 0, 1);
    return Math.min(4 + Math.sqrt(corpus) * 0.26, 20);
  }

  /**
   * How much of the corpus points AT this host, log-scaled to 0..1.
   *
   * Size is pages indexed, which measures how hard WE crawled — not what the
   * corpus considers important. Measured on the live graph, the gap is stark:
   * www.w3.org has 15 pages and 294 inbound links, en.wikipedia.org 56 and 368,
   * while ipac.caltech.edu renders among the largest nodes on 7,831 pages with
   * ZERO inbound. 18 of the 40 hosts with 40+ inbound links draw smaller than
   * 200 pages' worth of dot.
   *
   * Authority therefore gets its own channel rather than replacing size: the
   * caption promises "size is pages indexed", and quietly redefining it would
   * make the legend a lie.
   */
  function authorityOf(node) {
    var d = node.linkInDegree || 0;
    if (d < 1) return 0;
    return Math.min(Math.log(d) / Math.log(400), 1);
  }

  function stateOf(node) {
    if (node.linkOutDegree > 0 || node.linkInDegree > 0) return "linked";
    if (node.linkScanPages > 0) return "scanned";
    return "unscanned";
  }

  function band(t) {
    // `!(b >= 0)` rather than `b < 0`, because it catches NaN in the same test.
    // A malformed row — a null similarity, a string pageCount — makes this NaN,
    // and NaN fails every comparison, so a naive clamp RETURNS NaN, indexes the
    // bucket array with it, and throws on .push. One bad row would then take
    // out the whole map. Hostnames and counts reach the payload from crawled
    // third-party pages; nothing upstream promises they are well-formed.
    var b = Math.floor(t * BANDS);
    if (!(b >= 0)) return 0;
    return b >= BANDS ? BANDS - 1 : b;
  }

  function build(graph) {
    // Prototype-free: hostnames are untrusted keys. On a plain `{}`,
    // `byHost["__proto__"] = node` REPLACES the object's prototype instead of
    // adding a key, after which every miss — `byHost["constructor"]` and
    // friends — resolves to an inherited value that then gets treated as a
    // node. Object.create(null) removes the class outright and reads
    // identically at every use site.
    var byHost = Object.create(null);
    var maxRadius = 0;
    var nodes = graph.nodes.map(function (n) {
      var seed = hashHost(n.host);
      var angle = (seed % 10000) * 0.001 * Math.PI * 2;
      var dist = 60 + ((seed >>> 13) % 400);
      var r = radiusFor(n);
      if (r > maxRadius) maxRadius = r;
      var node = {
        host: n.host,
        releaseId: n.releaseId,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: r,
        mass: 1 + r * 0.1,
        state: stateOf(n),
        orbital: true,
        pageCount: n.pageCount || 0,
        inDegree: n.linkInDegree || 0,
        authority: authorityOf(n),
      };
      byHost[n.host] = node;
      return node;
    });

    function edge(e, strength, rest) {
      var s = byHost[e.source];
      var t = byHost[e.target];
      if (!s || !t) return null;
      s.orbital = false;
      t.orbital = false;
      return { s: s, t: t, k: strength, rest: rest };
    }

    var semantic = [];
    graph.semanticEdges.forEach(function (e) {
      var made = edge(
        e,
        0.006 + e.similarity * 0.02,
        500 - e.similarity * 250 + (byHost[e.source] ? byHost[e.source].radius : 0)
      );
      if (made) {
        made.sim = e.similarity;
        made.band = band((e.similarity - 0.45) / 0.55);
        semantic.push(made);
      }
    });

    var links = [];
    graph.linkEdges.forEach(function (e) {
      var weight = Math.min(Math.log(1 + e.pages) / Math.log(10) / 3.5, 1);
      var made = edge(e, 0.02 + weight * 0.05, 250);
      if (made) {
        made.pages = e.pages;
        made.weight = weight;
        made.band = band(weight);
        links.push(made);
      }
    });

    // Bucket for drawing. Done ONCE here rather than per frame: the keys are
    // all derived from data that never changes after build, and re-deriving
    // them 60 times a second is exactly the kind of per-frame work that stops
    // scaling. `orbital` is only final after the edge passes above.
    var semanticBands = [];
    var linkBands = [];
    var i;
    for (i = 0; i < BANDS; i++) { semanticBands.push([]); linkBands.push([]); }
    semantic.forEach(function (e) { semanticBands[e.band].push(e); });
    links.forEach(function (e) { linkBands[e.band].push(e); });

    var bodies = { linked: [], scanned: [], unscanned: [] };
    var orbitals = { linked: [], scanned: [], unscanned: [] };
    var halos = [];
    for (i = 0; i < BANDS; i++) halos.push([]);
    nodes.forEach(function (n) {
      (n.orbital ? orbitals : bodies)[n.state].push(n);
      if (n.authority >= 0.55) halos[band(n.authority)].push(n);
    });

    // Labels are chosen by prominence and dropped on collision; only nodes that
    // could ever win are worth sorting. Everything under radius 9 is discarded
    // by draw() anyway, and the sort was over all 2,876 nodes every frame.
    var labelled = nodes
      .filter(function (n) { return n.radius >= 9; })
      .sort(function (p, q) {
        return (q.radius + q.authority * 18) - (p.radius + p.authority * 18);
      });

    return {
      nodes: nodes,
      semantic: semantic,
      links: links,
      semanticBands: semanticBands,
      linkBands: linkBands,
      bodies: bodies,
      orbitals: orbitals,
      halos: halos,
      labelled: labelled,
      // Every short-range interaction in step() is bounded by this, so it sets
      // the grid cell size. Contact reaches a.radius+b.radius+15.
      nearRange: maxRadius * 2 + 15,
      alpha: 1,
      meanSpeed: Infinity,
    };
  }

  /* ------------------------------------------------- spatial acceleration */

  /**
   * Barnes-Hut quadtree, in flat typed arrays reused across frames.
   *
   * Object-per-cell would hand the GC ~4k objects every tick — 240k a second at
   * 60 fps — which shows up as periodic frame drops rather than a steady cost,
   * the kind of jank that is hard to attribute later. These grow once and are
   * then only ever overwritten.
   *
   * The aggregate stored per cell is the body COUNT, not the summed mass: the
   * repulsion this approximates is `16000/d² · alpha` per body, independent of
   * the other body's mass (mass only divides the force on the RECEIVING node,
   * which happens outside the traversal).
   */
  /**
   * Opening angle. A cell is summarised when its width over its distance falls
   * below THETA; smaller is more exact and much slower. 0.9 is d3-force's
   * default, chosen for simulations whose positions are read as data.
   *
   * Measured against exact all-pairs repulsion at an identical settled layout
   * of the live 2,876-node graph — the only honest way to judge this, since a
   * force layout is chaotic and comparing final POSITIONS between two runs
   * measures divergence, not error:
   *
   *     theta   ms/step   mean |F error|   p95     max
   *      0.6     6.48        2.6%          4.8%     8%
   *      0.9     4.95        7.5%         16.4%    34%   ← here
   *      1.2     3.92       15.9%         36.1%    68%
   *      1.5     3.52       32.5%         82.1%   224%
   *
   * 1.5 is tempting and wrong, and the timings say so more plainly than the
   * errors do: loosening all the way to 1.5 buys **1.4x**, and pays 32% mean
   * force error for it. That is a different picture, not a cheaper one. The
   * real speed came from the traversal's memory layout instead.
   *
   * (The error columns are ratios of forces and are unaffected by how the
   * harness was run; the ms column was re-measured natively — see the vm
   * warning at the top of this file.)
   */
  var THETA = 0.9;
  var THETA2 = THETA * THETA;
  var REPULSION = 16000;
  var MAX_DEPTH = 22;   // coincident hosts would otherwise subdivide forever

  var tCap = 0, tUsed = 0;
  var tSumX, tSumY, tCount, tHalf, tCx, tCy, tChild, tHead, tNext, tStack;
  // Positions, mirrored out of the node objects once per step.
  //
  // The traversal visits a few hundred cells per node and reading `nodes[b].x`
  // there was the hottest read in the simulation. A Float64Array pair is
  // contiguous and monomorphic; the copy in is 2,876 writes, noise against what
  // it saves, at an unchanged THETA so no accuracy is traded for it. (An
  // earlier revision quoted a specific before/after here; it was measured in a
  // vm context and is not reproduced, for the reason given at the top.)
  var pxs = null, pys = null;

  function ensureTree(n) {
    var cap = 8 * n + 256;
    if (cap <= tCap) return;
    tCap = cap;
    tSumX = new Float64Array(cap);
    tSumY = new Float64Array(cap);
    tCount = new Int32Array(cap);
    tHalf = new Float64Array(cap);
    tCx = new Float64Array(cap);
    tCy = new Float64Array(cap);
    tChild = new Int32Array(cap * 4);
    tHead = new Int32Array(cap);
    tStack = new Int32Array(4 * MAX_DEPTH + 16);
    if (!tNext || tNext.length < n) tNext = new Int32Array(n);
    if (!pxs || pxs.length < n) { pxs = new Float64Array(n); pys = new Float64Array(n); }
  }

  function newCell(cx, cy, half) {
    var c = tUsed++;
    tSumX[c] = 0; tSumY[c] = 0; tCount[c] = 0;
    tCx[c] = cx; tCy[c] = cy; tHalf[c] = half;
    tHead[c] = -1;
    tChild[c * 4] = -1; tChild[c * 4 + 1] = -1;
    tChild[c * 4 + 2] = -1; tChild[c * 4 + 3] = -1;
    return c;
  }

  function place(c, depth, i, x, y) {
    for (;;) {
      tCount[c]++;
      tSumX[c] += x;
      tSumY[c] += y;
      if (tChild[c * 4] === -1) {
        var head = tHead[c];
        if (head === -1) { tHead[c] = i; tNext[i] = -1; return; }
        // Out of depth or out of cells: keep the leaf as a short list. Both are
        // correctness fallbacks, not tuning — a list leaf is still EXACT, just
        // evaluated pairwise, so the worst case degrades smoothly instead of
        // overflowing an array or looping forever on coincident points.
        if (depth >= MAX_DEPTH || tUsed + 4 > tCap) {
          tNext[i] = head; tHead[c] = i; return;
        }
        var h = tHalf[c] / 2;
        tChild[c * 4] = newCell(tCx[c] - h, tCy[c] - h, h);
        tChild[c * 4 + 1] = newCell(tCx[c] + h, tCy[c] - h, h);
        tChild[c * 4 + 2] = newCell(tCx[c] - h, tCy[c] + h, h);
        tChild[c * 4 + 3] = newCell(tCx[c] + h, tCy[c] + h, h);
        tHead[c] = -1;
        for (var b = head, nx; b !== -1; b = nx) {
          nx = tNext[b];
          var bx = pxs[b], by = pys[b];
          var bq = (bx >= tCx[c] ? 1 : 0) + (by >= tCy[c] ? 2 : 0);
          place(tChild[c * 4 + bq], depth + 1, b, bx, by);
        }
      }
      c = tChild[c * 4 + ((x >= tCx[c] ? 1 : 0) + (y >= tCy[c] ? 2 : 0))];
      depth++;
    }
  }

  function buildTree(nodes) {
    var n = nodes.length, i;
    ensureTree(n);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (i = 0; i < n; i++) {
      var a = nodes[i];
      var x = a.x, y = a.y;
      pxs[i] = x; pys[i] = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    tUsed = 0;
    newCell((minX + maxX) / 2, (minY + maxY) / 2,
            Math.max(maxX - minX, maxY - minY) / 2 + 1);
    for (i = 0; i < n; i++) place(0, 0, i, pxs[i], pys[i]);
    // Sums become centroids. Leaves are evaluated exactly, so only the internal
    // cells' centroids are ever read — doing them all is cheaper than branching.
    for (i = 0; i < tUsed; i++) {
      var k = tCount[i];
      if (k > 0) { tSumX[i] /= k; tSumY[i] /= k; }
    }
  }

  /**
   * Uniform hash grid over the same points, via counting sort.
   *
   * Covers every interaction up to `cell` px with a 3x3 neighbourhood query:
   * two points at distance d occupy cells at most ceil(d/cell) apart. The cell
   * size is therefore the largest short-range reach in the simulation, never
   * smaller — and it is grown further when the layout spreads out, so the index
   * array can never blow up on a sparse graph.
   */
  var gCell = 64, gw = 1, gh = 1, gMinX = 0, gMinY = 0;
  var gStart = null, gItems = null, gKey = null, gCursor = null;

  function buildGrid(nodes, reach) {
    var n = nodes.length, i;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (i = 0; i < n; i++) {
      var a = nodes[i];
      if (a.x < minX) minX = a.x;
      if (a.x > maxX) maxX = a.x;
      if (a.y < minY) minY = a.y;
      if (a.y > maxY) maxY = a.y;
    }
    var span = Math.max(maxX - minX, maxY - minY, 1);
    // Never below `reach` (that is what makes 3x3 sufficient); never so small
    // that a 5,000px-wide layout needs a million cells.
    gCell = Math.max(reach, span / 256);
    gMinX = minX; gMinY = minY;
    gw = Math.max(1, Math.ceil((maxX - minX) / gCell) + 1);
    gh = Math.max(1, Math.ceil((maxY - minY) / gCell) + 1);
    var cells = gw * gh;
    if (!gStart || gStart.length < cells + 1) gStart = new Int32Array(cells + 1);
    else gStart.fill(0, 0, cells + 1);
    if (!gCursor || gCursor.length < cells) gCursor = new Int32Array(cells);
    if (!gItems || gItems.length < n) { gItems = new Int32Array(n); gKey = new Int32Array(n); }
    for (i = 0; i < n; i++) {
      var gx = ((nodes[i].x - minX) / gCell) | 0;
      var gy = ((nodes[i].y - minY) / gCell) | 0;
      if (gx < 0) gx = 0; else if (gx >= gw) gx = gw - 1;
      if (gy < 0) gy = 0; else if (gy >= gh) gy = gh - 1;
      var k = gy * gw + gx;
      gKey[i] = k;
      gStart[k + 1]++;
    }
    for (i = 0; i < cells; i++) { gStart[i + 1] += gStart[i]; gCursor[i] = gStart[i]; }
    for (i = 0; i < n; i++) gItems[gCursor[gKey[i]]++] = i;
  }

  /* ------------------------------------------------------------ simulation */

  function step(sim) {
    var nodes = sim.nodes;
    var n = nodes.length;
    var alpha = sim.alpha;
    var i, j, a, b, dx, dy, d2, d, f, fx, fy, k;

    // ── Long-range repulsion, Barnes-Hut. Was n²/2 = 4.1M pair evaluations at
    // 2,876 nodes; this is ~n·log n and the gap widens as the corpus grows.
    buildTree(nodes);
    for (i = 0; i < n; i++) {
      var aX = pxs[i], aY = pys[i];
      var ax = 0, ay = 0;
      var sp = 0;
      tStack[sp++] = 0;
      while (sp > 0) {
        var c = tStack[--sp];
        if (tCount[c] === 0) continue;
        var head = tHead[c];
        if (head !== -1) {
          for (b = head; b !== -1; b = tNext[b]) {
            if (b === i) continue;
            dx = pxs[b] - aX;
            dy = pys[b] - aY;
            d2 = dx * dx + dy * dy;
            if (d2 < 1e-6) { dx = (i - b) * 0.01 || 0.01; dy = 0.01; d2 = dx * dx + dy * dy; }
            k = REPULSION * alpha / (d2 * Math.sqrt(d2));
            ax -= dx * k;
            ay -= dy * k;
          }
          continue;
        }
        dx = tSumX[c] - aX;
        dy = tSumY[c] - aY;
        d2 = dx * dx + dy * dy;
        // Squared-form acceptance test, so a cell that gets REJECTED (the
        // common case near the centre) costs no sqrt at all — the traversal is
        // ~73% of a step, and most of its cell visits end in a recursion.
        var wid = tHalf[c] * 2;
        if (d2 > 1e-12 && wid * wid < THETA2 * d2) {
          k = REPULSION * alpha * tCount[c] / (d2 * Math.sqrt(d2));
          ax -= dx * k;
          ay -= dy * k;
        } else {
          for (var q = 0; q < 4; q++) {
            var ch = tChild[c * 4 + q];
            if (ch !== -1) tStack[sp++] = ch;
          }
        }
      }
      a = nodes[i];
      a.vx += ax / a.mass;
      a.vy += ay / a.mass;
    }

    // ── Contact repulsion. Acts only inside a.radius+b.radius+15 (≤ ~55 px),
    // so scanning every pair to reject 99.9% of them was pure waste. Grid
    // neighbourhood, each unordered pair visited once via the j > i test.
    buildGrid(nodes, sim.nearRange);
    for (i = 0; i < n; i++) {
      a = nodes[i];
      var cx0 = gKey[i] % gw, cy0 = (gKey[i] / gw) | 0;
      for (var oy = -1; oy <= 1; oy++) {
        var yy = cy0 + oy;
        if (yy < 0 || yy >= gh) continue;
        for (var ox = -1; ox <= 1; ox++) {
          var xx = cx0 + ox;
          if (xx < 0 || xx >= gw) continue;
          var cell = yy * gw + xx;
          for (var s = gStart[cell], e = gStart[cell + 1]; s < e; s++) {
            j = gItems[s];
            if (j <= i) continue;
            b = nodes[j];
            dx = b.x - a.x;
            dy = b.y - a.y;
            d2 = dx * dx + dy * dy;
            var minD = a.radius + b.radius + 15;
            if (d2 >= minD * minD) continue;
            if (d2 < 1e-6) { dx = (i - j) * 0.01 || 0.01; dy = 0.01; d2 = dx * dx + dy * dy; }
            d = Math.sqrt(d2);
            f = (minD - d) * 0.5;
            fx = (dx / d) * f;
            fy = (dy / d) * f;
            a.vx -= fx / a.mass;
            a.vy -= fy / a.mass;
            b.vx += fx / b.mass;
            b.vy += fy / b.mass;
          }
        }
      }
    }

    function spring(e) {
      var sdx = e.t.x - e.s.x;
      var sdy = e.t.y - e.s.y;
      var sd = Math.sqrt(sdx * sdx + sdy * sdy) || 0.01;
      var sf = (sd - e.rest) * e.k * alpha;
      var sfx = (sdx / sd) * sf;
      var sfy = (sdy / sd) * sf;
      e.s.vx += sfx / e.s.mass;
      e.s.vy += sfy / e.s.mass;
      e.t.vx -= sfx / e.t.mass;
      e.t.vy -= sfy / e.t.mass;
    }
    sim.semantic.forEach(spring);
    sim.links.forEach(spring);

    // Sites with no edge of either kind sit on an outer belt rather than
    // competing for the centre. As free bodies they balloon outward and squeeze
    // the actual graph into a knot — and belting them says something true:
    // these are the sites we know nothing relational about yet.
    var coreR = 0;
    var parked = 0;
    for (i = 0; i < n; i++) {
      a = nodes[i];
      if (a.orbital) { parked++; continue; }
      coreR = Math.max(coreR, Math.sqrt(a.x * a.x + a.y * a.y) + a.radius);
    }
    var belt = Math.max(coreR * 1.28 + 70, 240);
    // Published so draw() can OUTLINE the belt. Nodes with no edge of either
    // kind are parked here at an angle derived from a hash of the hostname.
    // Drawn plainly they form a tidy arc that reads as an arrangement — a
    // viewer zooming in sees neighbours and infers a relationship that does
    // not exist. The caption says so in words; until now the pixels said the
    // opposite.
    sim.beltRadius = belt;
    sim.orbitalCount = parked;

    var energy = 0;
    for (i = 0; i < n; i++) {
      a = nodes[i];
      if (a.orbital) {
        var dr = Math.sqrt(a.x * a.x + a.y * a.y) || 0.01;
        var pull = (belt - dr) * 0.012 * alpha;
        a.vx += (a.x / dr) * pull;
        a.vy += (a.y / dr) * pull;
      } else {
        a.vx -= a.x * 0.0031 * alpha;
        a.vy -= a.y * 0.0031 * alpha;
      }
      a.vx *= 0.87;
      a.vy *= 0.87;
      var sp2 = a.vx * a.vx + a.vy * a.vy;
      if (sp2 > 900) {
        var spd = Math.sqrt(sp2);
        a.vx = (a.vx / spd) * 30;
        a.vy = (a.vy / spd) * 30;
        sp2 = 900;
      }
      energy += sp2;
      a.x += a.vx;
      a.y += a.vy;
    }

    // Positional de-overlap. Velocity repulsion spaces nodes on average but
    // cannot guarantee it — a node held between strong springs settles on top
    // of its neighbours, which is what turns a hub cluster into a blob.
    //
    // Same grid, not rebuilt between the two relaxation passes: a pass moves a
    // node by at most the overlap it resolves (tens of px at most, and only
    // when nodes start coincident), while the cell size carries slack over the
    // largest reach. Rebuilding twice more per frame costs more than the
    // occasional missed pair in a relaxation that runs again next tick.
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < n; i++) {
        a = nodes[i];
        var kx = gKey[i] % gw, ky = (gKey[i] / gw) | 0;
        for (var py = -1; py <= 1; py++) {
          var ny2 = ky + py;
          if (ny2 < 0 || ny2 >= gh) continue;
          for (var px = -1; px <= 1; px++) {
            var nx2 = kx + px;
            if (nx2 < 0 || nx2 >= gw) continue;
            var pc = ny2 * gw + nx2;
            for (var ps = gStart[pc], pe = gStart[pc + 1]; ps < pe; ps++) {
              j = gItems[ps];
              if (j <= i) continue;
              b = nodes[j];
              var mind = a.radius + b.radius + 7.5;
              var oxx = b.x - a.x;
              var oyy = b.y - a.y;
              var o2 = oxx * oxx + oyy * oyy;
              if (o2 >= mind * mind || o2 < 1e-9) continue;
              var od = Math.sqrt(o2);
              var push = (mind - od) / od;
              var total = a.mass + b.mass;
              a.x -= oxx * push * (b.mass / total);
              a.y -= oyy * push * (b.mass / total);
              b.x += oxx * push * (a.mass / total);
              b.y += oyy * push * (a.mass / total);
            }
          }
        }
      }
    }

    sim.alpha = Math.max(0.06, sim.alpha * 0.994);
    // Mean node speed in WORLD px/frame. The caller turns it into on-screen px
    // with view.scale and decides whether anything is still visibly moving —
    // that decision needs the zoom, which lives in the renderer, and a
    // threshold in world units would mean something different on every device.
    sim.meanSpeed = Math.sqrt(energy / n);
  }

  /* ---------------------------------------------------------------- render */

  var view = { scale: 1, x: 0, y: 0 };

  function fit(sim, w, h) {
    // Fit the CONNECTED graph, letting the belt run past the edges. Fitting
    // everything shrinks the readable part to a third of the frame.
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, any = false;
    sim.nodes.forEach(function (n) {
      if (n.orbital) return;
      any = true;
      minX = Math.min(minX, n.x - n.radius);
      minY = Math.min(minY, n.y - n.radius);
      maxX = Math.max(maxX, n.x + n.radius);
      maxY = Math.max(maxY, n.y + n.radius);
    });
    if (!any) { minX = -200; minY = -200; maxX = 200; maxY = 200; }
    var bw = maxX - minX || 1;
    var bh = maxY - minY || 1;
    // 0.78, not the app's 0.62: this canvas is much wider than it is tall, so
    // Math.min lets HEIGHT set the scale and the graph ends up floating in a
    // sea of horizontal margin. Filling more of the short axis is what makes it
    // legible here; the belt is allowed to run off the top and bottom, being
    // context rather than content.
    view.scale = Math.min((w * 0.78) / bw, (h * 0.78) / bh, 2.4);
    view.x = w / 2 - ((minX + maxX) / 2) * view.scale;
    view.y = h / 2 - ((minY + maxY) / 2) * view.scale;
  }

  // Orbital nodes carry no information in their position, so they recede.
  function nodeAlpha(n) { return n.orbital ? 0.45 : 1; }

  // Midpoint of a band, for the alpha/width the whole bucket is drawn at.
  function bandT(b) { return (b + 0.5) / BANDS; }

  /**
   * One path per style bucket, rather than one per edge.
   *
   * The old renderer issued ~14,000 separate beginPath/stroke/fill calls per
   * frame (5,251 semantic edges + 5,816 links each with an arrowhead + 2,876
   * node arcs). Each stroke() is its own rasteriser submission, so that cost
   * alone kept the frame off 60 fps even once the physics was cheap. Batching
   * by quantised alpha collapses it to a few dozen paths and changes nothing a
   * viewer can see — the bands are finer than the alpha ramp is perceptible.
   */
  function draw(sim, w, h) {
    ctx.fillStyle = SURFACE;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);

    ctx.lineCap = "round";
    ctx.strokeStyle = EDGE_SEMANTIC;
    for (var bi = 0; bi < BANDS; bi++) {
      var bucket = sim.semanticBands[bi];
      if (!bucket.length) continue;
      var t = bandT(bi);
      ctx.globalAlpha = 0.05 + t * 0.16;
      ctx.lineWidth = 0.6 / view.scale + t * 0.5;
      ctx.beginPath();
      for (var si = 0; si < bucket.length; si++) {
        var se = bucket[si];
        ctx.moveTo(se.s.x, se.s.y);
        ctx.lineTo(se.t.x, se.t.y);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = EDGE_LINK;
    ctx.fillStyle = EDGE_LINK;
    for (bi = 0; bi < BANDS; bi++) {
      var lb = sim.linkBands[bi];
      if (!lb.length) continue;
      var wt = bandT(bi);
      var head = (4 + wt * 4) / Math.max(view.scale, 0.6);
      ctx.globalAlpha = 0.34 + wt * 0.5;
      ctx.lineWidth = (0.7 + wt * 2.6) / Math.max(view.scale, 0.6);
      ctx.beginPath();
      var heads = [];
      for (var li = 0; li < lb.length; li++) {
        var e = lb[li];
        var dx = e.t.x - e.s.x;
        var dy = e.t.y - e.s.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        var ex = e.t.x - ux * (e.t.radius + 3);
        var ey = e.t.y - uy * (e.t.radius + 3);
        ctx.moveTo(e.s.x + ux * e.s.radius, e.s.y + uy * e.s.radius);
        ctx.lineTo(ex, ey);
        heads.push(ex, ey, Math.atan2(dy, dx));
      }
      ctx.stroke();
      // Arrowhead: direction is the whole point of this layer. All of a band's
      // heads are one filled path — they never overlap, so winding is moot.
      ctx.beginPath();
      for (var hi = 0; hi < heads.length; hi += 3) {
        var hx = heads[hi], hy = heads[hi + 1], ang = heads[hi + 2];
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - head * Math.cos(ang - Math.PI / 7), hy - head * Math.sin(ang - Math.PI / 7));
        ctx.lineTo(hx - head * Math.cos(ang + Math.PI / 7), hy - head * Math.sin(ang + Math.PI / 7));
        ctx.closePath();
      }
      ctx.fill();
    }

    // The holding area, drawn as one. A boundary plus a word is the difference
    // between "a region of the map" and "the pile we have not placed yet".
    if (sim.beltRadius) {
      ctx.globalAlpha = 1;
      ctx.setLineDash([6 / view.scale, 9 / view.scale]);
      ctx.strokeStyle = BELT_EDGE;
      ctx.lineWidth = 1 / view.scale;
      ctx.beginPath();
      ctx.arc(0, 0, sim.beltRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Authority halo, under the node bodies. A ring rather than a bigger dot,
    // so "how much the corpus points here" cannot be mistaken for "how much we
    // crawled" — the two disagree by an order of magnitude on the real hubs.
    ctx.strokeStyle = NODE_LINKED;
    for (bi = 0; bi < BANDS; bi++) {
      var hb = sim.halos[bi];
      if (!hb.length) continue;
      var au = bandT(bi);
      ctx.globalAlpha = 0.12 + au * 0.3;
      ctx.lineWidth = (1 + au * 2.2) / view.scale;
      var pad = (3 + au * 7) / view.scale;
      ctx.beginPath();
      for (var ai = 0; ai < hb.length; ai++) {
        var hn = hb[ai];
        ctx.moveTo(hn.x + hn.radius + pad, hn.y);
        ctx.arc(hn.x, hn.y, hn.radius + pad, 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    // Node bodies, six buckets: three states x placed/orbital. The moveTo
    // before each arc matters — without it consecutive circles are joined by a
    // line and the whole batch draws as a cat's cradle.
    var groups = [sim.bodies, sim.orbitals];
    for (var gi = 0; gi < 2; gi++) {
      var g = groups[gi];
      ["linked", "scanned", "unscanned"].forEach(function (stateKey) {
        var list = g[stateKey];
        if (!list.length) return;
        ctx.globalAlpha = nodeAlpha(list[0]);
        ctx.beginPath();
        for (var i = 0; i < list.length; i++) {
          var n = list[i];
          ctx.moveTo(n.x + n.radius, n.y);
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        }
        if (stateKey === "unscanned") {
          // Secondary encoding — "no link data" is distinguishable without colour.
          ctx.setLineDash([2.5 / view.scale, 2.5 / view.scale]);
          ctx.strokeStyle = NODE_UNSCANNED;
          ctx.lineWidth = 1.2 / view.scale;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = stateKey === "linked" ? NODE_LINKED : NODE_SCANNED;
          ctx.fill();
          ctx.strokeStyle = SURFACE;
          ctx.lineWidth = 2 / view.scale;
          ctx.stroke();
        }
      });
    }

    // Selective labels, biggest first, dropped on collision. A name on every
    // node is an unreadable thicket; none at all makes the map useless.
    //
    // Ordered by PROMINENCE, not radius, and sorted once at build time. Sorting
    // by size alone meant the corpus's actual hubs were never named: w3.org (15
    // pages, 294 inbound) and en.wikipedia.org (56 pages, 368 inbound) lost
    // every collision to sites we happened to crawl deeply. Authority is scaled
    // into the same units as the radius so one comparison covers both reasons a
    // node deserves a name.
    var placed = [];
    var fontSize = Math.max(10, 11 / view.scale);
    ctx.globalAlpha = 1;
    ctx.font = fontSize + "px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    sim.labelled.forEach(function (n) {
      var label = n.host.replace(/^www\./, "");
      var halfW = (label.length * fontSize * 0.55) / 2 / view.scale;
      var top = n.y + n.radius + 4 / view.scale;
      var box = { x0: n.x - halfW, y0: top, x1: n.x + halfW, y1: top + (fontSize * 1.25) / view.scale };
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        if (!(box.x1 < p.x0 || box.x0 > p.x1 || box.y1 < p.y0 || box.y0 > p.y1)) return;
      }
      placed.push(box);
      ctx.lineWidth = 3 / view.scale;
      ctx.strokeStyle = SURFACE;
      ctx.strokeText(label, n.x, top);
      ctx.fillStyle = TEXT;
      ctx.fillText(label, n.x, top);
    });

    ctx.restore();

    // ── Screen-space legend ──────────────────────────────────────────────
    // Drawn AFTER restore(), in pixels, because the world-space version was
    // invisible: fit() deliberately frames the CONNECTED graph and lets the
    // belt run past the edges, so a label positioned at the belt radius sits
    // outside the viewport at the default zoom. The one sentence that stops a
    // viewer reading the outer ring as an arrangement was only legible if you
    // zoomed out — which is to say, never.
    if (sim.orbitalCount > 0) {
      ctx.globalAlpha = 1;
      ctx.font = "11px ui-sans-serif, system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = BELT_EDGE;
      ctx.fillText(
        "outer ring · " + sim.orbitalCount.toLocaleString() +
          " sites with no links or embedding yet — their position means nothing",
        14, h - 12,
      );
    }
  }

  /* ------------------------------------------------------------------ boot */

  function start(graph) {
    var sim = build(graph);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // MUST precede resize(): the section ships `hidden`, and a display:none
    // element measures 0×0, which silently leaves the canvas backing store at
    // 0×0 forever — no resize event ever fires to correct it, so the visitor
    // gets an empty black box.
    section.hidden = false;

    // The canvas is unhidden but transparent while the layout settles, so the
    // graph still ARRIVES FORMED rather than exploding outward while the
    // visitor watches — the property the old synchronous settle was buying,
    // kept without blocking the thread for it.
    canvas.style.opacity = "0";
    // The fade is the reveal, not decoration — but it is still motion, so a
    // visitor who asked for none gets the finished frame appearing outright.
    if (!reduceMotion) canvas.style.transition = "opacity 420ms ease";

    resize();
    window.addEventListener("resize", function () {
      resize();
      fit(sim, w, h);
      draw(sim, w, h);
    });

    /**
     * Settle in slices, never in one blocking run — and under a WALL-CLOCK
     * ceiling, not just a step count.
     *
     * The old code ran all 600 steps inside the fetch continuation. At 2,876
     * nodes that is ~20 SECONDS of unyielding main thread natively, and a
     * 36,255 ms frozen frame in a real browser — not a slow page, a killed tab. Chunking alone would fix the crash but not
     * the scaling: 600 steps is unbounded work, so a corpus twice this size
     * simply takes twice as long to appear.
     *
     * Bounding the TIME instead makes the failure mode graceful. A big corpus
     * gets fewer pre-reveal steps and finishes settling on screen, visibly,
     * which the loop below is doing anyway — so what grows with the corpus is
     * how much of the settling you watch, not how long you wait.
     *
     * The 8 ms slice bounds how many steps a frame ATTEMPTS. A step is
     * indivisible, so once one step costs more than the budget the settle
     * necessarily runs exactly ONE step per frame and the budget's real job is
     * stopping it running two.
     *
     * What that costs, measured in the BROWSER against the live corpus rather
     * than in a harness: the reveal is a single ~56 ms task (the 1.8 MB
     * JSON.parse, build(), and the first cold-JIT step together), and after it
     * nothing on the page exceeds 50 ms at all — production measured zero long
     * tasks. That is the floor here; going below it would mean splitting one
     * step across frames, which is a much larger change and is not worth it
     * until a single step approaches 50 ms on its own.
     */
    var SETTLE_STEPS = 600;
    var SETTLE_BUDGET_MS = 900;
    var SLICE_MS = 8;

    function settle(done) {
      var ran = 0;
      var spent = 0;
      var slowest = 0;
      (function slice() {
        var began = now();
        var inSlice = 0;
        while (ran < SETTLE_STEPS) {
          // PREDICTIVE, not reactive. A step cannot be interrupted, so a plain
          // `while (elapsed < SLICE_MS)` lets one overshoot the slice by its
          // own full duration — 8 + 19 ms at today's corpus, but 8 + ~85 ms at
          // four times it, which is a long task every frame. Refusing to START
          // a step that will not fit keeps the slice bounded as the corpus
          // grows, instead of quietly re-creating the problem this fixes.
          var elapsed = now() - began;
          if (inSlice > 0 && elapsed + slowest > SLICE_MS) break;
          // The first step of every slice always runs, whatever it costs:
          // a budget that can refuse every step makes no progress at all.
          var before = now();
          step(sim);
          ran++;
          inSlice++;
          var took = now() - before;
          if (took > slowest) slowest = took;
        }
        spent += now() - began;
        if (ran < SETTLE_STEPS && spent < SETTLE_BUDGET_MS) {
          requestAnimationFrame(slice);
          return;
        }
        done();
      })();
    }

    settle(function () {
      fit(sim, w, h);
      draw(sim, w, h);
      canvas.style.opacity = "1";
      if (reduceMotion) return; // settled still frame is the whole experience

      /**
       * Stop when the motion stops being VISIBLE, and stop RESCHEDULING.
       *
       * The old loop called requestAnimationFrame unconditionally, outside its
       * own budget check, so a callback stayed registered for the life of the
       * page; and `frames++` counted while the tab was hidden, so a page opened
       * in a background tab burned all 2,400 frames doing nothing and then
       * showed a permanently frozen graph.
       *
       * The budget was also far too generous, because this layout never
       * converges — the alpha floor keeps feeding it energy, so it settles into
       * a permanent creep instead of stopping. Measured on the live graph, that
       * creep is 0.41 world px/frame, which at the fitted zoom is 0.08 SCREEN
       * px: a node takes 13 frames to move one pixel. The old loop therefore
       * spent ~65 seconds of a core rendering motion nobody can perceive.
       *
       * So the test is in screen pixels, where the claim is checkable: below
       * an eighth of a pixel per frame, stop. Two consecutive frames, so a
       * momentary dip mid-settle cannot end it early.
       */
      var IMPERCEPTIBLE_PX = 0.125;
      var stillFrames = 0;
      var frames = 0;
      (function loop() {
        if (frames++ >= 2400) return;
        step(sim);
        // Re-fit as it settles: with the shortened pre-reveal settle the graph
        // is still contracting, and a fixed view would let it shrink away from
        // the frame it was fitted to.
        fit(sim, w, h);
        draw(sim, w, h);
        stillFrames = sim.meanSpeed * view.scale < IMPERCEPTIBLE_PX ? stillFrames + 1 : 0;
        if (stillFrames >= 2) return;
        requestAnimationFrame(loop);
      })();
    });

    canvas.addEventListener("click", function (ev) {
      var rect = canvas.getBoundingClientRect();
      var mx = (ev.clientX - rect.left - view.x) / view.scale;
      var my = (ev.clientY - rect.top - view.y) / view.scale;
      for (var i = sim.nodes.length - 1; i >= 0; i--) {
        var n = sim.nodes[i];
        var hit = Math.max(n.radius, 8);
        if ((n.x - mx) * (n.x - mx) + (n.y - my) * (n.y - my) <= hit * hit && n.releaseId) {
          window.open(CHAT_BASE + encodeURIComponent(n.releaseId), "_blank", "noopener");
          return;
        }
      }
    });
  }

  /**
   * "3 hours ago" for an ISO timestamp, or null when there is nothing to say.
   *
   * Freshness goes in front of a reader rather than into an alert because the
   * jobs that build these layers cannot report their own success: the link
   * refresh is triggered hourly but Cloudflare cuts the caller at 125s while
   * the work takes ~240s, so the trigger always sees a timeout. A stale map
   * that SAYS it is stale needs nobody to be on call.
   */
  function ago(iso) {
    if (!iso) return null;
    var then = Date.parse(iso);
    if (!isFinite(then)) return null;
    var mins = Math.round((Date.now() - then) / 60000);
    // Clock skew between the reader and the server must not print "in the
    // future" or a negative age; treat anything not-yet-past as just now.
    if (mins < 1) return "just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    var hrs = Math.round(mins / 60);
    if (hrs < 48) return hrs + (hrs === 1 ? " hour ago" : " hours ago");
    var days = Math.round(hrs / 24);
    return days + (days === 1 ? " day ago" : " days ago");
  }

  // Older payloads carry no timestamps; say nothing rather than "undefined".
  function freshness(s2) {
    var link = ago(s2.linkEdgesBuiltAt);
    var sem = ago(s2.semanticEdgesBuiltAt);
    if (!link && !sem) return "";
    if (link && sem) return " Links rebuilt " + link + ", embeddings " + sem + ".";
    return " " + (link ? "Links rebuilt " + link : "Embeddings rebuilt " + sem) + ".";
  }

  function describe(stats) {
    // State the coverage of BOTH layers. The link half already said so; the
    // semantic half did not, and claimed more than it delivered: "position is
    // embedding similarity" was true of the 145 sites that have a centroid and
    // false of the other 1,341, which have no edges at all and therefore never
    // leave their starting point — and that point is hashHost(host), a hash of
    // the domain name. An arbitrary-but-stable position looks exactly like a
    // meaningful one, which is the worst way for a visualization to be wrong.
    var s = stats.sites.toLocaleString();
    // `linkEdges` is what we DRAW; `linkEdgesTotal` is what we measured. The
    // endpoint keeps only the strongest few per site because the full graph is
    // an unreadable hairball and a megabyte of JSON — but reporting the drawn
    // count as though it were the finding is the same error this caption was
    // rewritten to stop making. Older payloads have no linkEdgesTotal, so fall
    // back rather than render "undefined".
    var total = typeof stats.linkEdgesTotal === "number" ? stats.linkEdgesTotal : stats.linkEdges;
    var shown = stats.linkEdges;
    var linkPhrase = total > shown
      ? total.toLocaleString() + " hyperlinks found between them (drawing the strongest " +
        (stats.linkTopKPerSource || "few") + " per site)"
      : total.toLocaleString() + " hyperlinks found between them";
    return (
      s + " sites · " + linkPhrase + " · " +
      stats.semanticEdges.toLocaleString() + " semantic ties. Size is pages indexed. " +
      "Embeddings are mapped for " + stats.sitesWithCentroid.toLocaleString() + " of " + s +
      " sites — those sit near the sites they resemble. The rest are parked on a ring " +
      "until theirs are computed, so their position carries no meaning yet. " +
      "Link data covers " + stats.sitesWithLinkScan.toLocaleString() + " of " + s +
      " sites, so a dashed circle means we have not mapped that site's links yet — not that it links nowhere." +
      freshness(stats)
    );
  }

  function load() {
    fetch(API_URL, { credentials: "omit" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        var graph;
        try {
          graph = JSON.parse(text);
        } catch (e) {
          throw new Error("universe endpoint returned non-JSON");
        }
        if (!graph || !graph.nodes || !graph.nodes.length) throw new Error("empty universe");
        if (caption) caption.textContent = describe(graph.stats);
        start(graph);
      })
      .catch(function () {
        // Stay hidden. The endpoint is unavailable on some environments, and an
        // empty canvas is worse than no section at all.
        section.hidden = true;
      });
  }

  /**
   * Hold the 280 KB payload and the settle until the map is nearly in view.
   *
   * ⚠️ BE HONEST ABOUT WHAT THIS BUYS TODAY. The map is the FOURTH section on
   * /www-rag, above the directory, and starts ~850 px down — 133 px below the
   * fold at 1280x720, and already on screen at 1080p. That is inside the 600 px
   * rootMargin on every realistic viewport, so in practice this fires almost
   * immediately and defers the fetch for hardly anyone. What it actually buys
   * is ordering: the work lands after first layout instead of competing with
   * the hero, the video and the directory fetch during the initial burst.
   *
   * It is kept because it is free and because the section will not sit at 850 px
   * forever — anything added above it turns this into a real deferral. Do not
   * restate it as "visitors who never scroll pay nothing" without re-measuring;
   * that claim was written here, was untrue for this layout, and is the same
   * kind of stale-comment error that produced the crash this file fixes.
   *
   * ⚠️ OBSERVE THE SENTINEL, NOT THE SECTION. The section ships `hidden`, and a
   * display:none element has no layout box, so IntersectionObserver never
   * reports it as intersecting — no matter where the page is scrolled. Watching
   * it directly means the universe NEVER loads, which is a worse failure than
   * the one this deferral exists to fix, and it looks exactly like a broken
   * endpoint. Same root cause as the 0x0 canvas note in start().
   *
   * A zero-height element immediately before the section does have a box, and
   * sits exactly where the section will appear.
   */
  function whenNearlyVisible(run) {
    if (!window.IntersectionObserver || !section.parentNode) { run(); return; }
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "height:0;margin:0;padding:0;border:0";
    section.parentNode.insertBefore(sentinel, section);
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (en) { return en.isIntersecting; })) return;
      io.disconnect();
      if (sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
      run();
    }, { rootMargin: "600px 0px" });
    io.observe(sentinel);
  }

  whenNearlyVisible(load);

  // Test hook. The scaling guard in tests/unit/www-rag-universe.test.js drives
  // the simulation directly, because the property that matters — that the work
  // per step grows sub-quadratically with the corpus — cannot be asserted by
  // reading the source. Browsers never define `module`, so this is inert in
  // production and adds nothing to the page.
  // Gated on a flag the harness sets first, not merely on `module` existing: a
  // third-party script defining a `module` global would otherwise have its
  // exports overwritten by ours. Opt-in means production cannot reach this
  // line by accident.
  if (typeof module !== "undefined" && module && module.exports &&
      module.exports.__wwwRagUniverseTestHook) {
    module.exports.build = build;
    module.exports.step = step;
  }
})();
