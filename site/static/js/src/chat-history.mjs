/**
 * What of a chat conversation is safe to keep in localStorage.
 *
 * The widget used to persist `this.messages` verbatim — INCLUDING the empty
 * `pending: true` assistant placeholder pushed before a send, and any
 * `isError` bubble pushed after a failure. Reloading the page then restored a
 * typing indicator that no request was ever going to resolve (seen on
 * divinci.ai/investors on 2026-09-05: the visitor's question sat above three
 * bouncing dots, forever, with zero network activity), or restored a dead
 * conversation ending in an error.
 *
 * Rule: only COMPLETED exchanges persist — a history is cut back to its last
 * non-pending, non-error assistant reply. Anything after that (an orphan user
 * turn, a placeholder, an error) is in-memory only. A stored history that
 * turns out to be unsettled is discarded WHOLE, so the visitor starts a fresh,
 * empty chat rather than resuming one that ended badly.
 *
 * Plain .mjs so the same module is bundled by esbuild into the widget and
 * imported by `node --test` without a transpile step.
 */

/** @typedef {{ role: "user" | "assistant", text: string, pending?: boolean, isError?: boolean }} ChatMessage */

/**
 * Truncate to the last completed assistant reply. Returns [] when there is
 * none. Never mutates its input.
 * @param {ReadonlyArray<ChatMessage>} messages
 * @returns {Array<ChatMessage>}
 */
export function settledHistory(messages) {
  if (!Array.isArray(messages)) return [];
  let end = -1;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m && m.role === "assistant" && !m.pending && !m.isError && typeof m.text === "string" && m.text.length > 0) end = i;
  }
  return messages.slice(0, end + 1);
}

/**
 * Parse a stored history. `wiped` is true when the stored value was missing,
 * unparseable, or ended unsettled — in every one of those cases the caller
 * should clear BOTH the history and the signed-transcript key and start empty.
 * @param {string | null} raw
 * @returns {{ messages: Array<ChatMessage>, wiped: boolean }}
 */
export function restoreHistory(raw) {
  if (typeof raw !== "string" || raw.length === 0) return { messages: [], wiped: false };
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return { messages: [], wiped: true }; }
  if (!Array.isArray(parsed)) return { messages: [], wiped: true };
  const settled = settledHistory(parsed);
  if (settled.length !== parsed.length) return { messages: [], wiped: true };
  return { messages: settled, wiped: false };
}
