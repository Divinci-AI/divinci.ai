const { test, expect } = require('@playwright/test');

/**
 * Visual Performance Testing Suite
 * Tests visual consistency under various performance conditions
 * and loading states to ensure robust visual experience
 */

test.describe('Visual Performance Testing', () => {
  const baseURL = 'http://localhost:1111';

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent visual testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        video {
          display: none !important;
        }
      `
    });
  });

  test.describe('Network condition visual tests', () => {
    test('Slow 3G network visual test - mobile', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add delay
        await route.continue();
      });

      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(baseURL);
      
      // Test loading states
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot('homepage-slow3g-loading-mobile.png', {
        threshold: 0.4,
        maxDiffPixels: 3000
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('homepage-slow3g-loaded-mobile.png', {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 2000
      });
    });

    test('Fast 3G network visual test - desktop', async ({ page, context }) => {
      // Simulate fast 3G network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Smaller delay
        await route.continue();
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-fast3g-desktop.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Image loading states', () => {
    test('Progressive image loading visual test', async ({ page, context }) => {
      let imageCount = 0;
      
      // Intercept images and add progressive loading delay
      await context.route('**/*.{png,jpg,jpeg,webp,svg}', async route => {
        imageCount++;
        await new Promise(resolve => setTimeout(resolve, imageCount * 200));
        await route.continue();
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      
      // Test hero section with partially loaded images
      await page.waitForTimeout(1000);
      const hero = page.locator('.hero');
      await expect(hero).toHaveScreenshot('hero-partial-images.png', {
        threshold: 0.4
      });

      // Test fully loaded state
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await expect(hero).toHaveScreenshot('hero-full-images.png', {
        threshold: 0.3
      });
    });

    test('Broken image fallback visual test', async ({ page, context }) => {
      // Simulate broken images
      await context.route('**/*.{png,jpg,jpeg,webp}', route => route.abort());

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-broken-images.png', {
        fullPage: true,
        threshold: 0.4,
        maxDiffPixels: 5000
      });
    });
  });

  test.describe('Font loading states', () => {
    test('System font fallback visual test', async ({ page, context }) => {
      // Block web fonts
      await context.route('**/*fonts.googleapis.com*', route => route.abort());
      await context.route('**/*fonts.gstatic.com*', route => route.abort());

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-system-fonts.png', {
        fullPage: true,
        threshold: 0.4,
        maxDiffPixels: 3000
      });
    });

    test('Font loading progression visual test', async ({ page, context }) => {
      let fontLoadDelay = 0;
      
      // Add progressive delay to font loading
      await context.route('**/*fonts*', async route => {
        fontLoadDelay += 500;
        await new Promise(resolve => setTimeout(resolve, fontLoadDelay));
        await route.continue();
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      
      // Test with system fonts
      await page.waitForTimeout(1000);
      const hero = page.locator('.hero');
      await expect(hero).toHaveScreenshot('hero-system-fonts.png', {
        threshold: 0.4
      });

      // Test with web fonts loaded
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await expect(hero).toHaveScreenshot('hero-web-fonts.png', {
        threshold: 0.3
      });
    });
  });

  test.describe('CSS loading states', () => {
    test('Progressive CSS loading visual test', async ({ page, context }) => {
      let cssLoaded = false;
      
      // Delay CSS loading
      await context.route('**/style.css', async route => {
        if (!cssLoaded) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          cssLoaded = true;
        }
        await route.continue();
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      
      // Test unstyled content
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('homepage-unstyled.png', {
        threshold: 0.5,
        maxDiffPixels: 10000
      });

      // Test styled content
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot('homepage-styled.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Performance under load', () => {
    test('High CPU usage visual test', async ({ page }) => {
      // Simulate high CPU usage with intensive script
      await page.addInitScript(() => {
        // Start CPU intensive task
        const startTime = Date.now();
        const duration = 2000; // 2 seconds of high CPU
        
        function intensiveTask() {
          const now = Date.now();
          if (now - startTime < duration) {
            // CPU intensive calculation
            for (let i = 0; i < 100000; i++) {
              Math.random() * Math.random();
            }
            requestAnimationFrame(intensiveTask);
          }
        }
        
        requestAnimationFrame(intensiveTask);
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('homepage-high-cpu.png', {
        fullPage: true,
        threshold: 0.4
      });
    });

    test('Memory pressure visual test', async ({ page }) => {
      // Create memory pressure by loading large data structures
      await page.addInitScript(() => {
        // Create memory pressure
        window.memoryPressure = [];
        for (let i = 0; i < 1000; i++) {
          window.memoryPressure.push(new Array(10000).fill('memory pressure test'));
        }
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-memory-pressure.png', {
        fullPage: true,
        threshold: 0.4
      });
    });
  });

  test.describe('Offline visual states', () => {
    test('Offline mode visual test', async ({ page, context }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      
      // Go offline after initial load
      await context.setOffline(true);
      
      // Try to navigate (should show cached content)
      await page.reload();
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot('homepage-offline.png', {
        fullPage: true,
        threshold: 0.4,
        maxDiffPixels: 5000
      });
    });
  });

  test.describe('Browser capability fallbacks', () => {
    test('No JavaScript visual test', async ({ page, context }) => {
      // Disable JavaScript
      await context.setJavaScriptEnabled(false);

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-no-javascript.png', {
        fullPage: true,
        threshold: 0.4,
        maxDiffPixels: 3000
      });
    });

    test('No CSS Grid support visual test', async ({ page }) => {
      // Simulate older browser without CSS Grid
      await page.addStyleTag({
        content: `
          .grid, .css-grid, [style*="grid"], [class*="grid"] {
            display: block !important;
          }
          @supports (display: grid) {
            .no-grid-fallback { display: none !important; }
          }
        `
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-no-css-grid.png', {
        fullPage: true,
        threshold: 0.4
      });
    });
  });

  test.describe('Print styles visual test', () => {
    test('Print media visual test', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('homepage-print-media.png', {
        fullPage: true,
        threshold: 0.4
      });
    });
  });
});