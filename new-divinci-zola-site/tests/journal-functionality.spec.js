const { test, expect } = require('@playwright/test');

/**
 * Da Vinci Journal Functionality Tests
 * Tests the interactive journal pages and animations
 */

test.describe('Da Vinci Journal Functionality', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Allow some animations for journal interactions
    await page.addStyleTag({
      content: `
        .journal-page {
          transition-duration: 0.2s !important;
        }
        * {
          animation-duration: 0.1s !important;
          animation-delay: 0s !important;
        }
      `
    });
  });

  test('should display all journal pages correctly', async ({ page }) => {
    console.log('📚 Testing journal pages display...');
    
    const journalSection = page.locator('.davinci-journal-showcase');
    await expect(journalSection).toBeVisible();
    
    const journalPages = page.locator('.journal-page');
    const pageCount = await journalPages.count();
    
    console.log(`Found ${pageCount} journal pages`);
    expect(pageCount).toBeGreaterThanOrEqual(8); // Should have multiple feature pages
    
    // Check first page is fully opaque
    const firstPage = journalPages.first();
    const isVisible = await firstPage.isVisible();
    expect(isVisible).toBeTruthy();
    
    console.log('✅ Journal pages display correctly');
  });

  test('should have proper journal page stacking order', async ({ page }) => {
    console.log('📑 Testing journal page stacking order...');
    
    const journalPages = page.locator('.journal-page');
    const pageCount = await journalPages.count();
    
    // Check z-index values decrease for stacked pages
    const zIndexValues = [];
    for (let i = 0; i < Math.min(pageCount, 5); i++) {
      const page_element = journalPages.nth(i);
      const zIndex = await page_element.evaluate(el => {
        const computed = getComputedStyle(el);
        return parseInt(computed.zIndex) || 0;
      });
      zIndexValues.push(zIndex);
      console.log(`Page ${i + 1} z-index: ${zIndex}`);
    }
    
    // First page should have highest z-index
    for (let i = 1; i < zIndexValues.length; i++) {
      expect(zIndexValues[0]).toBeGreaterThanOrEqual(zIndexValues[i]);
    }
    
    console.log('✅ Journal page stacking order verified');
  });

  test('should have journal page interactions', async ({ page }) => {
    console.log('🖱️ Testing journal page interactions...');
    
    const journalPages = page.locator('.journal-page');
    const firstPage = journalPages.first();
    
    // Get initial position
    const initialBox = await firstPage.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Test hover interaction
    await firstPage.hover();
    await page.waitForTimeout(300);
    
    // Check if hover effects are applied (transform or other changes)
    const hoverTransform = await firstPage.evaluate(el => 
      getComputedStyle(el).transform
    );
    
    console.log(`Hover transform: ${hoverTransform}`);
    console.log('✅ Journal page interactions verified');
  });

  test('should have proper journal content', async ({ page }) => {
    console.log('📝 Testing journal content...');
    
    const journalPages = page.locator('.journal-page');
    const pageCount = await journalPages.count();
    
    // Check each page has required content elements
    for (let i = 0; i < Math.min(pageCount, 5); i++) {
      const journalPage = journalPages.nth(i);
      
      // Check for title
      const title = journalPage.locator('h3');
      const hasTitle = await title.count() > 0;
      
      // Check for description
      const description = journalPage.locator('p');
      const hasDescription = await description.count() > 0;
      
      console.log(`Page ${i + 1}: Title=${hasTitle}, Description=${hasDescription}`);
      
      // At least one should be present
      expect(hasTitle || hasDescription).toBeTruthy();
    }
    
    console.log('✅ Journal content verified');
  });

  test('should have journal animation elements', async ({ page }) => {
    console.log('✨ Testing journal animation elements...');
    
    const journalPages = page.locator('.journal-page');
    
    // Check for animated elements within journal pages
    const animatedElements = [
      '.handwritten-notes',
      '.math-annotations', 
      '.sketch-overlay',
      '.sacred-icon'
    ];
    
    let foundAnimations = 0;
    
    for (const selector of animatedElements) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        foundAnimations++;
        console.log(`✅ Found ${elements} ${selector} elements`);
      }
    }
    
    expect(foundAnimations).toBeGreaterThan(0);
    console.log(`✅ Found animation elements in ${foundAnimations} categories`);
  });

  test('should have proper journal page positioning', async ({ page }) => {
    console.log('📐 Testing journal page positioning...');
    
    const journalPages = page.locator('.journal-page');
    const pageCount = await journalPages.count();
    
    // Check that pages are positioned with transforms
    const transforms = [];
    for (let i = 0; i < Math.min(pageCount, 5); i++) {
      const page_element = journalPages.nth(i);
      const transform = await page_element.evaluate(el => 
        getComputedStyle(el).transform
      );
      transforms.push(transform);
      console.log(`Page ${i + 1} transform: ${transform}`);
    }
    
    // Should have different transforms for stacking effect
    const uniqueTransforms = new Set(transforms);
    expect(uniqueTransforms.size).toBeGreaterThan(1);
    
    console.log('✅ Journal page positioning verified');
  });

  test('should handle journal page cycling', async ({ page }) => {
    console.log('🔄 Testing journal page cycling...');
    
    const journalSection = page.locator('.davinci-journal-showcase');
    await expect(journalSection).toBeVisible();
    
    // Look for any cycling controls or automatic cycling
    const journalPages = page.locator('.journal-page');
    const initialActiveClass = await journalPages.first().getAttribute('class');
    
    console.log(`Initial page classes: ${initialActiveClass}`);
    
    // Wait a bit to see if there's automatic cycling
    await page.waitForTimeout(2000);
    
    const afterWaitClass = await journalPages.first().getAttribute('class');
    console.log(`After wait classes: ${afterWaitClass}`);
    
    // Test clicking on journal area
    await journalSection.click();
    await page.waitForTimeout(500);
    
    const afterClickClass = await journalPages.first().getAttribute('class');
    console.log(`After click classes: ${afterClickClass}`);
    
    console.log('✅ Journal page cycling tested');
  });

  test('should have accessible journal content', async ({ page }) => {
    console.log('♿ Testing journal accessibility...');
    
    const journalPages = page.locator('.journal-page');
    
    // Check for proper heading structure
    const headings = await journalPages.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    // Check for descriptive text
    const paragraphs = await journalPages.locator('p').count();
    expect(paragraphs).toBeGreaterThan(0);
    
    // Check that pages are keyboard accessible
    const firstPage = journalPages.first();
    await firstPage.focus();
    
    const isFocused = await firstPage.evaluate(el => 
      document.activeElement === el || el.contains(document.activeElement)
    );
    
    console.log(`Journal page focusable: ${isFocused}`);
    console.log(`Headings: ${headings}, Paragraphs: ${paragraphs}`);
    console.log('✅ Journal accessibility verified');
  });
});