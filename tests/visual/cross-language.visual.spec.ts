import { test, expect } from '@playwright/test';

/**
 * Cross-Language Visual Comparison Tests
 * Validates visual consistency across all language versions
 */

test.describe('Cross-Language Visual Comparison', () => {
  
  const languages = [
    { code: 'en', name: 'English', path: '/', dir: 'ltr' },
    { code: 'es', name: 'Spanish', path: '/es/', dir: 'ltr' },
    { code: 'fr', name: 'French', path: '/fr/', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', path: '/ar/', dir: 'rtl' }
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

  // Test each language version for layout consistency
  for (const lang of languages) {
    test(`Layout Consistency - ${lang.name}`, async ({ page }) => {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      // Full page screenshot for each language
      await expect(page).toHaveScreenshot(`layout-${lang.code}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test(`Header Section - ${lang.name}`, async ({ page }) => {
      await page.goto(lang.path);
      await page.waitForSelector('header');
      
      const header = page.locator('header');
      await expect(header).toHaveScreenshot(`header-${lang.code}.png`);
    });

    test(`Hero Section - ${lang.name}`, async ({ page }) => {
      await page.goto(lang.path);
      await page.waitForSelector('.hero');
      
      const hero = page.locator('.hero');
      await expect(hero).toHaveScreenshot(`hero-${lang.code}.png`);
    });

    test(`Navigation Menu - ${lang.name}`, async ({ page }) => {
      await page.goto(lang.path);
      await page.waitForSelector('nav, .nav-menu');
      
      const nav = page.locator('nav, .nav-menu').first();
      await expect(nav).toHaveScreenshot(`navigation-${lang.code}.png`);
    });
  }

  test('RTL vs LTR Layout Comparison', async ({ page }) => {
    // Test LTR layout (English)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('layout-ltr.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Test RTL layout (Arabic)
    await page.goto('/ar/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('layout-rtl.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Font Rendering Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      // Focus on text-heavy sections
      const textSections = page.locator('h1, h2, h3, p, .hero-text, .feature-text');
      
      if (await textSections.count() > 0) {
        await expect(textSections.first()).toHaveScreenshot(`font-rendering-${lang.code}.png`);
      }
    }
  });

  test('Mobile Layout Consistency', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`mobile-layout-${lang.code}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('Tablet Layout Consistency', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`tablet-layout-${lang.code}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('Language Switcher Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForSelector('.language-switcher');
      
      // Closed state
      const languageSwitcher = page.locator('.language-switcher');
      await expect(languageSwitcher).toHaveScreenshot(`lang-switcher-closed-${lang.code}.png`);
      
      // Open state
      await languageSwitcher.click();
      await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
      await expect(languageSwitcher).toHaveScreenshot(`lang-switcher-open-${lang.code}.png`);
      
      // Close dropdown for next iteration
      await page.keyboard.press('Escape');
    }
  });

  test('Form Elements Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      // Look for forms on the page
      const forms = page.locator('form, .contact-form, .signup-form');
      
      if (await forms.count() > 0) {
        await expect(forms.first()).toHaveScreenshot(`form-elements-${lang.code}.png`);
      }
    }
  });

  test('Button Styles Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      // Find buttons on the page
      const buttons = page.locator('button, .btn, .cta-button, a[class*="button"]');
      
      if (await buttons.count() > 0) {
        // Screenshot first few buttons
        for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
          const button = buttons.nth(i);
          await expect(button).toHaveScreenshot(`button-${i}-${lang.code}.png`);
        }
      }
    }
  });

  test('Footer Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      const footer = page.locator('footer, .site-footer, .page-footer');
      
      if (await footer.count() > 0) {
        await expect(footer.first()).toHaveScreenshot(`footer-${lang.code}.png`);
      }
    }
  });

  test('Color Scheme Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      // Test dark mode if supported
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`dark-mode-${lang.code}.png`, {
        animations: 'disabled',
      });
      
      // Reset to light mode
      await page.emulateMedia({ colorScheme: 'light' });
    }
  });

  test('Accessibility Features Consistency', async ({ page }) => {
    for (const lang of languages) {
      await page.goto(lang.path);
      await page.waitForLoadState('networkidle');
      
      // Test high contrast mode
      await page.addStyleTag({
        content: `
          * {
            filter: contrast(150%) !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot(`high-contrast-${lang.code}.png`, {
        animations: 'disabled',
      });
    }
  });
});
