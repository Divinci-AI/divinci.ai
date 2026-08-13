/**
 * Every inline <script> in the BUILT site must actually parse.
 *
 * Why this exists: Zola's `minify_html = true` minifies inline JavaScript, and
 * its minifier renames identifiers per script. It will happily rename both a
 * catch parameter and a lexical declaration inside that catch block to the
 * same short name, emitting:
 *
 *     try { ... } catch(a) { const a = document.createElement("textarea"); ... }
 *
 * which is a SyntaxError, because a catch parameter and a `const` in the catch
 * body occupy one scope. That shipped to production on /docs/, /es/docs/ and
 * /fr/docs/: the entire page script died, so the code blocks never got their
 * copy buttons and never got `tabindex`, which in turn made every horizontally
 * scrollable code block unreachable by keyboard (WCAG 2.1.1).
 *
 * Nothing caught it. The source was valid, the build succeeded, the page looked
 * right, and the failure only existed in the minified output. So the check has
 * to run against `public/`, not against the source.
 *
 * Run with: npm run test:guards   (requires a build; `zola build` first)
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLIC = join(ROOT, 'public');

/** Only classic/module JS carries executable script; skip JSON-LD and friends.
 *  Attribute values may be unquoted — the built HTML is minified. */
function isJavaScript(attrs) {
  const m = attrs.match(/\stype\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
  if (!m) return true;
  const t = m[1].replace(/^["']|["']$/g, '').toLowerCase();
  return t === '' || t === 'text/javascript' || t === 'application/javascript' || t === 'module';
}

function isModule(attrs) {
  return /\stype\s*=\s*("module"|'module'|module)(\s|$|>)/i.test(attrs);
}

function htmlFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

describe('built inline scripts', () => {
  let pages = [];
  before(() => {
    if (!existsSync(PUBLIC)) return;
    pages = htmlFiles(PUBLIC);
  });

  test('public/ has been built', () => {
    assert.ok(existsSync(PUBLIC),
      'public/ is missing — run `zola build` before the guards');
    assert.ok(pages.length > 100, `only ${pages.length} built pages found`);
  });

  test('every inline script parses', () => {
    const broken = new Map();
    let checked = 0;

    for (const file of pages) {
      const html = readFileSync(file, 'utf8');
      for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
        const [, attrs, body] = m;
        if (/\ssrc\s*=/.test(attrs) || !isJavaScript(attrs) || !body.trim()) continue;
        checked++;
        try {
          // `new Function` parses a classic function body, which is what a
          // classic inline script is. It cannot parse `import`, so ES modules
          // are checked only for balanced parse via a Function wrapper below.
          if (isModule(attrs)) continue;
          new Function(body);
        } catch (err) {
          const key = err.message;
          if (!broken.has(key)) broken.set(key, []);
          broken.get(key).push(relative(ROOT, file));
        }
      }
    }

    assert.ok(checked > 1000, `only ${checked} inline scripts scanned — is the build stale?`);

    if (broken.size) {
      const detail = [...broken.entries()]
        .map(([msg, files]) =>
          `  ${files.length} page(s): ${msg}\n    ${files.slice(0, 5).join('\n    ')}`)
        .join('\n');
      assert.fail(
        `Inline scripts that do not parse in the BUILT output:\n${detail}\n\n` +
        'These parse fine in source — minify_html mangled them. The usual cause ' +
        'is a catch parameter colliding with a lexical declaration in the catch ' +
        'body; use an optional catch binding (`catch {`) to remove the parameter.');
    }
  });
});
