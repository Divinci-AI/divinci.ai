/**
 * Does /trustbench/ fit on a phone?
 *
 * ── Why it measures instead of screenshotting ─────────────────────────────
 * The defect this was written for was INVISIBLE in a screenshot and silent in
 * the browser: on a 375px viewport the table's right edge sat at 384px against
 * a container ending at 375, so `.tb-verify` — the "signed manifest →" link,
 * which is the entire point of the page — was clipped off-screen. The document
 * did NOT scroll horizontally, so nothing announced it. The column was simply
 * gone, and the page looked fine.
 *
 * So it walks every element under .tb-wrap and reports anything whose box
 * escapes the viewport, rather than relying on someone noticing.
 *
 * ⚠️ Point it at a REAL ORIGIN. Against a local static server the board fetch
 * is refused by CORS, no table renders, and the check passes with zero
 * offenders because there is nothing to overflow — a vacuous green. Run it
 * against staging or production.
 *
 *   TB_URL=https://staging.divinci.ai/trustbench/ node scripts/check-trustbench-mobile.mjs
 *
 * Screenshots land in /tmp/tbmobile/ for eyeballing after the numbers pass.
 */
import { chromium } from '@playwright/test';

const URL = process.env.TB_URL || 'https://divinci.ai/trustbench/';
const VIEWPORTS = [
  { name: 'iphone-se',  width: 375, height: 812 },
  { name: 'iphone-pro', width: 393, height: 852 },
  { name: 'tablet',     width: 768, height: 1024 },
];

const browser = await chromium.launch();
const report = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  // networkidle never settles — the chat widget holds a connection open.
  await page.goto(URL + '?cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
  // Wait for the boards to actually render rather than for a fixed delay.
  await page.waitForFunction(() => document.querySelectorAll('.tb-board').length > 0, null, { timeout: 25000 })
    .catch(() => console.error('  (boards never rendered — measuring anyway)'));
  await page.waitForTimeout(800);

  // Measure, don't eyeball: what actually overflows the viewport?
  const m = await page.evaluate((vw) => {
    const doc = document.documentElement;
    const offenders = [];
    for (const el of document.querySelectorAll('.tb-wrap *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 40),
          left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
          text: (el.textContent || '').trim().slice(0, 34),
        });
      }
    }
    const tbl = document.querySelector('.tb-table');
    return {
      docScrollW: doc.scrollWidth,
      viewportW: vw,
      horizontalScroll: doc.scrollWidth > vw + 1,
      tableW: tbl ? Math.round(tbl.getBoundingClientRect().width) : null,
      boards: document.querySelectorAll('.tb-board').length,
      offenders: offenders.slice(0, 12),
    };
  }, vp.width);

  report.push({ viewport: vp.name, ...m });
  await page.screenshot({ path: `/tmp/tbmobile/${vp.name}.png`, fullPage: false });
  await page.screenshot({ path: `/tmp/tbmobile/${vp.name}-full.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
