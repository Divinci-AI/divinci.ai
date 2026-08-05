/**
 * Contract tests for the pushed per-service status components.
 *
 * Run with:  npm run test:worker
 *
 * The push is authenticated but otherwise untrusted, and its output is
 * rendered on a public page. These pin the two properties that matter most:
 * nothing a pusher sends can become arbitrary text on divinci.ai, and no
 * customer identifier can reach the page even if someone tries to send one.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COMPONENTS_STALE_AFTER_MS,
  PUSHED_COMPONENTS,
  componentsView,
  sanitizeComponentsPush,
  worstOf,
} from '../../src/status-components.mjs';

const NOW = Date.parse('2026-08-05T12:00:00Z');
const iso = (ms) => new Date(ms).toISOString();
const push = (components, at = NOW) => ({ generatedAt: iso(at), components });

const ok = (input, now = NOW) => {
  const r = sanitizeComponentsPush(input, now);
  assert.equal(r.ok, true, `expected accept, got: ${r.error}`);
  return r.value;
};
const rejected = (input, now = NOW) => {
  const r = sanitizeComponentsPush(input, now);
  assert.equal(r.ok, false, 'expected reject');
  return r.error;
};

// ── the untrusted-input boundary ────────────────────────────────────────

test('accepts a realistic push', () => {
  const v = ok(push([
    { id: 'chat', status: 'operational' },
    { id: 'api', status: 'degraded' },
    { id: 'customer-embeds', status: 'operational', ok: 9, total: 9 },
  ]));
  assert.equal(v.components.length, 3);
});

test('drops component ids that are not on the allowlist', () => {
  const v = ok(push([
    { id: 'chat', status: 'operational' },
    { id: 'definitely-not-a-component', status: 'major_outage' },
  ]));
  assert.deepEqual(v.components.map((c) => c.id), ['chat']);
});

test('carries NO free text — name and description come from the allowlist', () => {
  // A stolen push token may mark us down. It must not be able to write words
  // onto a public page.
  const v = ok(push([
    { id: 'chat', status: 'operational', name: 'Owned by attacker', description: '<script>' },
  ]));
  assert.deepEqual(Object.keys(v.components[0]).sort(), ['id', 'status']);

  const view = componentsView(v, NOW);
  const chat = view.find((c) => c.id === 'chat');
  assert.equal(chat.name, 'Chat');
  assert.equal(chat.description, PUSHED_COMPONENTS.find((c) => c.id === 'chat').description);
});

test('no customer identifier can reach the view', () => {
  // 18 of the backing checks are per-customer. The schema has nowhere to put a
  // customer name, which beats remembering not to send one.
  const v = ok(push([
    { id: 'customer-embeds', status: 'operational', ok: 9, total: 9, customer: 'drfuhrman', names: ['femmex'] },
  ]));
  const serialized = JSON.stringify(componentsView(v, NOW));
  for (const name of ['drfuhrman', 'femmex', 'topsocal', 'excelspine']) {
    assert.ok(!serialized.includes(name), `${name} leaked into the public view`);
  }
});

test('rejects unknown statuses rather than coercing them', () => {
  const v = ok(push([
    { id: 'chat', status: 'operational' },
    { id: 'api', status: 'on fire' },
  ]));
  assert.deepEqual(v.components.map((c) => c.id), ['chat']);
});

test('rejects a payload with nothing recognizable', () => {
  rejected(push([{ id: 'nope', status: 'operational' }]));
  rejected(push([]));
  rejected({ components: [{ id: 'chat', status: 'operational' }] }); // no generatedAt
  rejected('not an object');
});

test('rejects timestamps outside a plausible window', () => {
  rejected(push([{ id: 'chat', status: 'operational' }], NOW + 60 * 60 * 1000));
  rejected(push([{ id: 'chat', status: 'operational' }], NOW - 48 * 60 * 60 * 1000));
});

test('duplicate ids collapse to one row', () => {
  const v = ok(push([
    { id: 'chat', status: 'operational' },
    { id: 'chat', status: 'major_outage' },
  ]));
  assert.equal(v.components.length, 1);
});

test('nonsense counts are dropped, not rendered', () => {
  for (const bad of [{ ok: 5, total: 2 }, { ok: -1, total: 3 }, { ok: 1.5, total: 3 }, { ok: 'x', total: 3 }]) {
    const v = ok(push([{ id: 'customer-embeds', status: 'operational', ...bad }]));
    assert.equal(v.components[0].ok, undefined, `accepted ${JSON.stringify(bad)}`);
  }
});

// ── the view ────────────────────────────────────────────────────────────

test('a stale push reads unknown, never its last good value', () => {
  // A status page that keeps saying "operational" because its feed died is
  // worse than one that admits it does not know.
  const v = ok(push([{ id: 'chat', status: 'operational' }]));
  const view = componentsView(v, NOW + COMPONENTS_STALE_AFTER_MS + 1000);
  assert.ok(view.every((c) => c.status === 'unknown'));
});

test('a push just inside the staleness window is still trusted', () => {
  const v = ok(push([{ id: 'chat', status: 'operational' }]));
  const view = componentsView(v, NOW + COMPONENTS_STALE_AFTER_MS - 1000);
  assert.equal(view.find((c) => c.id === 'chat').status, 'operational');
});

test('a component the pusher stopped reporting reads unknown, not missing', () => {
  const v = ok(push([{ id: 'chat', status: 'operational' }]));
  const view = componentsView(v, NOW);
  assert.equal(view.length, PUSHED_COMPONENTS.length);
  assert.equal(view.find((c) => c.id === 'api').status, 'unknown');
});

test('no record at all renders NOTHING — never configured is not an outage', () => {
  // Shipping the Worker before the feed is turned on must change the page by
  // zero pixels. Returning six `unknown` components here would drag the
  // overall banner off "All systems operational" and grey the footer dot,
  // announcing an outage that is really an unset secret. Caught on staging.
  assert.deepEqual(componentsView(null, NOW), []);
  assert.deepEqual(componentsView({}, NOW), []);
  assert.deepEqual(componentsView({ generatedAt: 'nonsense' }, NOW), []);
});

test('a STALE record still reports unknown — a dead feed IS news', () => {
  // The other half of the distinction above: once the feed has spoken, its
  // silence means something and must be shown.
  const v = ok(push([{ id: 'chat', status: 'operational' }]));
  const view = componentsView(v, NOW + COMPONENTS_STALE_AFTER_MS + 1000);
  assert.equal(view.length, PUSHED_COMPONENTS.length);
  assert.ok(view.every((c) => c.status === 'unknown'));
});

test('the customer aggregate renders a bare count', () => {
  const v = ok(push([{ id: 'customer-embeds', status: 'degraded', ok: 8, total: 9 }]));
  const c = componentsView(v, NOW).find((x) => x.id === 'customer-embeds');
  assert.equal(c.detail, '8 of 9 embed surfaces responding');
});

test('worstOf ranks unknown above operational', () => {
  // Missing data must never present as healthy.
  assert.equal(worstOf([{ status: 'operational' }, { status: 'unknown' }]), 'unknown');
  assert.equal(worstOf([{ status: 'degraded' }, { status: 'major_outage' }]), 'major_outage');
  assert.equal(worstOf([{ status: 'operational' }]), 'operational');
});
