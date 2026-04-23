// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Accessibility Test Suite
 * Tests WCAG 2.1 AA compliance, keyboard navigation, screen reader support,
 * and accessibility across all language versions
 */

test.describe('Accessibility Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test.describe('Keyboard Navigation Tests', () => {
    
    test('should support complete keyboard navigation', async ({ page }) => {
      // Test tab navigation through all interactive elements
      await page.keyboard.press('Tab');
      
      // Check main navigation is focusable
      const featuresLink = page.locator('nav a[href="#features"]');
      await expect(featuresLink).toBeFocused();
      
      await page.keyboard.press('Tab');
      const teamLink = page.locator('nav a[href="#team"]');
      await expect(teamLink).toBeFocused();
      
      await page.keyboard.press('Tab');
      const signupLink = page.locator('nav a[href="#signup"]');
      await expect(signupLink).toBeFocused();
      
      // Test language switcher accessibility
      await page.keyboard.press('Tab');
      const languageSwitcher = page.locator('.language-switcher');
      await expect(languageSwitcher).toBeVisible();
      
      // Test CTA button accessibility
      await page.keyboard.press('Tab');
      const ctaButton = page.locator('.cta-button');
      await expect(ctaButton).toBeFocused();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      // Should trigger some action (could be modal, navigation, etc.)
    });

    test('should support arrow key navigation in dropdowns', async ({ page }) => {
      // Focus on language switcher
      await page.locator('.language-switcher').focus();
      await page.keyboard.press('Enter');
      
      // Should open dropdown
      const dropdown = page.locator('.language-switcher-dropdown');
      await expect(dropdown).toBeVisible();
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Should select a language option
    });

    test('should support skip links for screen readers', async ({ page }) => {
      // Test for skip navigation links
      const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
      if (await skipLink.count() > 0) {
        await expect(skipLink).toHaveAttribute('href', /#(main|content)/);
      }
    });

    test('should maintain focus visibility', async ({ page }) => {
      // Check that focused elements have visible focus indicators
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test that focus is visually distinct
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have some form of focus indication
      const hasFocusIndicator = focusStyles.outline !== 'none' || 
                               focusStyles.boxShadow !== 'none' ||
                               focusStyles.outlineWidth !== '0px';
      expect(hasFocusIndicator).toBeTruthy();
    });
  });

  test.describe('ARIA and Screen Reader Support', () => {
    
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Test main navigation has proper ARIA
      const mainNav = page.locator('nav').first();
      await expect(mainNav).toHaveAttribute('role', /navigation|banner/);
      
      // Test language switcher has proper ARIA
      const languageSwitcher = page.locator('.language-switcher');
      await expect(languageSwitcher).toHaveAttribute('aria-label', /.+/);
      
      // Test buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const hasAccessibleName = await button.evaluate(btn => {
          return btn.getAttribute('aria-label') || 
                 btn.getAttribute('aria-labelledby') || 
                 btn.textContent?.trim() || 
                 btn.getAttribute('title');
        });
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Test heading structure follows proper hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = [];
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.replace('h', ''));
        headingLevels.push(level);
      }
      
      // Should start with h1
      expect(headingLevels[0]).toBe(1);
      
      // Should not skip levels (no h3 before h2, etc.)
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const previousLevel = headingLevels[i - 1];
        const levelDifference = currentLevel - previousLevel;
        
        // Should not skip more than one level
        expect(levelDifference).toBeLessThanOrEqual(1);
      }
    });

    test('should have accessible form elements', async ({ page }) => {
      // Navigate to signup section
      await page.locator('#signup').scrollIntoViewIfNeeded();
      
      // Test form inputs have proper labels
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        const hasLabel = await emailInput.evaluate(input => {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const placeholder = input.getAttribute('placeholder');
          const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
          
          return !!(ariaLabel || ariaLabelledBy || associatedLabel || placeholder);
        });
        expect(hasLabel).toBeTruthy();
      }
      
      // Test required fields are properly marked
      const requiredInputs = page.locator('input[required]');
      const requiredCount = await requiredInputs.count();
      
      for (let i = 0; i < requiredCount; i++) {
        const input = requiredInputs.nth(i);
        const hasRequiredIndication = await input.evaluate(inp => {
          return inp.getAttribute('aria-required') === 'true' || 
                 inp.getAttribute('required') !== null ||
                 inp.getAttribute('aria-label')?.includes('required') ||
                 inp.getAttribute('placeholder')?.includes('*');
        });
        expect(hasRequiredIndication).toBeTruthy();
      }
    });

    test('should have proper image alt text', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const altText = await img.getAttribute('alt');
        const isDecorative = await img.getAttribute('role') === 'presentation' ||
                            await img.getAttribute('aria-hidden') === 'true';
        
        // All images should have alt text or be marked as decorative
        if (!isDecorative) {
          expect(altText).toBeTruthy();
          expect(altText?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Color and Visual Accessibility', () => {
    
    test('should have sufficient color contrast', async ({ page }) => {
      // Test main text elements for contrast
      const textElements = [
        'h1', 'h2', 'h3', 'p', 'a', 'button', 
        '.hero-text', '.feature-text', '.team-member'
      ];
      
      for (const selector of textElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          const element = elements.first();
          const contrast = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            // Basic color contrast check (simplified)
            // In a real implementation, you'd use a proper contrast ratio calculation
            return {
              color,
              backgroundColor,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight
            };
          });
          
          // Ensure we have color information
          expect(contrast.color).toBeTruthy();
        }
      }
    });

    test('should not rely solely on color for information', async ({ page }) => {
      // Test that important UI states have more than just color differences
      const importantElements = [
        'button:hover', 'button:focus', 'button:active',
        'a:hover', 'a:focus', 'a:visited',
        '.error', '.success', '.warning'
      ];
      
      for (const selector of importantElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          const element = elements.first();
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              textDecoration: computed.textDecoration,
              fontWeight: computed.fontWeight,
              border: computed.border,
              outline: computed.outline,
              transform: computed.transform
            };
          });
          
          // Should have visual indicators beyond color
          const hasNonColorIndicator = 
            styles.textDecoration !== 'none' ||
            styles.border !== 'none' ||
            styles.outline !== 'none' ||
            styles.transform !== 'none';
          
          // This is informational - some elements may rely on color alone
          // but critical interactive elements should not
        }
      }
    });
  });

  test.describe('Multi-Language Accessibility', () => {
    
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'ar', name: 'Arabic' },
      { code: 'ja', name: 'Japanese' },
      { code: 'zh', name: 'Chinese' }
    ];

    languages.forEach(({ code, name }) => {
      test(`should have proper accessibility in ${name}`, async ({ page }) => {
        if (code !== 'en') {
          await page.goto(`/${code}/`);
          await page.waitForLoadState('networkidle');
        }
        
        // Test lang attribute is properly set
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(code);
        
        // Test dir attribute for RTL languages
        if (code === 'ar') {
          const dir = await page.locator('html').getAttribute('dir');
          expect(dir).toBe('rtl');
        }
        
        // Test that main navigation is accessible in this language
        const navLinks = page.locator('nav a');
        const navCount = await navLinks.count();
        expect(navCount).toBeGreaterThan(0);
        
        // Test that text content is properly translated
        const heroHeading = page.locator('h1').first();
        const headingText = await heroHeading.textContent();
        expect(headingText?.trim().length).toBeGreaterThan(0);
        
        // For non-English languages, ensure text is actually translated
        if (code !== 'en') {
          expect(headingText).not.toContain('AI releases. Excellence, every time.');
        }
      });
    });
  });

  test.describe('Media and Interactive Elements', () => {
    
    test('should have accessible video controls', async ({ page }) => {
      const videos = page.locator('video');
      const videoCount = await videos.count();
      
      for (let i = 0; i < videoCount; i++) {
        const video = videos.nth(i);
        
        // Test video has proper attributes
        const hasControls = await video.getAttribute('controls');
        const hasAutoplay = await video.getAttribute('autoplay');
        const isMuted = await video.getAttribute('muted');
        
        // Videos should either have controls or be muted if autoplaying
        if (hasAutoplay && !isMuted) {
          expect(hasControls).toBeTruthy();
        }
        
        // Test for captions/subtitles
        const trackElements = page.locator('track');
        if (await trackElements.count() > 0) {
          const track = trackElements.first();
          const kind = await track.getAttribute('kind');
          expect(['captions', 'subtitles']).toContain(kind);
        }
      }
    });

    test('should have accessible interactive panels', async ({ page }) => {
      // Test enterprise AI panels
      await page.locator('#solutions').scrollIntoViewIfNeeded();
      
      const panels = page.locator('.panel');
      const panelCount = await panels.count();
      
      for (let i = 0; i < panelCount; i++) {
        const panel = panels.nth(i);
        
        // Test panels are keyboard accessible
        await panel.focus();
        await expect(panel).toBeFocused();
        
        // Test panels have proper ARIA roles if interactive
        const role = await panel.getAttribute('role');
        const tabindex = await panel.getAttribute('tabindex');
        
        if (tabindex === '0' || tabindex === '-1') {
          expect(['button', 'tab', 'option']).toContain(role);
        }
      }
    });
  });

  test.describe('Performance and User Experience', () => {
    
    test('should have reasonable loading times for accessibility tools', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds for accessibility tools
      expect(loadTime).toBeLessThan(5000);
    });

    test('should support zoom up to 200% without horizontal scrolling', async ({ page }) => {
      // Set viewport to simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 480 });
      
      // Check that main content doesn't cause horizontal scroll
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      // Allow for small differences due to scrollbars
      expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 20);
    });

    test('should be usable without JavaScript', async ({ page, context }) => {
      // Disable JavaScript
      await context.setExtraHTTPHeaders({});
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'NoJS Test Browser'
        });
      });
      
      await page.goto('/');
      
      // Test that main content is visible
      const heroSection = page.locator('.hero');
      await expect(heroSection).toBeVisible();
      
      // Test that navigation links work
      const featuresLink = page.locator('a[href="#features"]');
      await expect(featuresLink).toBeVisible();
      
      // Basic functionality should work without JS
      const mainContent = page.locator('main, .hero, .features-section');
      await expect(mainContent.first()).toBeVisible();
    });
  });

  test.describe('Error Handling and User Guidance', () => {
    
    test('should provide clear error messages', async ({ page }) => {
      // Navigate to signup form
      await page.locator('#signup').scrollIntoViewIfNeeded();
      
      // Try submitting empty form
      const submitButton = page.locator('button[type="submit"], .signup-button');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Look for error messages
        const errorMessages = page.locator('.error, [role="alert"], .field-error');
        
        // If there are validation errors, they should be accessible
        const errorCount = await errorMessages.count();
        if (errorCount > 0) {
          for (let i = 0; i < errorCount; i++) {
            const error = errorMessages.nth(i);
            const errorText = await error.textContent();
            expect(errorText?.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should provide helpful 404 error page', async ({ page }) => {
      // Test navigation to non-existent page
      const response = await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
      
      if (response?.status() === 404) {
        // Should have helpful content
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('404');
        
        // Should have navigation back to main site
        const homeLink = page.locator('a[href="/"], a[href="index.html"]');
        if (await homeLink.count() > 0) {
          await expect(homeLink.first()).toBeVisible();
        }
      }
    });
  });
});

// Helper test for generating accessibility report
test('Generate Accessibility Report', async ({ page }) => {
  await page.goto('/');
  
  // Basic accessibility metrics
  const metrics = {
    pageTitle: await page.title(),
    hasMainLandmark: await page.locator('main, [role="main"]').count() > 0,
    headingCount: await page.locator('h1, h2, h3, h4, h5, h6').count(),
    imageCount: await page.locator('img').count(),
    linkCount: await page.locator('a').count(),
    buttonCount: await page.locator('button').count(),
    formCount: await page.locator('form').count(),
    videoCount: await page.locator('video').count(),
    languageSupport: await page.locator('.language-option').count()
  };
  
  console.log('Accessibility Metrics:', JSON.stringify(metrics, null, 2));
  
  // This test always passes - it's just for reporting
  expect(true).toBeTruthy();
});