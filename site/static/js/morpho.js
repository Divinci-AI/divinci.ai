/**
 * Morpho glyph — a minimal take on MorphoHDL, one per crawled website.
 *
 * MorphoHDL (github.com/paradigms-of-intelligence/morpho) grows circuit
 * structure through recursive cell division and rewiring rather than laying
 * it out from a fixed plan. That is a genuinely good fit for a crawler: a
 * crawl also starts from one seed and subdivides outward through a site it
 * has not seen yet. So each glyph GROWS — it is not a spinner.
 *
 * Kept to the two ideas that carry the metaphor at 26px:
 *   1. recursive division  — a cell splits into subcells, generation by generation
 *   2. rewiring            — each split leaves a port pair wired across the seam
 * No SwissGL, no force layout, no dependencies.
 *
 * DELIBERATELY FRAMEWORK-AGNOSTIC. The core touches nothing but a <canvas>
 * and its 2D context, so lifting this into workspace/sdk/packages/morpho for
 * the React app is adding `export` to the two public functions — no rewrite,
 * no React, no build step. (There is no existing morpho implementation in the
 * web app to share with today; this is written to become that shared core.)
 *
 * Structure is a pure function of the hostname, so a site's glyph is stable
 * across reloads and machines — kubernetes.io always looks like kubernetes.io.
 */
