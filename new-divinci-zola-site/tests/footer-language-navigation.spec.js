const { test, expect } = require('@playwright/test');

test.describe('Footer Language Navigation', () => {
  
  test('should navigate to English homepage when clicking footer logo from English page', async ({ page }) => {
    // Start on an English feature page
    await page.goto('/autorag');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Click the footer logo link
    await page.click('.footer-logo-link');
    
    // Should navigate to English homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('title')).toContainText(['Divinci AI', 'Excellence']);
  });

  test('should navigate to Spanish homepage when clicking footer logo from Spanish page', async ({ page }) => {
    // Start on a Spanish feature page
    await page.goto('/es/autorag');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Click the footer logo link
    await page.click('.footer-logo-link');
    
    // Should navigate to Spanish homepage
    await expect(page).toHaveURL('/es/');
    await expect(page.locator('title')).toContainText(['Divinci AI', 'Excelencia']);
  });

  test('should navigate to French homepage when clicking footer logo from French page', async ({ page }) => {
    // Start on a French feature page  
    await page.goto('/fr/autorag');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Click the footer logo link
    await page.click('.footer-logo-link');
    
    // Should navigate to French homepage
    await expect(page).toHaveURL('/fr/');
    await expect(page.locator('title')).toContainText(['Divinci AI', 'Excellence']);
  });

  test('should navigate to Arabic homepage when clicking footer logo from Arabic page', async ({ page }) => {
    // Start on an Arabic feature page
    await page.goto('/ar/autorag');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible();
    
    // Click the footer logo link
    await page.click('.footer-logo-link');
    
    // Should navigate to Arabic homepage
    await expect(page).toHaveURL('/ar/');
    await expect(page.locator('title')).toContainText(['Divinci AI', 'التميز']);
  });

  test('footer logo link should have no text decoration', async ({ page }) => {
    await page.goto('/autorag');
    
    // Check that footer logo link exists and has no underline
    const footerLogoLink = page.locator('.footer-logo-link');
    await expect(footerLogoLink).toBeVisible();
    
    // Check CSS text-decoration property
    const textDecoration = await footerLogoLink.evaluate(el => 
      getComputedStyle(el).textDecoration
    );
    expect(textDecoration).toContain('none');
  });

  test('footer logo link should contain both image and text', async ({ page }) => {
    await page.goto('/autorag');
    
    const footerLogoLink = page.locator('.footer-logo-link');
    
    // Should contain the logo image
    await expect(footerLogoLink.locator('img[alt="Divinci AI Logo"]')).toBeVisible();
    
    // Should contain the text
    await expect(footerLogoLink.locator('span')).toContainText('Divinci AI');
  });

  test('footer logo hover effect should work', async ({ page }) => {
    await page.goto('/autorag');
    
    const footerLogoLink = page.locator('.footer-logo-link');
    
    // Get initial opacity
    const initialOpacity = await footerLogoLink.evaluate(el => 
      getComputedStyle(el).opacity
    );
    
    // Hover over the link
    await footerLogoLink.hover();
    
    // Check that opacity changes on hover
    const hoverOpacity = await footerLogoLink.evaluate(el => 
      getComputedStyle(el).opacity
    );
    
    expect(parseFloat(hoverOpacity)).toBeLessThan(parseFloat(initialOpacity));
  });

  test('footer logo navigation should work across different feature pages', async ({ page }) => {
    const featurePages = [
      '/quality-assurance',
      '/release-management', 
      '/ai-safety'
    ];
    
    for (const featurePage of featurePages) {
      await page.goto(featurePage);
      await expect(page.locator('h1')).toBeVisible();
      
      // Click footer logo
      await page.click('.footer-logo-link');
      
      // Should be on homepage
      await expect(page).toHaveURL('/');
      
      // Should see homepage content
      await expect(page.locator('title')).toContainText(['Divinci AI', 'Excellence']);
    }
  });

  test('footer logo should maintain language context in multilingual navigation', async ({ page }) => {
    // Test Spanish language navigation
    await page.goto('/es/quality-assurance');
    await page.click('.footer-logo-link');
    await expect(page).toHaveURL('/es/');
    
    // Test French language navigation
    await page.goto('/fr/release-management');
    await page.click('.footer-logo-link');
    await expect(page).toHaveURL('/fr/');
    
    // Test returning to English
    await page.goto('/autorag');
    await page.click('.footer-logo-link');
    await expect(page).toHaveURL('/');
  });
});