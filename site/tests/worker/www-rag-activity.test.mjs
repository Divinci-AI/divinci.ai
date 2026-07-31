/**
 * Contract tests for the live WWW-RAG activity payload.
 *
 * Run with:  npm run test:worker
 *
 * Node's own runner rather than Jest: the worker is native ESM, and Jest here
 * is configured for CommonJS + jsdom with no transform, so importing the real
 * module (instead of re-implementing it in the test, as the existing unit
 * tests do) is only possible this way.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTIVITY_STATES,
  STALE_AFTER_MS,
  isValidHost,
  publicView,
  sanitizeActivity,
  timingSafeEqual,
} from '../../src/www-rag-activity.mjs';

const NOW = 1753900000000; // 2025-07-30T…, inside the accepted timestamp window
const ok = (input, now = NOW) => {
  const r = sanitizeActivity(input, now);
  assert.equal(r.ok, true, `expected accept, got: ${r.error}`);
  return r.value;
};
const rejected = (input, now = NOW) => {
  const r = sanitizeActivity(input, now);
  assert.equal(r.ok, false, 'expected reject');
  return r.error;
};

// ── hostnames ───────────────────────────────────────────────────────────
// These strings reach us from crawled third-party pages and end up rendered
// on divinci.ai, so the accept set is the security boundary.

test('accepts ordinary crawled hostnames', () => {
  for (const h of ['kubernetes.io', 'docs.python.org', 'peps.python.org', 'a.co', 'xn--80ak6aa92e.com']) {
    assert.equal(isValidHost(h), true, h);
  }
});

test('rejects anything that is not a plain DNS name', () => {
  const hostile = [
    '<script>alert(1)</script>',
    'evil.com/<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    'http://evil.com',
    'evil.com:8080',
    'localhost',            // no dot — also not a crawlable public site
    '',
    '.evil.com',
    'evil.com.',
    '-evil.com',
    'ev il.com',
    'EVIL.COM',             // callers lowercase first; the raw form is not valid
    'under_score.com',
    'a'.repeat(120) + '.com',
    null,
    42,
    {},
  ];
  for (const h of hostile) {
    assert.equal(isValidHost(h), false, JSON.stringify(h));
  }
});

test('drops non-conforming hosts rather than rejecting the whole snapshot', () => {
  const v = ok({
    state: 'crawling',
    inFlight: ['kubernetes.io', '<script>x</script>', 'docs.python.org'],
  });
  assert.deepEqual(v.inFlight, ['kubernetes.io', 'docs.python.org']);
});

test('lowercases and de-duplicates in-flight hosts', () => {
  const v = ok({ state: 'crawling', inFlight: ['Kubernetes.IO', 'kubernetes.io', ' docs.python.org '] });
  assert.deepEqual(v.inFlight, ['kubernetes.io', 'docs.python.org']);
});

// ── state ───────────────────────────────────────────────────────────────

test('accepts every documented state', () => {
  for (const state of ACTIVITY_STATES) {
    assert.equal(ok({ state }).state, state);
  }
});

test('rejects an unknown state', () => {
  assert.match(rejected({ state: 'hacking' }), /state/);
  assert.match(rejected({ state: '' }), /state/);
  assert.match(rejected({}), /state/);
});

test('rejects non-object bodies', () => {
  for (const body of [null, undefined, 'crawling', 42, ['crawling']]) {
    assert.match(rejected(body), /JSON object/);
  }
});

// ── counts ──────────────────────────────────────────────────────────────

test('coerces and clamps counts, dropping nonsense', () => {
  const v = ok({ state: 'crawling', pagesThisPass: '412', chunksThisPass: -5, sitesThisPass: Infinity });
  assert.equal(v.pagesThisPass, 412);
  assert.equal(v.chunksThisPass, undefined, 'a negative count is dropped, not clamped to 0');
  assert.equal(v.sitesThisPass, undefined, 'Infinity is not a count');
});

test('progress requires both seeds and done', () => {
  const partial = ok({ state: 'crawling', done: 41 });
  assert.equal(partial.seeds, undefined);
  assert.equal(partial.done, undefined, 'a lone done would render as "41 of —"');

  const full = ok({ state: 'crawling', seeds: 62, done: 41 });
  assert.equal(full.seeds, 62);
  assert.equal(full.done, 41);
});

test('clamps done to seeds so progress can never read "63 of 62"', () => {
  assert.equal(ok({ state: 'crawling', seeds: 62, done: 63 }).done, 62);
});

// ── timestamps ──────────────────────────────────────────────────────────

test('rejects timestamps outside a plausible window', () => {
  // The classic seconds-vs-millis mix-up lands in 1970 and must not survive.
  assert.equal(ok({ state: 'crawling', passStartedAt: Math.floor(NOW / 1000) }).passStartedAt, undefined);
  assert.equal(ok({ state: 'crawling', passStartedAt: NOW + 10 * 86400000 }).passStartedAt, undefined);
  assert.equal(ok({ state: 'crawling', passStartedAt: NOW - 3600000 }).passStartedAt, NOW - 3600000);
});

test('nextPassAt may be in the future, but not absurdly so', () => {
  assert.equal(ok({ state: 'idle', nextPassAt: NOW + 3 * 3600000 }).nextPassAt, NOW + 3 * 3600000);
  assert.equal(ok({ state: 'idle', nextPassAt: NOW + 400 * 86400000 }).nextPassAt, undefined);
  assert.equal(ok({ state: 'idle', nextPassAt: 0 }).nextPassAt, undefined);
});

test('updatedAt is stamped by the server, not taken from the client', () => {
  const v = ok({ state: 'crawling', updatedAt: 1 });
  assert.equal(v.updatedAt, NOW);
});

// ── recent completions ──────────────────────────────────────────────────

test('keeps well-formed recent entries and caps the list', () => {
  const recent = Array.from({ length: 40 }, (_, i) => ({
    host: `site${i}.example.com`,
    pages: i,
    chunks: i * 10,
    at: NOW - i * 1000,
  }));
  const v = ok({ state: 'crawling', recent });
  assert.equal(v.recent.length, 12);
  assert.deepEqual(v.recent[0], { host: 'site0.example.com', pages: 0, chunks: 0, at: NOW });
});

test('a recent entry with a bad host is skipped, not fatal', () => {
  const v = ok({
    state: 'crawling',
    recent: [{ host: 'javascript:alert(1)', pages: 5 }, { host: 'good.example.com', pages: 5 }],
  });
  assert.equal(v.recent.length, 1);
  assert.equal(v.recent[0].host, 'good.example.com');
});

test('a recent entry keeps only the numeric fields that make sense', () => {
  const v = ok({ state: 'crawling', recent: [{ host: 'good.example.com', pages: 'lots', chunks: 12 }] });
  assert.deepEqual(v.recent[0], { host: 'good.example.com', chunks: 12 });
});

// ── public view / staleness ─────────────────────────────────────────────

test('a fresh record renders as reported', () => {
  const view = publicView({ state: 'crawling', updatedAt: NOW - 5000 }, NOW);
  assert.equal(view.state, 'crawling');
  assert.equal(view.stale, false);
  assert.equal(view.ageSeconds, 5);
});

test('a stale record is downgraded to offline — never claims a live crawl', () => {
  const view = publicView({ state: 'crawling', updatedAt: NOW - STALE_AFTER_MS - 1000 }, NOW);
  assert.equal(view.state, 'offline');
  assert.equal(view.reportedState, 'crawling', 'what it last said is still visible');
  assert.equal(view.stale, true);
});

test('a missing or malformed record reads as offline, not as an error', () => {
  for (const rec of [null, undefined, {}, 'crawling', { state: 'crawling' }]) {
    const view = publicView(rec, NOW);
    assert.equal(view.state, 'offline');
    assert.equal(view.stale, true);
  }
});

// ── auth comparison ─────────────────────────────────────────────────────

test('timingSafeEqual matches only exact equality', () => {
  assert.equal(timingSafeEqual('secret-token', 'secret-token'), true);
  assert.equal(timingSafeEqual('secret-token', 'secret-toke'), false);
  assert.equal(timingSafeEqual('secret-token', 'secret-tokenn'), false);
  assert.equal(timingSafeEqual('', ''), true);
  assert.equal(timingSafeEqual('', 'x'), false);
  assert.equal(timingSafeEqual('x', undefined), false);
  assert.equal(timingSafeEqual(undefined, undefined), false, 'two missing values are not a match');
  assert.equal(timingSafeEqual('ünïcode', 'ünïcode'), true);
});

// ── end to end ──────────────────────────────────────────────────────────

test('a realistic reporter payload survives intact', () => {
  const v = ok({
    state: 'crawling',
    passStartedAt: NOW - 1800000,
    seeds: 62,
    done: 41,
    inFlight: ['kubernetes.io', 'huggingface.co', 'pytorch.org'],
    recent: [{ host: 'pydata.org', pages: 118, chunks: 2456, at: NOW - 20000 }],
    pagesThisPass: 3120,
    chunksThisPass: 133191,
    sitesThisPass: 41,
  });
  assert.equal(v.state, 'crawling');
  assert.equal(v.done, 41);
  assert.equal(v.inFlight.length, 3);
  assert.equal(v.recent[0].chunks, 2456);
  assert.equal(v.chunksThisPass, 133191);
});
