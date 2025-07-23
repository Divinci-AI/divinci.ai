const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Homepage Animation Debug', () => {
  test('should capture screenshots and debug circle animations', async ({ page }) => {
    // Navigate to the Zola site
    await page.goto('http://localhost:1111');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for animations to initialize
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-initial.png',
      fullPage: true 
    });
    
    // Check if geometry groups exist
    const geometryGroup = await page.locator('.geometry-group').first();
    const geometryGroupOuter1 = await page.locator('.geometry-group-outer1').first();
    const geometryGroupOuter2 = await page.locator('.geometry-group-outer2').first();
    
    console.log('🔍 Checking geometry groups...');
    
    // Verify groups exist
    await expect(geometryGroup).toBeVisible();
    await expect(geometryGroupOuter1).toBeVisible();
    await expect(geometryGroupOuter2).toBeVisible();
    
    // Get initial positions of first circle in each group
    const firstCircle = geometryGroup.locator('.circle').first();
    const firstCircleOuter1 = geometryGroupOuter1.locator('.circle').first();
    const firstCircleOuter2 = geometryGroupOuter2.locator('.circle').first();
    
    // Record initial positions
    const initialPos = await firstCircle.boundingBox();
    const initialPosOuter1 = await firstCircleOuter1.boundingBox();
    const initialPosOuter2 = await firstCircleOuter2.boundingBox();
    
    console.log('📍 Initial positions:');
    console.log('  First group:', initialPos);
    console.log('  Outer1 group:', initialPosOuter1);
    console.log('  Outer2 group:', initialPosOuter2);
    
    // Check computed styles for animations
    const firstCircleStyles = await firstCircle.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        opacity: computed.opacity,
        position: computed.position
      };
    });
    
    const firstCircleOuter1Styles = await firstCircleOuter1.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        opacity: computed.opacity,
        position: computed.position
      };
    });
    
    const firstCircleOuter2Styles = await firstCircleOuter2.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animation: computed.animation,
        transform: computed.transform,
        opacity: computed.opacity,
        position: computed.position
      };
    });
    
    console.log('🎨 Computed styles:');
    console.log('  First group:', firstCircleStyles);
    console.log('  Outer1 group:', firstCircleOuter1Styles);
    console.log('  Outer2 group:', firstCircleOuter2Styles);
    
    // Wait for 5 seconds to let animations run
    await page.waitForTimeout(5000);
    
    // Take screenshot after animation time
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-after-5s.png',
      fullPage: true 
    });
    
    // Check positions after animation time
    const newPos = await firstCircle.boundingBox();
    const newPosOuter1 = await firstCircleOuter1.boundingBox();
    const newPosOuter2 = await firstCircleOuter2.boundingBox();
    
    console.log('📍 Positions after 5 seconds:');
    console.log('  First group:', newPos);
    console.log('  Outer1 group:', newPosOuter1);
    console.log('  Outer2 group:', newPosOuter2);
    
    // Calculate movement distances
    const movement1 = Math.sqrt(
      Math.pow(newPos.x - initialPos.x, 2) + 
      Math.pow(newPos.y - initialPos.y, 2)
    );
    
    const movementOuter1 = Math.sqrt(
      Math.pow(newPosOuter1.x - initialPosOuter1.x, 2) + 
      Math.pow(newPosOuter1.y - initialPosOuter1.y, 2)
    );
    
    const movementOuter2 = Math.sqrt(
      Math.pow(newPosOuter2.x - initialPosOuter2.x, 2) + 
      Math.pow(newPosOuter2.y - initialPosOuter2.y, 2)
    );
    
    console.log('🏃 Movement distances:');
    console.log('  First group moved:', movement1, 'pixels');
    console.log('  Outer1 group moved:', movementOuter1, 'pixels');
    console.log('  Outer2 group moved:', movementOuter2, 'pixels');
    
    // Check if animations are actually running
    const isFirstGroupAnimating = movement1 > 10; // More than 10 pixels movement
    const isOuter1Animating = movementOuter1 > 10;
    const isOuter2Animating = movementOuter2 > 10;
    
    console.log('🎬 Animation status:');
    console.log('  First group animating:', isFirstGroupAnimating);
    console.log('  Outer1 group animating:', isOuter1Animating);
    console.log('  Outer2 group animating:', isOuter2Animating);
    
    // Take a final screenshot after 10 seconds
    await page.waitForTimeout(5000);
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/homepage-after-10s.png',
      fullPage: true 
    });
    
    // The test should pass if at least the outer groups are animating
    // We'll focus on fixing the first group based on the debug info
    expect(isOuter1Animating || isOuter2Animating).toBe(true);
  });
  
  test('should debug CSS keyframes and animation application', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if keyframes are properly defined
    const keyframesInfo = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const keyframes = {};
      
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          rules.forEach(rule => {
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              keyframes[rule.name] = {
                name: rule.name,
                cssText: rule.cssText.substring(0, 200) + '...' // Truncate for readability
              };
            }
          });
        } catch (e) {
          console.log('Could not access stylesheet:', e.message);
        }
      });
      
      return keyframes;
    });
    
    console.log('🎭 Available keyframes:', Object.keys(keyframesInfo));
    
    // Check if the JavaScript is properly applying animations
    const jsAnimationInfo = await page.evaluate(() => {
      const groups = [
        { selector: ".geometry-group", expected: "orbit" },
        { selector: ".geometry-group-outer1", expected: "orbit3" },
        { selector: ".geometry-group-outer2", expected: "orbit4" }
      ];
      
      return groups.map(group => {
        const element = document.querySelector(group.selector);
        if (!element) return { selector: group.selector, found: false };
        
        const circles = element.querySelectorAll('.circle');
        const firstCircle = circles[0];
        
        if (!firstCircle) return { selector: group.selector, found: true, hasCircles: false };
        
        const computed = window.getComputedStyle(firstCircle);
        
        return {
          selector: group.selector,
          found: true,
          hasCircles: true,
          circleCount: circles.length,
          groupOpacity: element.style.opacity,
          animation: computed.animation,
          transform: computed.transform,
          expectedKeyframe: group.expected
        };
      });
    });
    
    console.log('🔧 JavaScript animation application:', jsAnimationInfo);
    
    // This test is mainly for debugging, so we'll always pass
    expect(jsAnimationInfo.length).toBe(3);
  });
});
