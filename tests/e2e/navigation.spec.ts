import { test, expect } from '@playwright/test';
import { NavigationPage } from '../page-objects';

/**
 * Navigation E2E Tests
 *
 * Tests for header, footer, and mobile navigation functionality
 */

test.describe('Navigation', () => {
  let navPage: NavigationPage;

  test.beforeEach(async ({ page }) => {
    navPage = new NavigationPage(page);
    await navPage.goto('/');
  });

  test.describe('Header Navigation', () => {
    test('header is visible on page load', async () => {
      const isVisible = await navPage.isHeaderVisible();
      expect(isVisible).toBe(true);
    });

    test('logo navigates to homepage', async ({ page }) => {
      await navPage.goto('/pricing.html');
      await navPage.clickLogo();
      await expect(page).toHaveURL(/\/$/);
    });

    test('navigation links are present', async () => {
      const linkTexts = await navPage.getNavLinkTexts();
      expect(linkTexts.length).toBeGreaterThan(0);
    });

    test('navigation links are valid (no 404s)', async () => {
      const { broken } = await navPage.verifyNavLinksAreValid();
      expect(broken).toHaveLength(0);
    });
  });

  test.describe('Footer Navigation', () => {
    test('footer is visible after scrolling', async () => {
      await navPage.scrollToBottom();
      const isVisible = await navPage.isFooterVisible();
      expect(isVisible).toBe(true);
    });

    test('footer contains expected links', async () => {
      await navPage.scrollToBottom();
      const hrefs = await navPage.getFooterLinkHrefs();
      expect(hrefs.length).toBeGreaterThan(0);

      // Check for common footer links
      const hasPrivacyPolicy = hrefs.some(h => h.includes('privacy'));
      const hasTerms = hrefs.some(h => h.includes('terms'));
      expect(hasPrivacyPolicy || hasTerms).toBe(true);
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('mobile menu button is visible on mobile', async () => {
      const isVisible = await navPage.mobileMenuButton.isVisible();
      expect(isVisible).toBe(true);
    });

    test('mobile menu opens and closes', async () => {
      await navPage.openMobileMenu();
      let isOpen = await navPage.isMobileMenuOpen();
      expect(isOpen).toBe(true);

      await navPage.closeMobileMenu();
      isOpen = await navPage.isMobileMenuOpen();
      expect(isOpen).toBe(false);
    });
  });

  test.describe('Keyboard Accessibility', () => {
    test('navigation links are keyboard accessible', async ({ page }) => {
      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Continue tabbing through navigation
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
      }
    });
  });
});
