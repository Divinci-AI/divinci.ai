const { test, expect } = require('@playwright/test');

test.describe('Test Orbit1 Keyframe Fix', () => {
  test('should verify orbit1 keyframe works and first group animates', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Test the renamed orbit1 keyframe with a simple element
    await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.id = 'orbit1-test';
      testElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50px;
        height: 50px;
        background-color: lime;
        border-radius: 50%;
        z-index: 9999;
        animation: orbit1 5s linear infinite;
      `;
      testElement.textContent = 'TEST';
      document.body.appendChild(testElement);
    });
    
    await page.waitForTimeout(1000);
    
    // Test the test element
    const testElement = page.locator('#orbit1-test');
    const testInitialPos = await testElement.boundingBox();
    
    console.log('🟢 Orbit1 test element initial position:', testInitialPos);
    
    const testStyles = await testElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform
      };
    });
    
    console.log('🟢 Orbit1 test element styles:', testStyles);
    
    await page.waitForTimeout(3000);
    
    const testNewPos = await testElement.boundingBox();
    console.log('🟢 Orbit1 test element position after 3s:', testNewPos);
    
    const testMovement = Math.sqrt(
      Math.pow(testNewPos.x - testInitialPos.x, 2) + 
      Math.pow(testNewPos.y - testInitialPos.y, 2)
    );
    
    console.log('🟢 Orbit1 test element movement:', testMovement, 'pixels');
    const isOrbit1Working = testMovement > 10;
    console.log('🟢 Orbit1 keyframe working:', isOrbit1Working);
    
    // Now test the first group
    const firstCircle = page.locator('.geometry-group .circle').first();
    const firstInitialPos = await firstCircle.boundingBox();
    
    console.log('🔵 First group initial position:', firstInitialPos);
    
    const firstStyles = await firstCircle.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform
      };
    });
    
    console.log('🔵 First group styles:', firstStyles);
    
    await page.waitForTimeout(5000);
    
    const firstNewPos = await firstCircle.boundingBox();
    console.log('🔵 First group position after 5s:', firstNewPos);
    
    const firstMovement = Math.sqrt(
      Math.pow(firstNewPos.x - firstInitialPos.x, 2) + 
      Math.pow(firstNewPos.y - firstInitialPos.y, 2)
    );
    
    console.log('🔵 First group movement:', firstMovement, 'pixels');
    const isFirstGroupAnimating = firstMovement > 10;
    console.log('🔵 First group animating:', isFirstGroupAnimating);
    
    // Test all three groups
    const groups = [
      { selector: '.geometry-group', name: 'First Group' },
      { selector: '.geometry-group-outer1', name: 'Outer1 Group' },
      { selector: '.geometry-group-outer2', name: 'Outer2 Group' }
    ];
    
    console.log('\n🎬 Testing all groups:');
    const results = [];
    
    for (const group of groups) {
      const circle = page.locator(`${group.selector} .circle`).first();
      const initialPos = await circle.boundingBox();
      
      await page.waitForTimeout(3000);
      
      const newPos = await circle.boundingBox();
      const movement = Math.sqrt(
        Math.pow(newPos.x - initialPos.x, 2) + 
        Math.pow(newPos.y - initialPos.y, 2)
      );
      
      const isAnimating = movement > 10;
      results.push({ name: group.name, movement, isAnimating });
      
      console.log(`  ${group.name}: ${movement.toFixed(2)}px movement, animating: ${isAnimating}`);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/orbit1-fix-test.png',
      fullPage: true 
    });
    
    const allAnimating = results.every(r => r.isAnimating);
    console.log(`\n🎯 All groups animating: ${allAnimating}`);
    
    // The test should pass if orbit1 works and first group animates
    expect(isOrbit1Working).toBe(true);
    expect(isFirstGroupAnimating).toBe(true);
    expect(allAnimating).toBe(true);
  });
});
