import test from 'node:test';
import assert from 'node:assert/strict';

import { CANONICAL_ENVS, buildHeaders, envFromArgv } from '../../scripts/build-headers.mjs';
import { NOINDEX } from '../../src/indexability.mjs';

/** Lines the asset layer acts on: `#` comments and blanks are inert. */
function rules(body) {
  return body
    .split('\n')
    .filter((l) => l.trim() && !l.trimStart().startsWith('#'));
}

test('the production build carries no X-Robots-Tag rule', () => {
  // The catastrophic failure mode for this script, and the reason the body is
  // exported rather than written straight to disk: shipping noindex to
  // divinci.ai would de-index the real site, and nothing else in the build
  // would complain. This assertion turns that into a red build.
  //
  // Asserted over active rules rather than raw text so the file may still
  // NAME the header in a comment explaining why it is absent — which is the
  // first thing anyone opening public/_headers will want to know.
  for (const line of rules(buildHeaders(true))) {
    assert.doesNotMatch(line, /X-Robots-Tag/i);
    assert.doesNotMatch(line, /noindex/i);
  }
});

test('the production build emits no rules at all', () => {
  assert.deepEqual(rules(buildHeaders(true)), []);
});

test('a non-canonical build noindexes every path', () => {
  const body = buildHeaders(false);
  assert.match(body, /^\/\*$/m);
  assert.match(body, new RegExp(`^ {2}X-Robots-Tag: ${NOINDEX}$`, 'm'));
});

test('the header value comes from the worker’s own constant', () => {
  // Sharing NOINDEX rather than repeating the literal keeps the asset layer
  // and the worker from drifting into saying two different things.
  assert.ok(buildHeaders(false).includes(NOINDEX));
});

test('the rule is indented, as the _headers format requires', () => {
  // A header line flush against the margin is parsed as a new path pattern,
  // not as a header — the rule would be silently dropped.
  const lines = buildHeaders(false).split('\n');
  const i = lines.findIndex((l) => l.trim() === '/*');
  assert.ok(i !== -1, 'expected a /* path line');
  assert.match(lines[i + 1], /^ {2}\S/);
});

test('only production is treated as canonical', () => {
  assert.ok(CANONICAL_ENVS.has('production'));
  for (const e of ['staging', 'dev', 'development', 'preview', 'Production', '']) {
    assert.equal(CANONICAL_ENVS.has(e), false, `${e} must not be canonical`);
  }
});

test('a bare invocation means the production target', () => {
  // `wrangler deploy --env=""` passes no --env, and that is production.
  assert.equal(envFromArgv([]), 'production');
});

test('--env selects the named environment', () => {
  assert.equal(envFromArgv(['--env', 'staging']), 'staging');
  assert.equal(envFromArgv(['--env', 'dev']), 'dev');
});

test('a dangling --env yields a non-canonical build rather than production', () => {
  // Fail toward noindex: a malformed invocation must not be mistaken for the
  // canonical site.
  assert.equal(CANONICAL_ENVS.has(envFromArgv(['--env'])), false);
});
