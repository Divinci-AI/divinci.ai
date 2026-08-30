/**
 * The baseline harness decides whether the build is red, so its failure modes
 * matter more than its happy path. Run: node --test scripts/tests/
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { collectTests, compare, parseBaseline, baselineHeaderTotal }
  from "../e2e-baseline.mjs";

/** Minimal Playwright JSON report: nested suites, per-test status. */
const report = (specs) => ({
  suites: [{
    title: "a.spec.js", file: "a.spec.js",
    specs: [],
    suites: [{
      title: "group",
      specs: specs.map(([title, status]) => ({
        title, tests: [{ projectName: "Desktop-Chrome", status }],
      })),
    }],
  }],
});

describe("identity", () => {
  test("keys on project + file + title path, never on line number", () => {
    const [t] = collectTests(report([["does a thing", "expected"]]));
    assert.equal(t.id, "Desktop-Chrome | a.spec.js | group › does a thing");
    assert.ok(!/\d+:\d+/.test(t.id),
      "a line-keyed id makes every test in an edited file look regressed");
  });

  test("walks nested suites and carries the file down", () => {
    const tests = collectTests({
      suites: [{
        title: "b.spec.js", file: "b.spec.js", specs: [],
        suites: [{ title: "outer", specs: [], suites: [
          { title: "inner", specs: [{ title: "deep", tests: [{ projectName: "P", status: "unexpected" }] }] },
        ]}],
      }],
    });
    assert.equal(tests[0].id, "P | b.spec.js | outer › inner › deep");
  });
});

describe("what counts as failing", () => {
  test("only `unexpected` is a failure", () => {
    const r = compare(collectTests(report([
      ["a", "expected"], ["b", "unexpected"], ["c", "skipped"], ["d", "flaky"],
    ])), []);
    assert.equal(r.failingCount, 1);
  });

  test("flaky is NOT a failure — it passed on retry", () => {
    // Counting it would make the gate oscillate on timing alone, and a gate
    // that flaps is one people learn to re-run rather than read.
    const r = compare(collectTests(report([["a", "flaky"]])), []);
    assert.deepEqual(r.regressions, []);
    assert.equal(r.failingCount, 0);
  });
});

describe("the gate", () => {
  const id = "Desktop-Chrome | a.spec.js | group › a";

  test("a known failure is tolerated", () => {
    const r = compare(collectTests(report([["a", "unexpected"]])), [id]);
    assert.deepEqual(r.regressions, []);
    assert.deepEqual(r.fixed, []);
  });

  test("a NEW failure is a regression", () => {
    const r = compare(collectTests(report([["a", "unexpected"]])), []);
    assert.deepEqual(r.regressions, [id]);
  });

  test("a baseline entry that now PASSES is reported, so the file shrinks", () => {
    // Without this the file is a dumping ground: debt could be added but
    // never removed, and the gate would slowly stop meaning anything.
    const r = compare(collectTests(report([["a", "expected"]])), [id]);
    assert.deepEqual(r.fixed, [id]);
  });

  test("a baseline entry for a test that did not run is NOT reported as fixed", () => {
    // A renamed or deleted spec is stale in a different way than a fixed one,
    // and calling it "fixed" would quietly drop coverage.
    const r = compare(collectTests(report([["b", "expected"]])), [id]);
    assert.deepEqual(r.fixed, []);
    assert.deepEqual(r.vanished, [id]);
  });
});

describe("unstable tests", () => {
  const id = "Desktop-Chrome | a.spec.js | group › a";

  test("an unstable test failing is NOT a regression", () => {
    const r = compare(collectTests(report([["a", "unexpected"]])), [], [id]);
    assert.deepEqual(r.regressions, []);
  });

  test("an unstable test passing is NOT a stale baseline entry", () => {
    // Both directions, or the gate is red whichever way the test lands —
    // which is what made a flaky test un-baselineable in the first place.
    const r = compare(collectTests(report([["a", "expected"]])), [id], [id]);
    assert.deepEqual(r.fixed, []);
  });

  test("an unstable entry naming a test that did not run is reported", () => {
    // Dead weight here silently widens the blind spot.
    const r = compare(collectTests(report([["b", "expected"]])), [], [id]);
    assert.deepEqual(r.unstableVanished, [id]);
  });

  test("it reports which unstable tests failed, so the list stays visible", () => {
    const r = compare(collectTests(report([["a", "unexpected"]])), [], [id]);
    assert.deepEqual(r.unstableFailing, [id]);
  });

  test("a test NOT on the unstable list still gates normally", () => {
    // The escape hatch must not leak: listing one test cannot excuse another.
    const r = compare(collectTests(report([["a", "unexpected"], ["z", "unexpected"]])), [], [id]);
    assert.deepEqual(r.regressions, ["Desktop-Chrome | a.spec.js | group › z"]);
  });
});

describe("parsing", () => {
  test("ignores comments and blank lines", () => {
    assert.deepEqual(parseBaseline("# note\n\n  x  \n#more\ny\n"), ["x", "y"]);
  });

  test("reads total_tests from the header", () => {
    assert.equal(baselineHeaderTotal("# total_tests: 306\nx\n"), 306);
    assert.equal(baselineHeaderTotal("x\n"), null);
  });
});
