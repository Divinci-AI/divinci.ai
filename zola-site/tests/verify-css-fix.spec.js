const { test, expect } = require('@playwright/test');

test.describe('Verify CSS Fix for First Group Animation', () => {
  test('should verify first group is now animating after CSS fix', async ({ page }) => {
    // Navigate to the site with the CSS fix
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for animations to initialize
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-css-fix-initial.png',
      fullPage: true 
    });
    
    // Test all three groups
    const groups = [
      { selector: '.geometry-group', name: 'First Group', expected: true },
      { selector: '.geometry-group-outer1', name: 'Outer1 Group', expected: true },
      { selector: '.geometry-group-outer2', name: 'Outer2 Group', expected: true }
    ];
    
    const results = [];
    
    for (const group of groups) {
      const firstCircle = page.locator(`${group.selector} .circle`).first();
      
      // Check if the group exists and is visible
      const groupElement = page.locator(group.selector);
      const isGroupVisible = await groupElement.isVisible();
      
      if (!isGroupVisible) {
        console.log(`❌ ${group.name} is not visible`);
        results.push({ name: group.name, movement: 0, isAnimating: false, error: 'Group not visible' });
        continue;
      }
      
      // Get initial position
      const initialPos = await firstCircle.boundingBox();
      
      // Check computed styles
      const styles = await firstCircle.evaluate((el) => {
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
      
      console.log(`🎨 ${group.name} styles:`, styles);
      console.log(`📍 ${group.name} initial position:`, initialPos);
      
      // Wait for animation
      await page.waitForTimeout(5000);
      
      // Get new position
      const newPos = await firstCircle.boundingBox();
      console.log(`📍 ${group.name} position after 5s:`, newPos);
      
      // Calculate movement
      const movement = Math.sqrt(
        Math.pow(newPos.x - initialPos.x, 2) + 
        Math.pow(newPos.y - initialPos.y, 2)
      );
      
      const isAnimating = movement > 10;
      results.push({ name: group.name, movement, isAnimating });
      
      console.log(`${group.name}: movement=${movement.toFixed(2)}px, animating=${isAnimating}`);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-css-fix-after-5s.png',
      fullPage: true 
    });
    
    // Print summary
    console.log('\n🎬 Animation Summary:');
    results.forEach(r => {
      const status = r.isAnimating ? '✅' : '❌';
      console.log(`  ${status} ${r.name}: ${r.movement.toFixed(2)}px movement`);
    });
    
    // Check if first group is now animating
    const firstGroupResult = results.find(r => r.name === 'First Group');
    expect(firstGroupResult.isAnimating).toBe(true);
    
    // Verify all groups are animating
    const allAnimating = results.every(r => r.isAnimating);
    console.log(`\n🎯 All groups animating: ${allAnimating}`);
    expect(allAnimating).toBe(true);
  });
  
  test('should verify circles are properly distributed in orbit', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check that circles in the first group are not all stacked on top of each other
    const circles = page.locator('.geometry-group .circle');
    const circleCount = await circles.count();
    
    console.log(`🔢 First group has ${circleCount} circles`);
    
    const positions = [];
    for (let i = 0; i < circleCount; i++) {
      const circle = circles.nth(i);
      const pos = await circle.boundingBox();
      positions.push(pos);
      console.log(`Circle ${i} position:`, pos);
    }
    
    // Check if circles are distributed (not all at the same position)
    const uniquePositions = new Set(positions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
    const areDistributed = uniquePositions.size > 1;
    
    console.log(`🎯 Circles distributed: ${areDistributed} (${uniquePositions.size} unique positions)`);
    
    // Wait a bit and check again to see if they're moving
    await page.waitForTimeout(3000);
    
    const newPositions = [];
    for (let i = 0; i < circleCount; i++) {
      const circle = circles.nth(i);
      const pos = await circle.boundingBox();
      newPositions.push(pos);
    }
    
    // Check if any circles moved
    let anyMoved = false;
    for (let i = 0; i < circleCount; i++) {
      const movement = Math.sqrt(
        Math.pow(newPositions[i].x - positions[i].x, 2) + 
        Math.pow(newPositions[i].y - positions[i].y, 2)
      );
      if (movement > 5) {
        anyMoved = true;
        console.log(`Circle ${i} moved ${movement.toFixed(2)}px`);
      }
    }
    
    console.log(`🏃 Any circles moved: ${anyMoved}`);
    
    expect(areDistributed).toBe(true);
    expect(anyMoved).toBe(true);
  });
});
