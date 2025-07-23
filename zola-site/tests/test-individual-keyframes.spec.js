const { test, expect } = require('@playwright/test');

test.describe('Test Individual Keyframes for First Group', () => {
  test('should verify first group circles are distributed and animating with individual keyframes', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/individual-keyframes-initial.png',
      fullPage: true 
    });
    
    // Check that circles are distributed
    const circles = page.locator('.geometry-group .circle');
    const circleCount = await circles.count();
    
    console.log(`🔢 First group has ${circleCount} circles`);
    
    const initialPositions = [];
    for (let i = 0; i < circleCount; i++) {
      const circle = circles.nth(i);
      const pos = await circle.boundingBox();
      const styles = await circle.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          animation: computed.animation,
          transform: computed.transform
        };
      });
      
      initialPositions.push(pos);
      console.log(`Circle ${i}:`, pos);
      console.log(`  Animation: ${styles.animation}`);
      console.log(`  Transform: ${styles.transform}`);
    }
    
    // Check if circles are distributed (not all at the same position)
    const uniquePositions = new Set(initialPositions.map(p => `${Math.round(p.x/10)*10},${Math.round(p.y/10)*10}`));
    const areDistributed = uniquePositions.size > 1;
    
    console.log(`🎯 Circles distributed: ${areDistributed} (${uniquePositions.size} unique positions)`);
    console.log('Unique positions:', Array.from(uniquePositions));
    
    // Wait for animation
    await page.waitForTimeout(5000);
    
    // Take screenshot after animation
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/individual-keyframes-after-5s.png',
      fullPage: true 
    });
    
    const newPositions = [];
    for (let i = 0; i < circleCount; i++) {
      const circle = circles.nth(i);
      const pos = await circle.boundingBox();
      newPositions.push(pos);
      console.log(`Circle ${i} after 5s:`, pos);
    }
    
    // Check if any circles moved (animation working)
    let anyMoved = false;
    let totalMovement = 0;
    for (let i = 0; i < circleCount; i++) {
      const movement = Math.sqrt(
        Math.pow(newPositions[i].x - initialPositions[i].x, 2) + 
        Math.pow(newPositions[i].y - initialPositions[i].y, 2)
      );
      totalMovement += movement;
      if (movement > 5) {
        anyMoved = true;
        console.log(`Circle ${i} moved ${movement.toFixed(2)}px`);
      }
    }
    
    console.log(`🏃 Circles animating: ${anyMoved}`);
    console.log(`📊 Total movement: ${totalMovement.toFixed(2)}px`);
    
    // Test all three groups for comparison
    console.log('\n🎬 Testing all groups:');
    const groups = [
      { selector: '.geometry-group', name: 'First Group' },
      { selector: '.geometry-group-outer1', name: 'Outer1 Group' },
      { selector: '.geometry-group-outer2', name: 'Outer2 Group' }
    ];
    
    const results = [];
    
    for (const group of groups) {
      const groupCircles = page.locator(`${group.selector} .circle`);
      const groupCircleCount = await groupCircles.count();
      
      if (groupCircleCount === 0) {
        console.log(`  ${group.name}: No circles found`);
        continue;
      }
      
      const firstCircle = groupCircles.first();
      const groupInitialPos = await firstCircle.boundingBox();
      
      await page.waitForTimeout(3000);
      
      const groupNewPos = await firstCircle.boundingBox();
      const groupMovement = Math.sqrt(
        Math.pow(groupNewPos.x - groupInitialPos.x, 2) + 
        Math.pow(groupNewPos.y - groupInitialPos.y, 2)
      );
      
      const isGroupAnimating = groupMovement > 10;
      results.push({ name: group.name, movement: groupMovement, isAnimating: isGroupAnimating });
      
      console.log(`  ${group.name}: ${groupMovement.toFixed(2)}px movement, animating: ${isGroupAnimating}`);
    }
    
    const allAnimating = results.every(r => r.isAnimating);
    console.log(`\n🎯 All groups animating: ${allAnimating}`);
    
    expect(areDistributed).toBe(true);
    expect(anyMoved).toBe(true);
    expect(allAnimating).toBe(true);
  });
  
  test('should verify circles maintain distribution while animating', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Sample positions at different times to ensure they stay distributed
    const circles = page.locator('.geometry-group .circle');
    const circleCount = await circles.count();
    
    const timePoints = [0, 2000, 4000, 6000]; // Sample at 0s, 2s, 4s, 6s
    const allTimePositions = [];
    
    for (const timePoint of timePoints) {
      if (timePoint > 0) {
        await page.waitForTimeout(timePoint - (allTimePositions.length > 0 ? timePoints[allTimePositions.length - 1] : 0));
      }
      
      const positions = [];
      for (let i = 0; i < circleCount; i++) {
        const circle = circles.nth(i);
        const pos = await circle.boundingBox();
        positions.push(pos);
      }
      
      allTimePositions.push(positions);
      
      // Check distribution at this time point
      const uniquePositions = new Set(positions.map(p => `${Math.round(p.x/20)*20},${Math.round(p.y/20)*20}`));
      const areDistributed = uniquePositions.size > 1;
      
      console.log(`Time ${timePoint}ms: ${uniquePositions.size} unique positions, distributed: ${areDistributed}`);
      
      expect(areDistributed).toBe(true);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/individual-keyframes-final.png',
      fullPage: true 
    });
    
    console.log('✅ Circles maintain distribution throughout animation');
  });
});
