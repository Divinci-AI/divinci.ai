import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectTrafficConcentration, fetchZoneTrafficByIP, shouldCollect,
} from '../../src/traffic-concentration-collector.mjs';

describe('shouldCollect — one signal, not three', () => {
  test('only production publishes', () => {
    assert.equal(shouldCollect({ ENVIRONMENT: 'production' }), true);
    for (const e of ['development', 'staging', 'local', 'preview']) {
      assert.equal(shouldCollect({ ENVIRONMENT: e }), false, e);
    }
  });

  test('an unknown environment fails CLOSED', () => {
    // Same reasoning as customer-health.mjs: dev/staging/prod share this file,
    // so guessing "probably production" on an unset var would double the
    // metric every collaborator's monitor reads.
    for (const env of [{}, { ENVIRONMENT: '' }, null, undefined]) {
      assert.equal(shouldCollect(env), false, JSON.stringify(env));
    }
  });
});

describe('collectTrafficConcentration', () => {
  const cfBody = (rows) => JSON.stringify({
    data: { viewer: { zones: [{ httpRequestsAdaptiveGroups: rows }] } },
  });
  const okEnv = { CF_ANALYTICS_TOKEN: 't', DD_API_KEY: 'k', DD_SITE: 'us5.datadoghq.com' };
  const row = (ip, count) => ({ count, dimensions: { clientIP: ip } });

  function harness(cfResponse) {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('datadoghq.com')) {
        return { ok: true, status: 202, text: async () => '{}' };
      }
      return cfResponse;
    };
    return { calls, fetchImpl };
  }

  test('reproduces the 2026-09-12 incident shape and flags it', async () => {
    const rows = [
      row('74.110.128.177', 5_310_000),
      row('198.51.100.7', 400_000),
      row('203.0.113.4', 490_000),
    ];
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody(rows) });
    const out = await collectTrafficConcentration(okEnv, { fetchImpl, now: Date.UTC(2026, 8, 12, 12, 0, 0) });
    assert.equal(out.flagged, true);
    assert.equal(out.top.key, '74.110.128.177');
    assert.ok(out.share > 0.85 && out.share < 0.86, out.share);

    const dd = JSON.parse(calls.find(c => c.url.includes('datadoghq')).init.body);
    const byName = Object.fromEntries(dd.series.map(s => [s.metric, s]));
    assert.ok(Math.abs(byName['divinci.cf.marketing.top_client_share'].points[0][1] - out.share) < 1e-9);
    assert.equal(byName['divinci.cf.marketing.top_client_flagged'].points[0][1], 1);
    assert.equal(byName['divinci.cf.marketing.top_client_share'].type, 'gauge');
    assert.equal(byName['divinci.cf.marketing.top_client_flagged'].type, 'count');
  });

  test('ordinary spread-out traffic never flags, and still publishes a real number', async () => {
    const rows = Array.from({ length: 50 }, (_, i) => row(`10.0.0.${i}`, 1000));
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody(rows) });
    const out = await collectTrafficConcentration(okEnv, { fetchImpl });
    assert.equal(out.flagged, false);

    const dd = JSON.parse(calls.find(c => c.url.includes('datadoghq')).init.body);
    const byName = Object.fromEntries(dd.series.map(s => [s.metric, s]));
    assert.equal(byName['divinci.cf.marketing.top_client_flagged'].points[0][1], 0);
    // Publishes the real (small) share rather than 0 — an absent/zeroed value
    // on a healthy window would make the monitor indistinguishable from a
    // collector that is quietly broken.
    assert.ok(byName['divinci.cf.marketing.top_client_share'].points[0][1] > 0);
  });

  test('a quiet window with too little traffic still submits an explicit share', async () => {
    // Mirrors collectCustomerHealth's "explicit zero" test: the series must be
    // continuous, or an absent point reads as "healthy" instead of "dark".
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody([]) });
    const out = await collectTrafficConcentration(okEnv, { fetchImpl });
    assert.equal(out.flagged, false);
    assert.equal(out.total, 0);
    const dd = JSON.parse(calls.find(c => c.url.includes('datadoghq')).init.body);
    assert.equal(dd.series.length, 2);
  });

  test('reads a settled window: 5 minutes wide, ending 3 minutes back', async () => {
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody([]) });
    const now = Date.UTC(2026, 8, 12, 12, 0, 0);
    await collectTrafficConcentration(okEnv, { fetchImpl, now });
    const vars = JSON.parse(calls[0].init.body).variables;
    assert.equal(vars.until, '2026-09-12T11:57:00Z');
    assert.equal(vars.since, '2026-09-12T11:52:00Z');
  });

  test('queries the MARKETING zone, not the product zone', async () => {
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody([]) });
    await collectTrafficConcentration(okEnv, { fetchImpl });
    const vars = JSON.parse(calls[0].init.body).variables;
    assert.equal(vars.zone, 'bbca355451b61dd26605f616e68bd855');
  });

  test('a GraphQL error under HTTP 200 is a failure, not an empty result', async () => {
    const body = JSON.stringify({ errors: [{ message: 'bad zone' }] });
    const { fetchImpl } = harness({ ok: true, status: 200, text: async () => body });
    await assert.rejects(
      () => collectTrafficConcentration(okEnv, { fetchImpl }),
      /cloudflare graphql error/,
    );
  });

  test('a non-JSON body raises a described error, not a SyntaxError', async () => {
    const { fetchImpl } = harness({ ok: true, status: 200, text: async () => '<html>502</html>' });
    await assert.rejects(
      () => collectTrafficConcentration(okEnv, { fetchImpl }),
      /non-JSON/,
    );
  });

  test('a missing secret returns null and submits nothing', async () => {
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody([]) });
    assert.equal(await collectTrafficConcentration({ DD_API_KEY: 'k' }, { fetchImpl }), null);
    assert.equal(await collectTrafficConcentration({ CF_ANALYTICS_TOKEN: 't' }, { fetchImpl }), null);
    assert.equal(calls.length, 0);
  });
});

