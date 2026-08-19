import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHost, isCustomerHost, isCustomerPath, summarize, collectCustomerHealth,
} from '../../src/customer-health.mjs';

describe('host classification', () => {
  test('production customer surfaces count', () => {
    for (const h of [
      'api.divinci.app', 'chat.divinci.app', 'embed.divinci.app',
      'live.divinci.app', 'audio-services.divinci.app', 'agent.divinci.app',
    ]) assert.equal(isCustomerHost(h), true, h);
  });

  test('the port-suffixed variant of a customer host still counts', () => {
    // Cloudflare reports the host as the client sent it. Comparing raw strings
    // drops these silently, which is a real 5xx going uncounted rather than a
    // cosmetic miss.
    assert.equal(isCustomerHost('api.divinci.app:8443'), true);
    assert.equal(isCustomerHost('live.divinci.app:8443'), true);
    assert.equal(normalizeHost('API.Divinci.App:8443'), 'api.divinci.app');
  });

  test('non-production hosts never count', () => {
    for (const h of [
      'api.stage.divinci.app', 'chat.dev.divinci.app', 'assets.local.divinci.app',
      'assets.test.divinci.app', 'stage.divinci.app', 'live.stage.divinci.app:2053',
    ]) assert.equal(isCustomerHost(h), false, h);
  });

  test('the divinci.ai zone never counts — it is marketing, docs and internal', () => {
    // 21,512 of one 7-day window's 5xx were the marketing site alone. Counting
    // that zone is what made the status page report the product as degraded.
    for (const h of [
      'divinci.ai', 'www.divinci.ai', 'sdk.divinci.ai',
      'fulcrum-acme.divinci.ai', 'staging.divinci.ai',
    ]) assert.equal(isCustomerHost(h), false, h);
  });

  test('internal production hosts are excluded', () => {
    for (const h of [
      'chunks-workflow.divinci.app', 'status.divinci.app', 'r2.divinci.app',
      'hermes-webhooks.divinci.app', 'email.divinci.app',
    ]) assert.equal(isCustomerHost(h), false, h);
  });

  test('a host we do not recognise on the app zone counts as customer-facing', () => {
    // Fail toward inclusion: a new customer surface is covered the day it
    // ships, without anyone remembering to add it to a list.
    assert.equal(isCustomerHost('brand-new-product.divinci.app'), true);
  });
});

describe('path classification', () => {
  test('customer surfaces count', () => {
    for (const p of [
      '/api/v1/releases', '/api/v1/rag/files', '/ai-chat/free-chat-gate/config',
      '/white-label-release/6a65545c024387461d48dd2e', '/',
    ]) assert.equal(isCustomerPath(p), true, p);
  });

  test('our own automation calling our own API does not count', () => {
    // 91% of 5xx on customer HOSTS were these. Scoping by host alone would
    // still have been ~90% noise.
    for (const p of [
      '/api/v1/www-rag/submit-url',
      '/api/v1/www-rag-webhook/run-sync-task',
      '/api/v1/www-rag-directory',
      '/api/v1/hermes-webhook/proactive-tick',
      '/admin/rag-vector/cleanup-orphans-all',
      '/white-label/_admin/scored-qa/batch-jobs/sweep',
      '/pyannote/health',
    ]) assert.equal(isCustomerPath(p), false, p);
  });

  test('an unknown path counts rather than being dropped', () => {
    assert.equal(isCustomerPath(''), true);
    assert.equal(isCustomerPath(undefined), true);
    assert.equal(isCustomerPath('/something/new'), true);
  });

  test('classification is case-insensitive', () => {
    assert.equal(isCustomerPath('/API/V1/WWW-RAG/submit-url'), false);
    assert.equal(isCustomerHost('API.STAGE.DIVINCI.APP'), false);
  });
});

describe('summarize', () => {
  const row = (host, path, count) => ({
    count, dimensions: { clientRequestHTTPHost: host, clientRequestPath: path },
  });

  test('splits customer from internal and publishes BOTH', () => {
    const s = summarize([
      row('api.divinci.app', '/api/v1/releases', 10),
      row('api.divinci.app', '/api/v1/www-rag/submit-url', 400),
      row('api.stage.divinci.app', '/api/v1/releases', 50),
      row('divinci.ai', '/', 900),
    ]);
    assert.deepEqual(s, { customer: 10, internal: 1350 });
  });

  test('reproduces the real 7-day split exactly', () => {
    // The numbers this whole design rests on. Derived independently from
    // Cloudflare's API on 2026-08-19: of 4,591 5xx on customer HOSTS, 550 were
    // customer-facing paths and 4,182 were internal automation. If a future
    // edit to the exclusion lists moves these, that is a deliberate decision
    // and this test should be updated with fresh measured numbers — not
    // adjusted to whatever the code now says.
    const rows = [
      row('api.divinci.app', '/api/v1/www-rag/submit-url', 2381),
      row('api.divinci.app', '/api/v1/www-rag-webhook/run-sync-task', 1409),
      row('api.divinci.app', '/admin/rag-vector/cleanup-orphans-all', 240),
      row('api.divinci.app', '/api/v1/www-rag-directory', 53),
      row('api.divinci.app', '/white-label/_admin/scored-qa/batch-jobs/sweep', 41),
      row('api.divinci.app', '/api/v1/hermes-webhook/proactive-tick', 13),
      row('api.divinci.app', '/pyannote/health', 8),
      row('api.divinci.app', '/api/v1/releases', 121),
      row('api.divinci.app', '/api/v1/rag/files', 110),
      row('api.divinci.app', '/white-label/6a42fefcf0c5dc6c15837f17/tools/byok/keys', 58),
      row('api.divinci.app', '/ai-chat/free-chat-gate/config', 36),
      row('api.divinci.app', '/white-label/6a7f10545668b1155468f3a0/owner-balance', 39),
      row('api.divinci.app', '/rest', 186),
    ];
    const s = summarize(rows);
    assert.equal(s.internal, 4145);
    assert.equal(s.customer, 550);
  });

  test('ignores malformed and non-positive counts instead of throwing', () => {
    const s = summarize([
      row('api.divinci.app', '/x', 'nope'),
      row('api.divinci.app', '/x', -5),
      row('api.divinci.app', '/x', 0),
      null,
      { count: 7 },                       // no dimensions at all
    ]);
    assert.equal(s.customer, 7);          // unknown host+path ⇒ counted, not dropped
    assert.equal(s.internal, 0);
  });

  test('empty input is zero, not NaN', () => {
    assert.deepEqual(summarize([]), { customer: 0, internal: 0 });
    assert.deepEqual(summarize(undefined), { customer: 0, internal: 0 });
  });
});

