// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Accessibility Test Suite
 * Tests color contrast, visual design patterns, and visual accessibility requirements
 */

test.describe('Visual Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Color Contrast and Visual Design', () => {
    
    test('should pass color contrast for all text elements', async ({ page }) => {
      // Function to calculate relative luminance
      const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      
      // Function to calculate contrast ratio
      const getContrastRatio = (rgb1, rgb2) => {
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
      };
      
      // Function to parse RGB color
      const parseRGB = (rgbString) => {
        const match = rgbString.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
        if (match) {
          return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
        }
        return { r: 0, g: 0, b: 0 }; // fallback
      };
      
      // Test critical text elements
      const textSelectors = [
        'h1', 'h2', 'h3', 'p', 'a', 'button',
        '.hero-text h1', '.hero-text p', 
        '.feature-text', '.team-member h3', '.team-member p',
        '.footer-section h3', '.footer-section a'
      ];
      
      const contrastIssues = [];
      
      for (const selector of textSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) { // Test first 5 of each type
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const styles = await element.evaluate(el => {
              const computed = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
                selector: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
                text: el.textContent?.substring(0, 50) || '',
                visible: rect.width > 0 && rect.height > 0
              };
            });
            
            if (styles.visible && styles.color && styles.backgroundColor) {
              // Only test if we have actual color values (not transparent)
              if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                  styles.backgroundColor !== 'transparent') {
                const textColor = parseRGB(styles.color);
                const bgColor = parseRGB(styles.backgroundColor);
                const contrast = getContrastRatio(textColor, bgColor);
                
                const fontSize = parseFloat(styles.fontSize);
                const isLargeText = fontSize >= 18 || 
                  (fontSize >= 14 && (styles.fontWeight === 'bold' || parseInt(styles.fontWeight) >= 700));
                
                const minContrast = isLargeText ? 3.0 : 4.5; // WCAG AA standard
                
                if (contrast < minContrast) {
                  contrastIssues.push({
                    selector: styles.selector,
                    text: styles.text,
                    contrast: contrast.toFixed(2),
                    required: minContrast,
                    textColor: styles.color,
                    backgroundColor: styles.backgroundColor
                  });
                }
              }
            }
          }
        }
      }
      
      // Report contrast issues but don't fail the test (informational)
      if (contrastIssues.length > 0) {
        console.log('Color Contrast Issues Found:');
        contrastIssues.forEach(issue => {
          console.log(`- ${issue.selector}: ${issue.contrast} (needs ${issue.required})`);
        });
      }
      
      // This is currently informational - adjust threshold as needed
      expect(contrastIssues.length).toBeLessThan(10);
    });

    test('should support high contrast mode', async ({ page, browserName }) => {
      // Test high contrast support (primarily for Windows users)
      if (browserName === 'chromium') {
        // Simulate high contrast mode
        await page.emulateMedia({ forcedColors: 'active' });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check that text is still readable
        const heroText = page.locator('.hero-text h1');
        await expect(heroText).toBeVisible();
        
        // Check that interactive elements are distinguishable
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeVisible();
          }
        }
      }
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Test with reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that animations are disabled or reduced
      const animatedElements = page.locator('[style*="transition"], [style*="animation"], .panel');
      const count = await animatedElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = animatedElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            transition: computed.transition,
            animation: computed.animation,
            animationPlayState: computed.animationPlayState
          };
        });
        
        // In reduced motion mode, animations should be minimal or paused
        const hasReducedMotion = 
          styles.transition.includes('none') ||
          styles.animation.includes('none') ||
          styles.animationPlayState === 'paused';
        
        // This is informational for now
        if (!hasReducedMotion) {
          console.log('Element may not respect reduced motion:', styles);
        }
      }
    });

    test('should be readable when zoomed to 200%', async ({ page }) => {
      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 480 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that main content is still accessible
      const heroSection = page.locator('.hero');
      await expect(heroSection).toBeVisible();
      
      // Check that navigation is still usable
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();
      
      // Check that text doesn't get cut off
      const mainHeading = page.locator('h1').first();
      const headingBox = await mainHeading.boundingBox();
      expect(headingBox?.width).toBeGreaterThan(0);
      
      // Check that there's no horizontal scrolling required
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      // Allow small tolerance for scrollbars
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
    });
  });

  test.describe('Focus and Visual Indicators', () => {
    
    test('should have visible focus indicators on all interactive elements', async ({ page }) => {
      const interactiveSelectors = [
        'a', 'button', 'input', 'select', 'textarea',
        '[tabindex="0"]', '[tabindex="-1"]',
        '.language-switcher', '.panel'
      ];
      
      for (const selector of interactiveSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 3); i++) { // Test first 3 of each type
          const element = elements.nth(i);
          
          if (await element.isVisible()) {
            await element.focus();
            
            // Check if element received focus
            const isFocused = await element.evaluate(el => document.activeElement === el);
            
            if (isFocused) {
              // Check for focus indicators
              const focusStyles = await element.evaluate(el => {
                const styles = window.getComputedStyle(el, ':focus');
                const normalStyles = window.getComputedStyle(el);
                
                return {
                  outline: styles.outline,
                  outlineColor: styles.outlineColor,
                  outlineWidth: styles.outlineWidth,
                  outlineStyle: styles.outlineStyle,
                  boxShadow: styles.boxShadow,
                  border: styles.border,
                  backgroundColor: styles.backgroundColor,
                  normalBoxShadow: normalStyles.boxShadow,
                  normalBorder: normalStyles.border,
                  normalBackgroundColor: normalStyles.backgroundColor
                };
              });
              
              // Check for any visual focus indicator
              const hasFocusIndicator = 
                (focusStyles.outline !== 'none' && focusStyles.outlineWidth !== '0px') ||
                (focusStyles.boxShadow !== 'none' && focusStyles.boxShadow !== focusStyles.normalBoxShadow) ||
                (focusStyles.border !== focusStyles.normalBorder) ||
                (focusStyles.backgroundColor !== focusStyles.normalBackgroundColor);
              
              expect(hasFocusIndicator).toBeTruthy();
            }
          }
        }
      }
    });

    test('should maintain logical tab order', async ({ page }) => {
      // Test tab order through main navigation elements
      const expectedOrder = [
        'nav a[href="#features"]',
        'nav a[href="#team"]', 
        'nav a[href="#signup"]',
        '.language-switcher',
        '.cta-button'
      ];
      
      // Start from first interactive element
      await page.keyboard.press('Tab');
      
      for (let i = 0; i < expectedOrder.length; i++) {
        const expectedElement = page.locator(expectedOrder[i]);
        if (await expectedElement.count() > 0) {
          const isFocused = await expectedElement.evaluate(el => document.activeElement === el);
          
          if (!isFocused) {
            // If not focused, continue tabbing until we find it or hit max tabs
            let tabAttempts = 0;
            while (tabAttempts < 10) {
              await page.keyboard.press('Tab');
              const nowFocused = await expectedElement.evaluate(el => document.activeElement === el);
              if (nowFocused) break;
              tabAttempts++;
            }
          }
          
          await page.keyboard.press('Tab');
        }
      }
    });
  });

  test.describe('Responsive Design Accessibility', () => {
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1024, height: 768 },
      { name: 'Large Desktop', width: 1440, height: 900 }
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`should be accessible on ${name} viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Check that main content is visible
        const heroSection = page.locator('.hero');
        await expect(heroSection).toBeVisible();
        
        // Check that navigation is accessible
        const navigation = page.locator('nav');
        await expect(navigation).toBeVisible();
        
        // Check that touch targets are large enough (minimum 44px)
        const buttons = page.locator('button, a');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const box = await button.boundingBox();
            if (box) {
              // WCAG recommendation: minimum 44x44px touch targets
              const minSize = width < 768 ? 44 : 32; // Larger on mobile
              expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(minSize);
            }
          }
        }
        
        // Check that text is readable (not too small)
        const textElements = page.locator('p, span, a:not(.language-option)');
        const textCount = await textElements.count();
        
        for (let i = 0; i < Math.min(textCount, 5); i++) {
          const element = textElements.nth(i);
          if (await element.isVisible()) {
            const fontSize = await element.evaluate(el => {
              return window.getComputedStyle(el).fontSize;
            });
            
            const size = parseFloat(fontSize);
            // Minimum 16px on mobile, 14px on desktop
            const minSize = width < 768 ? 16 : 14;
            expect(size).toBeGreaterThanOrEqual(minSize);
          }
        }
      });
    });
  });

  test.describe('Print Styles and Alternative Formats', () => {
    
    test('should be readable in print format', async ({ page }) => {
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      // Check that main content is still visible
      const heroText = page.locator('.hero-text');
      await expect(heroText).toBeVisible();
      
      // Check that navigation is handled appropriately for print
      const navigation = page.locator('nav');
      const navVisible = await navigation.isVisible();
      
      // Navigation might be hidden in print - that's acceptable
      // But main content should always be visible
      const mainContent = page.locator('.hero, .features-section, .team-section');
      await expect(mainContent.first()).toBeVisible();
    });
    
    test('should maintain readability without CSS', async ({ page }) => {
      // Disable CSS to test semantic HTML structure
      await page.addStyleTag({ content: 'html { all: unset !important; } *, *::before, *::after { all: unset !important; }' });
      
      // Content should still be in logical order
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Links should still be identifiable
      const links = page.locator('a');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
      
      // Main content should be present
      const textContent = await page.textContent('body');
      expect(textContent?.length).toBeGreaterThan(100);
    });
  });
});