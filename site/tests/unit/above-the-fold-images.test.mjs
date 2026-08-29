/**
 * Above-the-fold images must not be lazy.
 *
 * `loading="lazy"` on an image in the initial viewport defers the first thing
 * a visitor sees, and in headless Chrome it is worse than slow — it is
 * NON-DETERMINISTIC. The Open Web Vectors hero robot was lazy until
 * 2026-08-29, and captures of that page came back with the illustration
 * present or missing across identical requests, with the asset itself serving
 * 200 every time. That produced README screenshots in the demo-pipeline repo
 * with an empty right half, from a job that was green end to end: the PNG was
 * valid, correctly sized, and had the right numbers in it.
 *
 * Whether a hero renders completely is not something a screenshot job can
 * assert on. It is something the markup has to guarantee, which is what this
 * checks.
 *
 * Runs against public/ — the built, minified output that actually ships, where
 * `loading="eager"` is legitimately DROPPED (it is the HTML default) and
 * `loading=lazy` is kept. So the assertion is "not lazy", never "is eager":
 * requiring the attribute would fail on correct output.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");

/**
 * The CSS hooks that identify an image sitting in the initial viewport.
 *
 * ⚠️ Every entry must be REACHED by the sweep below, or the guard is watching
 * nothing. Renaming a hero class in a template would otherwise empty this list
 * silently — the failure mode where a guard reports success because it can no
 * longer find the thing it protects.
 */
const HERO_IMAGES = [
  { hook: "hero-poster", why: "the LCP element on the homepage and all 190 section pages" },
  { hook: "owv-orbit-robot", why: "the Open Web Vectors hero illustration (wide layout)" },
  { hook: "owv-hero-robot-inline", why: "the same illustration below 1320px" },
  { hook: "site-research-banner-hf", why: "sits in the site banner, above the nav, on every page" },
  { hook: "document-logo", why: "the masthead logo on the AI-safety document" },
];

const pages = globSync("**/index.html", { cwd: PUBLIC }).map((p) => path.join(PUBLIC, p));

/**
 * Does this <img> carry `hook` as an id or class TOKEN?
 *
 * ⚠️ Not a substring test on the tag. That is how the first version of this
 * guard reported 13 offending pages that were all fine: "hero-poster" is a
 * substring of the class `featured-image-poster` AND of the filename
 * `www-rag-directory-hero-poster.webp` sitting in a srcset. A guard whose
 * first act is to cry wolf gets muted, and then it is worth nothing on the day
 * it is right.
 *
 * Handles both builds: quoted attributes from `zola serve`, and the bare
 * unquoted ones the production minifier emits.
 */
function carriesHook(tag, hook) {
  for (const m of tag.matchAll(/\b(?:id|class)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const value = m[1] ?? m[2] ?? m[3] ?? "";
    if (value.split(/\s+/).includes(hook)) return true;
  }
  return false;
}

test("the build produced pages to check", () => {
  // A zero-page sweep passes every assertion below it. Run `zola build` first.
  assert.ok(pages.length > 100, `expected the built site, found ${pages.length} pages`);
});

for (const { hook, why } of HERO_IMAGES) {
  test(`${hook} is never lazy — ${why}`, () => {
    let seen = 0;
    const offenders = [];

    for (const file of pages) {
      const html = readFileSync(file, "utf8");
      if (!html.includes(hook)) continue;
      for (const m of html.matchAll(/<img[^>]*>/g)) {
        const tag = m[0];
        if (!carriesHook(tag, hook)) continue;
        seen += 1;
        if (/loading=["']?lazy/.test(tag)) {
          offenders.push(path.relative(PUBLIC, file));
        }
      }
    }

    assert.ok(
      seen > 0,
      `no <img> carrying "${hook}" exists in the build any more. Either the ` +
        `hero was renamed — update HERO_IMAGES in this file — or it was ` +
        `removed, in which case delete the entry. Leaving it here means this ` +
        `guard passes while protecting nothing.`,
    );
    assert.deepEqual(
      [...new Set(offenders)],
      [],
      `${hook} is loading="lazy" on these pages. It is above the fold, so ` +
        `deferring it delays the first thing a visitor sees and makes headless ` +
        `captures of the page non-deterministic.`,
    );
  });
}
