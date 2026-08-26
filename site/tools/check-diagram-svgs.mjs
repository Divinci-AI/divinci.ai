#!/usr/bin/env node
/**
 * Renders each hand-authored diagram SVG in headless Chrome and asserts three
 * things that a static read of the file cannot tell you:
 *
 *   1. no <text> element overlaps another <text> element,
 *   2. no <text> element spills outside the viewBox,
 *   3. every fill/stroke colour is on the Divinci palette.
 *
 * Every one of these had already gone wrong in the wild — the release-cycle and
 * qa-pipeline diagrams shipped with five text collisions between them and a
 * blue/purple/cyan palette belonging to no part of the brand. They render
 * "fine" as XML; you only see it when something actually lays the text out.
 *
 * Usage: node tools/check-diagram-svgs.mjs [--json]
 */
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";

const run = promisify(execFile);

// The diagrams this guard owns. Brand assets (regulator logos, vendor marks)
// legitimately use other companies' colours and are deliberately not listed.
const DIAGRAMS = [
  "autorag-diagram.svg",
  "autorag-data-creation.svg",
  "autorag-retrieval-evaluation.svg",
  "autorag-generation-optimization.svg",
  "release-cycle-diagram.svg",
  "qa-pipeline-diagram.svg",
  "arch-vector-search.svg",
  "arch-hybrid-search.svg",
  "arch-reranking.svg",
  "arch-agentic-rag.svg",
];

// Greens, tans, creams and the neutrals that pair with them.
const PALETTE = new Set([
  "#1e3a2b", "#2d5a4f", "#2d3c34", "#3d4f45", "#5c4a3a",
  "#6b5a45", "#7d6a52", "#8b7659", "#a08e74",
  "#b8a080", "#c4b394", "#c9b894", "#d5c8ae", "#d8c8a8", "#d9cdb8",
  "#ddd0ba", "#dfd6c6", "#e2d8c6", "#e6dccb", "#e8ddc7", "#e8dfd0",
  "#ece5d8", "#f0e8d9", "#f4efe6", "#f6f1e8", "#faf6ef", "#fdfbf7",
  "#ffffff", "#cfd8d1",
  "none", "transparent",
]);

const CHROME =
  process.env.CHROME_BIN ||
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

const PROBE = `
  const svg = document.querySelector('svg');
  const vb = svg.viewBox.baseVal;
  // Lay the SVG out at 1 user unit == 1 CSS px so screen-space measurements are
  // directly comparable to viewBox coordinates.
  svg.setAttribute('width', vb.width);
  svg.setAttribute('height', vb.height);

  // getBoundingClientRect, NOT getBBox: getBBox reports coordinates in the
  // element's own user space, so two <text> nodes inside differently
  // translated <g> wrappers compare as though they sat on top of each other.
  const svgBox = svg.getBoundingClientRect();
  const texts = [...svg.querySelectorAll('text')];
  const boxes = texts.map(t => {
    const r = t.getBoundingClientRect();
    return { s: (t.textContent || '').trim().slice(0, 40),
             x: r.left - svgBox.left, y: r.top - svgBox.top,
             w: r.width, h: r.height };
  });

  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      // 1px of slack: adjacent baselines and tight kerning legitimately touch.
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 1 && oy > 1) {
        overlaps.push({ a: a.s, b: b.s, area: Math.round(ox * oy) });
      }
    }
  }

  const outside = boxes.filter(b =>
    b.x < -1 || b.y < -1 ||
    b.x + b.w > vb.width + 1 || b.y + b.h > vb.height + 1
  ).map(b => b.s);

  // Does any label outgrow the card or chip it sits in? This is the failure a
  // translation causes first — German and French run 20-30% longer than the
  // English the layout was measured against, and the text silently spills over
  // the edge of its box. For each label, find the smallest <rect> that contains
  // its midpoint and treat that as its container.
  const rects = [...svg.querySelectorAll('rect')].map(r => {
    const b = r.getBoundingClientRect();
    return { x: b.left - svgBox.left, y: b.top - svgBox.top, w: b.width, h: b.height };
  });
  const PAD = 3;
  const spills = [];
  for (const t of boxes) {
    const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
    let host = null;
    for (const r of rects) {
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
        if (!host || r.w * r.h < host.w * host.h) host = r;
      }
    }
    if (!host) continue;           // free-floating captions have no container
    const over = Math.round(Math.max(host.x + PAD - t.x, t.x + t.w - (host.x + host.w - PAD)));
    if (over > 0) spills.push({ s: t.s, over });
  }

  document.title = JSON.stringify({ textCount: boxes.length, overlaps, outside, spills });
`;

