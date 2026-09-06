/**
 * The chat widget must never RESTORE a conversation that ended in a pending
 * placeholder or an error, and must never persist one.
 *
 * Regression for 2026-09-05 on /investors/: a send timed out, the widget had
 * already written `{ role:"assistant", text:"", pending:true }` to
 * localStorage, and every later open replayed the visitor's question above a
 * typing indicator that no request would ever resolve. The pure helper is
 * unit-tested (tests/unit/chat-history.test.mjs); this covers the wiring —
 * the constructor wiping bad state on load, and the panel that results.
 *
 * Runs against the local zola build; the widget's release id is read from the
 * page's own <script id="divinci-chat-js" data-release-id>, so this does not
 * hardcode an id that config.toml may change.
 */
const { test, expect } = require('@playwright/test');

const HISTORY = (rel) => `divinci-chat-history:${rel}`;
const GATE = (rel) => `divinci-chat-gate:${rel}`;

async function releaseId(page) {
  return page.evaluate(() => document.getElementById('divinci-chat-js')?.dataset.releaseId || '');
}

async function seed(page, rel, messages) {
  await page.evaluate(([h, g, msgs]) => {
    localStorage.setItem(h, JSON.stringify(msgs));
    localStorage.setItem(g, JSON.stringify({ transcript: [], signiture: '' }));
  }, [HISTORY(rel), GATE(rel), messages]);
}

test.describe('chat widget persistence', () => {
  test('a stored history ending in a pending placeholder is wiped on load and the panel opens empty', async ({ page }) => {
    await page.goto('/');
    const rel = await releaseId(page);
    expect(rel).toMatch(/^[0-9a-f]{24}$/);
    await seed(page, rel, [
      { role: 'user', text: 'What does Divinci sell, in one paragraph, and to whom?' },
      { role: 'assistant', text: '', pending: true },
    ]);
    await page.reload();
    await page.waitForSelector('.dvc-bubble');
    const stored = await page.evaluate(([h, g]) => [localStorage.getItem(h), localStorage.getItem(g)], [HISTORY(rel), GATE(rel)]);
    expect(stored).toEqual([null, null]);
    await page.click('.dvc-bubble');
    await expect(page.locator('#dvc-panel')).not.toHaveClass(/dvc-hidden/);
    await expect(page.locator('#dvc-panel .dvc-typing')).toHaveCount(0);
    await expect(page.locator('#dvc-panel .dvc-msg-user')).toHaveCount(0);
  });

  test('a stored history ending in an error bubble is discarded whole', async ({ page }) => {
    await page.goto('/');
    const rel = await releaseId(page);
    await seed(page, rel, [
      { role: 'user', text: 'q1' }, { role: 'assistant', text: 'r1' },
      { role: 'user', text: 'q2' }, { role: 'assistant', text: 'Something went wrong. Please try again.', isError: true },
    ]);
    await page.reload();
    await page.waitForSelector('.dvc-bubble');
    expect(await page.evaluate((h) => localStorage.getItem(h), HISTORY(rel))).toBeNull();
    await page.click('.dvc-bubble');
    await expect(page.locator('#dvc-panel .dvc-msg-user')).toHaveCount(0);
  });

  test('a settled history is restored verbatim', async ({ page }) => {
    await page.goto('/');
    const rel = await releaseId(page);
    await seed(page, rel, [
      { role: 'user', text: 'What is Divinci?' }, { role: 'assistant', text: 'Divinci builds custom AIs a business can prove.' },
    ]);
    await page.reload();
    await page.waitForSelector('.dvc-bubble');
    await page.click('.dvc-bubble');
    await expect(page.locator('#dvc-panel .dvc-msg-user')).toHaveCount(1);
    await expect(page.locator('#dvc-panel .dvc-msg-assistant')).toContainText('custom AIs');
    await expect(page.locator('#dvc-panel .dvc-typing')).toHaveCount(0);
  });
});
