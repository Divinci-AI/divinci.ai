/**
 * Footer Link E2E Tests for Divinci AI
 * 
 * Comprehensive testing of footer links across all language sites
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

for (const lang of config.languages) {
  test.describe(`Footer Link Tests for ${lang.name}`, () => {
    let footer: FooterPage;

    test.beforeEach(async ({ page }) => {
      footer = new FooterPage(page);
    });

    test('Footer links should work on homepage', async ({ page }) => {
      const url = `${config.baseUrl}${lang.path || '/'}`;
      await page.goto(url, { timeout: 30000 });
      await page.waitForSelector('.site-footer', { timeout: 10000 });
      
      const linkResults = await footer.testAllFooterLinks(url);
      
      if (linkResults.broken.length > 0) {
        console.log('Broken links:', linkResults.broken);
      }
      
      expect(linkResults.broken.length).toBe(0);
    });

    for (const featurePage of config.featurePages) {
      test(`Footer links should work on ${featurePage.name} page`, async ({ page }) => {
        const url = `${config.baseUrl}${lang.path}${featurePage.path}`;
        
        try {
          await page.goto(url, { timeout: 30000 });
          await page.waitForSelector('.site-footer', { timeout: 10000 });
          
          const linkResults = await footer.testAllFooterLinks(url);
          
          if (linkResults.broken.length > 0) {
            console.log('Broken links:', linkResults.broken);
          }
          
          expect(linkResults.broken.length).toBe(0);
          
        } catch (error) {
          console.log(`Failed to test ${url}: ${error}`);
          throw error;
        }
      });
    }
  });
}
