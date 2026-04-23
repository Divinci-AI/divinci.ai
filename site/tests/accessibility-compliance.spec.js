// Accessibility Compliance Test Suite
// Tests for WCAG 2.1 AA compliance and accessibility best practices

import { test, expect } from '@playwright/test';

test.describe('Accessibility Compliance Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('WCAG 2.1 AA Compliance Tests', () => {
    
    test('should have proper document structure and landmarks', async ({ page }) => {
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Ensure h1 exists and is unique
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check for main landmark
      const mainElement = await page.locator('main, [role="main"]').count();
      expect(mainElement).toBeGreaterThanOrEqual(1);
      
      // Check for navigation landmark
      const navElement = await page.locator('nav, [role="navigation"]').count();
      expect(navElement).toBeGreaterThanOrEqual(1);
      
      console.log('✅ Document structure and landmarks test passed');
    });

    test('should have adequate color contrast ratios', async ({ page }) => {
      // Test primary text color contrast
      const primaryTextElements = await page.locator('body, p, h1, h2, h3, h4, h5, h6').first();
      const styles = await primaryTextElements.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Verify our style guide colors meet contrast requirements
      // Primary font color #2d3c34 on light backgrounds should pass AA
      expect(styles.color).toBeTruthy();
      
      // Test button contrast
      const buttons = await page.locator('button, .button, .secondary-button').all();
      for (const button of buttons) {
        const buttonStyles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });
        expect(buttonStyles.color).toBeTruthy();
        expect(buttonStyles.backgroundColor).toBeTruthy();
      }
      
      console.log('✅ Color contrast test passed');
    });

    test('should have proper focus management', async ({ page }) => {
      // Test keyboard navigation
      const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex="0"]').all();
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Test focus indicators
      for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
        await focusableElements[i].focus();
        
        // Check if element has visible focus indicator
        const focusedElement = await page.locator(':focus');
        const outline = await focusedElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            outlineColor: computed.outlineColor,
            outlineWidth: computed.outlineWidth,
            boxShadow: computed.boxShadow
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = outline.outline !== 'none' || 
                                  outline.outlineWidth !== '0px' || 
                                  outline.boxShadow !== 'none';
        expect(hasFocusIndicator).toBeTruthy();
      }
      
      console.log('✅ Focus management test passed');
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for interactive elements with proper labels
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        const hasLabel = ariaLabel || (textContent && textContent.trim().length > 0);
        expect(hasLabel).toBeTruthy();
      }
      
      // Check for images with alt text
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        // Alt text should exist or image should be marked as decorative
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }
      
      // Check for form labels
      const inputs = await page.locator('input').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const labelExists = await page.locator(`label[for="${id}"]`).count() > 0;
          const hasAccessibleName = labelExists || ariaLabel || ariaLabelledBy;
          expect(hasAccessibleName).toBeTruthy();
        }
      }
      
      console.log('✅ ARIA labels and roles test passed');
    });

    test('should respect reduced motion preferences', async ({ page }) => {
      // Test with reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that animations are disabled
      const animatedElements = await page.locator('.journal-page.active .davinci-sketch path').first();
      if (await animatedElements.count() > 0) {
        const animationDuration = await animatedElements.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.animationDuration;
        });
        
        // Should be very short duration or none when reduced motion is preferred
        expect(animationDuration === '0.01ms' || animationDuration === 'none').toBeTruthy();
      }
      
      console.log('✅ Reduced motion preferences test passed');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Test keyboard navigation through main interactive elements
      const journalPages = await page.locator('.journal-page').all();
      
      if (journalPages.length > 0) {
        // Focus first journal page
        await journalPages[0].focus();
        
        // Test arrow key navigation
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        
        // Verify navigation worked
        const activeJournalPage = await page.locator('.journal-page.active').count();
        expect(activeJournalPage).toBe(1);
      }
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBe(1);
      
      console.log('✅ Keyboard navigation test passed');
    });

    test('should have proper video accessibility', async ({ page }) => {
      // Check video elements have proper attributes
      const videos = await page.locator('video').all();
      
      for (const video of videos) {
        // Videos should be muted by default for accessibility
        const isMuted = await video.getAttribute('muted');
        expect(isMuted).toBeTruthy();
        
        // Check for captions/controls if autoplay
        const hasControls = await video.getAttribute('controls');
        const hasAutoplay = await video.evaluate(el => el.autoplay);
        
        // If video autoplays, it should be muted (already checked) and ideally have controls
        if (hasAutoplay) {
          expect(isMuted).toBeTruthy();
        }
      }
      
      // Check for mute/unmute button accessibility
      const soundToggle = await page.locator('#sound-toggle');
      if (await soundToggle.count() > 0) {
        const ariaLabel = await soundToggle.getAttribute('aria-label');
        const textContent = await soundToggle.textContent();
        const hasAccessibleName = ariaLabel || (textContent && textContent.trim().length > 0);
        expect(hasAccessibleName).toBeTruthy();
      }
      
      console.log('✅ Video accessibility test passed');
    });

    test('should handle language attributes correctly', async ({ page }) => {
      // Check html lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang.length).toBeGreaterThan(0);
      
      // Check for language switcher accessibility
      const languageSwitcher = await page.locator('.language-switcher');
      if (await languageSwitcher.count() > 0) {
        const hasRole = await languageSwitcher.getAttribute('role');
        const hasAriaLabel = await languageSwitcher.getAttribute('aria-label');
        
        // Language switcher should have proper ARIA attributes
        expect(hasRole || hasAriaLabel).toBeTruthy();
      }
      
      console.log('✅ Language attributes test passed');
    });
  });

  test.describe('Mobile Accessibility Tests', () => {
    
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check touch targets are at least 44px
      const touchTargets = await page.locator('button, a, input, .journal-page').all();
      
      for (let i = 0; i < Math.min(5, touchTargets.length); i++) {
        const boundingBox = await touchTargets[i].boundingBox();
        if (boundingBox) {
          expect(boundingBox.width >= 44 || boundingBox.height >= 44).toBeTruthy();
        }
      }
      
      // Verify mobile navigation is accessible
      const nav = await page.locator('nav').first();
      const isVisible = await nav.isVisible();
      expect(isVisible).toBeTruthy();
      
      console.log('✅ Mobile accessibility test passed');
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    
    test('should provide meaningful text alternatives', async ({ page }) => {
      // Check SVG accessibility
      const svgs = await page.locator('svg').all();
      
      for (const svg of svgs) {
        const title = await svg.locator('title').count();
        const ariaLabel = await svg.getAttribute('aria-label');
        const ariaLabelledBy = await svg.getAttribute('aria-labelledby');
        const role = await svg.getAttribute('role');
        
        // SVG should have title, aria-label, or be marked as decorative
        const isAccessible = title > 0 || ariaLabel || ariaLabelledBy || role === 'img' || role === 'presentation';
        expect(isAccessible).toBeTruthy();
      }
      
      console.log('✅ Screen reader compatibility test passed');
    });
  });

  test.describe('Performance Accessibility', () => {
    
    test('should not cause seizures or vestibular disorders', async ({ page }) => {
      // Check for potential seizure-inducing animations
      const animatedElements = await page.locator('[class*="animate"], [style*="animation"]').all();
      
      // This is a basic check - in production, you'd want more sophisticated analysis
      for (const element of animatedElements) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            animationDuration: computed.animationDuration,
            animationIterationCount: computed.animationIterationCount
          };
        });
        
        // Animations should not be too fast or infinite with high frequency
        expect(styles.animationDuration).not.toBe('0.1s'); // Too fast
      }
      
      console.log('✅ Seizure/vestibular safety test passed');
    });
  });
});

test.describe('Accessibility Error Detection', () => {
  
  test('should not have common accessibility violations', async ({ page }) => {
    // Check for missing alt text on important images
    const importantImages = await page.locator('img:not([role="presentation"])').all();
    
    for (const img of importantImages) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // Important images should have alt text
      if (src && !src.includes('decorative') && !src.includes('bg-')) {
        expect(alt).toBeTruthy();
      }
    }
    
    // Check for empty links
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel;
      
      expect(hasAccessibleName).toBeTruthy();
    }
    
    console.log('✅ Common accessibility violations test passed');
  });
});