describe('alerting contract', () => {
  test('the metric names are stable — renaming either silently blinds a monitor', async () => {
    const fetchImpl = async (url) => String(url).includes('datadoghq.com')
      ? { ok: true, status: 202, text: async () => '{}' }
      : {
          ok: true, status: 200,
          text: async () => JSON.stringify({ data: { viewer: { zones: [{ httpRequestsAdaptiveGroups: [] }] } } }),
        };
    const calls = [];
    const spy = async (url, init) => { calls.push({ url: String(url), init }); return fetchImpl(url, init); };
    await collectTrafficConcentration({ CF_ANALYTICS_TOKEN: 't', DD_API_KEY: 'k' }, { fetchImpl: spy });
    const dd = JSON.parse(calls.find(c => c.url.includes('datadoghq')).init.body);
    const names = dd.series.map(s => s.metric).sort();
    assert.deepEqual(names, ['divinci.cf.marketing.top_client_flagged', 'divinci.cf.marketing.top_client_share']);
  });
});

describe('fetchZoneTrafficByIP', () => {
  test('an unexpected payload shape raises rather than returning empty', async () => {
    const fetchImpl = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ data: {} }) });
    await assert.rejects(
      () => fetchZoneTrafficByIP('zone', { token: 't', since: new Date(), until: new Date(), fetchImpl }),
      /unexpected/,
    );
  });

  test('a non-2xx HTTP status raises with the status code', async () => {
    const fetchImpl = async () => ({ ok: false, status: 503, text: async () => 'nope' });
    await assert.rejects(
      () => fetchZoneTrafficByIP('zone', { token: 't', since: new Date(), until: new Date(), fetchImpl }),
      /cloudflare graphql 503/,
    );
  });
});
