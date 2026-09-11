// Render PNG exports of the Open Web Vector Initiative brand SVGs with the
// site's Playwright Chromium. Run after scripts/build-owv-brand.py:
//
//   node scripts/render-owv-brand.mjs
//
// The PNGs are what the GitHub README and the Hugging Face dataset cards embed:
// both render Markdown in a theme the SVG cannot see, and Hugging Face strips
// <picture>, so the banner carries its own navy plate.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(new URL('.', import.meta.url).pathname, '../static/brand/open-web-vectors');
const jobs = [
  { svg: 'owv-mark-dark.svg', png: 'owv-mark-dark-512.png', width: 512 },
  { svg: 'owv-mark-light.svg', png: 'owv-mark-light-512.png', width: 512 },
  { svg: 'owv-logo-dark.svg', png: 'owv-logo-dark.png', width: 1200 },
  { svg: 'owv-logo-light.svg', png: 'owv-logo-light.png', width: 1200 },
  { svg: 'owv-logo-stacked-dark.svg', png: 'owv-logo-stacked-dark.png', width: 800 },
  { svg: 'owv-logo-stacked-light.svg', png: 'owv-logo-stacked-light.png', width: 800 },
  { svg: 'owv-banner.svg', png: 'owv-banner.png', width: 1200 },
];

const browser = await chromium.launch();
for (const job of jobs) {
  const svg = fs.readFileSync(path.join(dir, job.svg), 'utf8');
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const height = Math.round(job.width * h / w);
  const page = await browser.newPage({ viewport: { width: job.width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${job.width}px;height:${height}px}</style>${svg}`);
  await page.screenshot({ path: path.join(dir, job.png), omitBackground: true });
  await page.close();
  console.log(`wrote ${job.png} ${job.width}×${height}`);
}
await browser.close();
