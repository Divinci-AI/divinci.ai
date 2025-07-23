// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Translation Completeness Check
 * Detects any untranslated English text on non-English pages
 */

test.describe('Translation Completeness Check', () => {
  
  // Common English phrases that should be translated
  const commonEnglishPhrases = [
    // Navigation
    'Features', 'Team', 'Sign Up', 'Support', 'Request demo',
    
    // Hero section
    'AI releases', 'Excellence, every time',
    'Intelligent test automation',
    'Detailed compliance records', 
    'Instant version recovery',
    'Explore platform',
    
    // Section headers
    'Enterprise AI, expertly managed',
    'Supercharge your workflow with AI',
    'Meet our team',
    'Start your AI journey',
    'AI for good',
    
    // Features
    'Multiplayer', 'AI Family', 'Voice In/Out',
    'Performance Analytics', 'Enterprise Security',
    'Lightning Responses', 'Domain Specialization',
    'Smart Workflows', 'API Integration', 'Scalability',
    
    // Footer
    'Product', 'Resources', 'Company', 'Legal',
    'Documentation', 'Blog', 'About Us', 'Careers',
    'Terms of Service', 'Privacy Policy',
    
    // CTAs
    'Request access', 'Connect', 'Learn more'
  ];

  const nonEnglishLanguages = [
    { code: 'es', name: 'Spanish', url: '/es/' },
    { code: 'fr', name: 'French', url: '/fr/' },
    { code: 'ar', name: 'Arabic', url: '/ar/' },
    { code: 'ja', name: 'Japanese', url: '/ja/' },
    { code: 'zh', name: 'Chinese', url: '/zh/' },
    { code: 'it', name: 'Italian', url: '/it/' },
    { code: 'ru', name: 'Russian', url: '/ru/' },
    { code: 'de', name: 'German', url: '/de/' },
    { code: 'pt', name: 'Portuguese', url: '/pt/' },
    { code: 'ko', name: 'Korean', url: '/ko/' },
    { code: 'nl', name: 'Dutch', url: '/nl/' },
    { code: 'hi', name: 'Hindi', url: '/hi/' }
  ];

  nonEnglishLanguages.forEach(language => {
    test(`${language.name} - Check for untranslated English text`, async ({ page }) => {
      console.log(`\n🔍 Checking ${language.name} for untranslated text...`);
      
      await page.goto(language.url);
      await page.waitForLoadState('networkidle');
      
      const pageText = await page.textContent('body');
      const foundEnglishPhrases = [];
      
      // Check each English phrase
      for (const phrase of commonEnglishPhrases) {
        if (pageText.includes(phrase)) {
          // Check if it's in a team bio (which might be okay)
          const isInTeamBio = await page.locator('.team-member').filter({ hasText: phrase }).count() > 0;
          
          // Check if it's a technical term that might not be translated
          const isTechnicalTerm = ['API', 'AI'].includes(phrase);
          
          if (!isInTeamBio && !isTechnicalTerm) {
            foundEnglishPhrases.push(phrase);
          }
        }
      }
      
      // Report findings
      if (foundEnglishPhrases.length > 0) {
        console.log(`⚠️  Found ${foundEnglishPhrases.length} untranslated phrases:`);
        foundEnglishPhrases.forEach(phrase => {
          console.log(`   - "${phrase}"`);
        });
      } else {
        console.log(`✅ No untranslated English phrases found!`);
      }
      
      // Test should fail if untranslated phrases are found
      expect(foundEnglishPhrases.length).toBe(0);
    });
  });

  test('Visual regression check for all languages', async ({ page }) => {
    console.log('\n📸 Performing visual checks for all languages...\n');
    
    const languages = ['en', 'es', 'fr', 'ar', 'ja', 'zh', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];
    
    for (const lang of languages) {
      const url = lang === 'en' ? '/' : `/${lang}/`;
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Check that key visual elements are present
      const hasLogo = await page.locator('.logo').isVisible();
      expect(hasLogo).toBeTruthy();
      
      const hasHeroImage = await page.locator('.hero-image').isVisible();
      expect(hasHeroImage).toBeTruthy();
      
      const hasLanguageSwitcher = await page.locator('.language-switcher').isVisible();
      expect(hasLanguageSwitcher).toBeTruthy();
      
      console.log(`✓ ${lang} - Visual elements present`);
    }
  });

  test('Check translation consistency across sections', async ({ page }) => {
    console.log('\n🔄 Checking translation consistency...\n');
    
    // For each language, verify that if one section is translated, all are translated
    const testLanguages = ['es', 'fr', 'pt', 'ko'];
    
    for (const lang of testLanguages) {
      await page.goto(`/${lang}/`);
      await page.waitForLoadState('networkidle');
      
      const pageText = await page.textContent('body');
      
      // Count how many sections have English vs translated content
      let englishSections = 0;
      let translatedSections = 0;
      
      // Check major sections
      const sections = [
        { selector: '.hero', englishMarker: 'AI releases' },
        { selector: '.enterprise-ai', englishMarker: 'Enterprise AI, expertly managed' },
        { selector: '.features-section', englishMarker: 'Supercharge your workflow' },
        { selector: '.team-section', englishMarker: 'Meet our team' },
        { selector: '.signup-section', englishMarker: 'Start your AI journey' }
      ];
      
      for (const section of sections) {
        const sectionText = await page.locator(section.selector).textContent();
        if (sectionText.includes(section.englishMarker)) {
          englishSections++;
        } else {
          translatedSections++;
        }
      }
      
      console.log(`${lang}: ${translatedSections} translated sections, ${englishSections} English sections`);
      
      // All sections should be translated (none in English)
      expect(englishSections).toBe(0);
    }
    
    console.log('\n✅ Translation consistency verified!');
  });
});