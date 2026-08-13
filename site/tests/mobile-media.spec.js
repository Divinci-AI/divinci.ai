const { test, expect } = require('@playwright/test');

/**
 * Hero video sizing and chat voice playback on phones.
 *
 * Registered under Mobile-Safari (WebKit) as well as Chromium on purpose.
 * Both bugs covered here are WebKit-shaped:
 *
 *   - The landscape overflow only appeared with `display: grid` +
 *     `place-items: center`, where `max-height: 100%` did not clamp a height
 *     derived from `aspect-ratio` — a 750x342 viewport produced a 750x422
 *     stage. Chromium hid it.
 *   - navigator.audioSession does not exist outside WebKit at all, so the
 *     ring-switch fix is unobservable in Chromium.
 */

const openTheater = async (page) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await page.evaluate(() => document.getElementById('hero-play').click());
  await page.waitForTimeout(1900);
};

const stageBox = (page) => page.evaluate(() => {
  const t = document.getElementById('hero-theater');
  const s = t.querySelector('.hero-theater-stage').getBoundingClientRect();
  const b = t.getBoundingClientRect();
  return {
    l: s.left, t: s.top, r: s.right, b: s.bottom, w: s.width, h: s.height,
    vw: window.innerWidth, vh: window.innerHeight,
    theaterCovers: Math.abs(b.width - window.innerWidth) < 1 &&
                   Math.abs(b.height - window.innerHeight) < 1,
    theaterClips: getComputedStyle(t).overflow === 'hidden',
  };
});

test.describe('hero video sizing on a phone', () => {
  for (const [label, size] of [
    ['portrait', { width: 390, height: 844 }],
    ['landscape', { width: 844, height: 390 }],
    ['small portrait', { width: 320, height: 568 }],
  ]) {
    test(`the player fits the viewport on both axes — ${label}`, async ({ page }) => {
      await page.setViewportSize(size);
      await openTheater(page);
      const s = await stageBox(page);

      // The reported failure was a player running off the side of the screen
      // with only its left edge visible, so both axes are asserted, not just
      // the one that happened to break in this engine.
      expect(s.l, 'stage starts left of the viewport').toBeGreaterThanOrEqual(-1);
      expect(s.r, 'stage runs past the right edge').toBeLessThanOrEqual(s.vw + 1);
      expect(s.t, 'stage starts above the viewport').toBeGreaterThanOrEqual(-1);
      expect(s.b, 'stage runs past the bottom edge').toBeLessThanOrEqual(s.vh + 1);

      // And it stays a real 16:9 box rather than being stretched to fill.
      expect(s.w / s.h).toBeCloseTo(16 / 9, 1);

      // Full-bleed black backdrop, with a hard clip as the backstop.
      expect(s.theaterCovers).toBe(true);
      expect(s.theaterClips).toBe(true);
    });
  }

  test('the player is as wide as it can be without overflowing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openTheater(page);
    const s = await stageBox(page);
    // In portrait the height budget is generous, so "fits" must not be
    // achieved by shrinking the video — it should use the full width.
    expect(s.w).toBeCloseTo(s.vw, 0);
  });
});

test.describe('chat voice on a phone', () => {
  const openChat = async (page) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 20000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-input', { timeout: 20000 });
  };

  test('turning voice on declares a playback audio session', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openChat(page);

    const supported = await page.evaluate(() => !!navigator.audioSession);
    test.skip(!supported, 'navigator.audioSession is WebKit-only');

    // "auto" behaves like ambient on iOS, which means the hardware ring/silent
    // switch mutes HTML5 audio outright — the element reports playing and
    // nothing comes out of the speaker. This is the single most likely reason
    // voice works on a laptop and is inaudible on an iPhone.
    expect(await page.evaluate(() => navigator.audioSession.type)).toBe('auto');

    await page.click('.dvc-header-actions button:first-child');
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => navigator.audioSession.type)).toBe('playback');
  });

  test('one audio element is reused, not one per clip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openChat(page);
    await page.evaluate(() => {
      window.__audioCount = 0;
      const Orig = window.Audio;
      window.Audio = function (...a) { window.__audioCount++; return new Orig(...a); };
      window.Audio.prototype = Orig.prototype;
    });

    const soundBtn = '.dvc-header-actions button:first-child';
    await page.click(soundBtn);          // on
    await page.waitForTimeout(500);
    await page.click(soundBtn);          // off
    await page.waitForTimeout(300);
    await page.click(soundBtn);          // on again
    await page.waitForTimeout(500);

    // iOS grants playback permission per element: an element primed inside a
    // gesture may be played from script afterwards, a fresh one may not. A
    // `new Audio()` per clip is why auto-speak — which runs in an async
    // continuation after the reply lands — was silent on iPhone.
    expect(await page.evaluate(() => window.__audioCount)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() =>
      document.querySelector('.dvc-header-actions button').getAttribute('aria-pressed'))).toBe('true');
  });
});
