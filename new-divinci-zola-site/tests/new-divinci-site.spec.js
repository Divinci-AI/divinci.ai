const { test, expect } = require('@playwright/test');

/**
 * New-Divinci Zola Site E2E Tests
 * Tests functionality and visual integrity of the new-divinci Zola site
 */

test.describe('New-Divinci Zola Site', () => {
  const baseURL = 'http://localhost:1111';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto(baseURL);
    
    // Wait for page to load
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

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Divinci AI/);
    await expect(page.locator('h1')).toContainText('AI releases');
  });

  test('should display all main sections', async ({ page }) => {
    // Hero section
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero h1')).toContainText('AI releases');
    
    // Enterprise AI section (should be first after hero)
    await expect(page.locator('.enterprise-ai')).toBeVisible();
    await expect(page.locator('.enterprise-ai h2')).toContainText('Enterprise AI');
    
    // Features section
    await expect(page.locator('.features-section')).toBeVisible();
    await expect(page.locator('.features-section h2')).toContainText('Supercharge your workflow');
    
    // Team section
    await expect(page.locator('.team-section')).toBeVisible();
    await expect(page.locator('.team-section h2')).toContainText('Meet our team');
    
    // Signup section
    await expect(page.locator('.signup-section')).toBeVisible();
    await expect(page.locator('.signup-section h2')).toContainText('Start your AI journey');
    
    // AI for Good section
    await expect(page.locator('.ai-for-good-section')).toBeVisible();
    await expect(page.locator('.ai-for-good-section h2')).toContainText('AI for good');
    
    // Footer
    await expect(page.locator('.site-footer')).toBeVisible();
  });

  test('should have functioning header navigation', async ({ page }) => {
    // Check header elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header .logo')).toBeVisible();
    await expect(page.locator('header nav')).toBeVisible();
    
    // Check navigation links
    await expect(page.locator('nav a[href="#features"]')).toBeVisible();
    await expect(page.locator('nav a[href="#team"]')).toBeVisible();
    await expect(page.locator('nav a[href="#signup"]')).toBeVisible();
    
    // Check CTA button
    await expect(page.locator('.cta-button')).toContainText('Request demo');
    
    // Check language switcher
    await expect(page.locator('.language-switcher')).toBeVisible();
  });

  test('should have working language switcher', async ({ page }) => {
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toBeVisible();
    
    // Click to open dropdown
    await languageSwitcher.click();
    
    // Check language options
    await expect(page.locator('.language-switcher-dropdown')).toBeVisible();
    await expect(page.locator('.language-option')).toHaveCount(4); // en, es, fr, ar
    
    // Test Spanish switch
    await page.locator('a[href="/es/"]').click();
    await page.waitForURL('**/es/');
    await expect(page.locator('h1')).toContainText('Lanzamientos de IA');
  });

  test('should display all 10 features', async ({ page }) => {
    const features = page.locator('.feature-card');
    await expect(features).toHaveCount(10);
    
    // Check specific features
    await expect(page.locator('.feature-card').nth(0)).toContainText('Multiplayer');
    await expect(page.locator('.feature-card').nth(1)).toContainText('AI Family');
    await expect(page.locator('.feature-card').nth(2)).toContainText('Voice In/Out');
    await expect(page.locator('.feature-card').nth(3)).toContainText('Performance Analytics');
    await expect(page.locator('.feature-card').nth(4)).toContainText('Enterprise Security');
    await expect(page.locator('.feature-card').nth(5)).toContainText('Lightning Responses');
    await expect(page.locator('.feature-card').nth(6)).toContainText('Domain Specialization');
    await expect(page.locator('.feature-card').nth(7)).toContainText('Smart Workflows');
    await expect(page.locator('.feature-card').nth(8)).toContainText('API Integration');
    await expect(page.locator('.feature-card').nth(9)).toContainText('Scalability');
  });

  test('should display all team members', async ({ page }) => {
    const teamMembers = page.locator('.team-member');
    await expect(teamMembers).toHaveCount(6);
    
    // Check team member names
    await expect(page.locator('.team-member').nth(0)).toContainText('Michael Mooring');
    await expect(page.locator('.team-member').nth(1)).toContainText('Duane Mooring');
    await expect(page.locator('.team-member').nth(2)).toContainText('Sam Tobia');
    await expect(page.locator('.team-member').nth(3)).toContainText('Abdul Rahman');
    await expect(page.locator('.team-member').nth(4)).toContainText('Sierra Hooshiari');
    await expect(page.locator('.team-member').nth(5)).toContainText('Sean Fuhrman');
  });

  test('should have working signup form', async ({ page }) => {
    const signupForm = page.locator('.signup-form form');
    await expect(signupForm).toBeVisible();
    
    const emailInput = page.locator('input[name="email"]');
    const submitButton = page.locator('.signup-button');
    
    await expect(emailInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Request access');
    
    // Test form validation
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should have comprehensive footer', async ({ page }) => {
    const footer = page.locator('.site-footer');
    await expect(footer).toBeVisible();
    
    // Check footer sections
    await expect(footer.locator('h3')).toHaveCount(4); // Product, Resources, Company, Legal
    
    // Check brand section
    await expect(footer.locator('.footer-logo')).toBeVisible();
    await expect(footer.locator('.footer-social')).toBeVisible();
    
    // Check social media links
    await expect(footer.locator('.footer-social a')).toHaveCount(3);
    
    // Check copyright
    await expect(footer.locator('.copyright')).toContainText('© 2023-2025 Divinci AI');
  });

  test('should check for broken images', async ({ page }) => {
    // Wait for all images to load
    await page.waitForLoadState('networkidle');
    
    // Get all images
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // Check if image loaded successfully
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        const naturalHeight = await img.evaluate((el) => el.naturalHeight);
        
        expect(naturalWidth).toBeGreaterThan(0);
        expect(naturalHeight).toBeGreaterThan(0);
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check header responsiveness
    await expect(page.locator('header')).toBeVisible();
    
    // Check hero section on mobile
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero-content')).toBeVisible();
    
    // Check features grid on mobile
    await expect(page.locator('.features-grid')).toBeVisible();
    
    // Check team grid on mobile
    await expect(page.locator('.team-grid')).toBeVisible();
    
    // Check signup form on mobile
    await expect(page.locator('.signup-form')).toBeVisible();
    
    // Check footer on mobile
    await expect(page.locator('.site-footer')).toBeVisible();
  });

  test('should have proper video elements', async ({ page }) => {
    // Check hero video
    await expect(page.locator('#hero-video')).toBeVisible();
    
    // Check enterprise AI background videos
    await expect(page.locator('#background-video-default')).toBeVisible();
    await expect(page.locator('#background-video-panel2')).toBeVisible();
    await expect(page.locator('#background-video-panel3')).toBeVisible();
  });

  test('should have enterprise AI panels', async ({ page }) => {
    const panels = page.locator('.panel');
    await expect(panels).toHaveCount(4);
    
    // Check panel content
    await expect(panels.nth(0)).toContainText('Intelligent release orchestration');
    await expect(panels.nth(1)).toContainText('Proactive model oversight');
    await expect(panels.nth(2)).toContainText('Tailored performance analytics');
    await expect(panels.nth(3)).toContainText('Integrated team collaboration');
  });

  test('should have AI for Good principles', async ({ page }) => {
    const principles = page.locator('.principle');
    await expect(principles).toHaveCount(3);
    
    await expect(principles.nth(0)).toContainText('Safe development');
    await expect(principles.nth(1)).toContainText('Fair AI');
    await expect(principles.nth(2)).toContainText('Positive impact');
  });
});

test.describe('Language-specific pages', () => {
  const baseURL = 'http://localhost:1111';
  
  test('should load Spanish version', async ({ page }) => {
    await page.goto(`${baseURL}/es/`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Lanzamientos de IA');
    await expect(page.locator('.features-section h2')).toContainText('Potencia tu flujo de trabajo');
    await expect(page.locator('.team-section h2')).toContainText('Conoce a nuestro equipo');
  });
  
  test('should load French version', async ({ page }) => {
    await page.goto(`${baseURL}/fr/`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('Versions d\'IA');
    await expect(page.locator('.features-section h2')).toContainText('Renforcez votre flux de travail');
    await expect(page.locator('.team-section h2')).toContainText('Rencontrez notre équipe');
  });
  
  test('should load Arabic version', async ({ page }) => {
    await page.goto(`${baseURL}/ar/`);
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toContainText('إصدارات الذكاء الاصطناعي');
    await expect(page.locator('.features-section h2')).toContainText('عزز سير عملك بالذكاء الاصطناعي');
    await expect(page.locator('.team-section h2')).toContainText('تعرف على فريقنا');
  });
});