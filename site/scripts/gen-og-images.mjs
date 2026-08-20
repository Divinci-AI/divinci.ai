#!/usr/bin/env node
/**
 * Per-page Open Graph images for divinci.ai.
 *
 * Every English marketing/blog route gets a 1200×630 card:
 *   1. the page's hero (hero_poster / hero_video_poster / featured_image /
 *      known template hero), cropped cover-style, with the title set in type
 *   2. else a content-tinted 3D robot plate + the same type overlay
 *
 * Type is drawn here (Sharp + SVG), not by an image model — unfurlers
 * show these at thumbnail size and the title is what tells two pages apart.
 *
 * Translations reuse the English card: the template strips the lang prefix
 * from the path before looking up images/og/<slug>.jpg.
 *
 * Run before `zola build`. Output is committed under static/images/og/ so
 * wrangler does not need sharp at deploy time.
 */
import { mkdir, writeFile, readdir, readFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CONTENT = join(ROOT, "content");
const STATIC = join(ROOT, "static");
const ROBOTS = join(HERE, "og-assets", "robots");
const OUT = join(STATIC, "images", "og");

const W = 1200;
const H = 630;

const LANG_DIRS = new Set([
  "es", "fr", "ar", "ja", "zh", "it", "ru", "de", "pt", "ko", "nl", "hi",
]);
const SKIP_TOP = new Set(["preview"]);

const TEMPLATE_HEROES = {
  index: "images/davinci-painter-robot-800w.webp",
  "www-rag": "images/www-rag-directory-hero-poster.webp",
};

const SHIELD_SLUGS = new Set([
  "security",
  "compliance",
  "privacy-policy",
  "cookies",
  "terms-of-service",
  "data-processing-agreement",
  "accessibility",
  "local-inference-privacy",
  "ai-safety",
]);
const WAVE_SLUGS = new Set(["about", "contact", "support", "careers", "press"]);
const BOOK_SLUGS = new Set(["api", "cli", "docs", "tutorials", "changelog", "brand"]);
const PHONE_SLUGS = new Set(["voice-agent-scripts"]);
const ROBOT_OVERRIDE = {
  "open-web-vectors": "globe.jpg",
};

const TITLE_OVERRIDE = {
  index: "Excellence, every time",
};

const SECTION = {
  index: { label: "Divinci AI", accent: "#d4b87a" },
  blog: { label: "Journal", accent: "#d4b87a" },
  legal: { label: "Legal", accent: "#c4a35a" },
  product: { label: "Product", accent: "#8fbfa4" },
  company: { label: "Company", accent: "#d4b87a" },
};

const LEGAL_SLUGS = SHIELD_SLUGS;
const PRODUCT_SLUGS = new Set([
  "autorag",
  "quality-assurance",
  "release-management",
  "rag-arena",
  "rag-routing",
  "voice-agents",
  "hermes-agents",
  "www-rag",
  "open-web-vectors",
  "cli",
  "api",
  "docs",
  "tutorials",
  "squarespace-to-cloudflare",
]);
const COMPANY_SLUGS = new Set([
  "about",
  "careers",
  "contact",
  "press",
  "pricing",
  "roadmap",
  "support",
  "brand",
  "changelog",
  "status",
  "sitemap",
]);

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function wrap(text, maxWidth, fontSize, maxLines = 3) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length * fontSize * 0.52 > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[,.;:]?$/, "")}…`;
  }
  return lines;
}

function parseFrontmatter(src) {
  const m = src.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+/);
  if (!m) return {};
  const block = m[1];
  const get = (key) => {
    const r = block.match(new RegExp(`^${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "m"));
    return (r?.[1] ?? r?.[2] ?? "").trim();
  };
  return {
    title: get("title"),
    description: get("description"),
    template: get("template"),
    hero_poster: get("hero_poster"),
    hero_video_poster: get("hero_video_poster"),
    hero_background: get("hero_background"),
    featured_image: get("featured_image"),
  };
}

function englishSlug(rel) {
  const noExt = rel.replace(/\.md$/, "");
  if (noExt === "_index") return "index";
  if (noExt.endsWith("/_index")) return noExt.slice(0, -"/_index".length);
  return noExt;
}

function sectionOf(slug) {
  if (slug === "index") return SECTION.index;
  if (slug === "blog" || slug.startsWith("blog/")) return SECTION.blog;
  if (LEGAL_SLUGS.has(slug)) return SECTION.legal;
  if (PRODUCT_SLUGS.has(slug)) return SECTION.product;
  if (COMPANY_SLUGS.has(slug)) return SECTION.company;
  return SECTION.index;
}

