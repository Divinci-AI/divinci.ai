const { test, expect } = require('@playwright/test');

test.describe('Orbit Size Comparison', () => {
  test('should verify all three groups have similar orbit sizes', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot to visually compare orbit sizes
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/orbit-size-comparison.png',
      fullPage: true 
    });
    
    // Measure the orbit radius of each group by finding the distance from center to circles
    const groups = [
      { selector: '.geometry-group', name: 'First Group' },
      { selector: '.geometry-group-outer1', name: 'Outer1 Group' },
      { selector: '.geometry-group-outer2', name: 'Outer2 Group' }
    ];
    
    // Get the center of the page (where the robot is)
    const centerX = 650; // Approximate center
    const centerY = 544; // Approximate center
    
    const orbitRadii = [];
    
    for (const group of groups) {
      const circles = page.locator(`${group.selector} .circle`);
      const circleCount = await circles.count();
      
      if (circleCount === 0) {
        console.log(`  ${group.name}: No circles found`);
        continue;
      }
      
      // Get positions of all circles in this group
      const positions = [];
      for (let i = 0; i < circleCount; i++) {
        const circle = circles.nth(i);
        const pos = await circle.boundingBox();
        const circleCenterX = pos.x + pos.width / 2;
        const circleCenterY = pos.y + pos.height / 2;
        
        // Calculate distance from page center to circle center
        const distance = Math.sqrt(
          Math.pow(circleCenterX - centerX, 2) + 
          Math.pow(circleCenterY - centerY, 2)
        );
        
        positions.push({ x: circleCenterX, y: circleCenterY, distance });
      }
      
      // Calculate average orbit radius for this group
      const avgRadius = positions.reduce((sum, pos) => sum + pos.distance, 0) / positions.length;
      orbitRadii.push({ name: group.name, radius: avgRadius, positions });
      
      console.log(`${group.name}:`);
      console.log(`  Average orbit radius: ${avgRadius.toFixed(2)}px`);
      console.log(`  Circle positions:`, positions.map(p => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)}) - ${p.distance.toFixed(0)}px`));
    }
    
    // Compare orbit radii - they should be relatively similar now
    console.log('\n🎯 Orbit Radius Comparison:');
    orbitRadii.forEach(group => {
      console.log(`  ${group.name}: ${group.radius.toFixed(2)}px`);
    });
    
    // Check that the first group's radius is now closer to the other groups
    if (orbitRadii.length >= 3) {
      const firstGroupRadius = orbitRadii[0].radius;
      const outer1Radius = orbitRadii[1].radius;
      const outer2Radius = orbitRadii[2].radius;
      
      // Calculate differences
      const diff1to2 = Math.abs(firstGroupRadius - outer1Radius);
      const diff1to3 = Math.abs(firstGroupRadius - outer2Radius);
      const diff2to3 = Math.abs(outer1Radius - outer2Radius);
      
      console.log('\n📏 Radius Differences:');
      console.log(`  First vs Outer1: ${diff1to2.toFixed(2)}px`);
      console.log(`  First vs Outer2: ${diff1to3.toFixed(2)}px`);
      console.log(`  Outer1 vs Outer2: ${diff2to3.toFixed(2)}px`);
      
      // The differences should be reasonable (less than 100px)
      expect(diff1to2).toBeLessThan(100);
      expect(diff1to3).toBeLessThan(100);
      expect(diff2to3).toBeLessThan(100);
      
      console.log('✅ All orbit radii are within reasonable range of each other');
    }
    
    // Wait a bit and take another screenshot to show animation
    await page.waitForTimeout(5000);
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/orbit-size-comparison-after-5s.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshots saved for visual comparison');
  });
  
  test('should verify orbit consistency over time', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Sample orbit radii at different times to ensure consistency
    const centerX = 650;
    const centerY = 544;
    const timePoints = [0, 3000, 6000]; // 0s, 3s, 6s
    
    for (const timePoint of timePoints) {
      if (timePoint > 0) {
        await page.waitForTimeout(3000);
      }
      
      console.log(`\n⏰ Time: ${timePoint/1000}s`);
      
      const circles = page.locator('.geometry-group .circle');
      const circleCount = await circles.count();
      
      const positions = [];
      for (let i = 0; i < circleCount; i++) {
        const circle = circles.nth(i);
        const pos = await circle.boundingBox();
        const circleCenterX = pos.x + pos.width / 2;
        const circleCenterY = pos.y + pos.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(circleCenterX - centerX, 2) + 
          Math.pow(circleCenterY - centerY, 2)
        );
        
        positions.push(distance);
      }
      
      const avgRadius = positions.reduce((sum, dist) => sum + dist, 0) / positions.length;
      const minRadius = Math.min(...positions);
      const maxRadius = Math.max(...positions);
      const radiusVariation = maxRadius - minRadius;
      
      console.log(`  Average radius: ${avgRadius.toFixed(2)}px`);
      console.log(`  Radius range: ${minRadius.toFixed(2)}px - ${maxRadius.toFixed(2)}px`);
      console.log(`  Variation: ${radiusVariation.toFixed(2)}px`);
      
      // The radius should be consistent (variation should be small)
      expect(radiusVariation).toBeLessThan(50); // Allow some variation due to animation timing
    }
    
    console.log('✅ Orbit radius remains consistent over time');
  });
});
