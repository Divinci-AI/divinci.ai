#!/usr/bin/env node
/**
 * Emits per-locale copies of the hand-authored diagram SVGs by substituting
 * <text> content from tools/diagram-locales.json.
 *
 * Only ar/es/fr are generated: those are the only locales whose page prose is
 * genuinely translated (the other nine are still English copies with a
 * translated hero), so a translated diagram on them would read as *more*
 * inconsistent, not less.
 *
 * Translated labels are routinely 20-30% longer than the English the layout was
 * measured against, so run tools/check-diagram-svgs.mjs afterwards — it catches
 * a label that has outgrown its card.
 *
 * Usage: node tools/build-diagram-locales.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCALES = ["ar", "es", "fr"];
const DIAGRAMS = [
  "autorag-diagram",
  "autorag-data-creation",
  "autorag-retrieval-evaluation",
  "autorag-generation-optimization",
];

const dict = JSON.parse(await readFile("tools/diagram-locales.json", "utf8"));
const imagesDir = "static/images";

let missing = new Set();
let written = 0;

for (const base of DIAGRAMS) {
  const src = await readFile(path.join(imagesDir, `${base}.svg`), "utf8");

  for (const loc of LOCALES) {
    let out = src.replace(
      /(<text\b[^>]*>)([^<]*)(<\/text>)/g,
      (whole, open, body, close) => {
        const key = body.trim();
        if (!key) return whole;
        const entry = dict[key];
        if (!entry) {
          // Bare numerals and Q/A badges are intentionally untranslated.
          if (!/^[0-9]+$/.test(key) && !["Q", "A", "B", "C"].includes(key)) {
            missing.add(key);
          }
          return whole;
        }
        const t = entry[loc];
        if (!t) { missing.add(`${key} [${loc}]`); return whole; }
        return open + t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + close;
      },
    );

    // NOTE: deliberately no direction="rtl" on the root. Setting it flips the
    // meaning of text-anchor="start" to the RIGHT edge, so every left-anchored
    // label grows leftward and runs off the canvas — the checker caught exactly
    // that. Arabic still shapes and orders correctly inside each label via
    // normal bidi; the stage-to-stage flow stays left-to-right, which is common
    // practice for technical process diagrams. Genuinely mirroring the layout is
    // a design change, not a substitution, and is deliberately not done here.

    // Stamp the locale onto the accessible name so screen readers in that
    // language are not handed an English title.
    out = out.replace(/<svg\b/, `<svg lang="${loc}"`);

    await writeFile(path.join(imagesDir, `${base}.${loc}.svg`), out);
    written++;
  }
}

console.log(`wrote ${written} localised diagrams (${DIAGRAMS.length} x ${LOCALES.length})`);
if (missing.size) {
  console.log(`\n${missing.size} string(s) had no translation and stayed English:`);
  for (const m of [...missing].sort()) console.log(`  ${m}`);
}
