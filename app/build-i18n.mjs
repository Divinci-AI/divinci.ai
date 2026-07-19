#!/usr/bin/env node
/**
 * divinci.app funnel i18n builder.
 *
 * public/index.html is the ENGLISH source of truth. This script:
 *   1. injects/refreshes the hreflang alternates + footer language switcher
 *      into the English page (between the i18n marker comments, idempotent);
 *   2. for every language in i18n/translations.json, produces
 *      public/<lang>/index.html by literal string replacement (longest
 *      English string first, whitespace-tolerant), with <html lang>,
 *      dir="rtl" for Arabic, and localized canonical/og:url.
 *
 * Run after editing the English page or translations:  node build-i18n.mjs
 * Same language set as divinci.ai (data/translations/*.json).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUB = join(ROOT, "public");
const SRC = join(PUB, "index.html");

const NATIVE = {
  en: "English", es: "Español", fr: "Français", de: "Deutsch", it: "Italiano",
  nl: "Nederlands", pt: "Português", ru: "Русский", ar: "العربية",
  hi: "हिन्दी", ja: "日本語", ko: "한국어", zh: "中文",
};
const RTL = new Set(["ar"]);

// One JSON file per language in i18n/ (es.json, fr.json, ...): a flat map of
// exact English source string -> translation.
const langs = {};
for (const f of readdirSync(join(ROOT, "i18n")).filter((f) => f.endsWith(".json")).sort()) {
  langs[basename(f, ".json")] = JSON.parse(readFileSync(join(ROOT, "i18n", f), "utf8"));
}
const ALL = ["en", ...Object.keys(langs)];

function alternatesBlock() {
  const lines = ALL.map((l) => {
    const href = l === "en" ? "https://divinci.app/" : `https://divinci.app/${l}/`;
    return `  <link rel="alternate" hreflang="${l}" href="${href}">`;
  });
  lines.push('  <link rel="alternate" hreflang="x-default" href="https://divinci.app/">');
  return `<!-- i18n:alternates -->\n${lines.join("\n")}\n  <!-- /i18n:alternates -->`;
}

function switcherBlock(current) {
  const links = ALL.map((l) => {
    const href = l === "en" ? "/" : `/${l}/`;
    const cur = l === current ? ' aria-current="true"' : "";
    return `<a href="${href}" lang="${l}"${cur}>${NATIVE[l]}</a>`;
  }).join(" ");
  return `<!-- i18n:switch --><p class="lang-switch">${links}</p><!-- /i18n:switch -->`;
}

// Loose replacement: internal whitespace runs in the English source may span
// newlines/indentation — match them with \s+.
function replaceLoose(html, en, tr) {
  const pattern = en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return html.replace(new RegExp(pattern, "g"), tr);
}

let en = readFileSync(SRC, "utf8");

// Refresh markers in the English page (insert on first run).
if (en.includes("<!-- i18n:alternates -->")) {
  en = en.replace(/<!-- i18n:alternates -->[\s\S]*?<!-- \/i18n:alternates -->/, alternatesBlock());
} else {
  en = en.replace('  <link rel="stylesheet" href="/styles.css">', `${alternatesBlock()}\n  <link rel="stylesheet" href="/styles.css">`);
}
if (en.includes("<!-- i18n:switch -->")) {
  en = en.replace(/<!-- i18n:switch -->[\s\S]*?<!-- \/i18n:switch -->/, switcherBlock("en"));
} else {
  en = en.replace('<p class="fineprint">', `${switcherBlock("en")}\n    <p class="fineprint">`);
}
writeFileSync(SRC, en);

for (const [lang, table] of Object.entries(langs)) {
  let html = en;
  const entries = Object.entries(table).sort((a, b) => b[0].length - a[0].length);
  let missed = 0;
  for (const [src, tr] of entries) {
    if (src === tr) continue; // intentionally untranslated (e.g. "Contact" in fr)
    const before = html;
    html = replaceLoose(html, src, tr);
    if (html === before) missed++;
  }
  html = html.replace('<html lang="en">', `<html lang="${lang}"${RTL.has(lang) ? ' dir="rtl"' : ""}>`);
  html = html.replace('<link rel="canonical" href="https://divinci.app/">', `<link rel="canonical" href="https://divinci.app/${lang}/">`);
  html = html.replace('<meta property="og:url" content="https://divinci.app/">', `<meta property="og:url" content="https://divinci.app/${lang}/">`);
  html = html.replace(/<!-- i18n:switch -->[\s\S]*?<!-- \/i18n:switch -->/, switcherBlock(lang));
  mkdirSync(join(PUB, lang), { recursive: true });
  writeFileSync(join(PUB, lang, "index.html"), html);
  console.log(`${lang}: ${entries.length - missed}/${entries.length} strings applied${missed ? ` (${missed} MISSED — check translations.json keys)` : ""}`);
}
console.log("done.");
