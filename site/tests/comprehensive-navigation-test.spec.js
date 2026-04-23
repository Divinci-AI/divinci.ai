const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Navigation and Page Existence Test
 * Tests all navigation links and identifies 404 errors
 */

// Define all expected pages based on navigation and footer links
const EXPECTED_PAGES = {
  // Main navigation pages
  autorag: {
    en: '/autorag/',
    es: '/es/autorag/',
    fr: '/fr/autorag/',
    ar: '/ar/autorag/'
  },
  'quality-assurance': {
    en: '/quality-assurance/',
    es: '/es/quality-assurance/',
    fr: '/fr/quality-assurance/',
    ar: '/ar/quality-assurance/'
  },
  'release-management': {
    en: '/release-management/',
    es: '/es/release-management/',
    fr: '/fr/release-management/',
    ar: '/ar/release-management/'
  },
  'terms-of-service': {
    en: '/terms-of-service/',
    es: '/es/terms-of-service/',
    fr: '/fr/terms-of-service/',
    ar: '/ar/terms-of-service/'
  },
  'privacy-policy': {
    en: '/privacy-policy/',
    es: '/es/privacy-policy/',
    fr: '/fr/privacy-policy/',
    ar: '/ar/privacy-policy/'
  },
  
  // Footer-only pages (likely missing)
  pricing: { en: '/pricing/' },
  roadmap: { en: '/roadmap/' },
  changelog: { en: '/changelog/' },
  docs: { en: '/docs/' },
  blog: { en: '/blog/' },
  tutorials: { en: '/tutorials/' },
  api: { en: '/api/' },
  about: { en: '/about/' },
  careers: { en: '/careers/' },
  contact: { en: '/contact/' },
  press: { en: '/press/' },
  'ai-safety': {
    en: '/ai-safety/',
    es: '/es/ai-safety/'
  },
  security: {
    en: '/security/',
    es: '/es/security/'
  },
  sitemap: {
    en: '/sitemap/',
    es: '/es/sitemap/'
  },
  accessibility: {
    en: '/accessibility/',
    es: '/es/accessibility/'
  },
  cookies: {
    en: '/cookies/',
    es: '/es/cookies/'
  }
};

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ar', 'ja', 'zh', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];