function offPalette(source) {
  const bad = new Map();
  // Colours in presentation attributes and in the internal <style> block alike.
  // rgb()/rgba()/hsl() are matched whole — a naive [^)] class stops at the first
  // comma and reports a colour of "rgb(248".
  const COLOUR = /(?:fill|stroke|flood-color)\s*[:=]\s*"?((?:rgba?|hsla?)\([^)]*\)|[^";,\s)]+)"?/gi;
  for (const m of source.matchAll(COLOUR)) {
    const v = m[1].toLowerCase();
    if (v.startsWith("url(") || v === "currentcolor" || v.startsWith("var(")) continue;
    if (!PALETTE.has(v)) bad.set(v, (bad.get(v) || 0) + 1);
  }
  return [...bad.entries()].map(([c, n]) => `${c} (x${n})`);
}

const imagesDir = path.resolve("static/images");

// Validate the generated per-locale copies too: a translation that outgrows its
// card is exactly the failure this guard exists to catch.
{
  const { readdir } = await import("node:fs/promises");
  const present = new Set(await readdir(imagesDir));
  for (const base of [...DIAGRAMS]) {
    const stem = base.replace(/\.svg$/, "");
    for (const loc of ["ar", "es", "fr"]) {
      const f = `${stem}.${loc}.svg`;
      if (present.has(f)) DIAGRAMS.push(f);
    }
  }
}
const work = await mkdtemp(path.join(tmpdir(), "svgcheck-"));
const results = [];

for (const name of DIAGRAMS) {
  const file = path.join(imagesDir, name);
  const source = await import("node:fs/promises").then(fs => fs.readFile(file, "utf8"));

  const harness = path.join(work, name.replace(/\.svg$/, "") + ".html");
  await writeFile(
    harness,
    `<body style="margin:0">${source.replace(/<\?xml[^>]*\?>/, "")}` +
      `<script>addEventListener('load',()=>{${PROBE}});</script></body>`,
  );

  const { stdout } = await run(
    CHROME,
    ["--headless", "--disable-gpu", "--dump-dom", "--virtual-time-budget=3000",
     "file://" + harness],
    { maxBuffer: 64 * 1024 * 1024 },
  );

  const title = stdout.match(/<title>([\s\S]*?)<\/title>/);
  if (!title) {
    results.push({ name, error: "probe did not run" });
    continue;
  }
  const decoded = title[1]
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
  results.push({ name, ...JSON.parse(decoded), palette: offPalette(source) });
}

await rm(work, { recursive: true, force: true });

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
} else {
  let failed = 0;
  for (const r of results) {
    const problems = [];
    if (r.error) problems.push(r.error);
    for (const o of r.overlaps || []) problems.push(`text overlap: "${o.a}" x "${o.b}" (${o.area}px²)`);
    for (const o of r.outside || []) problems.push(`outside viewBox: "${o}"`);
    for (const o of r.spills || []) problems.push(`label overflows its box by ${o.over}px: "${o.s}"`);
    for (const c of r.palette || []) problems.push(`off-palette colour: ${c}`);

    if (problems.length) {
      failed++;
      console.log(`✘ ${r.name}  (${r.textCount ?? "?"} text nodes)`);
      for (const p of problems) console.log(`    ${p}`);
    } else {
      console.log(`✔ ${r.name}  (${r.textCount} text nodes, no overlaps, on palette)`);
    }
  }
  process.exit(failed ? 1 : 0);
}
