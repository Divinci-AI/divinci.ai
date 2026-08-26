import test from 'node:test';
import assert from 'node:assert/strict';

import { NOINDEX, isIndexable } from '../../src/indexability.mjs';

const PROD = { ENVIRONMENT: 'production', BASE_URL: 'https://divinci.ai' };
const STAGING = { ENVIRONMENT: 'staging', BASE_URL: 'https://staging.divinci.ai' };
const DEV = { ENVIRONMENT: 'development', BASE_URL: 'https://dev.divinci.ai' };

test('the canonical production hostname is the one thing that may be indexed', () => {
  assert.equal(isIndexable(PROD, 'divinci.ai'), true);
});

test('the www production route is indexable too', () => {
  // It 301s to the apex, but it is still a route that serves this worker.
  assert.equal(isIndexable(PROD, 'www.divinci.ai'), true);
});

test('staging and dev are never indexable', () => {
  assert.equal(isIndexable(STAGING, 'staging.divinci.ai'), false);
  assert.equal(isIndexable(DEV, 'dev.divinci.ai'), false);
});

test("production's own workers.dev hostname is not indexable", () => {
  // The regression this whole module exists to prevent: the production worker
  // answers on divinci.ai AND on divinci-ai-site.divinci-ai.workers.dev, so a
  // check keyed only on ENVIRONMENT would leave a full duplicate of the live
  // site indexable under a different name.
  assert.equal(isIndexable(PROD, 'divinci-ai-site.divinci-ai.workers.dev'), false);
});

test('the lower environments’ workers.dev hostnames are not indexable', () => {
  assert.equal(isIndexable(STAGING, 'divinci-ai-site-staging.divinci-ai.workers.dev'), false);
  assert.equal(isIndexable(DEV, 'divinci-ai-site-dev.divinci-ai.workers.dev'), false);
});

test('a lookalike hostname does not pass as the canonical one', () => {
  // Suffix matching would let an attacker-controlled or typo domain inherit
  // indexability; the comparison is exact.
  assert.equal(isIndexable(PROD, 'notdivinci.ai'), false);
  assert.equal(isIndexable(PROD, 'divinci.ai.evil.test'), false);
  assert.equal(isIndexable(PROD, 'evil-divinci.ai'), false);
});

test('a subdomain of production is not indexable just because production is', () => {
  // `www.` is allowed deliberately; nothing else inherits.
  assert.equal(isIndexable(PROD, 'assets.divinci.ai'), false);
  assert.equal(isIndexable(PROD, 'sdk.divinci.ai'), false);
});

test('following BASE_URL means a domain move carries indexability with it', () => {
  const moved = { ENVIRONMENT: 'production', BASE_URL: 'https://divinci.example' };
  assert.equal(isIndexable(moved, 'divinci.example'), true);
  assert.equal(isIndexable(moved, 'www.divinci.example'), true);
  assert.equal(isIndexable(moved, 'divinci.ai'), false);
});

test('missing or malformed configuration fails closed, and never throws', () => {
  // A throw here would 500 every request, so each of these must return false
  // rather than propagate. noindex on a broken config is the safe direction.
  assert.equal(isIndexable(undefined, 'divinci.ai'), false);
  assert.equal(isIndexable({}, 'divinci.ai'), false);
  assert.equal(isIndexable({ ENVIRONMENT: 'production' }, 'divinci.ai'), false);
  assert.equal(isIndexable({ ENVIRONMENT: 'production', BASE_URL: '' }, 'divinci.ai'), false);
  assert.equal(
    isIndexable({ ENVIRONMENT: 'production', BASE_URL: 'not a url' }, 'divinci.ai'),
    false,
  );
});

test('an unrecognised environment is treated as not production', () => {
  assert.equal(isIndexable({ ENVIRONMENT: 'preview', BASE_URL: 'https://divinci.ai' }, 'divinci.ai'), false);
  assert.equal(isIndexable({ ENVIRONMENT: 'Production', BASE_URL: 'https://divinci.ai' }, 'divinci.ai'), false);
});

test('the header value tells crawlers not to index or walk the link graph', () => {
  assert.equal(NOINDEX, 'noindex, nofollow');
});
