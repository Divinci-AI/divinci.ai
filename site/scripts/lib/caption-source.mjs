/**
 * Render a caption string as the JS source that declares it.
 *
 * Extracted from gen-universe-poster.mjs so it can be tested without taking a
 * screenshot of production first.
 *
 * ⚠️ The " +" joining the fragments is load-bearing, and omitting it fails
 * SILENTLY. Adjacent string literals on separate lines are not a syntax error
 * in JavaScript — ASI ends the statement after the first one. So `node --check`
 * passes, the browser loads the file, and the caption quietly becomes its own
 * first 63 characters, mid-sentence. That is why renderCaptionLiteral is paired
 * with evalCaptionLiteral and every caller checks the round-trip.
 */

const WRAP_AT = 68;

/** The declaration this rewrites, anchored on its terminating semicolon. */
export const CAPTION_RE = /(  var POSTER_CAPTION =\n)[\s\S]*?(;\n)/;

/** `caption` -> the quoted, wrapped, +-joined literal that reproduces it. */
export function renderCaptionLiteral(caption) {
  const fragments = [];
  let line = "";
  for (const word of String(caption).split(" ")) {
    if (line && `${line} ${word}`.length > WRAP_AT) {
      fragments.push(`${line} `);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) fragments.push(line);
  return fragments.map((f) => JSON.stringify(f)).join(" +\n    ");
}

/** Evaluate an emitted declaration back to its string value. */
export function evalCaptionLiteral(declaration) {
  return new Function(`${declaration} return POSTER_CAPTION;`)();
}

/** Build the full declaration for a caption. */
export function renderCaptionDeclaration(caption) {
  return `  var POSTER_CAPTION =\n    ${renderCaptionLiteral(caption)};\n`;
}
