#!/usr/bin/env node
/**
 * Integrity guard for the divinci.app funnel pages (/, /files/, /partners/).
 *
 * WHY THIS EXISTS — the failure mode is silent, not loud.
 *
 * wrangler.jsonc sets `not_found_handling: "single-page-application"`, so a
 * request for a file that does NOT exist returns index.html with **HTTP 200
 * and Content-Type: text/html**. Consequences:
 *
 *   - A typo in a stylesheet href doesn't 404. The page renders unstyled and
 *     every automated check that looks at status codes reports success.
 *   - `check-pinned-assets.mjs` was written after exactly this bit us on
 *     2026-07-20 (the Auth0 login logo). That guard covers assets pinned by
 *     EXTERNAL systems; this one covers assets each funnel page references
 *     itself, which is the far larger surface.
 *
 * The second thing it guards is the "additive only" contract that both
 * files.css and partners.css state in their header comments: the spin-off
 * funnels deliberately borrow their shell (topbar, hero, steps, cards, trust,
 * faq, bottom-cta, team, ask-bar, footer) from /styles.css so the funnels stay
 * visually identical. Nothing enforced that. Renaming a class in styles.css
 * would silently unstyle a whole section of a spin-off page while the
 * originating page still looked fine.
 *
 * Third: the pages are wired to two scripts by SELECTOR, not by import —
 * app.js and divinci-chat.js query for `section.hero`, `#ask-bar`,
 * `[data-app-link]`, `[data-ask-divinci]` and the two JSON config blocks. Drop
 * one and the behaviour quietly disappears with no error. In particular
 * divinci-chat.js's `startHeroScrollGate()` does
 * `document.querySelector("section.hero")` — no hero section, no chat launcher.
 *
 * Modes:
 *   node check-funnel-integrity.mjs              # static: files on disk
 *   node check-funnel-integrity.mjs --live       # also verify live content-types
 *   node check-funnel-integrity.mjs --live --base=https://…workers.dev
 *   node check-funnel-integrity.mjs --selftest   # prove the checks can fail
 *
 * Deliberately zero-dependency and regex-based. This repo has no package.json,
 * no node_modules and no test runner, so anything needing an install would not
 * run. Regex HTML parsing is fragile in general; it is acceptable here because
 * the inputs are three hand-written files in this repository, and a parse miss
 * shows up as a false FAILURE (loud) rather than a false pass (silent).
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "public");

/**
 * One entry per funnel page.
 *
 * `structuralClasses` is the shared-shell contract: classes the page uses but
 * does NOT define in its own stylesheet, so they MUST still be present in
 * /styles.css. Keep the list short and structural — it is about the shell, not
 * about every decorative class. A page-specific class belongs in that page's
 * own CSS and is checked there instead.
 */
const PAGES = [
  {
    path: "index.html",
    url: "/",
    canonical: "https://divinci.app/",
    ownCss: [],
    structuralClasses: [
      "topbar", "brand", "hero", "hero-sub", "steps", "cards", "card",
      "trust", "faq", "bottom-cta", "team", "team-grid", "ask-bar", "footer",
      "promo-banner",
    ],
  },
  {
    path: "files/index.html",
    url: "/files/",
    canonical: "https://divinci.app/files/",
    ownCss: ["files/files.css"],
    structuralClasses: [
      "topbar", "brand", "hero", "hero-sub", "steps", "cards", "card",
      "trust", "faq", "bottom-cta", "team", "team-grid", "ask-bar", "footer",
      "promo-banner",
    ],
  },
  {
    path: "partners/index.html",
    url: "/partners/",
    canonical: "https://divinci.app/partners/",
    ownCss: ["partners/partners.css"],
    structuralClasses: [
      "topbar", "brand", "hero", "hero-sub", "steps", "trust", "faq",
      "bottom-cta", "team", "team-grid", "ask-bar", "footer", "promo-banner",
      "card-art", "title-emoji", "step-num", "trust-more", "hero-note",
    ],
  },
];

/**
 * Selector contracts. These are queried by app.js / divinci-chat.js at runtime;
 * a missing one degrades silently, which is why they are asserted here.
 * `section.hero` is load-bearing for the chat launcher specifically.
 */
