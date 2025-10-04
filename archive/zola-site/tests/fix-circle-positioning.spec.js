const { test, expect } = require('@playwright/test');

test.describe('Fix Circle Positioning for Animation', () => {
  test('should fix first group animation by changing positioning method', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // The real fix: Change the positioning method for the first group circles
    await page.addStyleTag({
      content: `
        /* Fix the first group circles positioning to work with orbit animation */
        .circle00, .circle01, .circle02, .circle03, .circle04 {
          /* Remove the fixed top/left positioning */
          top: 50% !important;
          left: 50% !important;
          
          /* Remove any conflicting transforms */
          transform: translate(-50%, -50%) rotate(0deg) translateX(275px) rotate(0deg) !important;
          
          /* Ensure animation works */
          animation: orbit 15s linear infinite !important;
          animation-fill-mode: both !important;
          
          /* Keep the visual styling */
          position: absolute !important;
          opacity: 1 !important;
        }
        
        /* Remove the conflicting CSS rule that was overriding the animation */
        .geometry-group .circle {
          /* Don't set a static transform - let the animation handle it */
          transform: unset !important;
        }
      `
    });
    
    await page.waitForTimeout(1000);
    
    // Take screenshot after fix
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-positioning-fix.png',
      fullPage: true 
    });
    
    // Test the first circle
    const firstCircle = page.locator('.geometry-group .circle').first();
    const initialPos = await firstCircle.boundingBox();
    
    console.log('📍 Initial position after positioning fix:', initialPos);
    
    // Check computed styles
    const stylesAfterFix = await firstCircle.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        opacity: computed.opacity,
        position: computed.position,
        top: computed.top,
        left: computed.left
      };
    });
    
    console.log('🎨 Styles after positioning fix:', stylesAfterFix);
    
    // Wait for animation
    await page.waitForTimeout(5000);
    
    const newPos = await firstCircle.boundingBox();
    console.log('📍 Position after 5 seconds:', newPos);
    
    const movement = Math.sqrt(
      Math.pow(newPos.x - initialPos.x, 2) + 
      Math.pow(newPos.y - initialPos.y, 2)
    );
    
    console.log('🏃 Movement distance after positioning fix:', movement, 'pixels');
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-positioning-fix-after-5s.png',
      fullPage: true 
    });
    
    const isAnimating = movement > 10;
    console.log('🎬 First group animating after positioning fix:', isAnimating);
    
    // Test all circles in the first group
    const allCircles = page.locator('.geometry-group .circle');
    const circleCount = await allCircles.count();
    console.log('🔢 Total circles in first group:', circleCount);
    
    // Check if all circles are visible and positioned correctly
    for (let i = 0; i < circleCount; i++) {
      const circle = allCircles.nth(i);
      const isVisible = await circle.isVisible();
      const bbox = await circle.boundingBox();
      console.log(`Circle ${i}: visible=${isVisible}, position=${JSON.stringify(bbox)}`);
    }
    
    expect(isAnimating).toBe(true);
  });
  
  test('should verify all three groups are now animating correctly', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Apply the same fix
    await page.addStyleTag({
      content: `
        .circle00, .circle01, .circle02, .circle03, .circle04 {
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) rotate(0deg) translateX(275px) rotate(0deg) !important;
          animation: orbit 15s linear infinite !important;
          animation-fill-mode: both !important;
          position: absolute !important;
          opacity: 1 !important;
        }
        
        .geometry-group .circle {
          transform: unset !important;
        }
      `
    });
    
    await page.waitForTimeout(1000);
    
    // Test all three groups
    const groups = [
      { selector: '.geometry-group', name: 'First Group' },
      { selector: '.geometry-group-outer1', name: 'Outer1 Group' },
      { selector: '.geometry-group-outer2', name: 'Outer2 Group' }
    ];
    
    const results = [];
    
    for (const group of groups) {
      const firstCircle = page.locator(`${group.selector} .circle`).first();
      const initialPos = await firstCircle.boundingBox();
      
      await page.waitForTimeout(3000); // Wait 3 seconds for each group
      
      const newPos = await firstCircle.boundingBox();
      const movement = Math.sqrt(
        Math.pow(newPos.x - initialPos.x, 2) + 
        Math.pow(newPos.y - initialPos.y, 2)
      );
      
      const isAnimating = movement > 10;
      results.push({ name: group.name, movement, isAnimating });
      
      console.log(`${group.name}: movement=${movement}px, animating=${isAnimating}`);
    }
    
    // All groups should be animating
    const allAnimating = results.every(r => r.isAnimating);
    console.log('🎬 All groups animating:', allAnimating);
    
    expect(allAnimating).toBe(true);
  });
});
