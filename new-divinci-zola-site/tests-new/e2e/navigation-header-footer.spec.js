// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Navigation, Header, and Footer E2E Tests
 * Verifies all migrated pages have proper header and footer structure
 * and all navigation links work correctly
 */

test.describe('Navigation, Header, and Footer Tests', () => {
  
  const migratedPages = [
    { url: '/autorag/', title: 'AutoRAG', name: 'AutoRAG' },
    { url: '/quality-assurance/', title: 'LLM Quality Assurance', name: 'Quality Assurance' },
    { url: '/release-management/', title: 'AI Release Management', name: 'Release Management' },
    { url: '/terms-of-service/', title: 'Terms of Service', name: 'Terms of Service' },
    { url: '/privacy-policy/', title: 'Privacy Policy', name: 'Privacy Policy' }
  ];

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // 60 second timeout for thorough checks
  });

  test('All migrated pages have complete header structure', async ({ page }) => {
    console.log('\n🏗️ Testing header structure on all migrated pages...\n');
    
    for (const pageInfo of migratedPages) {
      console.log(`Testing header on: ${pageInfo.name}`);
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Check header exists
      const header = await page.locator('header');
      await expect(header).toBeVisible();
      console.log(`  ✓ Header element found`);
      
      // Check logo exists and is visible
      const logo = await page.locator('header .logo');
      await expect(logo).toBeVisible();
      const logoImg = await page.locator('header .logo img');
      await expect(logoImg).toBeVisible();
      console.log(`  ✓ Logo found and visible`);
      
      // Check navigation menu exists
      const nav = await page.locator('header nav');
      await expect(nav).toBeVisible();
      console.log(`  ✓ Navigation menu found`);
      
      // Check Features dropdown exists
      const featuresDropdown = await page.locator('header nav .dropdown').first();
      await expect(featuresDropdown).toBeVisible();
      console.log(`  ✓ Features dropdown found`);
      
      // Check Support dropdown exists
      const supportDropdown = await page.locator('header nav .dropdown').nth(1);
      await expect(supportDropdown).toBeVisible();
      console.log(`  ✓ Support dropdown found`);
      
      // Check language switcher exists
      const languageSwitcher = await page.locator('header .language-switcher');
      await expect(languageSwitcher).toBeVisible();
      console.log(`  ✓ Language switcher found`);
      
      // Check CTA button exists
      const ctaButton = await page.locator('header .cta-button');
      await expect(ctaButton).toBeVisible();
      console.log(`  ✓ CTA button found`);
      
      console.log(`✅ ${pageInfo.name} header structure complete\n`);
    }
  });

  test('All migrated pages have complete footer structure', async ({ page }) => {
    console.log('\n🦶 Testing footer structure on all migrated pages...\n');
    
    for (const pageInfo of migratedPages) {
      console.log(`Testing footer on: ${pageInfo.name}`);
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Check footer exists
      const footer = await page.locator('footer.site-footer');
      await expect(footer).toBeVisible();
      console.log(`  ✓ Footer element found`);
      
      // Check footer brand section
      const brandSection = await page.locator('footer .brand-section');
      await expect(brandSection).toBeVisible();
      const footerLogo = await page.locator('footer .footer-logo');
      await expect(footerLogo).toBeVisible();
      console.log(`  ✓ Footer brand section found`);
      
      // Check footer has Product section
      const productSection = await page.locator('footer .footer-section').filter({ hasText: 'Product' });
      await expect(productSection).toBeVisible();
      console.log(`  ✓ Product section found`);
      
      // Check footer has Resources section
      const resourcesSection = await page.locator('footer .footer-section').filter({ hasText: 'Resources' });
      await expect(resourcesSection).toBeVisible();
      console.log(`  ✓ Resources section found`);
      
      // Check footer has Company section
      const companySection = await page.locator('footer .footer-section').filter({ hasText: 'Company' });
      await expect(companySection).toBeVisible();
      console.log(`  ✓ Company section found`);
      
      // Check footer has Legal section
      const legalSection = await page.locator('footer .footer-section').filter({ hasText: 'Legal' });
      await expect(legalSection).toBeVisible();
      console.log(`  ✓ Legal section found`);
      
      // Check footer has social links
      const socialLinks = await page.locator('footer .footer-social a');
      await expect(socialLinks.first()).toBeVisible();
      console.log(`  ✓ Social links found`);
      
      // Check footer has copyright
      const copyright = await page.locator('footer .copyright');
      await expect(copyright).toBeVisible();
      const copyrightText = await copyright.textContent();
      expect(copyrightText).toContain('Divinci AI');
      console.log(`  ✓ Copyright found`);
      
      console.log(`✅ ${pageInfo.name} footer structure complete\n`);
    }
  });

  test('Header navigation dropdowns work correctly', async ({ page }) => {
    console.log('\n🎯 Testing header dropdown functionality...\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Features dropdown
    console.log('Testing Features dropdown...');
    const featuresDropdown = await page.locator('header nav .dropdown').first();
    await featuresDropdown.hover();
    
    // Check if dropdown menu becomes visible
    const featuresMenu = await page.locator('header nav .dropdown-menu').first();
    await expect(featuresMenu).toBeVisible();
    console.log('  ✓ Features dropdown opens on hover');
    
    // Check AutoRAG link exists and works
    const autoragLink = await page.locator('header nav .dropdown-menu a:has-text("AutoRAG")');
    await expect(autoragLink).toBeVisible();
    await autoragLink.click();
    await expect(page).toHaveURL('/autorag/');
    console.log('  ✓ AutoRAG link works');
    
    // Go back and test Quality Assurance
    await page.goto('/');
    await featuresDropdown.hover();
    const qaLink = await page.locator('header nav .dropdown-menu a:has-text("Quality Assurance")');
    await qaLink.click();
    await expect(page).toHaveURL('/quality-assurance/');
    console.log('  ✓ Quality Assurance link works');
    
    // Go back and test Release Management
    await page.goto('/');
    await featuresDropdown.hover();
    const releaseLink = await page.locator('header nav .dropdown-menu a:has-text("Release Management")');
    await releaseLink.click();
    await expect(page).toHaveURL('/release-management/');
    console.log('  ✓ Release Management link works');
    
    // Test Support dropdown
    console.log('\nTesting Support dropdown...');
    await page.goto('/');
    const supportDropdown = await page.locator('header nav .dropdown:has(a:text("Support"))');
    await supportDropdown.hover();
    
    const supportMenu = await page.locator('header nav .dropdown:has(a:text("Support")) .dropdown-menu');
    await expect(supportMenu).toBeVisible();
    console.log('  ✓ Support dropdown opens on hover');
    
    // Test Terms of Service link
    const termsLink = await page.locator('header nav .dropdown-menu a:has-text("Terms of Service")');
    await termsLink.click();
    await expect(page).toHaveURL('/terms-of-service/');
    console.log('  ✓ Terms of Service link works');
    
    // Test Privacy Policy link
    await page.goto('/');
    await supportDropdown.hover();
    const privacyLink = await page.locator('header nav .dropdown-menu a:has-text("Privacy Policy")');
    await privacyLink.click();
    await expect(page).toHaveURL('/privacy-policy/');
    console.log('  ✓ Privacy Policy link works');
  });

  test('Footer navigation links work correctly', async ({ page }) => {
    console.log('\n🔗 Testing footer navigation links...\n');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Product section links
    console.log('Testing Product section links...');
    
    const autoragFooterLink = await page.locator('footer a:has-text("AutoRAG")');
    await autoragFooterLink.click();
    await expect(page).toHaveURL('/autorag/');
    console.log('  ✓ Footer AutoRAG link works');
    
    await page.goBack();
    const qaFooterLink = await page.locator('footer a:has-text("Quality Assurance")');
    await qaFooterLink.click();
    await expect(page).toHaveURL('/quality-assurance/');
    console.log('  ✓ Footer Quality Assurance link works');
    
    await page.goBack();
    const releaseFooterLink = await page.locator('footer a:has-text("Release Management")');
    await releaseFooterLink.click();
    await expect(page).toHaveURL('/release-management/');
    console.log('  ✓ Footer Release Management link works');
    
    // Test Legal section links
    console.log('\nTesting Legal section links...');
    
    await page.goBack();
    const termsFooterLink = await page.locator('footer a:has-text("Terms of Service")');
    await termsFooterLink.click();
    await expect(page).toHaveURL('/terms-of-service/');
    console.log('  ✓ Footer Terms of Service link works');
    
    await page.goBack();
    const privacyFooterLink = await page.locator('footer a:has-text("Privacy Policy")');
    await privacyFooterLink.click();
    await expect(page).toHaveURL('/privacy-policy/');
    console.log('  ✓ Footer Privacy Policy link works');
  });

  test('All migrated pages return 200 OK status', async ({ page }) => {
    console.log('\n📡 Testing HTTP status codes...\n');
    
    for (const pageInfo of migratedPages) {
      const response = await page.goto(pageInfo.url);
      expect(response.status()).toBe(200);
      console.log(`✅ ${pageInfo.name} returns 200 OK`);
    }
  });

  test('All migrated pages have proper page titles', async ({ page }) => {
    console.log('\n📑 Testing page titles...\n');
    
    for (const pageInfo of migratedPages) {
      await page.goto(pageInfo.url);
      
      // Check h1 title exists
      const h1 = await page.locator('h1').first();
      await expect(h1).toBeVisible();
      const h1Text = await h1.textContent();
      expect(h1Text).toContain(pageInfo.title.split(' - ')[0]); // Check first part of title
      
      // Check HTML title contains Divinci AI
      const title = await page.title();
      expect(title).toContain('Divinci AI');
      
      console.log(`✅ ${pageInfo.name} has proper titles`);
    }
  });

  test('Header and footer are consistent across all pages', async ({ page }) => {
    console.log('\n🔄 Testing header and footer consistency...\n');
    
    let firstPageHeaderHTML = '';
    let firstPageFooterHTML = '';
    
    for (let i = 0; i < migratedPages.length; i++) {
      const pageInfo = migratedPages[i];
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Get header and footer HTML
      const headerHTML = await page.locator('header').innerHTML();
      const footerHTML = await page.locator('footer.site-footer').innerHTML();
      
      if (i === 0) {
        // Store first page's header and footer as reference
        firstPageHeaderHTML = headerHTML;
        firstPageFooterHTML = footerHTML;
        console.log(`  📌 Using ${pageInfo.name} as reference`);
      } else {
        // Compare with first page
        expect(headerHTML).toBe(firstPageHeaderHTML);
        expect(footerHTML).toBe(firstPageFooterHTML);
        console.log(`  ✓ ${pageInfo.name} header and footer match reference`);
      }
    }
    
    console.log('\n🎉 All pages have consistent header and footer!');
  });
});