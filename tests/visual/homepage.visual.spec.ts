import { test, expect } from '@playwright/test';

/**
 * Homepage Visual Testing Suite
 * Tests the main landing page across different viewports and states
 */

test.describe('Homepage Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for critical elements to load
    await page.waitForSelector('.hero');
    await page.waitForSelector('.language-switcher');
    
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
    
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
  });

  test('Homepage - Full Page Screenshot', async ({ page }) => {
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Homepage - Above the Fold', async ({ page }) => {
    // Screenshot of visible area without scrolling
    await expect(page).toHaveScreenshot('homepage-above-fold.png', {
      animations: 'disabled',
    });
  });

  test('Homepage - Hero Section', async ({ page }) => {
    const heroSection = page.locator('.hero');
    await expect(heroSection).toHaveScreenshot('hero-section.png');
  });

  test('Homepage - Navigation Header', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('navigation-header.png');
  });

  test('Homepage - Features Section', async ({ page }) => {
    const featuresSection = page.locator('#features');
    await expect(featuresSection).toHaveScreenshot('features-section.png');
  });

  test('Homepage - Team Section', async ({ page }) => {
    const teamSection = page.locator('#team');
    await expect(teamSection).toHaveScreenshot('team-section.png');
  });

  test('Homepage - Footer', async ({ page }) => {
    const footer = page.locator('footer, .site-footer');
    await expect(footer).toHaveScreenshot('footer-section.png');
  });

  test('Language Switcher - Closed State', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-closed.png');
  });

  test('Language Switcher - Open State', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher');
    
    // Click to open dropdown
    await languageSwitcher.click();
    
    // Wait for dropdown to be visible
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    // Screenshot the open dropdown
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-open.png');
  });

  test('Language Switcher - Hover State', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher');
    
    // Open dropdown
    await languageSwitcher.click();
    await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    // Hover over first language option
    const firstOption = page.locator('.language-option').first();
    await firstOption.hover();
    
    // Screenshot with hover state
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-hover.png');
  });

  test('Mobile Menu - Closed State', async ({ page }) => {
    // Only test on mobile viewports
    const viewport = page.viewportSize();
    if (viewport && viewport.width <= 768) {
      const mobileMenu = page.locator('.nav-menu');
      await expect(mobileMenu).toHaveScreenshot('mobile-menu-closed.png');
    }
  });

  test('Mobile Menu - Open State', async ({ page }) => {
    // Only test on mobile viewports
    const viewport = page.viewportSize();
    if (viewport && viewport.width <= 768) {
      // Look for mobile menu trigger (hamburger button)
      const menuTrigger = page.locator('.mobile-menu-trigger, .hamburger, [aria-label="Menu"]');
      
      if (await menuTrigger.count() > 0) {
        await menuTrigger.click();
        await page.waitForTimeout(300); // Wait for animation
        
        const mobileMenu = page.locator('.nav-menu');
        await expect(mobileMenu).toHaveScreenshot('mobile-menu-open.png');
      }
    }
  });

  test('Form Elements - Default State', async ({ page }) => {
    // Navigate to contact page or find forms on homepage
    const forms = page.locator('form, .signup-form, .newsletter-signup');
    
    if (await forms.count() > 0) {
      await expect(forms.first()).toHaveScreenshot('form-elements-default.png');
    }
  });

  test('Responsive Breakpoints - Critical Points', async ({ page }) => {
    const viewport = page.viewportSize();
    
    if (viewport) {
      // Test specific responsive behavior based on viewport
      if (viewport.width <= 480) {
        // Mobile specific tests
        await expect(page).toHaveScreenshot(`mobile-${viewport.width}x${viewport.height}.png`);
      } else if (viewport.width <= 768) {
        // Tablet specific tests
        await expect(page).toHaveScreenshot(`tablet-${viewport.width}x${viewport.height}.png`);
      } else {
        // Desktop specific tests
        await expect(page).toHaveScreenshot(`desktop-${viewport.width}x${viewport.height}.png`);
      }
    }
  });

  test('Dark Mode Compatibility', async ({ page }) => {
    // Test if dark mode styles exist and apply them
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500); // Wait for theme change
    
    await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('High Contrast Mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            filter: contrast(150%) !important;
          }
        }
      `
    });
    
    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      animations: 'disabled',
    });
  });

  test('Print Styles', async ({ page }) => {
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('homepage-print.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
