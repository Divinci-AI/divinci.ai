/**
 * Attribution is what turns "Degraded" into "Degraded — and it was the
 * marketing site, not the product". It lands on a PUBLIC page with no human
 * in the loop, so the tests here are mostly about the claims it refuses to
 * make: too few events, too much it could not classify, or a quiet day it
 * never observed all have to produce NOTHING rather than a confident guess.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTRIBUTION_KEY,
  HISTORY_KEY_FOR_INCIDENTS,
  MIN_AREA_EVENTS,
  MIN_BASIS_EVENTS,
  mergeAttributionIntoDays,
  applyAttribution,
  areaForRow,
  attributeRows,
  attributionForDay,
  attributionView,
  autoNote,
  collectAttribution,
  customerFacingStatus,
  incidentOpenAt,
} from '../../src/status-attribution.mjs';
import { HISTORY_KEY } from '../../src/status-history.mjs';
import { AREA_IDS, dayBands } from '../../src/status-areas.mjs';

const row = (host, path, count) => ({ count, dimensions: { clientRequestHTTPHost: host, clientRequestPath: path } });

test('the history key it reads is the one the sampler writes', () => {
  // It is duplicated rather than imported (see the constant's comment). This
  // is the pin that makes duplicating it safe.
  assert.equal(HISTORY_KEY_FOR_INCIDENTS, HISTORY_KEY);
  assert.notEqual(ATTRIBUTION_KEY, HISTORY_KEY, 'attribution must not share the sampler key');
});

test('every host we have actually seen 5xx on classifies as we intend', () => {
  // Taken from a real two-day Cloudflare pull across both zones. A mapping
  // written from memory is a mapping that files real traffic under "unknown".
  const cases = [
    ['api.divinci.app', '/ai-chat/start', 'product'],
    ['embed.divinci.app', '/embed-script.js', 'product'],
    ['chat.divinci.app', '/', 'product'],
    ['api.divinci.app', '/api/v1/www-rag/submit-url', 'internal'],
    ['api.divinci.app', '/white-label/_admin/sweep', 'internal'],
    ['divinci.ai', '/status/', 'marketing'],
    ['www.divinci.ai', '/', 'marketing'],
    ['thegfbco.demos.divinci.ai', '/', 'marketing'],
    ['sdk.divinci.ai', '/guides/', 'docs'],
    ['fulcrum-acme.divinci.ai', '/api/tasks', 'internal'],
    ['status.divinci.app', '/', 'internal'],
    ['chunks-workflow.divinci.app', '/', 'internal'],
    ['email.divinci.app', '/', 'internal'],
    ['audio-services.stage.divinci.app', '/pyannote/', 'preprod'],
    ['api.stage.divinci.app', '/health', 'preprod'],
    ['staging.divinci.ai', '/', 'preprod'],
    ['live.dev.divinci.app', '/', 'preprod'],
    // Cloudflare reports the host as the client sent it, port and all.
    ['divinci.ai:8443', '/', 'marketing'],
    ['webhook.stage.divinci.app:2083', '/', 'preprod'],
  ];
  for (const [host, path, expected] of cases) {
    assert.equal(areaForRow(host, path), expected, `${host}${path}`);
  }
});

test('a host it cannot place is null, never a plausible guess', () => {
  assert.equal(areaForRow('example.com', '/'), null);
  assert.equal(areaForRow('', '/'), null);
  assert.equal(areaForRow(undefined, undefined), null);
});

test('unclassified rows are counted, not silently dropped', () => {
  const { areas, total, unclassified } = attributeRows([
    row('divinci.ai', '/', 90),
    row('example.com', '/', 10),
    row('api.divinci.app', '/x', 5),
    row('api.divinci.app', '/x', -3),   // nonsense counts are ignored outright
  ]);
  assert.equal(areas.marketing, 90);
  assert.equal(areas.product, 5);
  assert.equal(unclassified, 10);
  assert.equal(total, 105, 'the total must include what we could not classify');
});

// ── the two baskets ──────────────────────────────────────────────────────

test('incident ticks accumulate separately from the whole day', () => {
  const rec = { days: {} };
  const t0 = Date.parse('2026-08-26T03:00:00Z');
  applyAttribution(rec, attributeRows([row('divinci.ai', '/', 500)]), { now: t0, duringIncident: false });
  applyAttribution(rec, attributeRows([row('api.divinci.app', '/chat', 40)]), { now: t0 + 300000, duringIncident: true });

  const d = rec.days['2026-08-26'];
  assert.equal(d.total, 540);
  assert.equal(d.areas.marketing, 500);
  assert.equal(d.incTotal, 40, 'only the incident tick counts toward the incident basket');
  assert.equal(d.inc.marketing, 0);
  assert.equal(d.inc.product, 40);
  assert.equal(d.windows, 1);
});

test('the incident basket wins when it has enough to say', () => {
  const d = {
    total: 10000, areas: { marketing: 9990, product: 10 },
    incTotal: 200, inc: { marketing: 0, product: 200 },
    unclassified: 0, incUnclassified: 0,
  };
  const a = attributionForDay(d);
  assert.equal(a.basis, 'incident');
  assert.deepEqual(a.areas.map(x => x.id), ['product']);
  // Without this the day-long marketing noise would have taken the blame for
  // a product outage — the whole reason two baskets exist.
});

test('a day with no incident ticks falls back to the day, and says so', () => {
  const a = attributionForDay({ total: 400, areas: { marketing: 400 }, incTotal: 0, inc: {}, unclassified: 0, incUnclassified: 0 });
  assert.equal(a.basis, 'day');
  assert.equal(a.areas[0].id, 'marketing');
  assert.match(autoNote('2026-08-20', a, null).summary, /whole day/,
    'a weaker basis must be admitted in the note, not hidden');
});

// ── the refusals ─────────────────────────────────────────────────────────

test('too few events attributes nothing', () => {
  const a = attributionForDay({
    total: MIN_BASIS_EVENTS - 1, areas: { marketing: MIN_BASIS_EVENTS - 1 },
    incTotal: 0, inc: {}, unclassified: 0, incUnclassified: 0,
  });
  assert.equal(a, null);
});

test('too much unclassified attributes nothing', () => {
  // The shares of what remains might be perfectly right. We cannot know that,
  // and a breakdown that omits half its input while looking complete is worse
  // than no breakdown.
  const a = attributionForDay({
    total: 1000, areas: { marketing: 500 }, unclassified: 500,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  assert.equal(a, null);
});

test('a bare trickle on another area is not banded', () => {
  const a = attributionForDay({
    total: 1000, areas: { marketing: 985, product: 15 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  assert.deepEqual(a.areas.map(x => x.id), ['marketing']);
  assert.equal(a.areas[0].share, 98.5);
});

test('the leading area is named even when it is under the share floor', () => {
  // Five-way split: nothing clears 10%+ except by being the leader. Reporting
  // "no area reached the floor" on a day the page calls degraded would be a
  // non-answer.
  const areas = { product: 30, marketing: 25, docs: 20, preprod: 15, internal: 10 };
  const a = attributionForDay({ total: 100, areas, unclassified: 0, incTotal: 0, inc: {}, incUnclassified: 0 });
  assert.equal(a.areas[0].id, 'product');
});

test('the view drops days that support no claim', () => {
  const v = attributionView({ days: {
    '2026-08-25': { total: 500, areas: { marketing: 500 }, unclassified: 0, incTotal: 0, inc: {}, incUnclassified: 0 },
    '2026-08-24': { total: 3, areas: { marketing: 3 }, unclassified: 0, incTotal: 0, inc: {}, incUnclassified: 0 },
  } });
  assert.deepEqual(Object.keys(v), ['2026-08-25']);
});

test('days outside the window are pruned', () => {
  const rec = { days: { '2026-01-01': { total: 1 } } };
  const now = Date.parse('2026-08-26T00:00:00Z');
  applyAttribution(rec, attributeRows([row('divinci.ai', '/', 5)]), { now, duringIncident: false });
  assert.deepEqual(Object.keys(rec.days), ['2026-08-26']);
});

// ── the note ─────────────────────────────────────────────────────────────

test('the note answers the question a visitor is actually asking', () => {
  const a = attributionForDay({
    total: 4400, areas: { marketing: 3900, docs: 500 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  const n = autoNote('2026-08-25', a, { windows: [{ minutes: 20, counted: true }] });
  assert.equal(n.auto, true);
  assert.deepEqual(n.areas, ['marketing', 'docs']);
  assert.equal(n.productAffected, false);
  assert.match(n.summary, /was not among the affected areas/);
  assert.match(n.summary, /20 minutes/);
  assert.match(n.summary, /says what was affected, not why/,
    'the note must never be mistaken for a diagnosis');
});

test('the note does not soften a day the product WAS on', () => {
  const a = attributionForDay({
    total: 900, areas: { product: 900 }, unclassified: 0,
    incTotal: 900, inc: { product: 900 }, incUnclassified: 0,
  });
  const n = autoNote('2026-08-26', a, null);
  assert.equal(n.productAffected, true);
  assert.match(n.summary, /some customer requests will have failed/);
  assert.doesNotMatch(n.summary, /not among the affected/);
});

test('the note contains no text that came off the wire', () => {
  // Hosts and paths are attacker-influenceable (anyone can send a Host header
  // that reaches our zone). They must never reach the page — only area ids
  // and numbers do.
  const a = attributionForDay({
    total: 100, areas: { marketing: 100 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  const n = autoNote('2026-08-25', a, null);
  const text = JSON.stringify(n);
  // `<` and `>` are excluded: the note itself writes ">99%", which is ours.
  for (const bad of ['divinci.ai', 'divinci.app', 'http', '/']) {
    assert.ok(!text.includes(bad), `note leaked ${bad}`);
  }
});

test('the note is only ever built from an attribution', () => {
  assert.equal(autoNote('2026-08-25', null, null), null);
});

test('an attributed day bands, without anyone writing a note', () => {
  // The end-to-end point of the whole module: the page used to draw this as a
  // featureless amber block.
  const day = { date: '2026-08-25', status: 'degraded', areas: ['marketing'] };
  const bands = dayBands(day, []);
  assert.ok(bands, 'a derived attribution must be enough to band a day');
  assert.deepEqual(
    bands.filter(b => b.status !== 'operational').map(b => b.id), ['marketing']);
  assert.equal(bands.length, AREA_IDS.length);
});

test('a hand-written note still wins over the derived one', () => {
  const day = { date: '2026-08-25', status: 'degraded', areas: ['marketing'] };
  const hit = dayBands(day, ['product']).filter(b => b.status !== 'operational').map(b => b.id);
  assert.deepEqual(hit, ['product']);
});

// ── the incident clock ───────────────────────────────────────────────────

test('an incident is open only while the SAMPLER says it is', () => {
  const now = Date.parse('2026-08-26T04:00:00Z');
  const hist = (t) => ({ days: { '2026-08-26': { windows: [{ s: 'degraded', f: t - 60000, t }] } } });
  assert.equal(incidentOpenAt(hist(now - 60000), now), true);
  assert.equal(incidentOpenAt(hist(now - 60 * 60000), now), false, 'an hour-old window is not now');
  assert.equal(incidentOpenAt({ days: { '2026-08-26': { windows: [] } } }, now), false);
  assert.equal(incidentOpenAt(null, now), false);
});

// ── collection ───────────────────────────────────────────────────────────

function fakeKV(initial = {}) {
  const store = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    store,
    async get(k) { const v = store.get(k); return v === undefined ? null : JSON.parse(v); },
    async put(k, v) { store.set(k, v); },
  };
}

test('a tick lands in KV, scoped by the sampler window', async () => {
  const now = Date.parse('2026-08-26T04:00:00Z');
  const windowEnd = now - 3 * 60 * 1000;
  const kv = fakeKV({
    [HISTORY_KEY]: { days: { '2026-08-26': { windows: [{ s: 'degraded', f: now - 400000, t: now - 60000 }] } } },
  });
  const out = await collectAttribution({ STATUS_HISTORY: kv, CF_ANALYTICS_TOKEN: 'x' }, {
    now,
    fetchRows: async () => [[row('divinci.ai', '/', 300)], [row('api.divinci.app', '/chat', 10)]],
  });
  assert.equal(out.wrote, true);
  assert.equal(out.duringIncident, true);
  const rec = await kv.get(ATTRIBUTION_KEY);
  const day = rec.days[new Date(windowEnd).toISOString().slice(0, 10)];
  assert.equal(day.total, 310);
  assert.equal(day.incTotal, 310);
  assert.equal(day.areas.marketing, 300);
});

test('a clean window still writes the heartbeat, but moves no day counters', async () => {
  // A quiet window is POSITIVE evidence — it is what "operational" is
  // computed from. Skipping the write would let the reading go stale exactly
  // while everything was healthy, and the page would turn grey on its best
  // days. The day counters must not move, though: a long quiet stretch
  // diluting an incident's share is the bug the two baskets exist to prevent.
  const kv = fakeKV();
  const now = Date.parse('2026-08-26T04:00:00Z');
  const out = await collectAttribution({ STATUS_HISTORY: kv, CF_ANALYTICS_TOKEN: 'x' }, {
    now, fetchRows: async () => [[], []],
  });
  assert.equal(out.wrote, true);
  assert.equal(out.customer, 0);
  const rec = await kv.get(ATTRIBUTION_KEY);
  assert.equal(rec.latest.customer, 0);
  assert.deepEqual(rec.days, {}, 'a quiet window must not create a day record');
  assert.equal(customerFacingStatus(rec, now), 'operational');
});

test('the live rating counts customer-facing errors only', async () => {
  // The whole point of the 2026-08-26 change: 4,000 errors on internal
  // tooling must not colour a public status page, and 60 on the product must.
  const kv = fakeKV();
  const now = Date.parse('2026-08-26T04:00:00Z');
  await collectAttribution({ STATUS_HISTORY: kv, CF_ANALYTICS_TOKEN: 'x' }, {
    now, fetchRows: async () => [[row('chunks-workflow.divinci.app', '/', 4000)], []],
  });
  assert.equal(customerFacingStatus(await kv.get(ATTRIBUTION_KEY), now), 'operational',
    'an internal cron failing 4,000 times is not a customer-facing incident');

  const kv2 = fakeKV();
  await collectAttribution({ STATUS_HISTORY: kv2, CF_ANALYTICS_TOKEN: 'x' }, {
    now, fetchRows: async () => [[row('api.divinci.app', '/ai-chat/start', 60)], []],
  });
  assert.equal(customerFacingStatus(await kv2.get(ATTRIBUTION_KEY), now), 'degraded');
});

test('the rating distinguishes never-configured from gone-stale', () => {
  const now = Date.parse('2026-08-26T04:00:00Z');
  // Never configured: say nothing. Announcing an outage that is really an
  // unset binding is a bug this page has already shipped once.
  assert.equal(customerFacingStatus(null, now), null);
  assert.equal(customerFacingStatus({ days: {} }, now), null);
  assert.equal(customerFacingStatus({ latest: { at: now, customer: 'x' } }, now), null);
  // Gone stale: that IS news. A page reporting "operational" from a dead feed
  // is worse than one admitting it does not know.
  assert.equal(customerFacingStatus({ latest: { at: now - 25 * 60000, customer: 0 } }, now), 'unknown');
  assert.equal(customerFacingStatus({ latest: { at: now - 6 * 60000, customer: 0 } }, now), 'operational');
});

test('the rating never claims an outage', () => {
  // "Elevated errors" is degraded by nature — requests are being served and
  // some fail. A real outage reaches the banner through the GCP components,
  // which probe the customer path instead of counting what came back.
  const now = Date.now();
  assert.equal(customerFacingStatus({ latest: { at: now, customer: 1e9 } }, now), 'degraded');
});


test('missing configuration is refused loudly, not silently skipped', async () => {
  const errs = [];
  const orig = console.error;
  console.error = (...a) => errs.push(a.join(' '));
  try {
    assert.equal(await collectAttribution({ CF_ANALYTICS_TOKEN: 'x' }, { now: 1 }), null);
    assert.equal(await collectAttribution({ STATUS_HISTORY: fakeKV() }, { now: 1 }), null);
  } finally {
    console.error = orig;
  }
  assert.equal(errs.length, 2);
  assert.match(errs.join('\n'), /STATUS_HISTORY/);
  assert.match(errs.join('\n'), /CF_ANALYTICS_TOKEN/);
});

test('both zones are asked — one alone attributes nothing useful', async () => {
  // divinci.app alone files every marketing error under "unclassified", which
  // trips the unclassified veto and attributes the day to nothing. That is
  // how this started.
  let asked = null;
  const kv = fakeKV();
  await collectAttribution({ STATUS_HISTORY: kv, CF_ANALYTICS_TOKEN: 'x' }, {
    now: Date.parse('2026-08-26T04:00:00Z'),
    fetchRows: async ({ zoneTags }) => { asked = zoneTags; return [[row('divinci.ai', '/', 1)]]; },
  });
  assert.equal(asked.length, 2);
  assert.equal(new Set(asked).size, 2);
});

test('one zone failing skips the tick rather than half-attributing it', async () => {
  // Attributing from the product zone alone would report 100% product /
  // preprod / internal, because the marketing errors would just be missing.
  // On a public page that is not a degraded answer, it is an inverted one.
  const kv = fakeKV();
  await assert.rejects(
    collectAttribution({ STATUS_HISTORY: kv, CF_ANALYTICS_TOKEN: 'x' }, {
      now: Date.parse('2026-08-26T04:00:00Z'),
      fetchRows: async () => { throw new Error('cloudflare graphql 403'); },
    }),
    /403/,
  );
  assert.equal(kv.store.size, 0, 'nothing may be written from a partial read');
});

// ── dilution ─────────────────────────────────────────────────────────────
//
// The 5xx this counts are reachable by anyone: strangers scanning for
// /stripe.json already generate thousands against our hosts uninvited. So the
// share floor is an attacker-controlled dial unless something else holds.

test('noise elsewhere cannot dilute a real product burst out of the report', () => {
  // 300 product errors inside the window the page is calling degraded, buried
  // under 20k of unrelated marketing noise: 1.5%, far under the share floor.
  const d = {
    total: 0, areas: {}, unclassified: 0,
    incTotal: 20300, inc: { marketing: 20000, product: 300 }, incUnclassified: 0,
  };
  const a = attributionForDay(d);
  assert.ok(a.areas.some(x => x.id === 'product'),
    'an absolute count must survive dilution — otherwise "the product was not '
    + 'affected" is a claim anyone can buy with free traffic');
  assert.equal(autoNote('2026-08-26', a, null).productAffected, true);
});

test('the absolute floor does NOT apply to a whole day', () => {
  // Measured: 634 product 5xx across all of 2026-08-25 were our own publisher
  // retrying — 9.7% of the day, correctly not called out. Contemporaneity is
  // what makes a bare count mean anything.
  const a = attributionForDay({
    total: 6554, areas: { marketing: 5920, product: 634 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  assert.equal(a.basis, 'day');
  assert.deepEqual(a.areas.map(x => x.id), ['marketing']);
  assert.ok(634 > MIN_AREA_EVENTS, 'the fixture must actually exceed the floor');
});

// ── what becomes public ──────────────────────────────────────────────────

const RECORD = { days: { '2026-08-26': {
  total: 4817, areas: { marketing: 4000, product: 817 }, unclassified: 0,
  incTotal: 900, inc: { marketing: 600, product: 300 }, incUnclassified: 0,
} } };

test('the payload carries shares and area ids — never counts, never hosts', () => {
  // Publishing "4,077 errors on the marketing site" would hand any reader a
  // running measure of our request volume and of how much load it takes to
  // hurt us. A share is the entire useful content of the claim.
  const [day] = mergeAttributionIntoDays(
    [{ date: '2026-08-26', status: 'degraded' }], RECORD);
  const json = JSON.stringify(day);
  for (const count of ['4817', '4000', '817', '900', '600', '300']) {
    assert.ok(!json.includes(count), `an absolute error count reached the payload: ${count}`);
  }
  assert.deepEqual(day.areas, ['marketing', 'product']);
  assert.deepEqual(day.areaShares, [
    { id: 'marketing', share: 66.7 }, { id: 'product', share: 33.3 },
  ]);
  assert.equal(day.areaBasis, 'incident');
});

test('a green day is never attributed', () => {
  const [day] = mergeAttributionIntoDays(
    [{ date: '2026-08-26', status: 'operational' }], RECORD);
  assert.equal(day.areas, undefined);
  assert.equal(day.autoNote, undefined);
});

test('a day the record says nothing about passes through untouched', () => {
  const [day] = mergeAttributionIntoDays(
    [{ date: '2026-08-21', status: 'degraded' }], RECORD);
  assert.deepEqual(day, { date: '2026-08-21', status: 'degraded' });
});

test('an absent or unreadable record changes nothing', () => {
  const days = [{ date: '2026-08-26', status: 'degraded' }];
  for (const rec of [null, undefined, {}, { days: null }, 'nonsense']) {
    assert.deepEqual(mergeAttributionIntoDays(days, rec), days);
  }
});

// ── the ends of the scale ────────────────────────────────────────────────

test('a whole is reported as 100%, not as ">99"', () => {
  const a = attributionForDay({
    total: 500, areas: { marketing: 500 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  assert.match(autoNote('2026-08-25', a, null).summary, /\(100%\)/);
});

test('99.6% is not rounded up into a claim that nothing else was involved', () => {
  const a = attributionForDay({
    total: 1000, areas: { marketing: 996, product: 4 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  });
  assert.match(autoNote('2026-08-25', a, null).summary, /\(>99%\)/);
});

test('an incident that straddles midnight is still an incident', () => {
  // The collector reads a window that ended minutes ago, so just after 00:00
  // UTC the recent windows are still filed under yesterday. Looking only at
  // today would report every midnight-straddling incident as quiet — and
  // quiet is what sends a day to the weaker whole-day basis.
  const now = Date.parse('2026-08-26T00:02:00Z');
  const hist = { days: { '2026-08-25': { windows: [
    { s: 'degraded', f: Date.parse('2026-08-25T23:50:00Z'), t: Date.parse('2026-08-25T23:58:00Z') },
  ] } } };
  assert.equal(incidentOpenAt(hist, now), true);
});

test('a GREEN day still reports internal trouble in the sidecar', async () => {
  // From 2026-08-26 an internal-only problem does not make a day bad. If the
  // sidecar only rode along with bad days it would show the legacy ones and
  // then never fill again — internal systems would have been removed from the
  // number and, unnoticed, from the page. It carries no severity: the day
  // stays green, and correctly so.
  const rec = { days: { '2026-08-27': {
    total: 4000, areas: { internal: 4000 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  } } };
  const [day] = mergeAttributionIntoDays([{ date: '2026-08-27', status: 'operational' }], rec);
  assert.deepEqual(day.internalAreas, ['internal']);
  assert.equal(day.status, 'operational');
  assert.equal(day.areas, undefined, 'a green day must not band');
  assert.equal(day.autoNote, undefined, 'a green day must not carry an incident note');
});

test('a green day with nothing internal is left completely alone', async () => {
  const rec = { days: { '2026-08-27': {
    total: 4000, areas: { marketing: 4000 }, unclassified: 0,
    incTotal: 0, inc: {}, incUnclassified: 0,
  } } };
  const input = [{ date: '2026-08-27', status: 'operational' }];
  assert.deepEqual(mergeAttributionIntoDays(input, rec), input);
});