describe('collectCustomerHealth', () => {
  const cfBody = (rows) => JSON.stringify({
    data: { viewer: { zones: [{ httpRequestsAdaptiveGroups: rows }] } },
  });
  const okEnv = { CF_ANALYTICS_TOKEN: 't', DD_API_KEY: 'k', DD_SITE: 'us5.datadoghq.com' };

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

  test('publishes both counts, as counts, on one timestamp', async () => {
    const rows = [
      { count: 5, dimensions: { clientRequestHTTPHost: 'api.divinci.app', clientRequestPath: '/api/v1/releases' } },
      { count: 90, dimensions: { clientRequestHTTPHost: 'api.divinci.app', clientRequestPath: '/api/v1/www-rag/submit-url' } },
    ];
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody(rows) });
    const out = await collectCustomerHealth(okEnv, { fetchImpl, now: Date.UTC(2026, 7, 19, 12, 0, 0) });
    assert.deepEqual(out, { customer: 5, internal: 90, rows: 2 });

    const dd = JSON.parse(calls.find(c => c.url.includes('datadoghq')).init.body);
    const byName = Object.fromEntries(dd.series.map(s => [s.metric, s]));
    assert.equal(byName['divinci.cf.customer.errors_5xx'].points[0][1], 5);
    assert.equal(byName['divinci.cf.internal.errors_5xx'].points[0][1], 90);
    for (const s of dd.series) {
      assert.equal(s.type, 'count');
      assert.equal(s.interval, 300);
    }
    // Both series share one timestamp, or the two halves of the same window
    // land in different buckets and stop reconciling.
    assert.equal(dd.series[0].points[0][0], dd.series[1].points[0][0]);
  });

  test('reads a settled window: 5 minutes wide, ending 3 minutes back', async () => {
    // Reading up to `now` undercounts every bucket, which makes the metric read
    // LOW — a failure that looks like good news and so is never investigated.
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody([]) });
    const now = Date.UTC(2026, 7, 19, 12, 0, 0);
    await collectCustomerHealth(okEnv, { fetchImpl, now });
    const vars = JSON.parse(calls[0].init.body).variables;
    assert.equal(vars.until, '2026-08-19T11:57:00Z');
    assert.equal(vars.since, '2026-08-19T11:52:00Z');
  });

  test('a GraphQL error under HTTP 200 is a failure, not an empty result', async () => {
    // Cloudflare answers a bad query with 200 + {errors:[...]}. Trusting the
    // status code would publish customer_5xx=0 during an outage of our own
    // measurement — the most dangerous possible reading.
    const body = JSON.stringify({ errors: [{ message: 'bad zone' }] });
    const { fetchImpl } = harness({ ok: true, status: 200, text: async () => body });
    await assert.rejects(
      () => collectCustomerHealth(okEnv, { fetchImpl }),
      /cloudflare graphql error/,
    );
  });

  test('a non-JSON body raises a described error, not a SyntaxError', async () => {
    const { fetchImpl } = harness({ ok: true, status: 200, text: async () => '<html>502</html>' });
    await assert.rejects(
      () => collectCustomerHealth(okEnv, { fetchImpl }),
      /non-JSON/,
    );
  });

  test('an unexpected payload shape raises rather than publishing zero', async () => {
    const { fetchImpl } = harness({ ok: true, status: 200, text: async () => JSON.stringify({ data: {} }) });
    await assert.rejects(() => collectCustomerHealth(okEnv, { fetchImpl }), /unexpected/);
  });

  test('a missing secret returns null and submits nothing', async () => {
    const { calls, fetchImpl } = harness({ ok: true, status: 200, text: async () => cfBody([]) });
    assert.equal(await collectCustomerHealth({ DD_API_KEY: 'k' }, { fetchImpl }), null);
    assert.equal(await collectCustomerHealth({ CF_ANALYTICS_TOKEN: 't' }, { fetchImpl }), null);
    assert.equal(calls.length, 0);
  });
});