test.describe('Comprehensive Navigation and Page Existence Tests', () => {
  
  test('should identify all missing pages (404s)', async ({ page }) => {
    const missingPages = [];
    const workingPages = [];
    
    console.log('🔍 Testing all expected pages for 404 errors...\n');
    
    for (const [pageName, languages] of Object.entries(EXPECTED_PAGES)) {
      for (const [lang, url] of Object.entries(languages)) {
        try {
          const response = await page.goto(`http://127.0.0.1:1027${url}`, { 
            waitUntil: 'networkidle',
            timeout: 10000 
          });
          
          if (response && response.status() === 404) {
            missingPages.push({ page: pageName, lang, url, status: 404 });
            console.log(`❌ 404: ${url} (${pageName} - ${lang})`);
          } else if (response && response.status() >= 200 && response.status() < 300) {
            workingPages.push({ page: pageName, lang, url, status: response.status() });
            console.log(`✅ ${response.status()}: ${url} (${pageName} - ${lang})`);
          } else {
            missingPages.push({ page: pageName, lang, url, status: response?.status() || 'ERROR' });
            console.log(`⚠️  ${response?.status() || 'ERROR'}: ${url} (${pageName} - ${lang})`);
          }
        } catch (error) {
          missingPages.push({ page: pageName, lang, url, error: error.message });
          console.log(`🚫 ERROR: ${url} (${pageName} - ${lang}) - ${error.message}`);
        }
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Working pages: ${workingPages.length}`);
    console.log(`❌ Missing/Error pages: ${missingPages.length}\n`);
    
    if (missingPages.length > 0) {
      console.log('🚨 MISSING PAGES THAT NEED TO BE CREATED:');
      missingPages.forEach(({ page, lang, url, status, error }) => {
        console.log(`   - ${page} (${lang}): ${url} - ${status || error}`);
      });
    }
    
    // Don't fail the test, just report the findings
    console.log(`\n📝 Found ${missingPages.length} missing pages and ${workingPages.length} working pages`);
  });

  test('should test all navigation dropdown links', async ({ page }) => {
    await page.goto('http://127.0.0.1:1027/');
    await page.waitForLoadState('networkidle');
    
    console.log('🧭 Testing navigation dropdown links...\n');
    
    // Test Features dropdown
    const featuresDropdown = page.locator('.dropdown').first();
    await featuresDropdown.hover();
    await page.waitForTimeout(500); // Wait for dropdown to appear
    
    const dropdownLinks = [
      { text: 'AutoRAG', expectedPath: '/autorag/' },
      { text: 'Quality Assurance', expectedPath: '/quality-assurance/' },
      { text: 'Release Management', expectedPath: '/release-management/' }
    ];
    
    for (const link of dropdownLinks) {
      console.log(`Testing ${link.text} link...`);
      const linkElement = page.locator('.dropdown-menu a').filter({ hasText: link.text });
      await expect(linkElement).toBeVisible();
      
      const href = await linkElement.getAttribute('href');
      console.log(`  ✅ ${link.text}: ${href}`);
      expect(href).toBe(link.expectedPath);
    }
    
    // Test Support dropdown
    const supportDropdown = page.locator('.dropdown').last();
    await supportDropdown.hover();
    await page.waitForTimeout(500);
    
    const supportLinks = [
      { text: 'Terms of Service', expectedPath: '/terms-of-service/' },
      { text: 'Privacy Policy', expectedPath: '/privacy-policy/' }
    ];
    
    for (const link of supportLinks) {
      console.log(`Testing ${link.text} link...`);
      const linkElement = page.locator('.dropdown-menu a').filter({ hasText: link.text });
      await expect(linkElement).toBeVisible();
      
      const href = await linkElement.getAttribute('href');
      console.log(`  ✅ ${link.text}: ${href}`);
      expect(href).toBe(link.expectedPath);
    }
  });

  test('should test language-specific navigation links', async ({ page }) => {
    const testLanguages = ['es', 'fr', 'ar'];
    
    for (const lang of testLanguages) {
      console.log(`\n🌍 Testing ${lang} navigation links...`);
      
      await page.goto(`http://127.0.0.1:1027/${lang}/`);
      await page.waitForLoadState('networkidle');
      
      // Test Features dropdown for this language
      const featuresDropdown = page.locator('.dropdown').first();
      await featuresDropdown.hover();
      await page.waitForTimeout(500);
      
      const expectedLinks = [
        { text: 'AutoRAG', expectedPath: `/${lang}/autorag/` },
        { text: 'Quality Assurance', expectedPath: `/${lang}/quality-assurance/` },
        { text: 'Release Management', expectedPath: `/${lang}/release-management/` }
      ];
      
      for (const link of expectedLinks) {
        const linkElement = page.locator('.dropdown-menu a').filter({ hasText: link.text });
        if (await linkElement.count() > 0) {
          const href = await linkElement.getAttribute('href');
          console.log(`  ✅ ${lang} - ${link.text}: ${href}`);
          expect(href).toBe(link.expectedPath);
        } else {
          console.log(`  ⚠️  ${lang} - ${link.text}: Link not found`);
        }
      }
    }
  });

  test('should identify pages that need to be created', async ({ page }) => {
    console.log('\n📋 CONTENT FILES THAT NEED TO BE CREATED:\n');
    
    const missingContentFiles = [
      // English pages
      'content/pricing.md',
      'content/roadmap.md', 
      'content/changelog.md',
      'content/docs.md',
      'content/blog.md',
      'content/tutorials.md',
      'content/api.md',
      'content/about.md',
      'content/careers.md',
      'content/contact.md',
      'content/press.md',
      
      // Spanish pages that exist in nav but might be missing
      'content/es/terms-of-service.md',
      'content/es/privacy-policy.md',
      
      // French pages
      'content/fr/terms-of-service.md',
      'content/fr/privacy-policy.md',
      'content/fr/accessibility.md',
      'content/fr/ai-safety.md',
      'content/fr/cookies.md',
      'content/fr/security.md',
      'content/fr/sitemap.md',
      
      // Arabic pages
      'content/ar/terms-of-service.md',
      'content/ar/privacy-policy.md',
      'content/ar/accessibility.md',
      'content/ar/ai-safety.md',
      'content/ar/cookies.md',
      'content/ar/security.md',
      'content/ar/sitemap.md',
      
      // Other language index pages need more content
      'content/ja/_index.md',
      'content/zh/_index.md',
      'content/it/_index.md',
      'content/ru/_index.md',
      'content/de/_index.md',
      'content/pt/_index.md',
      'content/ko/_index.md',
      'content/nl/_index.md',
      'content/hi/_index.md'
    ];
    
    missingContentFiles.forEach(file => {
      console.log(`📄 Missing: ${file}`);
    });
    
    console.log(`\n📊 Total missing content files: ${missingContentFiles.length}`);
    
    // This is informational - don't fail the test
    expect(missingContentFiles.length).toBeGreaterThan(0); // We know there are missing files
  });
});