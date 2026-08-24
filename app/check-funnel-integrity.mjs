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

/**
 * The chat widget is configured by data-* attributes on its <script> tag, NOT
 * by an import or an env var — so the API origin it talks to is a literal
 * baked into 15 committed HTML files. Nothing checked it, and until
 * 2026-08-19 every one of them pointed the PRODUCTION apex at the STAGING API.
 *
 * That was not merely untidy. Staging's Atlas cluster is deliberately paused
 * when idle (56h of one recent 7-day window). While paused, /health stays
 * green and every data route 503s — so the chat widget on the production
 * marketing funnel went dark intermittently, with no alert and no error rate
 * to observe. Exactly the "a failed X is a 200" class the platform already
 * guards elsewhere.
 *
 * Resolved 2026-08-19 by repointing at release 6a5c825a4be54800a5349d53 on
 * api.divinci.app — which needed no new release to be published: divinci.ai
 * itself was already serving that exact release in production, so the funnel
 * had simply never been moved onto it. There is no waiver any more; a staging
 * origin is now a hard failure.
 */
/**
 * The funnel does not build the chat widget — it ships a COPY of the bundle
 * built from `site/static/js/src/divinci-chat-widget.ts` next door. Nothing
 * asserted the copy matched, and it silently fell a month behind: the funnel
 * carried the 2026-07-19 build while the source of truth moved on 2026-08-18,
 * missing ~20 fixes (iOS voice, keyboard-safe mobile panel, accessibility,
 * Turnstile token refresh, bare-403 recovery).
 *
 * A stale copy is invisible by construction — the page loads, the widget
 * appears, and only the fixes are missing. Byte-comparison is the whole check.
 */
const VENDORED_BUNDLES = [
  ["public/js/divinci-chat.js", "../site/static/js/divinci-chat.js"],
  ["public/js/divinci-robot.js", "../site/static/js/divinci-robot.js"],
];

const WIDGET_PROD_API = "https://api.divinci.app";
const WIDGET_STAGING_API = "https://api.stage.divinci.app";
// The release divinci.ai itself serves in production. Pinned because a
// correct origin with the wrong release is still the wrong assistant.
const WIDGET_PROD_RELEASE = "6a5c825a4be54800a5349d53";

// ── Pure helpers (exercised by --selftest) ────────────────────────────────

/**
 * The chat widget's data-* configuration, or null when the page does not load
 * it. Read off the divinci-chat.js <script> tag specifically, so an unrelated
 * data-api-base elsewhere on the page cannot satisfy the check.
 */
export function widgetConfig(html) {
  const tag = html.match(/<script\b[^>]*\bsrc="[^"]*divinci-chat\.js"[^>]*>/);
  if (!tag) return null;
  const attr = (name) => tag[0].match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
  return { apiBase: attr("data-api-base"), releaseId: attr("data-release-id") };
}

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
 * The submit button must never be disabled from the URL field's `blur` handler.
 *
 * WHY — this killed the entire funnel, silently, for weeks.
 *
 * `blur` on the URL input fires on the submit button's own MOUSEDOWN, before
 * mouseup. app.js used that blur to pre-check the directory, and the check
 * disabled the button while it ran. So pressing the CTA disabled the button
 * mid-press, and a browser dispatches no `click` — and therefore no `submit` —
 * on a disabled button. The press was swallowed outright: no navigation, no
 * request, no console error. The button even re-enabled ~200ms later, so the
 * page looked perfectly healthy afterwards.
 *
 * Nothing could see it. There is no failing request to log, no 5xx, no error
 * rate — the same "a failed X is a 200" shape guarded elsewhere in this file,
 * except here the failure never reaches the network at all. Measured against
 * production 2026-08-23: 1000+ directory prechecks (the blur handler firing)
 * against ZERO scan-website submits over 14 days.
 *
 * The invariant: `runCheck` gates its `button.disabled = true` behind a flag,
 * and the blur call site passes a falsy one. Returns the reasons it is
 * violated, empty when it holds.
 */
export function blurCanDisableSubmit(js) {
  const body = js.match(/function runCheck\([^)]*\)\s*\{[\s\S]*?\n    \}/);
  if (!body) return ["runCheck() not found in app.js — this guard has gone blind, fix the guard"];
  const reasons = [];

  // The disable must be gated, not unconditional.
  const gate = body[0].match(/if\s*\(\s*(\w+)\s*&&\s*button\s*\)\s*\{[^}]*button\.disabled\s*=\s*true/);
  if (!gate) {
    reasons.push("runCheck() disables the submit button unconditionally — gate it behind a busy flag that only the submit path passes");
  } else if (!new RegExp(`function runCheck\\([^)]*\\b${gate[1]}\\b`).test(js)) {
    reasons.push(`runCheck() gates the disable on "${gate[1]}", which is not one of its parameters`);
  }

  // The blur call site must opt out of it.
  const blur = js.match(/addEventListener\("blur",[\s\S]*?runCheck\(([^)]*)\)/);
  if (!blur) reasons.push("blur handler no longer calls runCheck() — this guard has gone blind, fix the guard");
  else if (!/,\s*(false|0)\s*$/.test(blur[1].trim())) {
    reasons.push(`blur handler calls runCheck(${blur[1].trim()}) — it must pass an explicit falsy busy flag, or it disables the button mid-click`);
  }
  return reasons;
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

  // 7. The chat widget must talk to production. See STAGING_API_WAIVER above.
  const widget = widgetConfig(html);
  if (widget) {
    if (!widget.apiBase || !widget.releaseId) {
      fail(`${page.url} — divinci-chat.js is missing data-api-base or data-release-id`);
    } else if (widget.apiBase === WIDGET_PROD_API) {
      if (widget.releaseId !== WIDGET_PROD_RELEASE) {
        fail(`${page.url} — chat widget release is ${widget.releaseId}, expected ${WIDGET_PROD_RELEASE}`);
      } else {
        ok(`${page.url} — chat widget → production API + release`);
      }
    } else if (widget.apiBase === WIDGET_STAGING_API) {
      // Regression guard, not a hypothetical: this is the state the funnel
      // shipped in for a month. Staging pauses when idle and answers /health
      // green while every data route 503s, so a page in this state looks
      // perfectly healthy from the outside.
      fail(`${page.url} — chat widget points at STAGING (${widget.apiBase}); production must use ${WIDGET_PROD_API}`);
    } else {
      fail(`${page.url} — chat widget points at an unrecognised API origin: ${widget.apiBase}`);
    }
  }
}

