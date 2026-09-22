import test from 'node:test';
import assert from 'node:assert/strict';

import { isFramable, framingHeadersFor } from '../../src/embed-framing.mjs';

const BASE = {
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'self'; report-uri /api/csp-report;",
  'X-Content-Type-Options': 'nosniff',
};

test('only the TrustBench embed path is framable', () => {
  assert.equal(isFramable('/trustbench/embed/'), true);
  assert.equal(isFramable('/trustbench/'), false);
  assert.equal(isFramable('/'), false);
  assert.equal(isFramable('/contact/'), false);
  // A directory merely NAMED embed elsewhere must not inherit the exemption.
  assert.equal(isFramable('/blog/embed/'), false);
  assert.equal(isFramable('/trustbench/embedded/'), false);
});

test('the embed path drops X-Frame-Options and opens frame-ancestors', () => {
  const h = framingHeadersFor('/trustbench/embed/', BASE);
  assert.equal(h['X-Frame-Options'], undefined);
  assert.match(h['Content-Security-Policy'], /frame-ancestors \*;/);
  assert.doesNotMatch(h['Content-Security-Policy'], /frame-ancestors 'self'/);
  // Everything else about the policy is untouched.
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.match(h['Content-Security-Policy'], /default-src 'self'/);
});

test('every other path keeps the anti-framing headers exactly', () => {
  for (const p of ['/', '/trustbench/', '/blog/what-a-benchmark-has-to-prove-about-itself/', '/contact/']) {
    assert.deepEqual(framingHeadersFor(p, BASE), BASE, p);
  }
});

test('the input headers are never mutated', () => {
  const copy = JSON.parse(JSON.stringify(BASE));
  framingHeadersFor('/trustbench/embed/', BASE);
  assert.deepEqual(BASE, copy);
});

test('a CSP without the expected clause fails closed', () => {
  const odd = { ...BASE, 'Content-Security-Policy': "default-src 'self';" };
  assert.deepEqual(framingHeadersFor('/trustbench/embed/', odd), odd);
});
