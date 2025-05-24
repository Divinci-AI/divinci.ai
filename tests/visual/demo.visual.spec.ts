import { test, expect } from '@playwright/test';

/**
 * Demo Visual Test
 * Simple test to verify visual testing setup is working
 */

test.describe('Demo Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the page
    await expect(page).toHaveScreenshot('demo-homepage.png', {
      animations: 'disabled',
    });
  });

  test('Language switcher is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('demo-language-switcher.png');
  });

  test('Mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('demo-mobile.png', {
      animations: 'disabled',
    });
  });
});
