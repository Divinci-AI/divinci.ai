import { test, expect } from '@playwright/test';

/**
 * Mobile Accessibility Analysis
 * Specifically tests for text visibility issues and contrast problems on mobile
 */

test.describe('Mobile Accessibility Analysis', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13 size
    
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

  test('Mobile - Full Page Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot for analysis
    await expect(page).toHaveScreenshot('mobile-full-page-analysis.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Mobile - Footer Section Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to footer to find "AI for good" section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Take screenshot of footer area
    const footer = page.locator('footer, .site-footer, .footer');
    if (await footer.count() > 0) {
      await expect(footer.first()).toHaveScreenshot('mobile-footer-analysis.png');
    } else {
      // If no footer element, take bottom section screenshot
      await expect(page).toHaveScreenshot('mobile-bottom-section-analysis.png');
    }
  });

  test('Mobile - Text Contrast Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for potential contrast issues by examining text elements
    const textElements = await page.locator('h1, h2, h3, h4, h5, h6, p, span, div').all();
    
    // Take screenshots of sections that might have contrast issues
    const sections = [
      '.hero',
      '.features', 
      '#features',
      '.team',
      '#team',
      '.footer',
      'footer',
      '.ai-for-good',
      '[class*="ai"]',
      '[class*="good"]'
    ];
    
    for (const selector of sections) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        try {
          await expect(element.first()).toHaveScreenshot(`mobile-section-${selector.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
        } catch (error) {
          // Continue if element is not visible or screenshot fails
          console.log(`Could not screenshot ${selector}:`, error.message);
        }
      }
    }
  });

  test('Mobile - White on White Text Detection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Add highlighting to detect white/light text on white/light backgrounds
    await page.addStyleTag({
      content: `
        /* Highlight potential contrast issues */
        * {
          outline: 1px solid red !important;
        }
        
        /* Specifically highlight white/light text */
        [style*="color: white"],
        [style*="color: #fff"],
        [style*="color: #ffffff"],
        [style*="color: rgb(255"],
        .text-white,
        .white-text {
          background: red !important;
          outline: 3px solid blue !important;
        }
        
        /* Highlight light backgrounds */
        [style*="background: white"],
        [style*="background: #fff"],
        [style*="background: #ffffff"],
        [style*="background-color: white"],
        [style*="background-color: #fff"],
        [style*="background-color: #ffffff"] {
          outline: 3px solid green !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('mobile-contrast-detection.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Mobile - AI for Good Section Specific', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look specifically for "AI for good" text
    const aiForGoodElements = await page.locator('text=/AI.*for.*good/i').all();
    
    if (aiForGoodElements.length > 0) {
      console.log(`Found ${aiForGoodElements.length} "AI for good" elements`);
      
      for (let i = 0; i < aiForGoodElements.length; i++) {
        const element = aiForGoodElements[i];
        
        // Scroll element into view
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        
        // Take screenshot of the element and its container
        await expect(element).toHaveScreenshot(`mobile-ai-for-good-${i}.png`);
        
        // Also screenshot the parent container for context
        const parent = element.locator('..');
        await expect(parent).toHaveScreenshot(`mobile-ai-for-good-container-${i}.png`);
      }
    } else {
      console.log('No "AI for good" text found');
      
      // Search for similar text patterns
      const similarElements = await page.locator('text=/AI/i').all();
      console.log(`Found ${similarElements.length} elements containing "AI"`);
      
      if (similarElements.length > 0) {
        const firstAI = similarElements[0];
        await firstAI.scrollIntoViewIfNeeded();
        await expect(firstAI).toHaveScreenshot('mobile-ai-text-found.png');
      }
    }
  });

  test('Mobile - Computed Styles Analysis', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Analyze computed styles for contrast issues
    const contrastIssues = await page.evaluate(() => {
      const issues = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach((el, index) => {
        if (el.textContent && el.textContent.trim()) {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Check for potential white-on-white or light-on-light issues
          if (
            (color.includes('255, 255, 255') || color.includes('rgb(255, 255, 255)') || color === 'white') &&
            (backgroundColor.includes('255, 255, 255') || backgroundColor.includes('rgb(255, 255, 255)') || backgroundColor === 'white' || backgroundColor === 'rgba(0, 0, 0, 0)')
          ) {
            issues.push({
              index,
              text: el.textContent.trim().substring(0, 50),
              color,
              backgroundColor,
              tagName: el.tagName,
              className: el.className
            });
          }
        }
      });
      
      return issues;
    });
    
    console.log('Potential contrast issues found:', contrastIssues);
    
    // Take screenshot with issues highlighted
    if (contrastIssues.length > 0) {
      await page.addStyleTag({
        content: `
          /* Highlight elements with potential contrast issues */
          ${contrastIssues.map((issue, i) => `
            *:nth-child(${issue.index + 1}) {
              outline: 3px solid red !important;
              background: yellow !important;
            }
          `).join('\n')}
        `
      });
      
      await expect(page).toHaveScreenshot('mobile-contrast-issues-highlighted.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('Mobile - High Contrast Mode Test', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Apply high contrast styles to reveal hidden text
    await page.addStyleTag({
      content: `
        * {
          filter: contrast(200%) brightness(150%) !important;
        }
        
        /* Force all text to be visible */
        * {
          color: #000 !important;
          background-color: #fff !important;
        }
        
        /* Alternate high contrast */
        body {
          background: #000 !important;
        }
        
        * {
          color: #fff !important;
          text-shadow: 1px 1px 0 #000 !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('mobile-high-contrast-reveal.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
