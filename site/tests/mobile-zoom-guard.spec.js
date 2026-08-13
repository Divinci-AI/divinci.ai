const { test, expect } = require('@playwright/test');

/**
 * Mobile Zoom Guard
 *
 * Regression cover for the "the page opens zoomed in and I have to pinch back
 * out every time" bug on iOS. Two WebKit behaviours produce it, and both are
 * silent — nothing errors, the page just renders wrong on a phone:
 *
 *   1. Focus zoom. Safari and every iOS browser built on WebKit (Brave and
 *      Chrome on iPhone included) zoom the whole page in when a text field
 *      with a computed font-size BELOW 16px takes focus, and never zoom back
 *      out on blur. 16px is a hard threshold, not a rounding guideline.
 *   2. Text autosizing. WebKit inflates the font of blocks it judges wider
 *      than the viewport unless text-size-adjust is pinned to 100%.
 *
 * The chat widget tripped both: a 14px composer that also autofocused itself
 * the moment the panel opened, so every visit zoomed in AND popped the
 * keyboard over the greeting.
 *
 * These assertions run against computed style rather than the stylesheets, so
 * they hold no matter which layer (global floor, page <style>, widget CSS)
 * ends up winning the cascade.
 */

const MIN_FONT_SIZE = 16;

// Every page that renders a focusable field, plus one RTL locale — Arabic has
// its own overflow history (see the base.html note about RTL viewports).
const PAGES = [
  '/', '/contact/', '/support/', '/docs/', '/cli/', '/pricing/', '/api/',
  '/blog/', '/about/', '/status/', '/tutorials/', '/ar/',
];

/** Fields the visitor can actually focus — hidden ones can't trigger the zoom. */
async function visibleFields(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('input, textarea, select')]
      .filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
      .filter((e) => !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'color'].includes(e.type))
      .map((e) => ({
        id: e.id || e.className || e.type,
        fontSize: parseFloat(getComputedStyle(e).fontSize),
      })));
}

