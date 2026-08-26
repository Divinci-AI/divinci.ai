/**
 * Deployment-config guards for the two 5-minute collectors.
 *
 * The collector publishes `divinci.cf.customer.errors_5xx`, which Datadog
 * monitor 20807649 queries and which the public /status history is sampled
 * from. Two properties of wrangler.jsonc keep that signal honest, and BOTH
 * look like dead config to anyone tidying the file:
 *
 *   1. Production must actually have a cron. The collector is deliberately
 *      NOT request-driven like the history sampler: it feeds a pager, and a
 *      pager that goes blind whenever the marketing site is quiet at 4am is
 *      worse than no pager.
 *
 *   2. dev and staging must have EMPTY crons. Named environments otherwise
 *      inherit the top-level `triggers` block, and three deployments running
 *      the same file would submit the same metric three times. A tripled
 *      count reads as a traffic increase, not as a bug, so nobody would go
 *      looking. `shouldCollect()` is the second line of defence; this is the
 *      first, and it is the one that stops the invocation happening at all.
 *
 * Read as text-with-comments-stripped rather than imported, because
 * wrangler.jsonc is JSONC and carries the reasoning inline.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, '..', '..', 'wrangler.jsonc'), 'utf8');

/** Strip // line comments that are not inside a string. */
function parseJsonc(text) {
  const stripped = text
    .split('\n')
    .map((line) => {
      let inStr = false;
      for (let i = 0; i < line.length; i += 1) {
        const c = line[i];
        if (c === '"' && line[i - 1] !== '\\') inStr = !inStr;
        if (!inStr && c === '/' && line[i + 1] === '/') return line.slice(0, i);
      }
      return line;
    })
    .join('\n');
  return JSON.parse(stripped);
}

const cfg = parseJsonc(raw);

describe('customer-health collector cron', () => {
  test('production has the 5-minute cron', () => {
    assert.deepEqual(cfg.triggers?.crons, ['*/5 * * * *']);
  });

  test('dev and staging publish NOTHING', () => {
    // Not "no cron block" — an ABSENT block inherits the top-level one, which
    // is the failure. It must be present and empty.
    for (const name of ['dev', 'staging']) {
      const env = cfg.env?.[name];
      assert.ok(env, `env.${name} missing`);
      assert.ok(env.triggers, `env.${name}.triggers missing — it would INHERIT production's cron`);
      assert.deepEqual(env.triggers.crons, [], `env.${name} must have an empty crons array`);
    }
  });

  test('every environment declares which one it is', () => {
    // shouldCollect() fails closed on an unknown ENVIRONMENT, so a missing
    // value silently stops collection everywhere rather than duplicating it.
    assert.equal(cfg.vars?.ENVIRONMENT, 'production');
    assert.equal(cfg.env?.dev?.vars?.ENVIRONMENT, 'development');
    assert.equal(cfg.env?.staging?.vars?.ENVIRONMENT, 'staging');
  });

  test('the history KV binding is still separate per environment', () => {
    // Staging samples must never land in the published production history.
    const prod = cfg.kv_namespaces?.find((k) => k.binding === 'STATUS_HISTORY');
    const stage = cfg.env?.staging?.kv_namespaces?.find((k) => k.binding === 'STATUS_HISTORY');
    assert.ok(prod?.id && stage?.id);
    assert.notEqual(prod.id, stage.id);
  });
});

// ── The attribution collector must actually be invoked ───────────────────
//
// The cron config above says a schedule EXISTS. It says nothing about whether
// the collector is wired to it — and the two ride the same trigger, so a
// refactor that drops one call keeps a green cron, a green deploy, and a
// green test suite while the public status page quietly stops learning
// anything new. It would look exactly like a quiet week.
//
// This was not hypothetical when the collector shipped: the days already on
// the page had been backfilled, so a dead collector would have been masked by
// data that was already correct. The only reason it was caught was reading
// KV twice, five minutes apart, by hand.

describe('the scheduled handler', () => {
  const worker = readFileSync(join(here, '..', '..', 'src', 'worker.js'), 'utf8');
  const scheduled = worker.slice(
    worker.indexOf('async scheduled('),
    worker.indexOf('async fetch('),
  );

  test('runs BOTH collectors, not just the one that pages', () => {
    assert.ok(scheduled.length > 0, 'scheduled() not found in worker.js');
    // Prefix match: both take options now, and pinning the exact call shape
    // would fail on an unrelated argument rather than on the thing that
    // matters — that the collector is invoked at all.
    for (const call of ['collectCustomerHealth(env', 'collectAttribution(env']) {
      assert.ok(scheduled.includes(call), `scheduled() no longer calls ${call}`);
    }
  });

  test('the cron writes the uptime sample, and the request path does NOT', () => {
    // The history used to be sampled from /api/status traffic, so it was
    // biased toward the hours people browse a marketing site and could miss a
    // quiet-hour incident entirely (2026-08-14 stored as 100% operational
    // against six degraded windows; the real 2026-08-02 outage stored as
    // 99.47%). The cron does not care what time it is.
    //
    // Restoring a write to the request path would undo that AND make a public
    // request able to trigger a KV read-modify-write again, with two writers
    // interleaving on one key. It would look like a harmless resolution
    // improvement, which is why this is pinned rather than commented.
    assert.ok(scheduled.includes('recordSample:'),
      'the cron no longer records the uptime sample');

    // ⚠️ Assert it of EVERY call, not of the handler as a whole. A substring
    // check for `bypassRateLimit` anywhere in scheduled() passes as soon as
    // ONE call has it — which is how the first version of this test went
    // green while the main sampling path had quietly lost the flag. Verified
    // by mutation: dropping the flag from either call must fail here.
    const calls = scheduled.match(/recordSample\(env[^)]*\)/g) || [];
    assert.ok(calls.length >= 2, `expected both sampling paths, found ${calls.length}`);
    for (const call of calls) {
      assert.ok(call.includes('bypassRateLimit'),
        `a drifting cron tick is silently dropped: ${call}`);
    }

    const handler = worker.slice(worker.indexOf('async function handleStatus('));
    assert.ok(!/\brecordSample\(/.test(handler),
      'handleStatus writes to the history again — the cron owns it');
  });

  test('the page publishes whether its own feed is alive', () => {
    // `ratingFresh` is what an uptime check can content-match on, and it is
    // the only thing that catches the collector dying: the history is now
    // sampled exclusively by this cron, so if it stops, the page keeps
    // rendering a perfectly good record that simply stops growing.
    //
    // It must be false for BOTH failure shapes — a stale reading and a failed
    // response build — or the check passes through the outage it exists for.
    const handler = worker.slice(worker.indexOf('async function handleStatus('));
    const freshness = handler.match(/ratingFresh:[^,\n]*/g) || [];
    assert.equal(freshness.length, 2, 'every response must state its freshness');
    assert.ok(freshness.some((f) => f.includes("!== 'unknown'")),
      'a stale reading must not report as fresh');
    assert.ok(freshness.some((f) => f.includes('false')),
      'a failed build must not report as fresh');
  });

  test('neither collector can take the other down', () => {
    // They answer different questions — how many customer errors, and where
    // all the errors landed — and one throwing must never cost the other. A
    // rejection escaping into the cron runner would do exactly that, since
    // they share an invocation.
    const waits = scheduled.split('ctx.waitUntil(').length - 1;
    assert.equal(waits, 2, 'each collector needs its own waitUntil');
    const catches = scheduled.split('.catch(').length - 1;
    assert.equal(catches, 2, 'each collector must swallow its own failure');
  });
});
