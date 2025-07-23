const { test, expect } = require('@playwright/test');

test.describe('Fix First Group Animation', () => {
  test('should fix the first geometry group animation by removing conflicting CSS', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Inject CSS to fix the animation conflict
    await page.addStyleTag({
      content: `
        /* Remove the conflicting static transform for the first group */
        .geometry-group .circle {
          /* Remove the static transform that conflicts with animation */
          transform: none !important;
          /* Keep animation-fill-mode and opacity */
          animation-fill-mode: both;
          opacity: 1;
        }
        
        /* Ensure the animation keyframe takes precedence */
        .geometry-group .circle {
          animation: orbit 15s linear infinite !important;
        }
      `
    });
    
    // Wait for the fix to take effect
    await page.waitForTimeout(1000);
    
    // Take screenshot after fix
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-after-fix.png',
      fullPage: true 
    });
    
    // Get initial position of first circle in first group
    const firstCircle = page.locator('.geometry-group .circle').first();
    const initialPos = await firstCircle.boundingBox();
    
    console.log('📍 Initial position after fix:', initialPos);
    
    // Check computed styles after fix
    const stylesAfterFix = await firstCircle.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        opacity: computed.opacity,
        position: computed.position
      };
    });
    
    console.log('🎨 Styles after fix:', stylesAfterFix);
    
    // Wait 5 seconds to see movement
    await page.waitForTimeout(5000);
    
    // Check position after animation time
    const newPos = await firstCircle.boundingBox();
    console.log('📍 Position after 5 seconds:', newPos);
    
    // Calculate movement
    const movement = Math.sqrt(
      Math.pow(newPos.x - initialPos.x, 2) + 
      Math.pow(newPos.y - initialPos.y, 2)
    );
    
    console.log('🏃 Movement distance after fix:', movement, 'pixels');
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-fixed-after-5s.png',
      fullPage: true 
    });
    
    // The first group should now be animating
    const isAnimating = movement > 10;
    console.log('🎬 First group animating after fix:', isAnimating);
    
    expect(isAnimating).toBe(true);
  });
  
  test('should test alternative fix using CSS specificity', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Alternative fix: Use higher specificity to override the static transform
    await page.addStyleTag({
      content: `
        /* Use higher specificity to override the static transform */
        .hero .geometry-group .circle {
          /* Let the animation handle the transform */
          transform: unset !important;
        }
        
        /* Ensure the orbit animation is applied with high specificity */
        .hero .geometry-group .circle {
          animation: orbit 15s linear infinite !important;
          animation-fill-mode: both !important;
        }
      `
    });
    
    await page.waitForTimeout(1000);
    
    // Test movement
    const firstCircle = page.locator('.geometry-group .circle').first();
    const initialPos = await firstCircle.boundingBox();
    
    await page.waitForTimeout(5000);
    
    const newPos = await firstCircle.boundingBox();
    const movement = Math.sqrt(
      Math.pow(newPos.x - initialPos.x, 2) + 
      Math.pow(newPos.y - initialPos.y, 2)
    );
    
    console.log('🔧 Alternative fix movement:', movement, 'pixels');
    
    const isAnimating = movement > 10;
    expect(isAnimating).toBe(true);
  });
});
