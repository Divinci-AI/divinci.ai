const { test, expect } = require('@playwright/test');

test.describe('Debug Keyframe Animation', () => {
  test('should test if orbit keyframe works with a simple test element', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Inject a test element to verify the orbit keyframe works
    await page.evaluate(() => {
      // Create a test element
      const testElement = document.createElement('div');
      testElement.id = 'orbit-test';
      testElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50px;
        height: 50px;
        background-color: red;
        border-radius: 50%;
        z-index: 9999;
        animation: orbit 5s linear infinite;
      `;
      testElement.textContent = 'TEST';
      document.body.appendChild(testElement);
    });
    
    await page.waitForTimeout(1000);
    
    // Test the test element
    const testElement = page.locator('#orbit-test');
    const initialPos = await testElement.boundingBox();
    
    console.log('🔴 Test element initial position:', initialPos);
    
    const testStyles = await testElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        position: computed.position
      };
    });
    
    console.log('🔴 Test element styles:', testStyles);
    
    await page.waitForTimeout(3000);
    
    const newPos = await testElement.boundingBox();
    console.log('🔴 Test element position after 3s:', newPos);
    
    const movement = Math.sqrt(
      Math.pow(newPos.x - initialPos.x, 2) + 
      Math.pow(newPos.y - initialPos.y, 2)
    );
    
    console.log('🔴 Test element movement:', movement, 'pixels');
    
    const isTestAnimating = movement > 10;
    console.log('🔴 Test element animating:', isTestAnimating);
    
    // If the test element works, the keyframe is fine
    if (isTestAnimating) {
      console.log('✅ Orbit keyframe works - issue is with the first group specifically');
    } else {
      console.log('❌ Orbit keyframe itself has issues');
    }
    
    // Now test what happens if we apply the same animation to the first group circles directly
    await page.evaluate(() => {
      const firstGroupCircles = document.querySelectorAll('.geometry-group .circle');
      firstGroupCircles.forEach((circle, index) => {
        // Remove any existing styles that might conflict
        circle.style.cssText = `
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          width: 77px !important;
          height: 77px !important;
          border-radius: 50% !important;
          animation: orbit 5s linear infinite !important;
          animation-delay: ${index * 0.5}s !important;
          z-index: 10 !important;
        `;
      });
    });
    
    await page.waitForTimeout(1000);
    
    // Test first group after direct styling
    const firstCircle = page.locator('.geometry-group .circle').first();
    const directInitialPos = await firstCircle.boundingBox();
    
    console.log('🟢 First group circle (direct style) initial position:', directInitialPos);
    
    const directStyles = await firstCircle.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        position: computed.position
      };
    });
    
    console.log('🟢 First group circle (direct style) styles:', directStyles);
    
    await page.waitForTimeout(3000);
    
    const directNewPos = await firstCircle.boundingBox();
    console.log('🟢 First group circle (direct style) position after 3s:', directNewPos);
    
    const directMovement = Math.sqrt(
      Math.pow(directNewPos.x - directInitialPos.x, 2) + 
      Math.pow(directNewPos.y - directInitialPos.y, 2)
    );
    
    console.log('🟢 First group circle (direct style) movement:', directMovement, 'pixels');
    
    const isDirectAnimating = directMovement > 10;
    console.log('🟢 First group circle (direct style) animating:', isDirectAnimating);
    
    // Take screenshot of the test
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/keyframe-debug-test.png',
      fullPage: true 
    });
    
    // The test should pass if either the test element or direct styling works
    expect(isTestAnimating || isDirectAnimating).toBe(true);
  });
});
