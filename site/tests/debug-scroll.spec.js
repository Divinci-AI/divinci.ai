const { test, expect } = require('@playwright/test');

test.describe('Debug Scroll Animation', () => {
  const baseURL = 'http://127.0.0.1:1027';

  test('should show console logs during scroll to debug animation', async ({ page }) => {
    console.log('🔍 Debugging scroll animation...\n');
    
    // Listen to console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console: ${msg.text()}`);
    });
    
    // Navigate to homepage
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    // Check if journal section exists
    const journalShowcase = page.locator('#journal-showcase');
    await expect(journalShowcase).toBeVisible();
    console.log('✅ Journal section found');
    
    // Scroll to top first
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    console.log('📍 Scrolled to top');
    
    // Now slowly scroll down and watch for console logs
    for (let i = 0; i <= 10; i++) {
      const scrollY = i * 300; // Scroll in 300px increments
      await page.evaluate((scroll) => window.scrollTo(0, scroll), scrollY);
      await page.waitForTimeout(200);
      console.log(`📜 Scrolled to ${scrollY}px`);
    }
    
    // Check final state
    const finalTransforms = await page.evaluate(() => {
      const pages = document.querySelectorAll('.journal-page');
      const stack = document.getElementById('journal-stack');
      return {
        hasScrollAnimatedClass: stack ? stack.classList.contains('scroll-animated') : false,
        pageCount: pages.length,
        transforms: Array.from(pages).slice(0, 3).map((page, index) => ({
          index,
          hasInlineTransform: page.style.transform !== '',
          transform: page.style.transform || 'none'
        }))
      };
    });
    
    console.log('Final state:', finalTransforms);
    console.log('Total console messages:', logs.length);
    
    // Check if any scroll progress was logged
    const scrollLogs = logs.filter(log => log.includes('Scroll progress'));
    console.log(`Found ${scrollLogs.length} scroll progress logs`);
    
    if (scrollLogs.length > 0) {
      console.log('✅ Scroll animation is being triggered');
      console.log('Sample logs:', scrollLogs.slice(0, 5));
    } else {
      console.log('❌ No scroll animation detected');
    }
  });
});