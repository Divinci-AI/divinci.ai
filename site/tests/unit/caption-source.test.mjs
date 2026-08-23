/**
 * The poster caption is GENERATED source, and one missing "+" broke it silently.
 *
 * gen-universe-poster.mjs rewrites `var POSTER_CAPTION = …` in
 * static/js/www-rag-universe.js so the words under the picture cannot drift
 * from the picture. It emits the caption as quoted fragments joined by `+`.
 *
 * On 2026-08-22 the fragments were joined by a newline alone. That is NOT a
 * syntax error in JavaScript: automatic semicolon insertion ends the statement
 * after the first literal and treats the rest as no-op expression statements.
 * So `node --check` passed, the file loaded in the browser, and the caption
 * became its own first 63 characters — "…captured 22 August 2026: 6,503 " —
 * cut off mid-sentence, under a picture it no longer described.
 *
 * These tests exist because nothing else in the stack can see that: not the
 * parser, not the linter, not a visual diff of the poster.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAPTION_RE,
  evalCaptionLiteral,
  renderCaptionDeclaration,
  renderCaptionLiteral,
} from "../../scripts/lib/caption-source.mjs";

const REAL =
  "A snapshot of the RAG Universe, captured 22 August 2026: 6,503 sites, " +
  "15,785 hyperlinks between them and 15,469 semantic ties. Size is pages " +
  "indexed, and sites sit near the sites they resemble. The live map is " +
  "interactive — every dot opens that site's assistant — but it is a heavy " +
  "drawing on a small screen, so this page shows the picture by default.";

test("a rendered caption evaluates back to exactly the caption", () => {
  assert.equal(evalCaptionLiteral(renderCaptionDeclaration(REAL)), REAL);
});

test("it wraps onto several lines — the single-line case would not catch the bug", () => {
  assert.ok(renderCaptionLiteral(REAL).split("\n").length >= 4);
});

test("every line break between fragments carries a +", () => {
  const literal = renderCaptionLiteral(REAL);
  for (const line of literal.split("\n").slice(0, -1)) {
    assert.match(line.trim(), /\+$/, `fragment does not end in +: ${line.trim()}`);
  }
});

test("THE BUG: newline-joined fragments truncate instead of failing", () => {
  // Reproduce the 2026-08-22 output exactly: same fragments, no "+".
  const broken = renderCaptionLiteral(REAL).split(" +\n").join("\n");
  const declaration = `  var POSTER_CAPTION =\n    ${broken};\n`;

  // It parses. That is the whole problem.
  assert.doesNotThrow(() => evalCaptionLiteral(declaration));

  const value = evalCaptionLiteral(declaration);
  assert.notEqual(value, REAL);
  assert.ok(value.length < REAL.length / 2, "expected silent truncation");

  // And the round-trip check in gen-universe-poster.mjs is what catches it.
  assert.notEqual(value, REAL);
});

test("caption text survives the quoting that trips naive emitters", () => {
  const awkward =
    "Curly ’ apostrophe, straight ' apostrophe, \"double quotes\", " +
    "an em dash — a backslash \\ and a trailing space ";
  assert.equal(evalCaptionLiteral(renderCaptionDeclaration(awkward)), awkward);
});

test("the anchor matches the declaration in the shipped file, exactly once", async () => {
  const { readFile } = await import("node:fs/promises");
  const url = new URL("../../static/js/www-rag-universe.js", import.meta.url);
  const source = await readFile(url, "utf8");
  const all = source.match(new RegExp(CAPTION_RE.source, "g")) || [];
  assert.equal(all.length, 1, "gen-universe-poster.mjs would refuse to rewrite this");
});

test("the caption SHIPPED in the file is whole, not truncated", async () => {
  const { readFile } = await import("node:fs/promises");
  const url = new URL("../../static/js/www-rag-universe.js", import.meta.url);
  const source = await readFile(url, "utf8");
  const value = evalCaptionLiteral(source.match(CAPTION_RE)[0]);
  assert.ok(value.length > 300, `caption is only ${value.length} chars: ${value}`);
  assert.match(value, /picture by default\.$/);
});

/**
 * The caption and the unfurl card are written from ONE capture, but they live
 * in two files. A hand-edit to either — or a refresh that half-failed — leaves
 * the page saying one number and every shared link saying another, and both
 * look fine on their own.
 */
test("the poster caption and the unfurl figures state the same corpus", async () => {
  const { readFile } = await import("node:fs/promises");
  const js = await readFile(
    new URL("../../static/js/www-rag-universe.js", import.meta.url),
    "utf8",
  );
  const figures = JSON.parse(
    await readFile(new URL("../../scripts/og-assets/figures.json", import.meta.url), "utf8"),
  );

  const caption = evalCaptionLiteral(js.match(CAPTION_RE)[0]);
  const line = figures["www-rag"]?.line;
  assert.ok(line, "no www-rag entry in og-assets/figures.json");

  // Every number the strip claims must also appear in the caption.
  const numbers = line.match(/[\d,]{2,}/g) || [];
  assert.ok(numbers.length >= 3, `expected 3 figures in the strip, got: ${line}`);
  for (const n of numbers) {
    assert.ok(
      caption.includes(n),
      `unfurl card says ${n} but the poster caption does not — they came from ` +
      `different captures. Re-run: npm run refresh:universe`,
    );
  }
});
