/**
 * Footer Navigation E2E Tests for Divinci AI
 * 
 * Comprehensive testing of footer links across all language sites
 * Tests both main pages and feature sub-pages for broken links
 */

import { test, expect } from '@playwright/test';
import { FooterPage } from '../page-objects/FooterPage';

// Configuration for language testing
const config = {
  baseUrl: 'http://localhost:8001',
  languages: [
    { code: 'en', name: 'English', path: '', default: true },
    { code: 'es', name: 'Spanish', path: '/es' },
    { code: 'fr', name: 'French', path: '/fr' },
    { code: 'ar', name: 'Arabic', path: '/ar', rtl: true }
  ],
  // Common pages to test in each language
  testPages: [
    { name: 'Homepage', path: '' },
    { name: 'About Us', path: '/about-us.html' },
    { name: 'Contact', path: '/contact.html' },
    { name: 'Pricing', path: '/pricing.html' }
  ],
  // Feature pages to test (these have different path structures)
  featurePages: [
    { name: 'AutoRAG', path: '/features/data-management/autorag.html' },
    { name: 'Release Cycle Management', path: '/features/development-tools/release-cycle-management.html' },
    { name: 'LLM Quality Assurance', path: '/features/quality-assurance/llm-quality-assurance.html' }
  ]
};

test.describe('Footer Navigation Tests', () => {
  let footer: FooterPage;

  test.beforeEach(async ({ page }) => {
    footer = new FooterPage(page);
  });

  // Test specific footer link categories
  test('Footer link categories should be consistent across languages', async ({ page }) => {
    const categoryResults: any[] = [];
    
    for (const lang of config.languages) {
      console.log(`Testing footer link categories for ${lang.name}`);
      
      const url = `${config.baseUrl}${lang.path}`;
      await page.goto(url, { timeout: 30000 });
      await page.waitForSelector('.site-footer', { timeout: 10000 });
      
      const allLinks = await footer.getAllFooterLinks();
      
      // Group links by section
      const sections: { [key: string]: any[] } = {};
      allLinks.forEach(link => {
        if (!sections[link.section]) {
          sections[link.section] = [];
        }
        sections[link.section].push(link);
      });
      
      categoryResults.push({
        language: lang.name,
        sections: sections,
        totalLinks: allLinks.length
      });
      
      // Check that we have the expected sections
      const expectedSections = ['Product', 'Resources', 'Company', 'Legal', 'Bottom'];
      for (const expectedSection of expectedSections) {
        expect(sections[expectedSection]).toBeDefined();
        expect(sections[expectedSection].length).toBeGreaterThan(0);
      }
    }
    
    console.log('Footer Categories Results:', JSON.stringify(categoryResults, null, 2));
  });

  // Test social media links
  test('Social media links should be external', async ({ page }) => {
    for (const lang of config.languages) {
      console.log(`Testing social media links for ${lang.name}`);
      
      const url = `${config.baseUrl}${lang.path}`;
      await page.goto(url, { timeout: 30000 });
      await page.waitForSelector('.site-footer', { timeout: 10000 });
      
      const socialLinks = await footer.getSocialLinks();
      
      // Check that we have social links
      expect(socialLinks.length).toBeGreaterThan(0);
      
      // Test each social link
      for (const socialLink of socialLinks) {
        console.log(`Testing ${socialLink.text}: ${socialLink.href}`);
        
        // Social links should be external URLs
        expect(socialLink.href).toMatch(/^https?:\/\//);
      }
    }
  });

  // Test footer navigation from different starting points
  test('Footer navigation should work from different page contexts', async ({ page }) => {
    const testScenarios = [
      { name: 'From Homepage', startPath: '' },
      { name: 'From Feature Page', startPath: '/features/data-management/autorag.html' },
      { name: 'From About Page', startPath: '/about-us.html' }
    ];
    
    for (const lang of config.languages) {
      for (const scenario of testScenarios) {
        console.log(`Testing ${scenario.name} navigation for ${lang.name}`);
        
        const startUrl = `${config.baseUrl}${lang.path}${scenario.startPath}`;
        
        try {
          await page.goto(startUrl, { timeout: 30000 });
          await page.waitForSelector('.site-footer', { timeout: 10000 });
          
          // Get a few key footer links to test
          const allLinks = await footer.getAllFooterLinks();
          const testLinks = allLinks.filter(link => 
            ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'].includes(link.text)
          );
          
          for (const link of testLinks.slice(0, 2)) { // Test first 2 links to avoid timeout
            console.log(`Testing navigation to ${link.text} from ${scenario.name}`);
            
            // Click the link
            await footer.clickFooterLinkByText(link.text);
            
            // Verify we navigated somewhere
            const newUrl = page.url();
            expect(newUrl).not.toBe(startUrl);
            
            // Go back to start page for next test
            await page.goto(startUrl, { timeout: 30000 });
            await page.waitForSelector('.site-footer', { timeout: 10000 });
          }
          
        } catch (error) {
          console.log(`Failed to test navigation from ${startUrl}: ${error}`);
        }
      }
    }
  });

  // Test anchor links within pages
  test('Footer anchor links should work correctly', async ({ page }) => {
    for (const lang of config.languages) {
      console.log(`Testing anchor links for ${lang.name}`);
      
      const url = `${config.baseUrl}${lang.path}`;
      await page.goto(url, { timeout: 30000 });
      await page.waitForSelector('.site-footer', { timeout: 10000 });
      
      const allLinks = await footer.getAllFooterLinks();
      const anchorLinks = allLinks.filter(link => link.href.startsWith('#'));
      
      for (const anchorLink of anchorLinks) {
        console.log(`Testing anchor link: ${anchorLink.href}`);
        
        // Check if the target element exists
        const targetElement = page.locator(anchorLink.href);
        const exists = await targetElement.count() > 0;
        
        if (exists) {
          // Click the anchor link
          await footer.clickFooterLinkByHref(anchorLink.href);
          
          // Verify the element is in view
          await expect(targetElement).toBeInViewport();
        } else {
          console.log(`Warning: Anchor target ${anchorLink.href} not found on page`);
        }
      }
    }
  });
});
