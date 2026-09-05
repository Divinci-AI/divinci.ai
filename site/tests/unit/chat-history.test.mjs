/**
 * The chat widget must never persist a conversation that ended in a pending
 * placeholder or an error, and must never RESTORE one. Regression for the
 * 2026-09-05 investors-page bug: a reload after "Request timed out" restored
 * the visitor's question above a typing indicator that no request would ever
 * resolve, because `{ role: "assistant", text: "", pending: true }` had been
 * written to localStorage before the send.
 *
 * Run with: npm run test:guards
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { settledHistory, restoreHistory } from "../../static/js/src/chat-history.mjs";

const u = (text) => ({ role: "user", text });
const a = (text) => ({ role: "assistant", text });
const PENDING = { role: "assistant", text: "", pending: true };
const ERROR = { role: "assistant", text: "Something went wrong.", isError: true };

describe("settledHistory", () => {
  test("keeps completed exchanges verbatim", () => {
    const h = [u("hi"), a("hello"), u("more?"), a("sure")];
    assert.deepEqual(settledHistory(h), h);
  });
  test("drops a trailing pending placeholder AND the orphan user turn before it", () => {
    assert.deepEqual(settledHistory([u("q1"), a("r1"), u("q2"), PENDING]), [u("q1"), a("r1")]);
  });
  test("drops a trailing error bubble and its user turn", () => {
    assert.deepEqual(settledHistory([u("q1"), a("r1"), u("q2"), ERROR]), [u("q1"), a("r1")]);
  });
  test("a conversation whose only exchange failed settles to nothing", () => {
    assert.deepEqual(settledHistory([u("q1"), PENDING]), []);
    assert.deepEqual(settledHistory([u("q1"), ERROR]), []);
    assert.deepEqual(settledHistory([u("q1")]), []);
  });
  test("an empty assistant reply does not count as completed", () => {
    assert.deepEqual(settledHistory([u("q1"), a("")]), []);
  });
  test("does not mutate its input and tolerates junk", () => {
    const h = [u("q1"), PENDING];
    settledHistory(h);
    assert.equal(h.length, 2);
    assert.deepEqual(settledHistory(null), []);
    assert.deepEqual(settledHistory([null, 3, "x"]), []);
  });
});

describe("restoreHistory", () => {
  test("nothing stored → empty, nothing to wipe", () => {
    assert.deepEqual(restoreHistory(null), { messages: [], wiped: false });
    assert.deepEqual(restoreHistory(""), { messages: [], wiped: false });
  });
  test("a settled history is restored as-is", () => {
    const h = [u("q1"), a("r1")];
    assert.deepEqual(restoreHistory(JSON.stringify(h)), { messages: h, wiped: false });
  });
  test("a history ending in a pending placeholder is discarded WHOLE (fresh chat), and flagged for wiping", () => {
    assert.deepEqual(restoreHistory(JSON.stringify([u("q1"), a("r1"), u("q2"), PENDING])), { messages: [], wiped: true });
  });
  test("a history ending in an error is discarded whole", () => {
    assert.deepEqual(restoreHistory(JSON.stringify([u("q1"), ERROR])), { messages: [], wiped: true });
  });
  test("unparseable or non-array storage is discarded and wiped", () => {
    assert.deepEqual(restoreHistory("{not json"), { messages: [], wiped: true });
    assert.deepEqual(restoreHistory(JSON.stringify({ a: 1 })), { messages: [], wiped: true });
  });
});