const SCRIPT_HOOKS = [
  { test: (h) => /<section class="hero"/.test(h), name: 'section.hero (divinci-chat.js hero scroll gate)' },
  { test: (h) => /id="ask-bar"/.test(h), name: '#ask-bar (app.js ask bar)' },
  { test: (h) => /data-app-link=/.test(h), name: '[data-app-link] (app.js staging-origin rewrite)' },
  { test: (h) => /id="divinci-chat-starters"/.test(h), name: '#divinci-chat-starters' },
  { test: (h) => /id="divinci-chat-blurbs"/.test(h), name: '#divinci-chat-blurbs' },
  { test: (h) => /id="footer-status"/.test(h), name: "#footer-status" },
];

// ── Pure helpers (exercised by --selftest) ────────────────────────────────

/** Every href/src value in the document, in source order. */
export function extractRefs(html) {
  return [...html.matchAll(/(?:href|src)\s*=\s*"([^"]*)"/g)].map((m) => m[1]);
}

/** Only the refs that point at something we ship in public/. */
export function localRefs(html) {
  return extractRefs(html).filter(
    (r) => r.startsWith("/") && !r.startsWith("//"),
  );
}

/** Distinct class tokens used anywhere in the document. */
export function extractClasses(html) {
  const out = new Set();
  for (const m of html.matchAll(/class\s*=\s*"([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (c) out.add(c);
  }
  return out;
}

/**
 * Does a stylesheet define a rule for this class? Matches `.name` followed by
 * anything that cannot continue an identifier, so `.card` does not match
 * `.card-art` (which would make the check silently permissive).
 */
export function cssDefinesClass(css, name) {
  return new RegExp(`\\.${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`).test(css);
}

/**
 * Anchors that open a new tab must carry rel="noopener" — without it the opened
 * page gets a live `window.opener` handle back to ours (reverse tabnabbing).
 * Returns the offending tag strings.
 */
export function blankLinksMissingNoopener(html) {
  return [...html.matchAll(/<a\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /target\s*=\s*"_blank"/.test(tag) && !/rel\s*=\s*"[^"]*noopener/.test(tag));
}

/**
 * Selectors declared in the #divinci-chat-blurbs JSON block.
 *
 * These are NOT style hooks — `.menu` for instance has no CSS rule anywhere,
 * which is why it does not belong in `structuralClasses`. divinci-chat.js
 * feeds each one to `document.querySelector` and attaches an
 * IntersectionObserver; a selector that matches nothing is skipped in silence,
 * so that section's speech bubble simply never appears and nothing reports it.
 */
export function blurbSelectors(html) {
  const block = html.match(/id="divinci-chat-blurbs"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!block) return [];
  try {
    return JSON.parse(block).map((b) => b.selector).filter(Boolean);
  } catch {
    return null; // malformed JSON — the widget would throw on it too
  }
}

/**
 * Does the document contain an element this simple selector would match?
 *
 * Class matching goes through exact TOKEN membership, not a regex over the raw
 * attribute. A `\b`-delimited regex looks right and is not: `-` is a non-word
 * character, so `\beconomics\b` happily matches inside `economics-grid`. That
 * made this check pass while the `.economics` section had actually been
 * renamed — found by mutation-testing the guard, not by the unit assertions,
 * which used a hyphen-free counter-example and so never exercised the flaw.
 */
export function selectorMatches(html, selector) {
  if (selector.startsWith(".")) return extractClasses(html).has(selector.slice(1));
  if (selector.startsWith("#")) return html.includes(`id="${selector.slice(1)}"`);
  return new RegExp(`<${selector}[\\s>]`).test(html); // bare tag
}

/** Resolve a site-absolute ref to a path under public/, following the SPA dir convention. */
export function refToDiskPath(ref, root) {
  const clean = ref.split("#")[0].split("?")[0];
  let p = join(root, clean);
  if (clean.endsWith("/")) p = join(p, "index.html");
  return p;
}

// ── Checks ────────────────────────────────────────────────────────────────

let failed = false;
const fail = (msg) => { failed = true; console.error(`✗ ${msg}`); };
const ok = (msg) => console.warn(`✓ ${msg}`);

function checkPage(page) {
  const file = join(publicDir, page.path);
  if (!existsSync(file)) return fail(`${page.path} — missing`);
  const html = readFileSync(file, "utf8");

  // 1. Every local asset the page references must exist on disk. This is the
  //    SPA-fallback trap: a missing one would serve index.html with a 200.
  let missing = 0;
  for (const ref of new Set(localRefs(html))) {
    const disk = refToDiskPath(ref, publicDir);
    // Guard against a ref escaping public/ via ../ segments.
    if (!resolve(disk).startsWith(resolve(publicDir))) {
      fail(`${page.url} → ${ref} escapes public/`);
      missing++;
      continue;
    }
    if (!existsSync(disk) || statSync(disk).size === 0) {
      fail(`${page.url} → ${ref} does not exist in public/ (would serve index.html with HTTP 200)`);
      missing++;
    }
  }
  if (!missing) ok(`${page.url} — all local assets exist`);

  // 2. Shared-shell contract: the classes this page borrows must still be in
  //    styles.css. Guards the "additive only" design of the spin-off funnels.
  const shared = readFileSync(join(publicDir, "styles.css"), "utf8");
  const lostClasses = page.structuralClasses.filter((c) => !cssDefinesClass(shared, c));
  if (lostClasses.length) {
    fail(`${page.url} — styles.css no longer defines: ${lostClasses.join(", ")} (page would render unstyled)`);
  } else {
    ok(`${page.url} — ${page.structuralClasses.length} shared shell classes present in styles.css`);
  }

  // 3. Classes the page's OWN stylesheet is supposed to provide.
  for (const cssPath of page.ownCss) {
    const cssFile = join(publicDir, cssPath);
    if (!existsSync(cssFile)) { fail(`${page.url} — own stylesheet ${cssPath} missing`); continue; }
    const own = readFileSync(cssFile, "utf8");
    const used = [...extractClasses(html)];
    // A class is unaccounted for only if NO stylesheet we ship defines it.
    // dvc-* belong to the chat widget's own sheet; i18n/JS-applied state
    // classes legitimately have no static rule.
    const unaccounted = used.filter(
      (c) =>
        !c.startsWith("dvc-") &&
        !cssDefinesClass(own, c) &&
        !cssDefinesClass(shared, c),
    );
    if (unaccounted.length) {
      // Informational: an unstyled class is usually a semantic hook, not a bug.
      console.warn(`  ⓘ ${page.url} — no rule found for: ${unaccounted.join(", ")}`);
    }
    ok(`${page.url} — own stylesheet ${cssPath} present`);
  }

  // 4. Runtime selector contracts.
  const lostHooks = SCRIPT_HOOKS.filter((h) => !h.test(html)).map((h) => h.name);
  if (lostHooks.length) fail(`${page.url} — missing script hooks: ${lostHooks.join("; ")}`);
  else ok(`${page.url} — all ${SCRIPT_HOOKS.length} script hooks present`);

  // 4b. Every chat-blurb selector must match something on this page.
  const sels = blurbSelectors(html);
  if (sels === null) {
    fail(`${page.url} — #divinci-chat-blurbs is not valid JSON (the widget would throw)`);
  } else {
    const dead = sels.filter((s) => !selectorMatches(html, s));
    if (dead.length) fail(`${page.url} — chat blurbs target selectors that match nothing: ${dead.join(", ")}`);
    else ok(`${page.url} — all ${sels.length} chat-blurb selectors match an element`);
  }

  // 5. Security invariant: no reverse-tabnabbing handles.
  const bad = blankLinksMissingNoopener(html);
  if (bad.length) fail(`${page.url} — target="_blank" without rel="noopener": ${bad.length} link(s)`);
  else ok(`${page.url} — every _blank link carries rel="noopener"`);

  // 6. Structure / SEO invariants.
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(`${page.url} — expected exactly 1 <h1>, found ${h1s}`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== page.canonical) fail(`${page.url} — canonical is ${canonical ?? "(absent)"}, expected ${page.canonical}`);
  for (const tag of ["og:title", "og:description", "og:url", "og:image"]) {
    if (!html.includes(`property="${tag}"`)) fail(`${page.url} — missing ${tag}`);
  }
  if (!/<title>.+<\/title>/.test(html)) fail(`${page.url} — missing <title>`);
  if (h1s === 1 && canonical === page.canonical) ok(`${page.url} — structure + canonical + og tags`);
}

async function checkLive(base) {
  for (const page of PAGES) {
    for (const [ref, expect] of [
      [page.url, "text/html"],
      ...page.ownCss.map((c) => [`/${c}`, "text/css"]),
    ]) {
      const url = base.replace(/\/$/, "") + ref;
      try {
        const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
        const ct = res.headers.get("content-type") ?? "";
        // Status alone lies here: the SPA fallback answers 200 text/html for a
        // file that does not exist. Content-type is the check that matters.
        if (!res.ok || !ct.startsWith(expect)) {
          fail(`LIVE ${url} → ${res.status} ${ct} (expected ${expect})`);
        } else {
          ok(`LIVE ${url} → ${res.status} ${ct}`);
        }
      } catch (err) {
        fail(`LIVE ${url} → ${err.message}`);
      }
    }
  }
}

// ── Self-test ─────────────────────────────────────────────────────────────
// This repo has no test runner, so the guard proves its own checks can FAIL.
// A guard that cannot fail is indistinguishable from one that always passes —
// which is the state the dormant Playwright suite is already in.
function selftest() {
  let bad = 0;
  const is = (name, actual, expected) => {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) { bad++; console.error(`✗ selftest: ${name}\n    got      ${JSON.stringify(actual)}\n    expected ${JSON.stringify(expected)}`); }
    else console.warn(`✓ selftest: ${name}`);
  };

  is("extractRefs finds href and src",
    extractRefs('<a href="/a.css"><img src="/b.png">'), ["/a.css", "/b.png"]);
  is("localRefs drops protocol-relative and absolute",
    localRefs('<a href="/ok"><a href="//cdn/x"><a href="https://e/x">'), ["/ok"]);
  is("extractClasses splits tokens", [...extractClasses('<p class="a b"><i class="a">')], ["a", "b"]);

  // The subtle one: prefix matching would make the shared-shell check
  // permissive enough to miss a real rename.
  is("cssDefinesClass exact-matches", cssDefinesClass(".card-art{}", "card"), false);
  is("cssDefinesClass matches a real rule", cssDefinesClass(".card{}", "card"), true);
  is("cssDefinesClass matches in a compound selector", cssDefinesClass(".x .card:hover{}", "card"), true);

  is("noopener check flags a bare _blank",
    blankLinksMissingNoopener('<a target="_blank" href="/x">').length, 1);
  is("noopener check passes a guarded _blank",
    blankLinksMissingNoopener('<a target="_blank" rel="noopener" href="/x">').length, 0);

  is("blurbSelectors parses the JSON block",
    blurbSelectors('<script id="divinci-chat-blurbs">[{"selector":".x","blurb":"b"}]</script>'), [".x"]);
  is("blurbSelectors returns null on malformed JSON",
    blurbSelectors('<script id="divinci-chat-blurbs">[{oops}]</script>'), null);
  is("selectorMatches finds a class among several",
    selectorMatches('<div class="a menu b">', ".menu"), true);
  is("selectorMatches does not substring-match a class",
    selectorMatches('<div class="menubar">', ".menu"), false);
  // The regression the mutation test caught: a hyphenated sibling class must
  // NOT satisfy the bare selector, or renaming a section goes unnoticed.
  is("selectorMatches does not accept a hyphenated sibling class",
    selectorMatches('<div class="economics-grid"><p class="economics-note">', ".economics"), false);
  is("selectorMatches still accepts the exact class alongside its siblings",
    selectorMatches('<section class="economics"><div class="economics-grid">', ".economics"), true);

  is("refToDiskPath maps a directory to index.html",
    refToDiskPath("/partners/", "/root"), "/root/partners/index.html");
  is("refToDiskPath strips query and hash",
    refToDiskPath("/a.css?v=2#x", "/root"), "/root/a.css");

  if (bad) { console.error(`\n${bad} selftest assertion(s) failed`); process.exit(1); }
  console.warn("\nselftest: all assertions passed");
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────
if (process.argv.includes("--selftest")) selftest();

for (const page of PAGES) checkPage(page);

if (process.argv.includes("--live")) {
  const baseArg = process.argv.find((a) => a.startsWith("--base="));
  await checkLive(baseArg ? baseArg.slice("--base=".length) : "https://divinci.app");
}

if (failed) {
  console.error("\n❌ funnel integrity check FAILED");
  process.exit(1);
}
console.warn("\n✅ funnel integrity OK");
