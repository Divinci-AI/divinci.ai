const { test, expect, devices } = require('@playwright/test');

// iPhone 12 Pro specific testing
test.describe('iPhone 12 Pro Homepage Visual Testing', () => {
  test.use({ 
    ...devices['iPhone 12 Pro'],
    // iPhone 12 Pro specs: 390x844 viewport
  });

  test('Homepage visual regression test - iPhone 12 Pro', async ({ page }) => {
    // Navigate to homepage
    await page.goto('https://divinci.ai/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for any animations to complete
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('iphone-12-pro-homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Homepage sections analysis - iPhone 12 Pro', async ({ page }) => {
    await page.goto('https://divinci.ai/');
    await page.waitForLoadState('networkidle');
    
    // Test individual sections that commonly have mobile issues
    
    // 1. Header/Navigation
    const header = page.locator('header, .site-header, nav');
    if (await header.count() > 0) {
      await expect(header.first()).toHaveScreenshot('iphone-header.png');
    }
    
    // 2. Hero section
    const hero = page.locator('.hero, .hero-section, main section:first-child');
    if (await hero.count() > 0) {
      await expect(hero.first()).toHaveScreenshot('iphone-hero.png');
    }
    
    // 3. Features section
    const features = page.locator('.features, .features-section, [class*="feature"]').first();
    if (await features.count() > 0) {
      await expect(features).toHaveScreenshot('iphone-features.png');
    }
    
    // 4. Footer
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toHaveScreenshot('iphone-footer.png');
    }
  });

  test('Mobile interaction testing - iPhone 12 Pro', async ({ page }) => {
    await page.goto('https://divinci.ai/');
    await page.waitForLoadState('networkidle');
    
    // Test mobile menu (hamburger)
    const mobileMenuToggle = page.locator('[class*="menu-toggle"], [class*="hamburger"], .mobile-menu-btn');
    if (await mobileMenuToggle.count() > 0) {
      console.log('Found mobile menu toggle');
      await mobileMenuToggle.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('iphone-mobile-menu-open.png');
    }
    
    // Test scroll behavior
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('iphone-scroll-position.png');
  });

  test('Responsive layout checks - iPhone 12 Pro', async ({ page }) => {
    await page.goto('https://divinci.ai/');
    await page.waitForLoadState('networkidle');
    
    // Check for common mobile issues
    
    // 1. Horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    console.log(`Body width: ${bodyWidth}, Viewport width: ${viewportWidth}`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow 5px tolerance
    
    // 2. Check for elements wider than viewport
    const wideElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .filter(el => el.scrollWidth > window.innerWidth)
        .map(el => ({
          tag: el.tagName,
          class: el.className,
          width: el.scrollWidth,
          computed: window.getComputedStyle(el).width
        }))
        .slice(0, 10); // Limit to first 10 problematic elements
    });
    
    console.log('Wide elements detected:', wideElements);
    
    // 3. Check text readability (font sizes)
    const smallText = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('p, span, div, a, li'));
      return textElements
        .map(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          return {
            text: el.textContent?.substring(0, 50),
            fontSize: fontSize,
            element: el.tagName + (el.className ? '.' + el.className : '')
          };
        })
        .filter(item => item.fontSize < 14 && item.text && item.text.trim().length > 0)
        .slice(0, 5);
    });
    
    console.log('Small text elements:', smallText);
    
    // 4. Check button/link touch targets
    const smallTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, a, [onclick]'));
      return interactive
        .map(el => {
          const rect = el.getBoundingClientRect();
          return {
            element: el.tagName + (el.className ? '.' + el.className : ''),
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height
          };
        })
        .filter(item => item.width < 44 || item.height < 44) // Apple's minimum touch target
        .slice(0, 5);
    });
    
    console.log('Small touch targets:', smallTargets);
  });

  test('Performance and loading - iPhone 12 Pro', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://divinci.ai/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check for layout shift during load
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('iphone-final-layout.png');
    
    // Performance should be reasonable on mobile
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });
});