(function (root) {
  "use strict";

  // 4 generations => up to ~16 cells. More is mush at this size.
  var MAX_GEN = 4;
  var SPLIT_CHANCE = 0.72;
  // Generations 1-2 always divide. Leaving the first split to chance made it a
  // single point of failure: one failed roll (28% of hosts) left an undivided
  // cell that could never split again, because later generations only consider
  // leaves from the generation before. Those hosts rendered as an identical
  // empty box — the opposite of a per-site glyph.
  var FORCED_GENS = 2;
  // Sentinel for "never subdivided". A finite number rather than Infinity so
  // structures stay JSON-comparable in tests.
  var NEVER = 99;
  // One growth cycle for an actively-fetching site.
  var CYCLE_MS = 5200;

  /** FNV-1a. Small, dependency-free, and good enough to decorrelate hosts. */
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  /** mulberry32 — tiny seeded PRNG so structure is reproducible. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Grow the structure for a host: recursively divide the unit square,
   * recording each split so the renderer can reveal them generation by
   * generation. Returns cells (leaves) and seams (the rewiring).
   */
  function buildStructure(host) {
    var rand = rng(hashString(host));
    var root = { x: 0, y: 0, w: 1, h: 1, born: 0, died: NEVER };
    // EVERY cell ever created, not just the final leaves. A leaves-only list
    // cannot be drawn at a partial growth level: revealing generation 2 would
    // skip any region that went on to subdivide further, because the parent
    // covering it no longer exists — the glyph came out full of holes instead
    // of showing a coarser tiling. Recording born/died lets the renderer
    // reconstruct the complete tiling at any generation.
    var all = [root];
    var live = [root];
    var seams = [];

    for (var gen = 1; gen <= MAX_GEN; gen++) {
      var next = [];
      for (var i = 0; i < live.length; i++) {
        var c = live[i];
        // A cell that stops splitting is what gives each host an uneven
        // silhouette instead of a uniform grid — but not before FORCED_GENS,
        // so every glyph has real structure to show.
        if (gen > FORCED_GENS && rand() > SPLIT_CHANCE) {
          next.push(c);
          continue;
        }
        // Split the longer axis so cells stay roughly square and legible.
        var vertical = c.w >= c.h;
        var ratio = 0.34 + rand() * 0.32;
        var a, b;
        if (vertical) {
          var lw = c.w * ratio;
          a = { x: c.x, y: c.y, w: lw, h: c.h, born: gen, died: NEVER };
          b = { x: c.x + lw, y: c.y, w: c.w - lw, h: c.h, born: gen, died: NEVER };
          seams.push({ gen: gen, x: c.x + lw, y: c.y + c.h * 0.5 });
        } else {
          var th = c.h * ratio;
          a = { x: c.x, y: c.y, w: c.w, h: th, born: gen, died: NEVER };
          b = { x: c.x, y: c.y + th, w: c.w, h: c.h - th, born: gen, died: NEVER };
          seams.push({ gen: gen, x: c.x + c.w * 0.5, y: c.y + th });
        }
        c.died = gen;
        all.push(a, b);
        next.push(a, b);
      }
      live = next;
    }
    return { cells: all, seams: seams, leaves: live };
  }

  // ── shared animation loop ───────────────────────────────────────────────
  // One rAF for every glyph on the page. Dozens of independent loops is how a
  // decorative visual turns into a battery complaint.
  var live = [];
  var frame = null;

  function tick() {
    frame = null;
    var now = Date.now();
    var wantMore = false;
    for (var i = 0; i < live.length; i++) {
      if (live[i].draw(now)) wantMore = true;
    }
    if (wantMore && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame === null && !document.hidden) frame = requestAnimationFrame(tick);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) wake();
  });

  /**
   * Per-host growth clock. The banner re-renders every poll (~15s), which
   * destroys and rebuilds these canvases — without a persistent start time
   * every glyph would snap back to a seed on each refresh and never appear
   * to grow at all.
   */
  var births = Object.create(null);

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  /**
   * Mount a glyph on a canvas.
   *
   *   host    : hostname — seeds the structure (required)
   *   size    : CSS px, default 26
   *   active  : true = grow on a loop (being fetched now)
   *   growth  : 0..1 static fill when not active (how much we indexed)
   *   color   : stroke colour
   */
  function createGlyph(canvas, opts) {
    if (!canvas || !canvas.getContext) return null;
    var o = opts || {};
    var host = String(o.host || "");
    var size = o.size || 26;
    var color = o.color || "#7c7ca0";
    var active = !!o.active;
    var staticGrowth = typeof o.growth === "number" ? Math.max(0, Math.min(1, o.growth)) : 1;

    var ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Cap DPR: past ~2 the extra pixels are invisible at this size and the
    // fill cost is real when a page carries a dozen glyphs.
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    var struct = buildStructure(host);
    var still = prefersReducedMotion();
    if (!births[host]) births[host] = Date.now();

    function paint(growth) {
      var pad = 2 * dpr;
      var box = size * dpr - pad * 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = Math.max(1, dpr * 0.75);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      var revealed = growth * MAX_GEN;
      var whole = Math.floor(revealed);
      var partial = revealed - whole;

      // Draw the complete tiling as it stood at generation `whole` — cells
      // already born and not yet subdivided — then fade in the next
      // generation on top. This always covers the full square.
      for (var i = 0; i < struct.cells.length; i++) {
        var c = struct.cells[i];
        var alpha = c.born <= whole && c.died > whole ? 1 : c.born === whole + 1 ? partial : 0;
        if (alpha <= 0.01) continue;
        ctx.globalAlpha = alpha * 0.85;
        ctx.strokeRect(
          pad + c.x * box + ctx.lineWidth / 2,
          pad + c.y * box + ctx.lineWidth / 2,
          Math.max(0, c.w * box - ctx.lineWidth),
          Math.max(0, c.h * box - ctx.lineWidth)
        );
      }

      // Seams: the rewiring. A dot on the split line reads, at this size, as
      // a port — enough to say "connected", not so much as to become noise.
      for (var j = 0; j < struct.seams.length; j++) {
        var s = struct.seams[j];
        if (s.gen > whole + 1) continue;
        var a2 = s.gen <= whole ? 1 : partial;
        if (a2 <= 0.01) continue;
        ctx.globalAlpha = a2;
        ctx.beginPath();
        ctx.arc(pad + s.x * box, pad + s.y * box, Math.max(0.8, dpr * 0.9), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    var glyph = {
      /** Returns true while it still wants frames. */
      draw: function (now) {
        if (!active || still) {
          paint(still && active ? 1 : staticGrowth);
          return false;
        }
        var t = ((now - births[host]) % CYCLE_MS) / CYCLE_MS;
        // Ease out, then hold the finished structure for the last third of
        // the cycle — a glyph that restarts the instant it completes reads as
        // a loading spinner rather than something being built.
        var g = t < 0.66 ? 1 - Math.pow(1 - t / 0.66, 3) : 1;
        paint(g);
        return true;
      },
      destroy: function () {
        var k = live.indexOf(glyph);
        if (k !== -1) live.splice(k, 1);
      },
    };

    live.push(glyph);
    glyph.draw(Date.now());
    if (active && !still) wake();
    return glyph;
  }

  /**
   * Map a page count to glyph complexity. Log scale: the interesting range is
   * 1..500 pages, and linear would render everything under ~100 identically.
   */
  function growthForPages(pages) {
    var n = typeof pages === "number" && pages > 0 ? pages : 0;
    // Floor at 0.5, not 0. Growth resolves to whole generations, so anything
    // below ~0.5 renders as one or two cells — which reads as a broken glyph
    // rather than a small crawl. The legible band is generations 2..4, so map
    // into that and let the count text carry the precise number.
    if (n === 0) return 0.5; // crawled, nothing new — a seed structure
    return Math.min(1, 0.55 + 0.45 * (Math.log(n + 1) / Math.log(400)));
  }

  root.DivinciMorpho = {
    createGlyph: createGlyph,
    growthForPages: growthForPages,
    // Exported for tests — structure must be deterministic per host.
    _buildStructure: buildStructure,
    _hashString: hashString,
  };
})(typeof window !== "undefined" ? window : this);
