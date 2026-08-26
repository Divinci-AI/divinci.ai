/**
 * The status page draws the bands in the BROWSER, so templates/status.html
 * carries its own copy of dayBands(). src/status-areas.mjs is the canonical,
 * tested one — and two copies of a rule is exactly how this repo has been
 * bitten before (see the STATUS_RANK note in status-history.mjs: "keeping two
 * copies in sync was an invitation to drift").
 *
 * This test executes the copy that actually ships, out of the template file,
 * and asserts it agrees with the module on every combination that matters. If
 * someone edits one and not the other, this fails.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS, dayBands as canonical } from '../../src/status-areas.mjs';

const html = readFileSync(new URL('../../templates/status.html', import.meta.url), 'utf8');

// Pull the shipped implementation out of the template rather than restating it.
function extract(startMarker, endMarker) {
  const a = html.indexOf(startMarker);
  const b = html.indexOf(endMarker, a);
  assert.ok(a !== -1, `template no longer contains: ${startMarker}`);
  assert.ok(b !== -1, `template no longer contains: ${endMarker}`);
  return html.slice(a, b);
}

const source = extract('var BAD = {', '  function renderHistory(');

// The template's dayBands reads notes via notesFor(date); supply that.
function build(notesByDate) {
  const factory = new Function(
    'notesFor',
    `${source}; return { dayBands: dayBands, bandsToGradient: bandsToGradient };`
  );
  return factory((date) => notesByDate[date] || []);
}

const ALL = AREAS.map(a => a.id);
const CASES = [
  [], ['product'], ['marketing'], ['docs'],
  // Sidecar-only and mixed: neither may band a sidecar area, in EITHER copy.
  ['internal'], ['preprod', 'internal'],
  ['marketing', 'internal'], ['marketing', 'product', 'preprod'],
  ALL, ['bogus'], ['bogus', 'docs'],
];
const STATUSES = ['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown', 'no_data'];

test('the template agrees with the module on every case', () => {
  for (const status of STATUSES) {
    for (const areas of CASES) {
      const day = { date: '2026-08-14', status };
      const tpl = build({ '2026-08-14': [{ date: '2026-08-14', areas }] })
        .dayBands(day, AREAS);
      const mod = canonical(day, areas);
      const norm = (b) => (b ? b.map(x => `${x.id}:${x.status}`).join(',') : null);
      assert.equal(norm(tpl), norm(mod),
        `disagreement for status=${status} areas=${JSON.stringify(areas)}`);
    }
  }
});

test('the template agrees with the module on DERIVED attribution too', () => {
  // The fallback that stops an un-written-up day rendering as a bare block.
  // It exists in two places for the same reason dayBands does, so it needs
  // the same pin — otherwise one copy keeps banding derived days and the
  // other quietly stops.
  for (const status of STATUSES) {
    for (const areas of CASES) {
      const day = { date: '2026-08-25', status, areas };
      const tpl = build({}).dayBands(day, AREAS);          // no human note
      const mod = canonical(day, []);
      const norm = (b) => (b ? b.map(x => `${x.id}:${x.status}`).join(',') : null);
      assert.equal(norm(tpl), norm(mod),
        `disagreement for status=${status} derived=${JSON.stringify(areas)}`);
    }
  }
});

test('a human note overrides the derived areas in BOTH copies', () => {
  const day = { date: '2026-08-25', status: 'degraded', areas: ['marketing'] };
  const tpl = build({ '2026-08-25': [{ date: '2026-08-25', areas: ['product'] }] })
    .dayBands(day, AREAS);
  const hit = (b) => b.filter(x => x.status !== 'operational').map(x => x.id);
  assert.deepEqual(hit(tpl), ['product']);
  assert.deepEqual(hit(canonical(day, ['product'])), ['product']);
});

test('bands from MULTIPLE notes on one day are unioned', () => {
  // A day can carry more than one note (2026-08-02 has two). Taking only the
  // first would silently under-report which areas were hit.
  const { dayBands } = build({
    '2026-08-02': [
      { date: '2026-08-02', areas: ['product'] },
      { date: '2026-08-02', areas: ['docs'] },
    ],
  });
  const hit = dayBands({ date: '2026-08-02', status: 'major_outage' }, AREAS)
    .filter(b => b.status !== 'operational').map(b => b.id);
  assert.deepEqual(hit.sort(), ['docs', 'product']);
});

test('the gradient is hard-edged and covers exactly 100%', () => {
  // A blended gradient would imply a spectrum between areas, which is
  // meaningless — each strip is a distinct thing that was or was not affected.
  const { dayBands, bandsToGradient } = build({
    '2026-08-16': [{ date: '2026-08-16', areas: ['marketing'] }],
  });
  const g = bandsToGradient(dayBands({ date: '2026-08-16', status: 'major_outage' }, AREAS));
  assert.match(g, /^linear-gradient\(to bottom, /);
  const pcts = [...g.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m => Number(m[1]));
  assert.equal(pcts[0], 0);
  assert.equal(pcts[pcts.length - 1], 100);
  // Each colour appears twice in a row (start and end of its strip) — that is
  // what makes the edge hard rather than a fade.
  assert.equal(pcts.length, AREAS.length * 2);
  for (let i = 1; i < pcts.length - 1; i += 2) {
    assert.equal(pcts[i], pcts[i + 1], 'a strip boundary is not hard-edged');
  }
  // The affected area must actually be the one tinted.
  const idx = AREAS.findIndex(a => a.id === 'marketing');
  assert.ok(g.includes('#c92a2a'), 'major_outage colour missing');
  assert.equal(g.split('#c92a2a').length - 1, 2, 'exactly one strip should be red');
  assert.ok(idx >= 0);
});
