#!/usr/bin/env node
/**
 * Bespoke Open Graph cards for the TrustBench pages.
 *
 *   scripts/og-assets/bespoke/trustbench.jpg
 *   scripts/og-assets/bespoke/what-a-benchmark-has-to-prove-about-itself.jpg
 *
 * gen-og-images.mjs COPIES these (see BESPOKE there) instead of composing its
 * generic robot-plate card, and it wipes + rebuilds every card on each run —
 * so a card dropped straight into static/images/og/ would be lost on the next
 * run. Regenerate with this script, then run gen-og-images.mjs.
 *
 * Rendered as HTML in the site's own type (Fraunces / Source Sans 3), with the
 * real crest sprite and the real vendor marks, so the card is the page's
 * identity rather than a description of it.
 *
 * The /trustbench/ card shows live board rows and therefore goes stale. It
 * says so ON the card ("as of <date>") — the page's honesty rule is that a
 * number is never shown without saying when it was true.
 *
 *   node scripts/gen-trustbench-og.mjs
 */
import { chromium } from "playwright";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATIC = join(HERE, "..", "static");
const OUT = join(HERE, "og-assets", "bespoke");
const API = "https://api.divinci.app/v1/trustbench/public/leaderboard";
const SPRITE = await readFile(join(STATIC, "brand/trustbench/trustbench-marks-sprite.svg"), "utf8");
const BASE = pathToFileURL(STATIC + "/").href;

// Same mappings as templates/partials/trustbench-boards-script.html.
const PUBLISHER = { "deepseek-ai": "deepseek", google: "gemma", meta: "meta", mistralai: "mistralai",
  moonshotai: "kimi", nvidia: "nvidia", openai: "openai", qwen: "qwen", "zai-org": "zai" };
const STACK = [["vertex-ai", "brand/companies/google.svg"], ["qdrant", "brand/vendors/qdrant.svg"],
  ["cloudflare", "brand/vendors/cloudflare.svg"], ["divinci-pageindex", "brand/vendors/pageindex.png"]];
const modelLogo = (id) => { const m = /^@cf\/([^/]+)\//.exec(id || ""); const n = m ? PUBLISHER[m[1]] : /^gemini/.test(id || "") ? "google" : null; return n ? `brand/companies/${n}.svg` : null; };
const stackLogo = (id) => (STACK.find(([p]) => (id || "").startsWith(p)) || [])[1] || null;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const colour = (g) => (g >= 0.75 ? "#2d5a4f" : g >= 0.4 ? "#c08850" : "#a8433a");

async function boards() {
  const res = await fetch(API, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`API ${res.status}, non-JSON: ${text.slice(0, 160)}`); }
  if (!res.ok || !data.boards?.length) throw new Error(`API ${res.status}: no boards`);
  return data;
}

const FRAME = `
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=block">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
    body { font-family: 'Source Sans 3', sans-serif; color: #1e3a2b; -webkit-font-smoothing: antialiased;
      background:
        linear-gradient(rgba(30,58,43,.045) 1px, transparent 1px) 0 0 / 40px 40px,
        linear-gradient(90deg, rgba(30,58,43,.045) 1px, transparent 1px) 0 0 / 40px 40px,
        #f6f1e8; }
    .left { position: absolute; left: 64px; top: 58px; width: 480px; }
    .crest { width: 74px; height: 74px; color: #1e3a2b; display: block; margin-bottom: 26px; }
    .eyebrow { font: 700 15px/1 'Source Sans 3'; letter-spacing: .24em; color: #9a6b2f; text-transform: uppercase; }
    .rule { width: 230px; height: 3px; margin: 16px 0 22px; background: linear-gradient(90deg, #9a6b2f, transparent); }
    h1 { font: 600 52px/1.06 'Fraunces', serif; letter-spacing: -.015em; margin: 0 0 18px; }
    .sub { font-size: 22px; line-height: 1.42; color: #5a4a3a; margin: 0; }
    .foot { position: absolute; left: 64px; bottom: 44px; font: 700 21px/1 'Source Sans 3'; color: #9a6b2f; letter-spacing: .01em; }
    .family { display: flex; gap: 12px; margin-top: 26px; }
    .family svg { width: 34px; height: 34px; color: #1e3a2b; opacity: .9; }
    .card { position: absolute; background: #fff; border: 1px solid #e8ddc7; border-radius: 16px; box-shadow: 0 18px 50px rgba(30,58,43,.12); }
    .bh { display: flex; align-items: center; gap: 12px; padding: 20px 22px 12px; }
    .bh svg { width: 30px; height: 30px; color: #1e3a2b; flex: none; }
    .bh b { font: 600 19px/1.2 'Fraunces', serif; }
    .row { display: flex; align-items: center; gap: 12px; padding: 13px 22px; border-top: 1px solid #f0e8d8; background-repeat: no-repeat; }
    .rk { width: 16px; color: #8a7a68; font-size: 15px; }
    .lg { width: 20px; height: 20px; object-fit: contain; flex: none; }
    .pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 11px; border: 1px solid #e8ddc7; border-radius: 999px; font-size: 15px; background: rgba(255,255,255,.75); white-space: nowrap; }
    .pill img { width: 16px; height: 16px; object-fit: contain; }
    .sc { margin-left: auto; font: 700 24px/1 'Source Sans 3'; font-variant-numeric: tabular-nums; }
    .ok { font-size: 13px; color: #2d5a4f; white-space: nowrap; }
    .note { padding: 11px 22px 15px; font-size: 13.5px; color: #8a7a68; border-top: 1px solid #f0e8d8; }
  </style>`;

