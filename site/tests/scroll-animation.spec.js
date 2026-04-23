const { test, expect } = require('@playwright/test');

test.describe('Journal Scroll Animation Test', () => {
  const baseURL = 'http://127.0.0.1:1027';

  test('should apply scroll-based fanning animation to journal pages', async ({ page }) => {
    console.log('🎬 Testing journal scroll animation functionality...\n');
    
    // Navigate to homepage
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    // Find the journal showcase section
    const journalShowcase = page.locator('#journal-showcase');
    await expect(journalShowcase).toBeVisible();
    
    // Scroll to top of page first to ensure we start from a known position
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Get initial transforms before scrolling (check both inline and computed styles)
    const initialTransforms = await page.evaluate(() => {
      const pages = document.querySelectorAll('.journal-page');
      return Array.from(pages).map((page, index) => ({
        index,
        inlineTransform: page.style.transform || 'none',
        computedTransform: window.getComputedStyle(page).transform,
        hasInlineTransform: page.style.transform !== '',
        hasClass: page.className
      }));
    });
    
    console.log('Initial page transforms:', initialTransforms);
    
    // Scroll down to the journal section to trigger animation
    await page.evaluate(() => {
      const journalShowcase = document.getElementById('journal-showcase');
      const rect = journalShowcase.getBoundingClientRect();
      const scrollTarget = window.scrollY + rect.top - 200; // Scroll a bit before the section
      window.scrollTo(0, scrollTarget);
    });
    
    await page.waitForTimeout(1000); // Wait for scroll animation to apply
    
    // Get transforms after scrolling into view
    const scrolledTransforms = await page.evaluate(() => {
      const pages = document.querySelectorAll('.journal-page');
      return Array.from(pages).map((page, index) => ({
        index,
        transform: page.style.transform || 'none',
        hasTransform: page.style.transform !== '',
        hasScrollAnimatedClass: page.parentElement?.classList.contains('scroll-animated') || false
      }));
    });
    
    console.log('Transforms after scrolling into view:', scrolledTransforms);
    
    // Scroll further past the section to trigger compacting animation
    await page.evaluate(() => {
      const journalShowcase = document.getElementById('journal-showcase');
      const rect = journalShowcase.getBoundingClientRect();
      const scrollTarget = window.scrollY + rect.bottom + 300; // Scroll past the section
      window.scrollTo(0, scrollTarget);
    });
    
    await page.waitForTimeout(1000); // Wait for scroll animation to apply
    
    // Get transforms after scrolling past
    const finalTransforms = await page.evaluate(() => {
      const pages = document.querySelectorAll('.journal-page');
      return Array.from(pages).map((page, index) => ({
        index,
        transform: page.style.transform || 'none',
        hasTransform: page.style.transform !== ''
      }));
    });
    
    console.log('Final transforms after scrolling past:', finalTransforms);
    
    // Verify that transforms were applied during scrolling
    const hasAnyTransforms = scrolledTransforms.some(page => page.hasTransform) || 
                           finalTransforms.some(page => page.hasTransform);
    
    if (hasAnyTransforms) {
      console.log('✅ Scroll animation is working - transforms detected');
    } else {
      console.log('❌ Scroll animation not working - no transforms detected');
      
      // Check if scroll event listeners are attached
      const listenerCheck = await page.evaluate(() => {
        // Try to trigger the scroll animation manually
        if (typeof updateJournalAnimation === 'function') {
          return 'updateJournalAnimation function exists';
        } else if (typeof window.updateJournalAnimation === 'function') {
          return 'window.updateJournalAnimation function exists';
        } else {
          return 'updateJournalAnimation function not found';
        }
      });
      
      console.log('Function check:', listenerCheck);
    }
    
    expect(hasAnyTransforms).toBe(true);
    console.log('\n✅ Journal scroll animation test completed!');
  });
});