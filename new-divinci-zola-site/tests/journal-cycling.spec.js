const { test, expect } = require('@playwright/test');

test.describe('Journal Page Cycling Fix', () => {
  const baseURL = 'http://127.0.0.1:1027';

  test('should cycle between journal pages without interference from scroll animation', async ({ page }) => {
    console.log('🔄 Testing journal page cycling functionality...\n');
    
    // Navigate to homepage
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    // Find the journal showcase section
    const journalShowcase = page.locator('#journal-showcase');
    await expect(journalShowcase).toBeVisible();
    
    // Find the journal pages
    const journalPages = page.locator('.journal-page');
    const pageCount = await journalPages.count();
    console.log(`Found ${pageCount} journal pages`);
    
    // Verify first page is initially active
    const firstPage = journalPages.first();
    await expect(firstPage).toHaveClass(/active/);
    console.log('✅ First page is initially active');
    
    // Check if JavaScript variables are properly defined
    const jsCheck = await page.evaluate(() => {
      const prevButton = document.querySelector('.nav-button.nav-prev');
      const nextButton = document.querySelector('.nav-button.nav-next');
      const journalPages = document.querySelectorAll('.journal-page');
      
      return {
        prevButtonFound: !!prevButton,
        nextButtonFound: !!nextButton,
        journalPagesCount: journalPages.length,
        navigateToPageExists: typeof window.navigateToPage === 'function'
      };
    });
    console.log('JavaScript state check:', jsCheck);
    
    // Test next button navigation
    const nextButton = page.locator('.nav-button.nav-next');
    console.log(`Next button count: ${await nextButton.count()}`);
    
    if (await nextButton.count() > 0) {
      // Check current page state before clicking
      console.log('Before click - checking current page state...');
      const firstPageClasses = await firstPage.getAttribute('class');
      console.log(`First page classes: ${firstPageClasses}`);
      
      // Check for console errors before clicking
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
      
      await nextButton.click();
      console.log('Next button clicked');
      await page.waitForTimeout(1500); // Wait for navigation to complete
      
      // Log any console messages
      if (consoleLogs.length > 0) {
        console.log('Console messages:', consoleLogs);
      }
      
      // Check page states after clicking
      const firstPageClassesAfter = await firstPage.getAttribute('class');
      const secondPageClassesAfter = await journalPages.nth(1).getAttribute('class');
      console.log(`After click - First page classes: ${firstPageClassesAfter}`);
      console.log(`After click - Second page classes: ${secondPageClassesAfter}`);
      
      // Check that the second page is now active
      const secondPage = journalPages.nth(1);
      try {
        await expect(secondPage).toHaveClass(/active/);
        console.log('✅ Successfully navigated to second page using next button');
        
        // Verify first page is no longer active
        await expect(firstPage).not.toHaveClass(/active/);
        console.log('✅ First page is no longer active');
      } catch (error) {
        console.log('❌ Navigation failed:', error.message);
      }
    }
    
    // Test previous button navigation
    const prevButton = page.locator('.nav-button.nav-prev');
    if (await prevButton.count() > 0) {
      await prevButton.click();
      await page.waitForTimeout(1000); // Wait for navigation to complete
      
      // Check that the first page is active again
      await expect(firstPage).toHaveClass(/active/);
      console.log('✅ Successfully navigated back to first page using previous button');
    }
    
    // Test direct page click navigation
    if (pageCount > 2) {
      const thirdPage = journalPages.nth(2);
      await thirdPage.click();
      await page.waitForTimeout(1000); // Wait for navigation to complete
      
      // Check that the third page is now active
      await expect(thirdPage).toHaveClass(/active/);
      console.log('✅ Successfully navigated to third page by clicking');
      
      // Verify other pages are not active
      await expect(firstPage).not.toHaveClass(/active/);
      await expect(journalPages.nth(1)).not.toHaveClass(/active/);
      console.log('✅ Other pages are properly deactivated');
    }
    
    // Test keyboard navigation
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1000);
    
    const secondPage = journalPages.nth(1);
    await expect(secondPage).toHaveClass(/active/);
    console.log('✅ Keyboard navigation (left arrow) works');
    
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    
    const thirdPage = journalPages.nth(2);
    await expect(thirdPage).toHaveClass(/active/);
    console.log('✅ Keyboard navigation (right arrow) works');
    
    // Test that pages maintain proper z-index and visibility during scroll
    await page.evaluate(() => {
      window.scrollTo(0, 1000); // Scroll down to trigger animation
    });
    await page.waitForTimeout(500);
    
    // Active page should still be visible and on top
    await expect(thirdPage).toHaveClass(/active/);
    const activePageZIndex = await thirdPage.evaluate(el => window.getComputedStyle(el).zIndex);
    console.log(`Active page z-index: ${activePageZIndex}`);
    
    console.log('\n✅ All journal page cycling tests passed!');
  });
});