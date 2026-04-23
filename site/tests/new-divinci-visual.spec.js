const { test, expect } = require('@playwright/test');

/**
 * New-Divinci Zola Site Visual Tests
 * Visual regression testing for desktop and mobile viewports
 */

test.describe('New-Divinci Visual Tests', () => {
  const baseURL = 'http://localhost:1111';
  
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        video {
          display: none !important;
        }
      `
    });
  });

  test('should match homepage visual - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match homepage visual - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match hero section - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const heroSection = page.locator('.hero');
    await expect(heroSection).toHaveScreenshot('hero-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match hero section - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const heroSection = page.locator('.hero');
    await expect(heroSection).toHaveScreenshot('hero-mobile.png', {
      threshold: 0.3
    });
  });

  test('should match enterprise AI section - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const enterpriseSection = page.locator('.enterprise-ai');
    await expect(enterpriseSection).toHaveScreenshot('enterprise-ai-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match features section - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const featuresSection = page.locator('.features-section');
    await expect(featuresSection).toHaveScreenshot('features-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match features section - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const featuresSection = page.locator('.features-section');
    await expect(featuresSection).toHaveScreenshot('features-mobile.png', {
      threshold: 0.3
    });
  });

  test('should match team section - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const teamSection = page.locator('.team-section');
    await expect(teamSection).toHaveScreenshot('team-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match team section - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const teamSection = page.locator('.team-section');
    await expect(teamSection).toHaveScreenshot('team-mobile.png', {
      threshold: 0.3
    });
  });

  test('should match signup section - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const signupSection = page.locator('.signup-section');
    await expect(signupSection).toHaveScreenshot('signup-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match signup section - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const signupSection = page.locator('.signup-section');
    await expect(signupSection).toHaveScreenshot('signup-mobile.png', {
      threshold: 0.3
    });
  });

  test('should match AI for Good section - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const aiForGoodSection = page.locator('.ai-for-good-section');
    await expect(aiForGoodSection).toHaveScreenshot('ai-for-good-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match AI for Good section - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const aiForGoodSection = page.locator('.ai-for-good-section');
    await expect(aiForGoodSection).toHaveScreenshot('ai-for-good-mobile.png', {
      threshold: 0.3
    });
  });

  test('should match footer - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('.site-footer');
    await expect(footer).toHaveScreenshot('footer-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match footer - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('.site-footer');
    await expect(footer).toHaveScreenshot('footer-mobile.png', {
      threshold: 0.3
    });
  });

  test('should match language switcher dropdown - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Click language switcher to open dropdown
    await page.locator('.language-switcher').click();
    await page.waitForTimeout(500);
    
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-desktop.png', {
      threshold: 0.3
    });
  });

  test('should match language switcher dropdown - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Click language switcher to open dropdown
    await page.locator('.language-switcher').click();
    await page.waitForTimeout(500);
    
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toHaveScreenshot('language-switcher-mobile.png', {
      threshold: 0.3
    });
  });
});

test.describe('Language-specific visual tests', () => {
  const baseURL = 'http://localhost:1111';
  
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        video {
          display: none !important;
        }
      `
    });
  });

  test('should match Spanish homepage - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseURL}/es/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-spanish-desktop.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match French homepage - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseURL}/fr/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-french-desktop.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match Arabic homepage - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseURL}/ar/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-arabic-desktop.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match Spanish homepage - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseURL}/es/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-spanish-mobile.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match French homepage - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseURL}/fr/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-french-mobile.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should match Arabic homepage - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseURL}/ar/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-arabic-mobile.png', {
      fullPage: true,
      threshold: 0.3
    });
  });
});