function robotFileFor(slug) {
  if (ROBOT_OVERRIDE[slug]) return ROBOT_OVERRIDE[slug];
  if (SHIELD_SLUGS.has(slug)) return "shield.jpg";
  if (WAVE_SLUGS.has(slug)) return "look-wave.jpg";
  if (BOOK_SLUGS.has(slug)) return "book.jpg";
  if (PHONE_SLUGS.has(slug)) return "phone.jpg";
  if (slug === "index") return "look.jpg";
  if (slug.startsWith("blog/")) return "book.jpg";
  return "look.jpg";
}

function localAsset(ref) {
  if (!ref) return null;
  const trimmed = String(ref).trim();
  if (!trimmed) return null;

  const candidates = [];
  if (/^https?:\/\//i.test(trimmed)) {
    const name = basename(new URL(trimmed).pathname);
    if (name) {
      candidates.push(join(STATIC, "images", name));
      const noPoster = name.replace(/-poster(?=\.\w+$)/, "");
      if (noPoster !== name) candidates.push(join(STATIC, "images", noPoster));
      const asWebp = name.replace(/\.(png|jpg|jpeg)$/i, ".webp");
      if (asWebp !== name) candidates.push(join(STATIC, "images", asWebp));
      const asPng = name.replace(/\.(webp|jpg|jpeg)$/i, ".png");
      if (asPng !== name) candidates.push(join(STATIC, "images", asPng));
    }
  } else {
    const rel = trimmed.replace(/^\/+/, "");
    candidates.push(join(STATIC, rel));
    if (!rel.startsWith("images/")) candidates.push(join(STATIC, "images", rel));
  }

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function isWeakFeatured(ref) {
  if (!ref) return true;
  const lower = ref.toLowerCase();
  if (lower.endsWith(".svg")) return true;
  if (lower.includes("logo")) return true;
  if (lower.includes("icon")) return true;
  return false;
}

function resolveHero(slug, extra) {
  const order = [
    extra.hero_poster,
    extra.hero_video_poster,
    extra.hero_background,
    isWeakFeatured(extra.featured_image) ? null : extra.featured_image,
    TEMPLATE_HEROES[slug],
  ];
  for (const ref of order) {
    const path = localAsset(ref);
    if (path) return path;
  }
  return null;
}

function textSvg({ title, subtitle, section, accent }) {
  const size = title.length > 70 ? 44 : title.length > 42 ? 52 : 60;
  const lines = wrap(title, 640, size, 3);
  const startY = 200;
  const titleBottom = startY + (lines.length - 1) * size * 1.22;

  const subSize = 24;
  const subLines = subtitle ? wrap(subtitle, 640, subSize, 5) : [];
  const subStart = titleBottom + 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1a1710" stop-opacity="0.92"/>
      <stop offset="40%" stop-color="#1a1710" stop-opacity="0.78"/>
      <stop offset="58%" stop-color="#1a1710" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${esc(accent)}"/>
      <stop offset="100%" stop-color="${esc(accent)}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <rect x="72" y="118" width="280" height="3" fill="url(#rule)"/>
  <text x="72" y="100" font-family="Georgia,Times,serif" font-size="20"
        font-weight="600" fill="${esc(accent)}" letter-spacing="3">${esc(section.toUpperCase())}</text>
  ${lines
    .map(
      (l, i) =>
        `<text x="72" y="${startY + i * size * 1.22}" font-family="Georgia,Times,serif" ` +
        `font-size="${size}" font-weight="700" fill="#f6efe4">${esc(l)}</text>`,
    )
    .join("\n  ")}
  ${subLines
    .map(
      (l, i) =>
        `<text x="72" y="${subStart + i * subSize * 1.38}" font-family="Helvetica,Arial,sans-serif" ` +
        `font-size="${subSize}" fill="#e2d6c2">${esc(l)}</text>`,
    )
    .join("\n  ")}
  <text x="72" y="${H - 28}" font-family="Helvetica,Arial,sans-serif" font-size="22"
        font-weight="600" fill="${esc(accent)}">divinci.ai</text>
</svg>`;
}

async function coverCrop(inputPath) {
  const img = sharp(inputPath, { density: 180 });
  const meta = await img.metadata();
  const srcW = meta.width || W;
  const srcH = meta.height || H;
  const scale = Math.max(W / srcW, H / srcH);
  const newW = Math.max(W, Math.round(srcW * scale));
  const newH = Math.max(H, Math.round(srcH * scale));
  const left = Math.max(0, Math.round((newW - W) / 2));
  // Prefer a bit of the top so faces / architecture stay in frame.
  const top = Math.max(0, Math.min(newH - H, Math.round((newH - H) * 0.28)));
  return img
    .resize(newW, newH)
    .extract({ left, top, width: W, height: H })
    .toBuffer();
}

async function robotScene(robot) {
  const platePath = join(ROBOTS, robot);
  if (!existsSync(platePath)) {
    throw new Error(`missing robot plate: ${platePath}`);
  }
  const SCALE_H = 880;
  const fitted = sharp(platePath).resize({ height: SCALE_H });
  const meta = await fitted.metadata();
  const fittedW = meta.width ?? Math.round((1456 / 704) * SCALE_H);
  const robotX = fittedW / 2;
  const targetX =
    robot === "look-wave.jpg" || robot === "look.jpg" || robot === "globe.jpg" ? 760 : 900;
  const extractLeft = Math.max(0, Math.min(fittedW - W, Math.round(robotX - targetX)));
  const extractTop = Math.max(0, Math.round((SCALE_H - H) / 2));
  return fitted.extract({ left: extractLeft, top: extractTop, width: W, height: H }).toBuffer();
}

async function compose(page) {
  let scene;
  let kind;
  if (page.hero) {
    try {
      scene = await coverCrop(page.hero);
      kind = "hero";
    } catch (err) {
      console.warn(`gen-og-images: hero failed for ${page.slug} (${page.hero}): ${err.message}`);
      scene = await robotScene(page.robot);
      kind = "robot";
    }
  } else {
    scene = await robotScene(page.robot);
    kind = "robot";
  }

  const overlay = textSvg({
    title: page.title,
    subtitle: page.subtitle,
    section: page.section,
    accent: page.accent,
  });

  const card = await sharp(scene)
    .composite([{ input: Buffer.from(overlay) }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  const dest = join(OUT, `${page.slug}.jpg`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, card);
  return kind;
}

async function walkMd(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === CONTENT && (LANG_DIRS.has(entry.name) || SKIP_TOP.has(entry.name))) {
        continue;
      }
      await walkMd(p, out);
    } else if (entry.name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

async function collectPages() {
  const pages = [];
  for (const file of await walkMd(CONTENT)) {
    const rel = relative(CONTENT, file).replace(/\\/g, "/");
    const slug = englishSlug(rel);
    const extra = parseFrontmatter(await readFile(file, "utf8"));
    if (!extra.title) {
      console.warn(`gen-og-images: no title in ${rel} — skipping`);
      continue;
    }
    const section = sectionOf(slug);
    pages.push({
      slug,
      title: TITLE_OVERRIDE[slug] || extra.title,
      subtitle: extra.description,
      section: section.label,
      accent: section.accent,
      robot: robotFileFor(slug),
      hero: resolveHero(slug, extra),
    });
  }

  if (pages.length === 0) {
    console.error("gen-og-images: collected ZERO pages — refusing to continue");
    process.exit(1);
  }
  return pages;
}

async function clearPreviousPngs(dir) {
  if (!existsSync(dir)) return;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const p = join(current, entry.name);
      if (entry.isDirectory()) stack.push(p);
      else if (entry.name.endsWith(".png") || entry.name.endsWith(".jpg")) await unlink(p);
    }
  }
}

const listOnly = process.argv.includes("--list");
const pages = await collectPages();

if (listOnly) {
  for (const p of pages) {
    const src = p.hero ? relative(STATIC, p.hero) : `robot:${p.robot}`;
    console.log(`${p.slug.padEnd(56)} ${src}`);
  }
  console.log(`\n${pages.length} page(s)`);
  process.exit(0);
}

await mkdir(OUT, { recursive: true });
await clearPreviousPngs(OUT);

let heroes = 0;
let robots = 0;
for (const page of pages) {
  const kind = await compose(page);
  if (kind === "hero") heroes += 1;
  else robots += 1;
}

// Taxonomy listings share the journal card.
const blogCard = join(OUT, "blog.jpg");
if (existsSync(blogCard)) {
  const bytes = await readFile(blogCard);
  await writeFile(join(OUT, "categories.jpg"), bytes);
  await writeFile(join(OUT, "tags.jpg"), bytes);
}

console.log(
  `gen-og-images: wrote ${pages.length} card(s) (${heroes} hero, ${robots} robot) → static/images/og/`,
);
