#!/usr/bin/env node
/**
 * Build-output invariants. Runs against site/public/ after `zola build`, as
 * part of the deploy build chain, so a violation cannot reach any environment.
 *
 * Why here and not in CI: .github/workflows/test.yml triggers only on `main`
 * and `develop`, and its `tests/e2e/` suite targets the pre-Zola site
 * (`/pricing.html` against a server rooted at the repo). It has been red since
 * 2026-08-23 and never runs on a feature branch. A guard wired into that is a
 * guard that does not run. This runs on every single deploy instead.
 *
 * Each check below is a CLASS of failure that already occurred, not the one
 * page it occurred on.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname;

/** Every built .html file. */
function htmlFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const failures = [];
function fail(check, file, detail) {
  failures.push({ check, file: relative(PUBLIC_DIR, file), detail });
}

/**
 * 1. A CSS-filtered image must not be lazy-loaded.
 *
 * The logo strip carries a `filter:` chain. When the image arrives after the
 * layer holding that filter has been composited, Chrome paints NOTHING until
 * something else invalidates — while `complete`, `naturalWidth`,
 * `checkVisibility()` and `getBoundingClientRect()` all report a healthy,
 * visible image. No DOM assertion can see this; `toBeVisible()` passes over an
 * invisible logo. The attribute is the only thing that is checkable, so it is
 * what gets checked.
 *
 * Observed on /compliance/ 2026-08-28. The home page uses the identical
 * construction and currently wins the race; this keeps it that way.
 */
const FILTERED_CONTAINERS = ["research-band-logos"];
function checkFilteredImagesAreEager(file, html) {
  for (const cls of FILTERED_CONTAINERS) {
    // Minified output drops attribute quotes, so match bare and quoted forms.
    const block = new RegExp(`class="?[^">]*${cls}[^">]*"?[^>]*>([\\s\\S]*?)</ul>`, "g");
    let m;
    while ((m = block.exec(html)) !== null) {
      for (const tag of m[1].match(/<img[^>]*>/g) || []) {
        if (/loading=["']?lazy/.test(tag)) {
          const src = (tag.match(/src=["']?([^"'\s>]+)/) || [])[1] || "?";
          fail("filtered-image-is-lazy", file, `${cls} -> ${src}`);
        }
      }
    }
  }
}

/**
 * 2. No mangled HTML entities.
 *
 * Tera escapes `/` to `&#x2F;`, and the minifier can rewrite that to a bare
 * `&amp#x2F;` — no semicolon, so browsers render the entity as literal text.
 * `LarQL/vIndex` shipped to staging reading `LARQL&#X2F;VINDEX`. Found by eye
 * in a screenshot, which is not a detection strategy.
 */
function checkNoMangledEntities(file, html) {
  const bad = html.match(/&amp#x[0-9a-fA-F]{2,4};?/g);
  if (bad) fail("mangled-entity", file, [...new Set(bad)].join(", "));
}

/**
 * 3. A page that PROMISES a facade must keep it.
 *
 * The privacy claim is that nothing reaches the video host until the visitor
 * clicks. The dynamic half needs a browser; the half that matters is static
 * and fully checkable — a facade page must carry the `data-embed` contract and
 * must NOT ship a video iframe in served HTML. A regression to a plain embed,
 * the obvious "simplification", is exactly what this catches.
 *
 * Scoped to pages that make the promise. 22 other pages (blog posts, /autorag)
 * embed video directly; whether those should also be facades is a consent
 * decision for a human, not something a guard should impose by existing.
 */
const VIDEO_HOSTS = ["youtube.com", "youtube-nocookie.com", "player.vimeo.com"];
// Anchored at the (optionally locale-prefixed) root: a bare `/compliance/`
// suffix match also catches `categories/compliance/` and `tags/compliance/`,
// taxonomy pages that never had a video.
const FACADE_PAGES = [/^(?:[a-z]{2}\/)?compliance\/index\.html$/];

function checkFacadePagesStayFacades(file, html) {
  const rel = relative(PUBLIC_DIR, file);
  if (!FACADE_PAGES.some((re) => re.test(rel))) return;

  if (!/data-embed=/.test(html)) {
    fail("facade-contract-missing", file, "no data-embed on a facade page");
  }
  for (const tag of html.match(/<iframe[^>]*>/g) || []) {
    const host = VIDEO_HOSTS.find((h) => tag.includes(h));
    if (host) fail("facade-regressed-to-embed", file, host);
  }
}

const files = htmlFiles(PUBLIC_DIR);
for (const file of files) {
  const html = readFileSync(file, "utf8");
  checkFilteredImagesAreEager(file, html);
  checkNoMangledEntities(file, html);
  checkFacadePagesStayFacades(file, html);
}

if (failures.length > 0) {
  console.error(`\n✘ build invariants: ${failures.length} violation(s) across ${files.length} pages\n`);
  const byCheck = new Map();
  for (const f of failures) {
    if (!byCheck.has(f.check)) byCheck.set(f.check, []);
    byCheck.get(f.check).push(f);
  }
  for (const [check, items] of byCheck) {
    console.error(`  ${check}  (${items.length})`);
    for (const i of items.slice(0, 8)) console.error(`    ${i.file}: ${i.detail}`);
    if (items.length > 8) console.error(`    … and ${items.length - 8} more`);
    console.error("");
  }
  process.exit(1);
}

console.log(`✓ build invariants: 3 checks clean across ${files.length} pages`);
