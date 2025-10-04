const { test, expect } = require('@playwright/test');

test.describe('Fix Circle Distribution in First Group', () => {
  test('should distribute circles around the orbit path with different starting angles', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Apply CSS to distribute the circles with different starting rotations
    await page.addStyleTag({
      content: `
        /* Distribute first group circles with different starting angles */
        .geometry-group .circle00 {
          animation: orbit1 15s linear infinite !important;
          animation-delay: 0s !important;
          transform: translate(-50%, -50%) rotate(0deg) translateX(350px) rotate(0deg) !important;
        }
        
        .geometry-group .circle01 {
          animation: orbit1 15s linear infinite !important;
          animation-delay: 0s !important;
          transform: translate(-50%, -50%) rotate(72deg) translateX(350px) rotate(-72deg) !important;
        }
        
        .geometry-group .circle02 {
          animation: orbit1 15s linear infinite !important;
          animation-delay: 0s !important;
          transform: translate(-50%, -50%) rotate(144deg) translateX(350px) rotate(-144deg) !important;
        }
        
        .geometry-group .circle03 {
          animation: orbit1 15s linear infinite !important;
          animation-delay: 0s !important;
          transform: translate(-50%, -50%) rotate(216deg) translateX(350px) rotate(-216deg) !important;
        }
        
        .geometry-group .circle04 {
          animation: orbit1 15s linear infinite !important;
          animation-delay: 0s !important;
          transform: translate(-50%, -50%) rotate(288deg) translateX(350px) rotate(-288deg) !important;
        }
      `
    });
    
    await page.waitForTimeout(2000);
    
    // Take screenshot after distribution fix
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/circle-distribution-fix.png',
      fullPage: true 
    });
    
    // Check that circles are now distributed
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
    const uniquePositions = new Set(positions.map(p => `${Math.round(p.x/10)*10},${Math.round(p.y/10)*10}`));
    const areDistributed = uniquePositions.size > 1;
    
    console.log(`🎯 Circles distributed: ${areDistributed} (${uniquePositions.size} unique positions)`);
    console.log('Unique positions:', Array.from(uniquePositions));
    
    // Wait and check if they're still animating
    await page.waitForTimeout(3000);
    
    const newPositions = [];
    for (let i = 0; i < circleCount; i++) {
      const circle = circles.nth(i);
      const pos = await circle.boundingBox();
      newPositions.push(pos);
    }
    
    // Check if any circles moved (animation still working)
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
    
    console.log(`🏃 Circles still animating: ${anyMoved}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/circle-distribution-fix-after-3s.png',
      fullPage: true 
    });
    
    expect(areDistributed).toBe(true);
    expect(anyMoved).toBe(true);
  });
  
  test('should verify all groups have proper circle distribution', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Apply the same distribution fix
    await page.addStyleTag({
      content: `
        .geometry-group .circle00 {
          animation: orbit1 15s linear infinite !important;
          transform: translate(-50%, -50%) rotate(0deg) translateX(350px) rotate(0deg) !important;
        }
        .geometry-group .circle01 {
          animation: orbit1 15s linear infinite !important;
          transform: translate(-50%, -50%) rotate(72deg) translateX(350px) rotate(-72deg) !important;
        }
        .geometry-group .circle02 {
          animation: orbit1 15s linear infinite !important;
          transform: translate(-50%, -50%) rotate(144deg) translateX(350px) rotate(-144deg) !important;
        }
        .geometry-group .circle03 {
          animation: orbit1 15s linear infinite !important;
          transform: translate(-50%, -50%) rotate(216deg) translateX(350px) rotate(-216deg) !important;
        }
        .geometry-group .circle04 {
          animation: orbit1 15s linear infinite !important;
          transform: translate(-50%, -50%) rotate(288deg) translateX(350px) rotate(-288deg) !important;
        }
      `
    });
    
    await page.waitForTimeout(2000);
    
    // Test all three groups for proper distribution
    const groups = [
      { selector: '.geometry-group', name: 'First Group' },
      { selector: '.geometry-group-outer1', name: 'Outer1 Group' },
      { selector: '.geometry-group-outer2', name: 'Outer2 Group' }
    ];
    
    for (const group of groups) {
      const circles = page.locator(`${group.selector} .circle`);
      const circleCount = await circles.count();
      
      console.log(`\n${group.name}: ${circleCount} circles`);
      
      const positions = [];
      for (let i = 0; i < circleCount; i++) {
        const circle = circles.nth(i);
        const pos = await circle.boundingBox();
        positions.push(pos);
      }
      
      // Check distribution
      const uniquePositions = new Set(positions.map(p => `${Math.round(p.x/10)*10},${Math.round(p.y/10)*10}`));
      const areDistributed = uniquePositions.size > 1;
      
      console.log(`  Distributed: ${areDistributed} (${uniquePositions.size} unique positions)`);
      
      expect(areDistributed).toBe(true);
    }
    
    // Take final comparison screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/all-groups-distributed.png',
      fullPage: true 
    });
  });
});
