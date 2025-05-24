import { test, expect } from '@playwright/test';

/**
 * Language Switcher Visual Testing Suite
 * Validates the improved accessibility and visual design of the language switcher
 */

test.describe('Language Switcher Visual Tests', () => {
  
  const languages = [
    { code: '', name: 'English', path: '/' },
    { code: 'es', name: 'Spanish', path: '/es/' },
    { code: 'fr', name: 'French', path: '/fr/' },
    { code: 'ar', name: 'Arabic', path: '/ar/' }
  ];

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

  // Test each language version
  for (const lang of languages) {
    test(`Language Switcher - ${lang.name} Page`, async ({ page }) => {
      await page.goto(lang.path);
      await page.waitForSelector('.language-switcher');
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('.language-switcher');
      await expect(languageSwitcher).toHaveScreenshot(`language-switcher-${lang.code || 'en'}.png`);
    });

    test(`Language Switcher Dropdown - ${lang.name} Page`, async ({ page }) => {
      await page.goto(lang.path);
      await page.waitForSelector('.language-switcher');
      
      // Open dropdown
      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.click();
      await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
      
      // Screenshot the dropdown
      await expect(languageSwitcher).toHaveScreenshot(`language-dropdown-${lang.code || 'en'}.png`);
    });
  }

  test('Language Switcher - Contrast Validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Open dropdown
    const languageSwitcher = page.locator('.language-switcher');
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    // Test normal state
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-contrast-normal.png');
    
    // Test hover state on first option
    const firstOption = page.locator('.language-option').first();
    await firstOption.hover();
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-contrast-hover.png');
  });

  test('Language Switcher - Mobile Responsive', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Closed state
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-mobile-closed.png');
    
    // Open state
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-mobile-open.png');
  });

  test('Language Switcher - Tablet Responsive', async ({ page }) => {
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-tablet.png');
    
    // Open dropdown
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-tablet-open.png');
  });

  test('Language Switcher - RTL Layout (Arabic)', async ({ page }) => {
    await page.goto('/ar/');
    await page.waitForSelector('.language-switcher');
    await page.waitForLoadState('networkidle');
    
    // Test RTL layout
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-rtl.png');
    
    // Open dropdown in RTL
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-rtl-open.png');
  });

  test('Language Switcher - Focus States', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Focus on language switcher
    const languageSwitcher = page.locator('.language-switcher');
    await languageSwitcher.focus();
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-focused.png');
    
    // Open dropdown and focus on options
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    const firstOption = page.locator('.language-option').first();
    await firstOption.focus();
    await expect(languageSwitcher).toHaveScreenshot('language-option-focused.png');
  });

  test('Language Switcher - Keyboard Navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Tab to language switcher
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure
    
    // Find and focus the language switcher
    const languageSwitcher = page.locator('.language-switcher');
    await languageSwitcher.focus();
    
    // Open with Enter key
    await page.keyboard.press('Enter');
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-keyboard-nav.png');
  });

  test('Language Switcher - High Contrast Mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Apply high contrast styles
    await page.addStyleTag({
      content: `
        .language-switcher,
        .language-option {
          filter: contrast(200%) !important;
          border: 2px solid #000 !important;
        }
        .language-option:hover {
          background-color: #000 !important;
          color: #fff !important;
        }
      `
    });
    
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-high-contrast.png');
    
    // Open dropdown in high contrast
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-high-contrast-open.png');
  });

  test('Language Switcher - Color Blind Simulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Simulate protanopia (red-blind)
    await page.addStyleTag({
      content: `
        .language-switcher,
        .language-option {
          filter: sepia(100%) saturate(0%) hue-rotate(0deg) !important;
        }
      `
    });
    
    const languageSwitcher = page.locator('.language-switcher');
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-colorblind.png');
  });

  test('Language Switcher - Print Styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.language-switcher');
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);
    
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-print.png');
  });
});