/**
 * Vendored bundles must be byte-identical to the source of truth next door.
 * Skipped (not failed) when site/ is absent, so the guard still runs in a
 * checkout that contains only the funnel — a missing sibling is not evidence
 * of drift, and failing on it would train people to ignore this check.
 */
function checkVendoredBundles() {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const [copyRel, srcRel] of VENDORED_BUNDLES) {
    const copy = join(here, copyRel);
    const src = join(here, srcRel);
    if (!existsSync(copy)) { fail(`${copyRel} — missing`); continue; }
    if (!existsSync(src)) {
      console.warn(`  ⓘ ${copyRel} — source of truth not in this checkout, drift not checked`);
      continue;
    }
    if (readFileSync(copy).equals(readFileSync(src))) {
      ok(`${copyRel} — matches ${srcRel}`);
    } else {
      fail(`${copyRel} — STALE: differs from ${srcRel}. Rebuild in site/ (\`npm run build:chat\` / \`build:robot\`) and copy it across.`);
    }
  }
}

/** app.js must not be able to swallow a press on the funnel's primary CTA. */
function checkSubmitReachable() {
  const js = join(publicDir, "app.js");
  if (!existsSync(js)) { fail("app.js — missing"); return; }
  const reasons = blurCanDisableSubmit(readFileSync(js, "utf8"));
  if (reasons.length) for (const r of reasons) fail(`app.js — ${r}`);
  else ok("app.js — blur pre-check cannot disable the submit button mid-click");
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

  // ── blurCanDisableSubmit ────────────────────────────────────────────────
  // The bug that killed the funnel, and the two shapes that fix or re-break it.
  const submitJs = (runCheckSig, disableLine, blurCall) => `
    function runCheck(${runCheckSig}) {
      ${disableLine}
      var pending = checkDirectory(host);
      return pending;
    }
    input.addEventListener("blur", function () {
      void runCheck(${blurCall});
    });`;
  const GATED = 'if (busy && button) { button.disabled = true; }';
  const UNGATED = 'if (button) { button.disabled = true; }';

  is("blurCanDisableSubmit passes when gated and blur opts out",
    blurCanDisableSubmit(submitJs("host, busy", GATED, "host, false")), []);
  // The original bug violates BOTH halves of the invariant, so it reports two.
  is("blurCanDisableSubmit catches the original unconditional disable",
    blurCanDisableSubmit(submitJs("host", UNGATED, "host")).length, 2);
  is("blurCanDisableSubmit catches a gated disable that blur still opts INTO",
    blurCanDisableSubmit(submitJs("host, busy", GATED, "host, true")).length, 1);
  is("blurCanDisableSubmit catches a gate on a non-parameter",
    blurCanDisableSubmit(submitJs("host", GATED, "host, false")).length, 1);
  is("blurCanDisableSubmit goes LOUD rather than silent if app.js is restructured",
    blurCanDisableSubmit("function somethingElse() {}").length, 1);
  // The real shipped file must satisfy it.
  is("blurCanDisableSubmit holds for the shipped app.js",
    blurCanDisableSubmit(readFileSync(join(publicDir, "app.js"), "utf8")), []);

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

  is("widgetConfig reads both data attributes",
    widgetConfig('<script src="/js/divinci-chat.js" data-api-base="https://api.divinci.app" data-release-id="abc"></script>'),
    { apiBase: "https://api.divinci.app", releaseId: "abc" });
  is("widgetConfig returns null when the widget is absent",
    widgetConfig('<script src="/js/app.js" data-api-base="https://api.divinci.app"></script>'), null);
  // The regression that matters: a data-api-base on some OTHER tag must not
  // satisfy the check, or the widget could be repointed unnoticed.
  is("widgetConfig ignores data-api-base on an unrelated tag",
    widgetConfig('<div data-api-base="https://api.divinci.app"></div>'), null);
  is("widgetConfig reports a missing attribute as null",
    widgetConfig('<script src="/js/divinci-chat.js" data-release-id="abc"></script>').apiBase, null);

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
checkVendoredBundles();
checkSubmitReachable();

if (process.argv.includes("--live")) {
  const baseArg = process.argv.find((a) => a.startsWith("--base="));
  await checkLive(baseArg ? baseArg.slice("--base=".length) : "https://divinci.app");
}

if (failed) {
  console.error("\n❌ funnel integrity check FAILED");
  process.exit(1);
}
console.warn("\n✅ funnel integrity OK");
