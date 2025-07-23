const { test, expect } = require('@playwright/test');

test.describe('Simple Site Test', () => {
  test('should load homepage', async ({ page }) => {
    // Go to the homepage
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Divinci AI/);
    
    // Check that the main heading is present
    await expect(page.locator('h1')).toContainText('AI releases');
    
    // Check that the hero section is visible
    await expect(page.locator('.hero')).toBeVisible();
    
    // Check that the features section is visible
    await expect(page.locator('.features-section')).toBeVisible();
    
    // Check that the team section is visible
    await expect(page.locator('.team-section')).toBeVisible();
  });
  
  test('should have no broken images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all images and check if they loaded
    const images = await page.locator('img').all();
    const brokenImages = [];
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        const naturalHeight = await img.evaluate((el) => el.naturalHeight);
        
        if (naturalWidth === 0 || naturalHeight === 0) {
          brokenImages.push(src);
        }
      }
    }
    
    if (brokenImages.length > 0) {
      console.log('Broken images found:', brokenImages);
    }
    
    expect(brokenImages.length).toBe(0);
  });
});