/**
 * Deployment-config guards for the customer-health collector.
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
