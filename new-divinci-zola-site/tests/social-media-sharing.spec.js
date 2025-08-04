// Social Media Sharing Test Suite
// Tests for Open Graph and Twitter Card meta tags

import { test, expect } from '@playwright/test';

test.describe('Social Media Sharing Meta Tags', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Open Graph Meta Tags', () => {
    
    test('should have proper Open Graph meta tags on homepage', async ({ page }) => {
      // Check basic Open Graph tags
      const ogType = await page.getAttribute('meta[property="og:type"]', 'content');
      expect(ogType).toBe('website');
      
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      expect(ogTitle).toContain('Divinci AI');
      
      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
      expect(ogDescription).toContain('AI releases');
      
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
      expect(ogImage).toContain('social-preview.png');
      
      // Check image dimensions
      const ogImageWidth = await page.getAttribute('meta[property="og:image:width"]', 'content');
      expect(ogImageWidth).toBe('1200');
      
      const ogImageHeight = await page.getAttribute('meta[property="og:image:height"]', 'content');
      expect(ogImageHeight).toBe('630');
      
      const ogImageAlt = await page.getAttribute('meta[property="og:image:alt"]', 'content');
      expect(ogImageAlt).toContain('Leonardo da Vinci');
      
      const ogSiteName = await page.getAttribute('meta[property="og:site_name"]', 'content');
      expect(ogSiteName).toBe('Divinci AI');
      
      console.log('✅ Open Graph meta tags test passed');
    });

    test('should have language-specific Open Graph tags', async ({ page }) => {
      const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
      expect(ogLocale).toBeTruthy();
      expect(['en', 'es', 'fr', 'ar']).toContainEqual(ogLocale);
      
      console.log('✅ Language-specific Open Graph test passed');
    });
  });

  test.describe('Twitter Card Meta Tags', () => {
    
    test('should have proper Twitter Card meta tags', async ({ page }) => {
      // Check Twitter Card type
      const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
      expect(twitterCard).toBe('summary_large_image');
      
      const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
      expect(twitterTitle).toContain('Divinci AI');
      
      const twitterDescription = await page.getAttribute('meta[name="twitter:description"]', 'content');
      expect(twitterDescription).toContain('AI releases');
      
      const twitterImage = await page.getAttribute('meta[name="twitter:image"]', 'content');
      expect(twitterImage).toContain('social-preview.png');
      
      const twitterImageAlt = await page.getAttribute('meta[name="twitter:image:alt"]', 'content');
      expect(twitterImageAlt).toContain('Leonardo da Vinci');
      
      const twitterSite = await page.getAttribute('meta[name="twitter:site"]', 'content');
      expect(twitterSite).toBe('@DivinciAI');
      
      const twitterCreator = await page.getAttribute('meta[name="twitter:creator"]', 'content');
      expect(twitterCreator).toBe('@DivinciAI');
      
      console.log('✅ Twitter Card meta tags test passed');
    });
  });

  test.describe('Social Image Accessibility', () => {
    
    test('should have accessible social preview image', async ({ page }) => {
      // Navigate to the social preview image URL
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
      
      // Check if image URL is valid
      expect(ogImage).toBeTruthy();
      expect(ogImage).toMatch(/\.(png|jpg|jpeg|webp)$/i);
      
      // Test if image is accessible (try to load it)
      const response = await page.goto(ogImage);
      expect(response.status()).toBe(200);
      
      console.log('✅ Social image accessibility test passed');
    });
  });

  test.describe('Page-Specific Social Meta Tags', () => {
    
    test('should have proper meta tags on feature pages', async ({ page }) => {
      // Test AutoRAG page
      await page.goto('/autorag/');
      await page.waitForLoadState('networkidle');
      
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      expect(ogTitle).toMatch(/AutoRAG.*Divinci AI/);
      
      const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
      expect(twitterTitle).toMatch(/AutoRAG.*Divinci AI/);
      
      console.log('✅ Page-specific meta tags test passed');
    });

    test('should have proper meta tags on quality assurance page', async ({ page }) => {
      await page.goto('/quality-assurance/');
      await page.waitForLoadState('networkidle');
      
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      expect(ogTitle).toMatch(/Quality.*Divinci AI/);
      
      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
      expect(ogDescription).toBeTruthy();
      
      console.log('✅ Quality assurance page meta tags test passed');
    });
  });

  test.describe('Social Media Preview Validation', () => {
    
    test('should meet social media platform requirements', async ({ page }) => {
      // Get all meta tags for validation
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
      
      // Validate Facebook/LinkedIn requirements
      expect(ogTitle.length).toBeGreaterThan(0);
      expect(ogTitle.length).toBeLessThanOrEqual(95); // Facebook recommendation
      
      expect(ogDescription.length).toBeGreaterThan(0);
      expect(ogDescription.length).toBeLessThanOrEqual(297); // Facebook recommendation
      
      expect(ogImage).toBeTruthy();
      
      // Validate Twitter requirements
      const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
      const twitterDescription = await page.getAttribute('meta[name="twitter:description"]', 'content');
      
      expect(twitterTitle.length).toBeLessThanOrEqual(70); // Twitter recommendation
      expect(twitterDescription.length).toBeLessThanOrEqual(200); // Twitter recommendation
      
      console.log('✅ Social media platform requirements test passed');
    });
  });

  test.describe('Multi-language Social Sharing', () => {
    
    test('should handle French language social meta tags', async ({ page }) => {
      await page.goto('/fr/');
      await page.waitForLoadState('networkidle');
      
      const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
      expect(ogLocale).toBe('fr');
      
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      expect(ogTitle).toContain('Divinci AI');
      
      console.log('✅ French language social meta tags test passed');
    });

    test('should handle Spanish language social meta tags', async ({ page }) => {
      await page.goto('/es/');
      await page.waitForLoadState('networkidle');
      
      const ogLocale = await page.getAttribute('meta[property="og:locale"]', 'content');
      expect(ogLocale).toBe('es');
      
      console.log('✅ Spanish language social meta tags test passed');
    });
  });
});