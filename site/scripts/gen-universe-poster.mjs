/**
 * Capture the RAG Universe map as a still poster.
 *
 * The poster is what /www-rag/ shows to a visitor who cannot use the live map —
 * a phone, a save-data connection, or a device that MEASURED itself too slow on
 * a previous visit (see posterReason() in static/js/www-rag-universe.js).
 *
 * ⚠️ THE CAPTION IS DATED AND MUST BE UPDATED WITH THE IMAGE. This script prints
 * the corpus counts at capture time; paste them into POSTER_CAPTION alongside
 * the new date. Captioning a still with LIVE counts would be a lie that grows
 * by ~150 sites a day — the picture is a snapshot and says so.
 *
 * Run against production so the poster shows the real corpus:
 *
 *     node scripts/gen-universe-poster.mjs
 *     node scripts/gen-universe-poster.mjs --url https://staging.divinci.ai/www-rag/
 *
 * It waits for the simulation to come to rest rather than for a fixed delay —
 * a timer would capture whatever the machine happened to have drawn by then,
 * which is a different picture on every machine.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../static/images/marketing/www-rag/universe-poster.webp");

const argv = process.argv.slice(2);
const urlArg = argv.indexOf("--url");
const URL = urlArg !== -1 ? argv[urlArg + 1] : "https://divinci.ai/www-rag/";

// Sized for the audience this actually serves: phones, where the poster renders
// at ~390 CSS px, and small tablets at ~768. 1400 is ~3.6x on a retina phone and
// ~1.8x on a tablet — sharp on both, and ~120 KB instead of the ~157 KB an
// 1800px master costs. Measured over the real image; a dense starfield does not
// compress the way a photograph does, so width is the lever that matters.
//
// The canvas's own aspect ratio is kept and NOT cropped here. The poster is
// displayed with object-fit: cover, so every viewport crops it differently —
// a phone's tall box and a tablet's wide one want different framing, and
// baking one crop in would look wrong on the other. Cropping to 4:3 also cut
// the canvas-drawn belt legend out of the bottom-left corner.
const WIDTH = 1400;

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2,
});

// Never let the capture take the poster path itself — that would photograph
// last week's poster and call it this week's.
await page.addInitScript(() => {
	try {
		window.localStorage.removeItem("divinci-www-rag-universe-drawcost");
	} catch (e) { /* private mode: nothing to clear */ }
});

console.log(`→ ${URL}`);
await page.goto(URL, { waitUntil: "domcontentloaded" });

const section = "#www-rag-universe-section";
await page.waitForFunction(
	(sel) => { const s = document.querySelector(sel); return s && !s.hidden; },
	section,
	{ timeout: 120000 },
);
// Keep it on screen: the animation skips drawing while off screen, so a capture
// taken without scrolling would photograph a canvas that was never painted.
await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "center" }), section);

const mode = await page.getAttribute(section, "data-universe-mode");
if (mode === "poster") {
	throw new Error("the page served the POSTER, not the live map — nothing to capture");
}

// Settled = the canvas stopped changing. Poll a cheap hash of its pixels.
console.log("  waiting for the layout to come to rest…");
let previous = "";
let stable = 0;
for (let i = 0; i < 180; i++) {
	const signature = await page.evaluate(() => {
		const c = document.getElementById("www-rag-universe-canvas");
		if (!c || !c.width) return "";
		const ctx = c.getContext("2d");
		const d = ctx.getImageData(0, 0, Math.min(c.width, 300), Math.min(c.height, 300)).data;
		let h = 0;
		for (let j = 0; j < d.length; j += 97) h = (h * 31 + d[j]) >>> 0;
		return String(h);
	});
	if (signature && signature === previous) {
		if (++stable >= 3) break;
	} else {
		stable = 0;
	}
	previous = signature;
	await new Promise((r) => setTimeout(r, 1000));
}
if (stable < 3) console.warn("  ⚠️  never fully settled — capturing anyway");

const stats = await page.evaluate(async () => {
	const res = await fetch(
		"https://api.divinci.app/api/v1/www-rag-universe?format=compact",
		{ credentials: "omit" },
	);
	return (await res.json()).stats;
});

// ⚠️ HIDE THE CAPTION FIRST. It is a DOM <p> positioned OVER the canvas, and an
// element screenshot captures whatever is painted in that region — so the first
// version of this poster had the live caption baked into it, clipped
// mid-sentence at the canvas edge. The caption belongs in POSTER_CAPTION, where
// it is dated and can be read; a screenshot of it is neither.
await page.addStyleTag({
	content: ".www-rag-universe-caption { display: none !important; }",
});
await page.waitForTimeout(150);

const png = await page.locator("#www-rag-universe-canvas").screenshot();
await browser.close();

fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Trim the bottom strip before resizing.
//
// The belt legend ("outer ring · N sites with no links or embedding yet…") is
// drawn INTO the canvas by the renderer, so no CSS can hide it the way the
// DOM caption was hidden above. On a phone the poster is displayed with
// object-fit: cover, which crops the sides — leaving that legend chopped
// mid-word in the corner, which reads as a broken image rather than a caption.
// The poster's own caption already carries the meaning, so the strip goes.
const meta = await sharp(png).metadata();
const TRIM_BOTTOM = 0.08;
await sharp(png)
	.extract({
		left: 0,
		top: 0,
		width: meta.width,
		height: Math.round(meta.height * (1 - TRIM_BOTTOM)),
	})
	.resize({ width: WIDTH })
	.webp({ quality: 82 })
	.toFile(OUT);

const bytes = fs.statSync(OUT).size;
console.log(`\n✅ ${path.relative(process.cwd(), OUT)} — ${(bytes / 1024).toFixed(0)} KB`);
console.log("\nUpdate POSTER_CAPTION in static/js/www-rag-universe.js with:");
console.log(
	`  captured ${new Date().toISOString().slice(0, 10)}: ` +
	`${stats.sites.toLocaleString()} sites, ` +
	`${stats.linkEdges.toLocaleString()} hyperlinks, ` +
	`${stats.semanticEdges.toLocaleString()} semantic ties`,
);
