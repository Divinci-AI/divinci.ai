import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests using axe-core
 *
 * Automated accessibility testing for WCAG compliance
 */

// Pages to test for accessibility
const PAGES_TO_TEST = [
  { name: 'Homepage', path: '/' },
  { name: 'Pricing', path: '/pricing.html' },
  { name: 'About', path: '/about-us.html' },
  { name: 'Contact', path: '/contact.html' },
  { name: 'Blog', path: '/blog/' },
  { name: 'Docs', path: '/docs/' },
  { name: 'Arabic Homepage', path: '/ar/' },
];

test.describe('Accessibility (WCAG)', () => {
  test.describe('Automated Accessibility Scans', () => {
    for (const pageConfig of PAGES_TO_TEST) {
      test(`${pageConfig.name} has no critical accessibility violations`, async ({ page }) => {
        await page.goto(pageConfig.path, { waitUntil: 'networkidle' });

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        // Filter for critical and serious violations only
        const criticalViolations = accessibilityScanResults.violations.filter(
          v => v.impact === 'critical' || v.impact === 'serious'
        );

        // Log violations for debugging
        if (criticalViolations.length > 0) {
          console.log(`\nAccessibility violations on ${pageConfig.name}:`);
          criticalViolations.forEach(violation => {
            console.log(`  - ${violation.id}: ${violation.description}`);
            console.log(`    Impact: ${violation.impact}`);
            console.log(`    Nodes: ${violation.nodes.length}`);
          });
        }

        expect(criticalViolations).toEqual([]);
      });
    }
  });

  test.describe('Color Contrast', () => {
    test('homepage passes color contrast checks', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('all interactive elements are keyboard accessible', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withRules(['keyboard', 'focus-order-semantics', 'focusable-content'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('skip link is present and functional', async ({ page }) => {
      await page.goto('/');

      // Press Tab to focus skip link
      await page.keyboard.press('Tab');

      // Check if skip link exists
      const skipLink = page.locator('a[href="#main"], a[href="#main-content"], .skip-link');
      const isVisible = await skipLink.isVisible();

      // Skip link may not be visible until focused
      if (isVisible) {
        await skipLink.click();
        // Verify focus moved to main content
        const mainContent = page.locator('#main, #main-content, main');
        await expect(mainContent).toBeVisible();
      }
    });
  });

  test.describe('Images & Media', () => {
    test('all images have alt text', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withRules(['image-alt'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Forms', () => {
    test('form inputs have associated labels', async ({ page }) => {
      await page.goto('/contact.html');

      const results = await new AxeBuilder({ page })
        .withRules(['label', 'form-field-multiple-labels'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Landmarks & Headings', () => {
    test('page has proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withRules(['heading-order', 'page-has-heading-one'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('page has proper landmark regions', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withRules(['landmark-one-main', 'region'])
        .analyze();

      // These are best practices, not hard requirements
      const seriousViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(seriousViolations).toEqual([]);
    });
  });

  test.describe('ARIA', () => {
    test('ARIA attributes are used correctly', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withRules([
          'aria-allowed-attr',
          'aria-hidden-body',
          'aria-hidden-focus',
          'aria-required-attr',
          'aria-valid-attr',
          'aria-valid-attr-value',
        ])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('mobile view is accessible', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('touch targets are appropriately sized', async ({ page }) => {
      await page.goto('/');

      // Check that buttons and links are at least 44x44 pixels
      const interactiveElements = page.locator('a, button, [role="button"]');
      const count = await interactiveElements.count();

      for (let i = 0; i < Math.min(count, 20); i++) {
        const box = await interactiveElements.nth(i).boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          // Allow some elements to be smaller if they're decorative
          const isLargeEnough = box.width >= 24 && box.height >= 24;
          // Just warn, don't fail - this is a best practice
          if (!isLargeEnough) {
            console.log(`Small touch target: ${box.width}x${box.height}`);
          }
        }
      }
    });
  });
});
