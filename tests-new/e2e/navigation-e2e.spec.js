// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Navigation End-to-End Tests
 * Verifies all navigation links work correctly and pages load without 404s
 */

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('All header navigation links should work', async ({ page }) => {
    console.log('🔗 Testing header navigation links...\n');
    
    // Test Features dropdown
    await page.hover('nav a:has-text("Features")');
    
    // Click AutoRAG link
    await page.click('nav .dropdown-menu a:has-text("AutoRAG")');
    await expect(page).toHaveURL('/autorag/');
    await expect(page.locator('h1')).toContainText('AutoRAG');
    console.log('✓ AutoRAG page loads correctly');
    
    // Go back and test Quality Assurance
    await page.goto('/');
    await page.hover('nav a:has-text("Features")');
    await page.click('nav .dropdown-menu a:has-text("Quality Assurance")');
    await expect(page).toHaveURL('/quality-assurance/');
    await expect(page.locator('h1')).toContainText('Quality Assurance');
    console.log('✓ Quality Assurance page loads correctly');
    
    // Test Release Management
    await page.goto('/');
    await page.hover('nav a:has-text("Features")');
    await page.click('nav .dropdown-menu a:has-text("Release Management")');
    await expect(page).toHaveURL('/release-management/');
    await expect(page.locator('h1')).toContainText('Release Management');
    console.log('✓ Release Management page loads correctly');
    
    // Test Support dropdown
    await page.goto('/');
    await page.hover('nav a:has-text("Support")');
    
    // Click Terms of Service
    await page.click('nav .dropdown-menu a:has-text("Terms of Service")');
    await expect(page).toHaveURL('/terms-of-service/');
    await expect(page.locator('h1')).toContainText('Terms of Service');
    console.log('✓ Terms of Service page loads correctly');
    
    // Test Privacy Policy
    await page.goto('/');
    await page.hover('nav a:has-text("Support")');
    await page.click('nav .dropdown-menu a:has-text("Privacy Policy")');
    await expect(page).toHaveURL('/privacy-policy/');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    console.log('✓ Privacy Policy page loads correctly');
  });

  test('All footer navigation links should work', async ({ page }) => {
    console.log('\n🔗 Testing footer navigation links...\n');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test Product section links
    const productLinks = [
      { text: 'AutoRAG', url: '/autorag/' },
      { text: 'Quality Assurance', url: '/quality-assurance/' },
      { text: 'Release Management', url: '/release-management/' }
    ];
    
    for (const link of productLinks) {
      await page.click(`footer a:has-text("${link.text}")`);
      await expect(page).toHaveURL(link.url);
      console.log(`✓ Footer link "${link.text}" works`);
      await page.goBack();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    
    // Test Legal section links
    const legalLinks = [
      { text: 'Terms of Service', url: '/terms-of-service/' },
      { text: 'Privacy Policy', url: '/privacy-policy/' }
    ];
    
    for (const link of legalLinks) {
      await page.click(`footer a:has-text("${link.text}")`);
      await expect(page).toHaveURL(link.url);
      console.log(`✓ Footer link "${link.text}" works`);
      await page.goBack();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
  });

  test('No 404 errors on any navigation link', async ({ page }) => {
    console.log('\n🔍 Checking all links for 404 errors...\n');
    
    const allUrls = [
      '/autorag/',
      '/quality-assurance/',
      '/release-management/',
      '/terms-of-service/',
      '/privacy-policy/'
    ];
    
    for (const url of allUrls) {
      const response = await page.goto(url);
      expect(response.status()).not.toBe(404);
      expect(response.status()).toBe(200);
      console.log(`✓ ${url} returns 200 OK`);
    }
  });

  test('Navigation works from different language pages', async ({ page }) => {
    console.log('\n🌐 Testing navigation from different language versions...\n');
    
    // Test from Spanish page
    await page.goto('/es/');
    await page.hover('nav a:has-text("Características")');
    
    // Spanish links should go to Spanish pages
    const spanishDropdown = await page.locator('nav .dropdown-menu a').first().getAttribute('href');
    expect(spanishDropdown).toContain('/es/');
    console.log('✓ Spanish navigation links to Spanish pages');
    
    // Test from French page
    await page.goto('/fr/');
    await page.hover('nav a:has-text("Fonctionnalités")');
    
    const frenchDropdown = await page.locator('nav .dropdown-menu a').first().getAttribute('href');
    expect(frenchDropdown).toContain('/fr/');
    console.log('✓ French navigation links to French pages');
  });

  test('Page content matches navigation expectations', async ({ page }) => {
    console.log('\n📝 Verifying page content...\n');
    
    const pages = [
      {
        url: '/autorag/',
        title: 'AutoRAG',
        expectedContent: ['What is AutoRAG?', 'Key Benefits', 'How AutoRAG Works']
      },
      {
        url: '/quality-assurance/',
        title: 'LLM Quality Assurance',
        expectedContent: ['Enterprise AI Quality at Scale', 'Key Features', 'How It Works']
      },
      {
        url: '/release-management/',
        title: 'AI Release Management',
        expectedContent: ['Intelligent Release Cycle Management', 'Core Capabilities', 'Release Pipeline']
      },
      {
        url: '/terms-of-service/',
        title: 'Terms of Service',
        expectedContent: ['Introduction', 'Eligibility', 'AI Content Disclaimer']
      },
      {
        url: '/privacy-policy/',
        title: 'Privacy Policy',
        expectedContent: ['Introduction', 'Data Collection and Use', 'User Rights']
      }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      
      // Check title
      await expect(page.locator('h1')).toContainText(pageInfo.title);
      
      // Check expected content sections
      for (const content of pageInfo.expectedContent) {
        await expect(page.locator('body')).toContainText(content);
      }
      
      console.log(`✓ ${pageInfo.title} has correct content`);
    }
  });

  test('Dropdown menus are accessible via keyboard', async ({ page }) => {
    console.log('\n⌨️ Testing keyboard accessibility...\n');
    
    // Tab to Features dropdown
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Adjust based on actual tab order
    
    // Enter should open dropdown
    await page.keyboard.press('Enter');
    
    // Check if dropdown is visible
    const dropdownVisible = await page.locator('nav .dropdown-menu').first().isVisible();
    expect(dropdownVisible).toBeTruthy();
    console.log('✓ Dropdown menus are keyboard accessible');
  });

  test('All pages have proper meta tags', async ({ page }) => {
    console.log('\n🏷️ Checking meta tags...\n');
    
    const pages = [
      { url: '/autorag/', title: 'AutoRAG - Automated Retrieval Augmented Generation' },
      { url: '/quality-assurance/', title: 'LLM Quality Assurance' },
      { url: '/release-management/', title: 'AI Release Management' },
      { url: '/terms-of-service/', title: 'Terms of Service' },
      { url: '/privacy-policy/', title: 'Privacy Policy' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      
      // Check page title
      const title = await page.title();
      expect(title).toContain('Divinci AI');
      
      // Check meta description exists
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      
      console.log(`✓ ${pageInfo.title} has proper meta tags`);
    }
  });
});