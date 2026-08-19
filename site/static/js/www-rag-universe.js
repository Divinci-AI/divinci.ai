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
 * DELIBERATELY FRAMEWORK-AGNOSTIC, same as morpho.js: the core touches nothing
 * but a <canvas> and its 2D context. The signed-in app at chat.divinci.app runs
 * the same layout from TypeScript (pages/WwwRagDirectory/Universe/force-layout.ts);
 * if these ever need to share one implementation, this file is the shape it
 * would take — add `export` to the layout functions and drop the IIFE.
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
  var EDGE_LINK = "#3987e5";
  var EDGE_SEMANTIC = "#7d7d95";
  var TEXT = "#c3c2b7";

  var section = document.getElementById("www-rag-universe-section");
  var canvas = document.getElementById("www-rag-universe-canvas");
  var caption = document.getElementById("www-rag-universe-caption");
  if (!section || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function stateOf(node) {
    if (node.linkOutDegree > 0 || node.linkInDegree > 0) return "linked";
    if (node.linkScanPages > 0) return "scanned";
    return "unscanned";
  }

  function build(graph) {
    var byHost = {};
    var nodes = graph.nodes.map(function (n) {
      var seed = hashHost(n.host);
      var angle = (seed % 10000) * 0.001 * Math.PI * 2;
      var dist = 60 + ((seed >>> 13) % 400);
      var r = radiusFor(n);
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
        links.push(made);
      }
    });

    return { nodes: nodes, semantic: semantic, links: links, alpha: 1 };
  }

  function step(sim) {
    var nodes = sim.nodes;
    var alpha = sim.alpha;
    var i, j, a, b;

    // Pairwise repulsion. O(n²) over ~170 nodes is ~14k evaluations — cheaper
    // than building a Barnes-Hut tree at this size.
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 1e-6) {
          dx = (i - j) * 0.01 || 0.01;
          dy = 0.01;
          d2 = dx * dx + dy * dy;
        }
        var d = Math.sqrt(d2);
        var minD = a.radius + b.radius + 15;
        var f = (16000 / d2) * alpha + (d < minD ? (minD - d) * 0.5 : 0);
        var fx = (dx / d) * f;
        var fy = (dy / d) * f;
        a.vx -= fx / a.mass;
        a.vy -= fy / a.mass;
        b.vx += fx / b.mass;
        b.vy += fy / b.mass;
      }
    }

    function spring(e) {
      var dx = e.t.x - e.s.x;
      var dy = e.t.y - e.s.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var f = (d - e.rest) * e.k * alpha;
      var fx = (dx / d) * f;
      var fy = (dy / d) * f;
      e.s.vx += fx / e.s.mass;
      e.s.vy += fy / e.s.mass;
      e.t.vx -= fx / e.t.mass;
      e.t.vy -= fy / e.t.mass;
    }
    sim.semantic.forEach(spring);
    sim.links.forEach(spring);

    // Sites with no edge of either kind sit on an outer belt rather than
    // competing for the centre. As free bodies they balloon outward and squeeze
    // the actual graph into a knot — and belting them says something true:
    // these are the sites we know nothing relational about yet.
    var coreR = 0;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].orbital) continue;
      coreR = Math.max(coreR, Math.sqrt(nodes[i].x * nodes[i].x + nodes[i].y * nodes[i].y) + nodes[i].radius);
    }
    var belt = Math.max(coreR * 1.28 + 70, 240);

    for (i = 0; i < nodes.length; i++) {
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
      var sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (sp > 30) {
        a.vx = (a.vx / sp) * 30;
        a.vy = (a.vy / sp) * 30;
      }
      a.x += a.vx;
      a.y += a.vy;
    }

    // Positional de-overlap. Velocity repulsion spaces nodes on average but
    // cannot guarantee it — a node held between strong springs settles on top
    // of its neighbours, which is what turns a hub cluster into a blob.
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          var mind = a.radius + b.radius + 7.5;
          var ox = b.x - a.x;
          var oy = b.y - a.y;
          var o2 = ox * ox + oy * oy;
          if (o2 >= mind * mind || o2 < 1e-9) continue;
          var od = Math.sqrt(o2);
          var push = (mind - od) / od;
          var total = a.mass + b.mass;
          a.x -= ox * push * (b.mass / total);
          a.y -= oy * push * (b.mass / total);
          b.x += ox * push * (a.mass / total);
          b.y += oy * push * (a.mass / total);
        }
      }
    }

    sim.alpha = Math.max(0.06, sim.alpha * 0.994);
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

  function draw(sim, w, h) {
    ctx.fillStyle = SURFACE;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);

    ctx.lineCap = "round";
    sim.semantic.forEach(function (e) {
      var strength = (e.sim - 0.45) / 0.55;
      ctx.globalAlpha = 0.05 + strength * 0.16;
      ctx.strokeStyle = EDGE_SEMANTIC;
      ctx.lineWidth = 0.6 / view.scale + strength * 0.5;
      ctx.beginPath();
      ctx.moveTo(e.s.x, e.s.y);
      ctx.lineTo(e.t.x, e.t.y);
      ctx.stroke();
    });

    sim.links.forEach(function (e) {
      ctx.globalAlpha = 0.34 + e.weight * 0.5;
      ctx.strokeStyle = EDGE_LINK;
      ctx.lineWidth = (0.7 + e.weight * 2.6) / Math.max(view.scale, 0.6);
      var dx = e.t.x - e.s.x;
      var dy = e.t.y - e.s.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / d;
      var uy = dy / d;
      var ex = e.t.x - ux * (e.t.radius + 3);
      var ey = e.t.y - uy * (e.t.radius + 3);
      ctx.beginPath();
      ctx.moveTo(e.s.x + ux * e.s.radius, e.s.y + uy * e.s.radius);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Arrowhead: direction is the whole point of this layer.
      var head = (4 + e.weight * 4) / Math.max(view.scale, 0.6);
      var ang = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - head * Math.cos(ang - Math.PI / 7), ey - head * Math.sin(ang - Math.PI / 7));
      ctx.lineTo(ex - head * Math.cos(ang + Math.PI / 7), ey - head * Math.sin(ang + Math.PI / 7));
      ctx.closePath();
      ctx.fillStyle = EDGE_LINK;
      ctx.fill();
    });

    sim.nodes.forEach(function (n) {
      ctx.globalAlpha = 1;
      if (n.state === "unscanned") {
        // Secondary encoding — "no link data" is distinguishable without colour.
        ctx.setLineDash([2.5 / view.scale, 2.5 / view.scale]);
        ctx.strokeStyle = NODE_UNSCANNED;
        ctx.lineWidth = 1.2 / view.scale;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = n.state === "linked" ? NODE_LINKED : NODE_SCANNED;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = SURFACE;
        ctx.lineWidth = 2 / view.scale;
        ctx.stroke();
      }
    });

    // Selective labels, biggest first, dropped on collision. A name on every
    // node is an unreadable thicket; none at all makes the map useless.
    var placed = [];
    var fontSize = Math.max(10, 11 / view.scale);
    ctx.font = fontSize + "px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    sim.nodes
      .slice()
      .sort(function (p, q) { return q.radius - p.radius; })
      .forEach(function (n) {
        if (n.radius < 9) return;
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
  }

  /* ------------------------------------------------------------------ boot */

  function start(graph) {
    var sim = build(graph);
    var dpr = window.devicePixelRatio || 1;
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
    // gets an empty black box. Unhiding first costs nothing visually: the
    // measure/settle/draw below all run in this same task, so the browser
    // paints once, already formed.
    section.hidden = false;

    resize();
    window.addEventListener("resize", function () { resize(); fit(sim, w, h); });

    // Settle before the first paint so it arrives formed rather than exploding
    // outward while the visitor watches.
    for (var i = 0; i < 600; i++) step(sim);
    fit(sim, w, h);
    draw(sim, w, h);

    if (reduceMotion) return; // settled still frame is the whole experience

    var frames = 0;
    (function loop() {
      // Keep drifting gently, but stop the simulation once it has cooled — a
      // marketing page should not burn a core forever in a background tab.
      if (frames++ < 2400 && !document.hidden) {
        step(sim);
        draw(sim, w, h);
      }
      requestAnimationFrame(loop);
    })();

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

  function describe(stats) {
    // State the coverage of BOTH layers. The link half already said so; the
    // semantic half did not, and claimed more than it delivered: "position is
    // embedding similarity" was true of the 145 sites that have a centroid and
    // false of the other 1,341, which have no edges at all and therefore never
    // leave their starting point — and that point is hashHost(host), a hash of
    // the domain name. An arbitrary-but-stable position looks exactly like a
    // meaningful one, which is the worst way for a visualization to be wrong.
    var s = stats.sites.toLocaleString();
    return (
      s + " sites · " +
      stats.linkEdges.toLocaleString() + " hyperlinks found between them · " +
      stats.semanticEdges.toLocaleString() + " semantic ties. Size is pages indexed. " +
      "Embeddings are mapped for " + stats.sitesWithCentroid.toLocaleString() + " of " + s +
      " sites — those sit near the sites they resemble. The rest are parked on a ring " +
      "until theirs are computed, so their position carries no meaning yet. " +
      "Link data covers " + stats.sitesWithLinkScan.toLocaleString() + " of " + s +
      " sites, so a dashed circle means we have not mapped that site's links yet — not that it links nowhere."
    );
  }

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
})();
