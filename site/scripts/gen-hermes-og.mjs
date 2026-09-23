#!/usr/bin/env node
/**
 * Bespoke Open Graph cards for the Hosted Hermes pages.
 *
 *   scripts/og-assets/bespoke/hermes-agents.jpg
 *   scripts/og-assets/bespoke/hosted-hermes-on-cloudflare.jpg
 *
 * gen-og-images.mjs COPIES these (see BESPOKE there) instead of composing its
 * generic robot-plate card, and it wipes + rebuilds every card on each run —
 * so regenerate here, then run gen-og-images.mjs.
 *
 * The cards carry the REAL marks of the three parties, side by side:
 *   - Divinci: the renaissance robot from the site header
 *   - Hermes Agent (Nous Research): the mark from LobeHub's
 *     MIT-licensed icon set (lobehub.com/icons/hermesagent)
 *   - Cloudflare: static/brand/vendors/cloudflare.svg
 * Beside them sits the page's own Leonardo notebook art, so the card is the
 * page's identity rather than a description of it.
 *
 *   node scripts/gen-hermes-og.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATIC = join(HERE, "..", "static");
const OUT = join(HERE, "og-assets", "bespoke");
const BASE = pathToFileURL(STATIC + "/").href;
const R2 = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev";

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
    .left { position: absolute; left: 60px; top: 50px; width: 520px; }
    .lockup { display: flex; align-items: center; gap: 16px; margin-bottom: 30px; }
    .lockup .x { font: 500 26px/1 'Fraunces', serif; color: #b09a7c; }
    .robot { width: 92px; height: 92px; margin: -8px -6px -8px -10px; object-fit: contain; }
    .hermes-mark { width: 80px; height: 80px; object-fit: contain; }
    .cf { width: 60px; height: 60px; object-fit: contain; }
    .eyebrow { font: 700 15px/1 'Source Sans 3'; letter-spacing: .24em; color: #9a6b2f; text-transform: uppercase; }
    .rule { width: 230px; height: 3px; margin: 16px 0 20px; background: linear-gradient(90deg, #9a6b2f, transparent); }
    h1 { font: 600 48px/1.07 'Fraunces', serif; letter-spacing: -.015em; margin: 0 0 16px; }
    .sub { font-size: 21px; line-height: 1.42; color: #5a4a3a; margin: 0; }
    .foot { position: absolute; left: 60px; bottom: 42px; font: 700 21px/1 'Source Sans 3'; color: #9a6b2f; }
    .art { position: absolute; left: 620px; top: 60px; width: 530px; height: 510px; border-radius: 16px; overflow: hidden;
      border: 1px solid #e8ddc7; box-shadow: 0 18px 50px rgba(30,58,43,.16); background-size: auto 118%; }
  </style>`;

const LOCKUP = `
  <div class="lockup">
    <img class="robot" src="${R2}/images/divinci-renaissance_no-bg.webp" alt="">
    <span class="x">×</span>
    <img class="hermes-mark" src="brand/vendors/hermes-agent-mark.svg" alt="">
    <span class="x">×</span>
    <img class="cf" src="brand/vendors/cloudflare.svg" alt="">
  </div>`;

const cards = {
  "hermes-agents": `
    <div class="left">${LOCKUP}
      <div class="eyebrow">Hosted Hermes Agents</div><div class="rule"></div>
      <h1>Your own Hermes agent, isolated in the cloud</h1>
      <p class="sub">One agent, one Cloudflare Sandbox. Chat in Divinci, or connect a local Hermes through a per-agent proxy.</p>
    </div>
    <div class="foot">divinci.ai/hermes-agents</div>
    <div class="art" style="background-image:url('${R2}/images/hosted-hermes-hero-poster.webp'); background-position: 74% 30%"></div>`,
  "hosted-hermes-on-cloudflare": `
    <div class="left">${LOCKUP}
      <div class="eyebrow">Divinci Journal</div><div class="rule"></div>
      <h1>Hosted Hermes on Cloudflare: one agent, one sandbox</h1>
      <p class="sub">How we run Nous Research's Hermes Agent per customer, and the two trust boundaries that keep agents apart.</p>
    </div>
    <div class="foot">divinci.ai/blog</div>
    <div class="art" style="background-image:url('${R2}/images/hosted-hermes-on-cloudflare-hero.webp'); background-position: 74% 30%"></div>`,
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [slug, body] of Object.entries(cards)) {
    // Written to a real file (not setContent) so file:// assets under static/ load.
    const tmp = join(tmpdir(), `hermes-og-${slug}-${process.pid}.html`);
    await writeFile(tmp, `<!doctype html><html><head><base href="${BASE}">${FRAME}</head><body>${body}</body></html>`);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await rm(tmp);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    });
    await page.waitForTimeout(1500);
    const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
    if (broken.length) throw new Error(`${slug}: images failed to load: ${broken.join(", ")}`);
    const out = join(OUT, `${slug}.jpg`);
    await page.screenshot({ path: out, type: "jpeg", quality: 88 });
    console.warn(`wrote ${out}`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
