const { test, expect } = require('@playwright/test');

/**
 * Layout and Alignment Tests
 * Tests CSS Grid layout and icon alignment functionality
 */

test.describe('Layout and Alignment', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Disable animations for consistent testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('should have properly aligned feature icons', async ({ page }) => {
    console.log('🎯 Testing feature icon alignment...');
    
    const features = page.locator('.feature');
    await expect(features).toHaveCount(3);
    
    // Check CSS Grid layout on features container
    const featuresContainer = page.locator('.features');
    const gridCols = await featuresContainer.evaluate(el => 
      getComputedStyle(el).gridTemplateColumns
    );
    expect(gridCols).toContain('1fr');
    console.log(`✅ Features grid columns: ${gridCols}`);
    
    // Check individual feature layout
    const firstFeature = features.first();
    const featureGridCols = await firstFeature.evaluate(el => 
      getComputedStyle(el).gridTemplateColumns
    );
    expect(featureGridCols).toContain('2.5rem');
    console.log(`✅ Feature grid template: ${featureGridCols}`);
    
    // Check icon sizes
    const starIcon = page.locator('.feature-icon-star');
    const rotateIcon = page.locator('.feature-icon-rotate');
    const heartIcon = page.locator('.feature-icon-heart');
    
    await expect(starIcon).toBeVisible();
    await expect(rotateIcon).toBeVisible();
    await expect(heartIcon).toBeVisible();
    
    // Check computed font sizes
    const starSize = await starIcon.evaluate(el => getComputedStyle(el).fontSize);
    const rotateSize = await rotateIcon.evaluate(el => getComputedStyle(el).fontSize);
    const heartSize = await heartIcon.evaluate(el => getComputedStyle(el).fontSize);
    
    console.log(`Icon sizes - Star: ${starSize}, Rotate: ${rotateSize}, Heart: ${heartSize}`);
    
    // Heart should be smaller than star/rotate
    const starPx = parseFloat(starSize);
    const heartPx = parseFloat(heartSize);
    expect(heartPx).toBeLessThan(starPx);
    
    console.log('✅ Feature icon alignment verified');
  });

  test('should have consistent hero section layout', async ({ page }) => {
    console.log('🦸 Testing hero section layout...');
    
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    
    // Check hero content structure
    const heroContent = page.locator('.hero-content');
    const heroImage = page.locator('.hero-image');
    const heroText = page.locator('.hero-text');
    
    await expect(heroContent).toBeVisible();
    await expect(heroImage).toBeVisible();
    await expect(heroText).toBeVisible();
    
    // Check video positioning
    const heroVideo = page.locator('#hero-video');
    await expect(heroVideo).toBeVisible();
    
    const videoDimensions = await heroVideo.boundingBox();
    expect(videoDimensions?.width).toBeGreaterThan(100);
    expect(videoDimensions?.height).toBeGreaterThan(100);
    
    console.log(`✅ Hero video dimensions: ${videoDimensions?.width}x${videoDimensions?.height}`);
    console.log('✅ Hero section layout verified');
  });

  test('should have responsive grid layout', async ({ page }) => {
    console.log('📱 Testing responsive grid layout...');
    
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const featuresDesktop = page.locator('.features');
    const desktopGridCols = await featuresDesktop.evaluate(el => 
      getComputedStyle(el).gridTemplateColumns
    );
    console.log(`Desktop grid: ${desktopGridCols}`);
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const featuresMobile = page.locator('.features');
    const mobileGridCols = await featuresMobile.evaluate(el => 
      getComputedStyle(el).gridTemplateColumns
    );
    console.log(`Mobile grid: ${mobileGridCols}`);
    
    // Grid should adapt to viewport
    expect(desktopGridCols).not.toBe(mobileGridCols);
    
    console.log('✅ Responsive grid layout verified');
  });

  test('should have proper journal page stacking', async ({ page }) => {
    console.log('📖 Testing Da Vinci journal page stacking...');
    
    const journalPages = page.locator('.journal-page');
    const pageCount = await journalPages.count();
    expect(pageCount).toBeGreaterThan(5);
    console.log(`✅ Found ${pageCount} journal pages`);
    
    // Check first page opacity (should be fully opaque)
    const firstPage = journalPages.first();
    const firstPageOpacity = await firstPage.evaluate(el => {
      const bgImage = getComputedStyle(el).backgroundImage;
      return bgImage.includes('rgba') ? 
        bgImage.match(/rgba\([^)]+,\s*([^)]+)\)/)?.[1] : '1';
    });
    
    console.log(`First journal page opacity: ${firstPageOpacity}`);
    
    // Check z-index stacking
    const firstPageZIndex = await firstPage.evaluate(el => 
      getComputedStyle(el).zIndex
    );
    const secondPageZIndex = await journalPages.nth(1).evaluate(el => 
      getComputedStyle(el).zIndex
    );
    
    console.log(`Z-index stacking - First: ${firstPageZIndex}, Second: ${secondPageZIndex}`);
    expect(parseInt(firstPageZIndex)).toBeGreaterThan(parseInt(secondPageZIndex));
    
    console.log('✅ Journal page stacking verified');
  });

  test('should have proper enterprise AI panel layout', async ({ page }) => {
    console.log('🏢 Testing enterprise AI panel layout...');
    
    const panels = page.locator('.panel');
    await expect(panels).toHaveCount(4);
    
    // Check panel container
    const panelsContainer = page.locator('.panels-container');
    await expect(panelsContainer).toBeVisible();
    
    // Check each panel has required elements
    for (let i = 0; i < 4; i++) {
      const panel = panels.nth(i);
      const panelArt = panel.locator('.panel-art');
      const panelTitle = panel.locator('h3');
      const panelDescription = panel.locator('p');
      
      await expect(panelArt).toBeVisible();
      await expect(panelTitle).toBeVisible();
      await expect(panelDescription).toBeVisible();
      
      const titleText = await panelTitle.textContent();
      console.log(`✅ Panel ${i + 1}: "${titleText}"`);
    }
    
    console.log('✅ Enterprise AI panel layout verified');
  });

  test('should have proper footer layout', async ({ page }) => {
    console.log('🦶 Testing footer layout...');
    
    const footer = page.locator('.site-footer');
    await expect(footer).toBeVisible();
    
    // Check footer background image
    const footerWrapper = page.locator('.contact-footer-wrapper');
    const backgroundImage = await footerWrapper.evaluate(el => 
      getComputedStyle(el).backgroundImage
    );
    
    expect(backgroundImage).toContain('url');
    console.log(`✅ Footer background image: ${backgroundImage.substring(0, 50)}...`);
    
    // Check footer content sections
    const footerSections = await footer.locator('h3').count();
    expect(footerSections).toBeGreaterThanOrEqual(3);
    console.log(`✅ Footer sections: ${footerSections}`);
    
    // Check social links
    const socialLinks = await footer.locator('.footer-social a').count();
    expect(socialLinks).toBeGreaterThanOrEqual(2);
    console.log(`✅ Social links: ${socialLinks}`);
    
    console.log('✅ Footer layout verified');
  });

  test('should handle inline styles cleanup', async ({ page }) => {
    console.log('🧹 Testing inline styles cleanup...');
    
    // Check that hero videos don't have inline display styles
    const heroVideo2 = page.locator('#hero-video-2');
    const heroVideo3 = page.locator('#hero-video-3');
    
    const video2Style = await heroVideo2.getAttribute('style');
    const video3Style = await heroVideo3.getAttribute('style');
    
    // Should not have inline styles anymore (moved to CSS)
    expect(video2Style).toBeFalsy();
    expect(video3Style).toBeFalsy();
    
    // Check sound toggle
    const soundToggle = page.locator('#sound-toggle');
    const soundToggleStyle = await soundToggle.getAttribute('style');
    expect(soundToggleStyle).toBeFalsy();
    
    console.log('✅ Inline styles properly moved to CSS');
  });
});