test.describe('Mobile zoom guard', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  for (const path of PAGES) {
    test(`no sub-16px focusable field on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000); // the chat widget mounts async

      const tooSmall = (await visibleFields(page)).filter((f) => f.fontSize < MIN_FONT_SIZE);
      expect(tooSmall, `${path} has fields that will make iOS zoom in on focus`).toEqual([]);
    });
  }

  test('text-size-adjust is pinned so WebKit does not inflate copy', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    const adjust = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return s.webkitTextSizeAdjust || s.textSizeAdjust;
    });
    expect(adjust).toBe('100%');
  });

  test('no page-level horizontal overflow to pan around', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      // 1px of slack for subpixel rounding.
      expect(scrollWidth, `${path} scrolls sideways`).toBeLessThanOrEqual(clientWidth + 1);
    }
  });
});

test.describe('Chat widget on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('opens full-screen, greeting visible, no keyboard stolen', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-panel:not(.dvc-hidden)');

    const state = await page.evaluate(() => {
      const r = document.querySelector('.dvc-panel').getBoundingClientRect();
      return {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        bodyOverflow: document.body.style.overflow,
        focused: document.activeElement && document.activeElement.className,
      };
    });

    // Full-screen sheet pinned to the visual viewport — not a side panel
    // hanging below the fold with its composer under the browser toolbar.
    expect(state.top).toBe(0);
    expect(state.left).toBe(0);
    expect(state.width).toBe(state.innerWidth);
    expect(state.height).toBe(state.innerHeight);

    // The page behind must not scroll while the sheet is up.
    expect(state.bodyOverflow).toBe('hidden');

    // Opening must NOT focus the composer: on touch that raises the keyboard
    // over the greeting and starter prompts before they can be read.
    expect(state.focused).not.toContain('dvc-input');

    // And the greeting itself has to be on screen.
    const greeting = page.locator('.dvc-msg-assistant').first();
    await expect(greeting).toBeVisible();
    const box = await greeting.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeLessThan(state.innerHeight);
  });

  test('the panel shrinks to the visual viewport when the keyboard opens', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-input');

    // A software keyboard cannot be raised in a headless browser, but it is
    // reported to the page purely as a shrunken visualViewport — so shadow the
    // height and fire the event the real keyboard fires. This exercises the
    // actual handler, which is the part that can regress.
    const KEYBOARD_HEIGHT = 336;
    await page.evaluate((kb) => {
      const vv = window.visualViewport;
      Object.defineProperty(vv, 'height', {
        value: window.innerHeight - kb, configurable: true,
      });
      vv.dispatchEvent(new Event('resize'));
    }, KEYBOARD_HEIGHT);
    await page.waitForTimeout(100);

    const shrunk = await page.evaluate(() => ({
      vh: document.documentElement.style.getPropertyValue('--dvc-vh'),
      panelH: document.querySelector('.dvc-panel').getBoundingClientRect().height,
      composerBottom: document.querySelector('.dvc-inputrow').getBoundingClientRect().bottom,
      expected: window.visualViewport.height,
    }));

    expect(shrunk.vh).toBe(`${shrunk.expected}px`);
    expect(shrunk.panelH).toBeCloseTo(shrunk.expected, 0);
    // The whole point: the composer stays above the keyboard line, so WebKit
    // never has to pan the page to reveal it (which is what dragged the
    // greeting off the top of the screen).
    expect(shrunk.composerBottom).toBeLessThanOrEqual(shrunk.expected + 1);
  });

  test('the panel follows the visual viewport when the keyboard scrolls it', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-input');

    // iOS does not merely SHRINK the visual viewport for the keyboard, it also
    // SCROLLS it inside the layout viewport — and a position:fixed panel is
    // pinned to the layout viewport, which does not move. Shadow both
    // properties the way the real keyboard reports them.
    const KEYBOARD = 336;
    await page.evaluate((kb) => {
      const vv = window.visualViewport;
      Object.defineProperty(vv, 'height', { value: window.innerHeight - kb, configurable: true });
      Object.defineProperty(vv, 'offsetTop', { value: kb, configurable: true });
      vv.dispatchEvent(new Event('resize'));
    }, KEYBOARD);
    await page.waitForTimeout(120);

    const s = await page.evaluate(() => {
      const p = document.querySelector('.dvc-panel');
      const r = p.getBoundingClientRect();
      return {
        vt: document.documentElement.style.getPropertyValue('--dvc-vt'),
        vh: document.documentElement.style.getPropertyValue('--dvc-vh'),
        top: Math.round(r.top),
        height: Math.round(r.height),
        expectedTop: window.visualViewport.offsetTop,
        expectedHeight: window.visualViewport.height,
        backdropShown: getComputedStyle(document.querySelector('.dvc-backdrop')).display,
      };
    });

    // The panel must sit where the visitor is actually looking.
    expect(s.vt).toBe(`${s.expectedTop}px`);
    expect(s.top).toBe(s.expectedTop);
    expect(s.height).toBe(s.expectedHeight);
    // And the layer behind it is opaque, so any residual mismatch shows the
    // widget's own surface rather than the page.
    expect(s.backdropShown).toBe('block');
  });

  test('rotating to landscape keeps the panel full-screen', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-panel:not(.dvc-hidden)');

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => {
      const r = document.querySelector('.dvc-panel').getBoundingClientRect();
      return { top: r.top, width: r.width, height: r.height,
               innerWidth: window.innerWidth, innerHeight: window.innerHeight };
    });
    // 844x390 misses (max-width: 600px) but hits the (max-height: 480px) arm.
    expect(state.top).toBe(0);
    expect(state.width).toBe(state.innerWidth);
    expect(state.height).toBeCloseTo(state.innerHeight, 0);
  });

  test('the page behind the panel cannot be scrolled', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    const before = await page.evaluate(() => window.scrollY);

    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-panel:not(.dvc-hidden)');

    // The lock must sit on <html>. mobile-fixes.css sets
    // `html { overflow-x: hidden }`, which stops <body>'s overflow propagating
    // to the viewport — so a body-only lock is a silent no-op on this site.
    // Assert the mechanism, not just the outcome: the wheel check below passes
    // even with no lock at all, because overscroll-behavior on the panel
    // happens to contain it.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');

    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    // ...and the reading position survives the round trip. A position:fixed
    // body lock would have reset this to 0.
    await page.evaluate(() => document.querySelector('.dvc-close').click());
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('reopening after a close re-arms the lock', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => document.querySelector('.dvc-bubble').click());
      await page.waitForSelector('.dvc-panel:not(.dvc-hidden)');
      expect(await page.evaluate(() => ({
        overflow: document.body.style.overflow,
        hasVh: !!document.documentElement.style.getPropertyValue('--dvc-vh'),
      })), `open #${i + 1}`).toEqual({ overflow: 'hidden', hasVh: true });

      await page.evaluate(() => document.querySelector('.dvc-close').click());
      await page.waitForTimeout(150);
      expect(await page.evaluate(() => document.body.style.overflow), `close #${i + 1}`).toBe('');
    }
  });

  test('tapping the composer focuses it without collapsing the panel', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-input');

    await page.locator('.dvc-input').tap();
    await page.waitForTimeout(150);

    expect(await page.evaluate(() => document.activeElement.className)).toContain('dvc-input');
    // 16px exactly — the value that stops iOS zooming on this very tap.
    expect(await page.evaluate(() =>
      getComputedStyle(document.querySelector('.dvc-input')).fontSize)).toBe('16px');
    expect(await page.evaluate(() => {
      const r = document.querySelector('.dvc-panel').getBoundingClientRect();
      return r.height === window.innerHeight && r.top === 0;
    })).toBe(true);
  });

  test('closing releases the scroll lock and the viewport override', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-panel:not(.dvc-hidden)');
    await page.evaluate(() => document.querySelector('.dvc-close').click());
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => ({
      bodyOverflow: document.body.style.overflow,
      vh: document.documentElement.style.getPropertyValue('--dvc-vh'),
    }))).toEqual({ bodyOverflow: '', vh: '' });
  });
});

test.describe('Chat widget on a desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('stays a side sheet and keeps its autofocus', async ({ page }) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-panel:not(.dvc-hidden)');
    // The panel unhides on the "loading" view; the composer only exists once
    // the gate config resolves, and that later render is what focuses it.
    await page.waitForSelector('.dvc-input');

    const state = await page.evaluate(() => {
      const r = document.querySelector('.dvc-panel').getBoundingClientRect();
      return {
        width: r.width,
        bodyOverflow: document.body.style.overflow,
        focused: document.activeElement && document.activeElement.className,
      };
    });

    expect(state.width).toBe(380);
    expect(state.bodyOverflow).toBe(''); // page behind stays scrollable
    expect(state.focused).toContain('dvc-input'); // pointer users type straight away
  });
});
