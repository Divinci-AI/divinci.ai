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
import { execFileSync } from "child_process";
import {
	CAPTION_RE,
	evalCaptionLiteral,
	renderCaptionLiteral,
} from "./lib/caption-source.mjs";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../static/images/marketing/www-rag/universe-poster.webp");
const UNIVERSE_JS = path.join(__dirname, "../static/js/www-rag-universe.js");
const FIGURES_FILE = path.join(__dirname, "og-assets", "figures.json");
const OG_SLUG = "www-rag";

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

function localDate() {
	const d = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

// ---------------------------------------------------------------------------
// Everything below keeps the WORDS in step with the PICTURE.
//
// The poster is a still, so its caption states a date and three counts. Those
// were updated by hand, from a line this script printed — which is a step that
// gets skipped, and a caption claiming 5,119 sites over a picture of 6,486 is
// worse than no caption at all. So the script that takes the picture also
// writes the words, and refuses rather than guessing.
// ---------------------------------------------------------------------------

const n = (v) => Number(v).toLocaleString("en-US");
const captured = new Date().toLocaleDateString("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

const caption =
	`A snapshot of the RAG Universe, captured ${captured}: ${n(stats.sites)} sites, ` +
	`${n(stats.linkEdges)} hyperlinks between them and ${n(stats.semanticEdges)} semantic ` +
	`ties. Size is pages indexed, and sites sit near the sites they resemble. The live ` +
	`map is interactive — every dot opens that site's assistant — but it is a heavy ` +
	`drawing on a small screen, so this page shows the picture by default.`;

const literal = renderCaptionLiteral(caption);

const source = fs.readFileSync(UNIVERSE_JS, "utf8");
// Exactly one match or nothing happens — a silent no-op here would ship a
// stale caption under a fresh picture, which is what this section prevents.
const matches = source.match(new RegExp(CAPTION_RE.source, "g")) || [];
if (matches.length !== 1) {
	throw new Error(
		`expected exactly ONE POSTER_CAPTION declaration in ${path.basename(UNIVERSE_JS)}, ` +
		`found ${matches.length} — refusing to rewrite it`,
	);
}
const rewritten = source.replace(CAPTION_RE, `$1    ${literal}$2`);

// Read back what we are about to write and CHECK IT SAYS WHAT WE MEANT.
// Emitting source is easy to get subtly wrong in ways that still parse; the
// only honest test is to evaluate the result and compare it to the input.
const emitted = rewritten.match(CAPTION_RE)[0];
let roundTrip;
try {
	roundTrip = evalCaptionLiteral(emitted);
} catch (err) {
	throw new Error(`emitted POSTER_CAPTION does not parse: ${err.message}`);
}
if (roundTrip !== caption) {
	throw new Error(
		"emitted POSTER_CAPTION does not round-trip — refusing to write.\n" +
		`  wanted (${caption.length} chars): ${JSON.stringify(caption.slice(0, 90))}…\n` +
		`  got    (${String(roundTrip).length} chars): ${JSON.stringify(String(roundTrip).slice(0, 90))}…`,
	);
}

if (rewritten === source) {
	console.log("   caption already current — unchanged");
} else {
	fs.writeFileSync(UNIVERSE_JS, rewritten);
	console.log(`   caption rewritten in ${path.relative(process.cwd(), UNIVERSE_JS)}`);
}

// The unfurl card's figures strip. Written to a committed file rather than
// fetched at card-build time so `npm run og` stays offline and deterministic.
const figuresLine =
	`${n(stats.sites)} sites · ${n(stats.linkEdges)} links · ` +
	`${n(stats.semanticEdges)} semantic ties`;
const figures = JSON.parse(fs.readFileSync(FIGURES_FILE, "utf8"));
figures[OG_SLUG] = {
	line: figuresLine,
	capturedAt: localDate(),
};
fs.writeFileSync(FIGURES_FILE, JSON.stringify(figures, null, 2) + "\n");
console.log(`   og figures: ${figuresLine}`);

// Redraw the cards so the repo is CONSISTENT when this script exits. The
// wrangler build commands run zola only — they do NOT run `npm run og` — so
// whatever is committed under static/images/og/ is exactly what deploys.
if (process.argv.includes("--no-og")) {
	console.log("   skipping card rebuild (--no-og)");
} else {
	execFileSync("node", [path.join(__dirname, "gen-og-images.mjs")], {
		stdio: "inherit",
		cwd: path.join(__dirname, ".."),
	});
}

console.log("\nNext: review the picture, then commit and deploy the site.");
