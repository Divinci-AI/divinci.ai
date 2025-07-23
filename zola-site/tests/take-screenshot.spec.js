const { test, expect } = require('@playwright/test');

test.describe('Take Screenshot', () => {
  test('should take a screenshot of current state', async ({ page }) => {
    await page.goto('http://localhost:1111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'zola-site/tests/screenshots/current-orbit-state.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: current-orbit-state.png');
  });
});
