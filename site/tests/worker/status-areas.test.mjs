/**
 * Contract tests for the per-area bands.
 *
 * These pin the behaviour that was missing until 2026-08-19, when the page
 * rated 16 days "Degraded" without ever saying that the customer-facing
 * product was 1–12% of the 5xx on every one of them, and the majority share
 * was our own marketing site, pre-production, or internal tooling.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, AREA_IDS, INTERNAL_AREA_IDS, dayBands, productAffected } from '../../src/status-areas.mjs';

test('a day names only the areas the note implicated', () => {
  const bands = dayBands({ status: 'degraded' }, ['marketing']);
  const bad = bands.filter(b => b.status !== 'operational').map(b => b.id);
  assert.deepEqual(bad, ['marketing']);
});

test('every band carries the DAY\'s severity, not a softened one', () => {
  // A major outage confined to one area is still a major outage in that area.
  // Down-ranking it per band would understate a real event.
  const bands = dayBands({ status: 'major_outage' }, ['docs']);
  assert.equal(bands.find(b => b.id === 'docs').status, 'major_outage');
});

test('an area no customer can reach bands NOTHING', () => {
  // Pre-production and internal tooling left the bands on 2026-08-26 along
  // with the uptime number they used to move. A note naming only those must
  // therefore produce no bands at all rather than an empty five-strip bar —
  // there is nothing customer-facing to draw. The day is still reported, in
  // the sidecar, which is the whole point of the split.
  for (const id of INTERNAL_AREA_IDS) {
    assert.equal(dayBands({ status: 'degraded' }, [id]), null, `${id} banded`);
  }
  assert.equal(dayBands({ status: 'degraded' }, ['internal', 'preprod']), null);
  // ...and a mixed note bands only the public half.
  const mixed = dayBands({ status: 'degraded' }, ['internal', 'docs']);
  assert.deepEqual(mixed.filter(b => b.status !== 'operational').map(b => b.id), ['docs']);
  assert.equal(mixed.length, AREAS.length, 'the sidecar areas must not reappear as strips');
});

test('no evidence renders NO bands — never an invented breakdown', () => {
  // The page's failure mode has been over-claiming. Absent attribution we must
  // fall back to the plain bar rather than assert which area was at fault.
  assert.equal(dayBands({ status: 'degraded' }, []), null);
  assert.equal(dayBands({ status: 'degraded' }, undefined), null);
  assert.equal(dayBands({ status: 'degraded' }, null), null);
});

test('an unknown area id is dropped, not trusted', () => {
  // status-incidents.toml is hand-edited; a typo must not paint a meaningless
  // band, and must not turn into a band of its own.
  assert.equal(dayBands({ status: 'degraded' }, ['markting']), null);
  const bands = dayBands({ status: 'degraded' }, ['markting', 'docs']);
  assert.deepEqual(bands.filter(b => b.status !== 'operational').map(b => b.id), ['docs']);
  assert.equal(bands.length, AREAS.length);
});

test('good days and unmeasured days get no bands', () => {
  for (const s of ['operational', 'unknown', 'no_data']) {
    assert.equal(dayBands({ status: s }, ['product']), null, `banded a ${s} day`);
  }
});

test('band order is fixed and product-first', () => {
  // The shape has to be comparable across 90 days at a glance; a per-day
  // ordering would make two identical days look different.
  assert.equal(AREA_IDS[0], 'product');
  const a = dayBands({ status: 'degraded' }, ['marketing']).map(b => b.id);
  const b = dayBands({ status: 'degraded' }, ['docs']).map(b => b.id);
  assert.deepEqual(a, b);
  assert.deepEqual(a, AREA_IDS);
});

test('productAffected answers the question a visitor is actually asking', () => {
  assert.equal(productAffected(['marketing', 'preprod']), false);
  assert.equal(productAffected(['product']), true);
  assert.equal(productAffected(undefined), false);
});

test('every area has a name and a hint', () => {
  // These render on a public page; an id leaking through would be noise.
  for (const a of AREAS) {
    assert.ok(a.name && a.name.length > 2, `${a.id} has no name`);
    assert.ok(a.hint && a.hint.length > 5, `${a.id} has no hint`);
  }
});
