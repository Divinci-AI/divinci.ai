/**
 * Emit `public/_headers` for one environment.
 *
 * WHY THIS EXISTS
 *
 * `wrangler.jsonc` gives the worker a `run_worker_first` allowlist — `/`,
 * `/*​/`, `/*.html`, `/api/*`, `/robots.txt`, `/.well-known/*`. Every other
 * response (images, CSS, JS, fonts, sitemap.xml) is served straight off the
 * asset layer and NEVER INVOKES THE WORKER, so nothing in `securityHeaders`
 * reaches it. The worker's `X-Robots-Tag` therefore covers every HTML page —
 * which is what de-indexing turns on — but leaves staging's images reachable
 * through image search and its sitemap.xml served without comment.
 *
 * A `_headers` file is applied by the asset layer itself, so it reaches the
 * responses the worker cannot. Verified against a live staging deploy before
 * this was written: a probe rule appeared on /css/style.css,
 * /images/*.svg and /sitemap.xml, and GET /_headers returned 404 — the file is
 * consumed as configuration, not published.
 *
 * WHY IT DOES NOT REPLACE THE WORKER CHECK
 *
 * This file is baked at BUILD time; the worker decides per REQUEST. Build the
 * production target and deploy it at staging and this file says "indexable"
 * while the worker, reading its runtime bindings, still says noindex. The two
 * mechanisms fail in different directions on purpose: `_headers` supplies
 * completeness, `isIndexable()` supplies robustness. Deleting either one leaves
 * a real gap.
 *
 * Run AFTER `zola build` — zola empties `public/` on each build, so a file
 * written before it does not survive.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NOINDEX } from '../src/indexability.mjs';

/**
 * Environments whose deploy serves the canonical site.
 *
 * Deliberately an allowlist of one rather than a `!== 'production'` test: a
 * typo'd or newly added environment name falls through to noindex, which is
 * the harmless direction. A stray noindex on a preview costs nothing; a
 * missing one costs weeks of a duplicate outranking the original.
 */
const CANONICAL_ENVS = new Set(['production']);

/**
 * The body of `_headers` for a build.
 *
 * Exported so a test can assert on the production output directly. That
 * assertion is the point of the split: shipping `noindex` to divinci.ai is the
 * catastrophic failure mode here, and it should be a red build rather than
 * something noticed weeks later in Search Console.
 *
 * @param {boolean} canonical  Does this build serve the canonical site?
 * @returns {string}
 */
export function buildHeaders(canonical) {
  if (canonical) {
    // Emitted even when empty of rules, so the production path is exercised by
    // the same code that writes the others rather than being a silent no-op
    // that nothing ever checks.
    return [
      '# Canonical production build — deliberately no X-Robots-Tag.',
      '# See scripts/build-headers.mjs. Changing this de-indexes divinci.ai.',
      '',
    ].join('\n');
  }
  return [
    '# Non-canonical build: a byte-for-byte copy of the production site.',
    '#',
    '# The worker already sets this on every HTML page, but static assets do',
    '# not invoke the worker (see run_worker_first in wrangler.jsonc), so',
    '# without this rule staging images remain reachable via image search.',
    '#',
    '# Crawling stays ALLOWED in robots.txt on purpose: a URL a crawler may',
    '# not fetch is a URL whose noindex it never reads, so anything already',
    '# indexed would stay indexed forever.',
    '/*',
    `  X-Robots-Tag: ${NOINDEX}`,
    '',
  ].join('\n');
}

/** @param {string[]} argv */
export function envFromArgv(argv) {
  const i = argv.indexOf('--env');
  // No flag means the top-level (production) target, matching
  // `wrangler deploy --env=""`.
  return i === -1 ? 'production' : (argv[i + 1] ?? '');
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const env = envFromArgv(process.argv.slice(2));
  const canonical = CANONICAL_ENVS.has(env);
  const out = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'public',
    '_headers',
  );
  await writeFile(out, buildHeaders(canonical), 'utf8');
  console.log(
    `[build-headers] env=${env || '(none)'} canonical=${canonical} -> public/_headers`,
  );
}

export { CANONICAL_ENVS };