function rowsHtml(b, rows, { showModel }) {
  return rows.map((r) => {
    const lo = b.rangeMin, hi = b.rangeMax;
    let g = (r.score - lo) / (hi - lo); g = Math.max(0, Math.min(1, b.higherIsBetter ? g : 1 - g));
    const c = colour(g), pct = (g * 100).toFixed(1);
    const ml = modelLogo(r.modelId), sl = stackLogo(r.retrievalStackId);
    return `<div class="row" style="background-image:linear-gradient(90deg, color-mix(in srgb, ${c} 11%, transparent) 0 ${pct}%, transparent ${pct}%)">
      <span class="rk">${r.rank}</span>
      ${showModel && ml ? `<img class="lg" src="${ml}">` : ""}
      ${r.retrievalStackId
        ? `<span class="pill">${sl ? `<img src="${sl}">` : ""}${esc(r.retrievalStackLabel || r.retrievalStackId)}</span>`
        : `<span class="pill" style="border-style:dashed;color:#8a7a68">no retrieval — the control</span>`}
      <span class="sc" style="color:${c}">${(r.score * 100).toFixed(1)}%</span>
      <span class="ok">signed ✓</span></div>`;
  }).join("");
}

function markFor(b) {
  const s = `${b.slug} ${b.name}`.toLowerCase();
  return s.includes("retrieval") ? "retrieval" : s.includes("red team") ? "redteam" : "trustbench";
}

async function main() {
  const data = await boards();
  const asOf = new Date(data.generatedAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const fuhrman = data.boards.find((x) => /fuhrman/i.test(x.benchmark.name));
  const sdk = data.boards.find((x) => /sdk docs/i.test(x.benchmark.name));
  if (!fuhrman || !sdk) throw new Error("expected the Fuhrman and SDK Docs boards");

  const cards = {
    trustbench: `
      <div class="left">
        <svg class="crest"><use href="#tb-trustbench"/></svg>
        <div class="eyebrow">Divinci TrustBench</div><div class="rule"></div>
        <h1>Attested AI benchmarks</h1>
        <p class="sub">Every score links to a signed manifest you can verify yourself. No account, no trust in us.</p>
        <div class="family">${["trustbench", "redteam", "extraction", "grounding", "retrieval", "erasure"].map((s) => `<svg><use href="#tb-${s}"/></svg>`).join("")}</div>
      </div>
      <div class="foot">divinci.ai/trustbench</div>
      <div class="card" style="left:590px; top:92px; width:560px">
        <div class="bh"><svg><use href="#tb-${markFor(fuhrman.benchmark)}"/></svg><b>Nutrition corpus — retrieval QA</b></div>
        ${rowsHtml(fuhrman.benchmark, fuhrman.rows.slice(0, 4), { showModel: false })}
        <div class="note">Same model on every row · as of ${esc(asOf)}</div>
      </div>`,

    "what-a-benchmark-has-to-prove-about-itself": `
      <div style="position:absolute; right:0; top:0; width:640px; height:630px;
        background: url('https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/what-a-benchmark-has-to-prove-about-itself-hero-poster.webp') 58% 45% / cover;"></div>
      <div style="position:absolute; right:0; top:0; width:640px; height:630px;
        background: linear-gradient(90deg, #f6f1e8 0%, rgba(246,241,232,.55) 16%, rgba(246,241,232,0) 38%);"></div>
      <div class="left" style="width:500px">
        <svg class="crest" style="width:64px;height:64px;margin-bottom:22px"><use href="#tb-retrieval"/></svg>
        <div class="eyebrow">Research · TrustBench</div><div class="rule"></div>
        <h1 style="font-size:50px">What a Benchmark Has to Prove About Itself</h1>
        <p class="sub">A score can be honest and still mean nothing. The unit of trust is the manifest.</p>
      </div>
      <div class="foot">divinci.ai</div>
      <div class="card" style="left:640px; top:392px; width:500px">
        ${rowsHtml(sdk.benchmark, sdk.rows.slice(0, 3), { showModel: false })}
      </div>`,
  };

  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [name, body] of Object.entries(cards)) {
    // Loaded from a FILE, not setContent: an about:blank document may not read
    // file:// resources, so every logo and the hero art came back broken.
    const tmp = join(tmpdir(), `tb-og-${name}.html`);
    await writeFile(tmp, `<!doctype html><html><head><base href="${BASE}">${FRAME}</head><body>${SPRITE}${body}</body></html>`);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await rm(tmp);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    });
    // CSS backgrounds are not in document.images; give the hero art time to land.
    await page.waitForTimeout(1500);
    const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src")));
    if (broken.length) throw new Error(`${name}: broken images ${broken.join(", ")}`);
    const out = join(OUT, `${name}.jpg`);
    await page.screenshot({ path: out, type: "jpeg", quality: 88 });
    console.log(`wrote ${out}`);
  }
  await browser.close();
}

main().catch((e) => { console.error(`gen-trustbench-og: ${e.message}`); process.exit(1); });
