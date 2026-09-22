import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/*
 * Zola's HTML minifier rewrites inline-script strings as template literals and
 * DOUBLES every backslash. A '\n' in a string therefore ships as a literal
 * backslash-n — on 2026-09-22 every Markdown/CSV copy from /trustbench/ came
 * out as a single line of "\n" text — and a \' ships as a visible backslash
 * (the earlier "configuration\'s" bug). Regex literals are not affected.
 *
 * So: no backslash inside a quoted string in the TrustBench board script.
 * Build the character instead (String.fromCharCode).
 */
const FILE = new URL('../../templates/partials/trustbench-boards-script.html', import.meta.url);

test('no backslash escapes inside string literals in the board script', () => {
  const offenders = [];
  readFileSync(FILE, 'utf8').split('\n').forEach((line, i) => {
    const code = line
      .replace(/^\s*\/\/.*$/, '').replace(/\s\/\/\s.*$/, '')
      // Regex literals are safe (the minifier leaves them alone) and often
      // contain quotes and backslashes, so drop them before looking at strings.
      .replace(/(?<=(?:[(,=:!&|?]|return)\s*)\/(?:\\.|[^/\n])+\/[gimsuy]*/g, 'RE');
    // '...\...' or "...\..." on one line
    if (/'[^'\n]*\\[^'\n]*'/.test(code) || /"[^"\n]*\\[^"\n]*"/.test(code)) offenders.push(`${i + 1}: ${line.trim()}`);
  });
  assert.deepEqual(offenders, [], 'backslash in a string literal:\n' + offenders.join('\n'));
});
