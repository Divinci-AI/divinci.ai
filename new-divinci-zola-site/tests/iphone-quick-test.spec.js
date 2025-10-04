const { test, expect, devices } = require('@playwright/test');

test.describe('iPhone 12 Pro Homepage Quick Analysis', () => {
  test.use({ ...devices['iPhone 12 Pro'] });

  test('iPhone 12 Pro homepage issues analysis', async ({ page }) => {
    // Navigate to live site
    await page.goto('https://divinci.ai/');
    await page.waitForLoadState('networkidle');
    
    console.log('📱 Testing iPhone 12 Pro (390x844) homepage...');
    
    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        bodyOffsetWidth: document.body.offsetWidth
      };
    });
    
    console.log('📏 Width Analysis:', bodyWidth);
    
    // Find elements that are wider than viewport
    const wideElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const problematic = [];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        if (rect.width > window.innerWidth + 5) {
          problematic.push({
            tag: el.tagName,
            class: el.className || 'no-class',
            id: el.id || 'no-id',
            width: Math.round(rect.width),
            viewportWidth: window.innerWidth,
            overflow: Math.round(rect.width - window.innerWidth),
            position: styles.position,
            left: styles.left,
            right: styles.right,
            margin: styles.margin,
            padding: styles.padding
          });
        }
      });
      
      return problematic.slice(0, 10);
    });
    
    console.log('🚨 Wide elements causing horizontal scroll:', wideElements);
    
    // Check font sizes for readability
    const fontIssues = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('p, span, div, a, li, h1, h2, h3, h4, h5, h6'));
      const small = [];
      
      textElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        const hasText = el.textContent && el.textContent.trim().length > 0;
        
        if (fontSize < 14 && hasText) {
          small.push({
            tag: el.tagName,
            class: el.className || 'no-class',
            fontSize: fontSize,
            text: el.textContent.substring(0, 50)
          });
        }
      });
      
      return small.slice(0, 5);
    });
    
    console.log('🔍 Small text elements (< 14px):', fontIssues);
    
    // Check touch targets
    const touchTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('button, a, input, [onclick], [role="button"]'));
      const small = [];
      
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          small.push({
            tag: el.tagName,
            class: el.className || 'no-class',
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: el.textContent?.substring(0, 30) || 'no-text'
          });
        }
      });
      
      return small.slice(0, 5);
    });
    
    console.log('👆 Small touch targets (< 44px):', touchTargets);
    
    // Take a screenshot of current state
    await expect(page).toHaveScreenshot('iphone-12-pro-homepage-current.png', {
      fullPage: true,
    });
    
    console.log('✅ Screenshot saved as iphone-12-pro-homepage-current.png');
    
    // Test key interactions
    try {
      // Try to find and test mobile menu
      const menuButton = page.locator('[class*="menu"], [class*="toggle"], [class*="hamburger"]').first();
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(500);
        console.log('📱 Mobile menu toggle tested');
      }
    } catch (e) {
      console.log('⚠️ Mobile menu test failed:', e.message);
    }
    
    // Report final status
    const hasHorizontalScroll = bodyWidth.bodyScrollWidth > bodyWidth.viewportWidth + 5;
    const hasSmallText = fontIssues.length > 0;
    const hasSmallTargets = touchTargets.length > 0;
    
    console.log('📊 Issue Summary:');
    console.log(`   Horizontal overflow: ${hasHorizontalScroll ? '❌ YES' : '✅ NO'}`);
    console.log(`   Small text: ${hasSmallText ? '❌ YES' : '✅ NO'}`);
    console.log(`   Small touch targets: ${hasSmallTargets ? '❌ YES' : '✅ NO'}`);
    
    // Assert key metrics
    expect(wideElements.length).toBeLessThan(3); // Should have minimal wide elements
  });
});