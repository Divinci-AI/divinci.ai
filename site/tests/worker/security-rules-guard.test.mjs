import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { diffCustomRules } from '../../src/security-rules-guard.mjs';
import expectedConfig from '../../deploy/cloudflare/security-rules.json' with { type: 'json' };

const expected = expectedConfig.rules;

function liveFrom(expected, overrides = {}) {
  return expected.map((r) => ({
    description: r.description,
    expression: r.expression,
    action: r.action,
    enabled: r.enabled,
    ...(overrides[r.description] ?? {}),
  }));
}

describe('diffCustomRules', () => {
  test('a live ruleset matching the committed file has no problems', () => {
    assert.deepEqual(diffCustomRules(expected, liveFrom(expected)), []);
  });

  test('a rule removed from the dashboard is MISSING, not silently ignored', () => {
    const live = liveFrom(expected).filter((r) => r.description !== expected[0].description);
    const problems = diffCustomRules(expected, live);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /MISSING/);
    assert.match(problems[0], new RegExp(expected[0].description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('a rule quietly switched to Log (or otherwise disabled) is flagged', () => {
    const live = liveFrom(expected, { [expected[0].description]: { enabled: false } });
    const problems = diffCustomRules(expected, live);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /DISABLED/);
  });

  test('a rule downgraded from block to something weaker is flagged', () => {
    const live = liveFrom(expected, { [expected[1].description]: { action: 'log' } });
    const problems = diffCustomRules(expected, live);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /ACTION CHANGED/);
  });

  test('a narrowed expression is flagged even though the rule still exists and is Active', () => {
    const live = liveFrom(expected, {
      [expected[1].description]: { expression: '(http.request.uri.path contains "/wp-admin")' },
    });
    const problems = diffCustomRules(expected, live);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /EXPRESSION CHANGED/);
  });

  test('whitespace-only differences in the expression are not a false alarm', () => {
    const live = liveFrom(expected, {
      [expected[0].description]: { expression: `  ${expected[0].expression}  \n` },
    });
    assert.deepEqual(diffCustomRules(expected, live), []);
  });

  test('an empty live ruleset flags every expected rule as missing', () => {
    const problems = diffCustomRules(expected, []);
    assert.equal(problems.length, expected.length);
  });

  test('committed rules are actually block, not something weaker, as a sanity check on the fixture itself', () => {
    for (const r of expected) assert.equal(r.action, 'block', r.description);
  });
});
