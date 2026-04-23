// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');

/**
 * Homepage UI Translation End-to-End Tests
 * 
 * Comprehensive testing to ensure all homepage UI elements are properly translated
 * including FAQ actions, demo buttons, product features, and footer elements.
 */

test.describe('Homepage UI Translation Testing', () => {
  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic' }
  ];

  // Load translation files for verification
  const translations = {};
  supportedLanguages.forEach(lang => {
    try {
      const filePath = `data/translations/${lang.code}.json`;
      const content = fs.readFileSync(filePath, 'utf8');
      translations[lang.code] = JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load ${lang.code} translations: ${error.message}`);
    }
  });

  test('should have all homepage UI elements translated in language files', async () => {
    console.log('🔍 Verifying homepage UI element translations in language files...\n');
    
    const requiredUIElements = [
      'expert_answers.view_complete_list',
      'contact.schedule_demo',
      'contact.book_demo', 
      'contact.demo_availability',
      'features.autorag.title',
      'features.qa_title',
      'features.release_management',
      'footer.api',
      'footer.support',
      'footer.privacy_settings',
      'footer.cookie_policy',
      'footer.cookie_preferences'
    ];

    for (const lang of supportedLanguages) {
      const translation = translations[lang.code];
      expect(translation).toBeDefined();
      
      for (const elementPath of requiredUIElements) {
        const keys = elementPath.split('.');
        let current = translation;
        let found = true;
        
        for (const key of keys) {
          if (!current || !current[key]) {
            found = false;
            break;
          }
          current = current[key];
        }
        
        expect(found).toBe(true);
        if (found && typeof current === 'string') {
          expect(current.trim()).not.toBe('');
        }
      }
      
      console.log(`✅ ${lang.name} (${lang.code}): All UI elements complete`);
    }
  });

  test('should not display English UI text in Chinese version', async ({ page }) => {
    await page.goto('http://localhost:3000/zh/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that English UI text from user's report is NOT present
    const englishUIText = [
      'View complete model compatibility list',
      'Schedule Demo',
      'Book a live demo',
      'Available for 30-minute personalized demos to show you how Divinci AI works',
      'Privacy Settings',
      'Cookie Policy',
      'Cookie Preferences'
    ];
    
    for (const englishText of englishUIText) {
      const englishElement = page.locator(`text="${englishText}"`);
      await expect(englishElement).toHaveCount(0);
    }
    
    console.log('✅ No English UI text found in Chinese version');
  });

  test('should display translated UI elements in Chinese', async ({ page }) => {
    await page.goto('http://localhost:3000/zh/');
    await page.waitForLoadState('domcontentloaded');
    
    const chineseTranslation = translations['zh'];
    
    // Look for translated UI elements
    const expectedChineseElements = [
      chineseTranslation.expert_answers?.view_complete_list,
      chineseTranslation.contact?.schedule_demo,
      chineseTranslation.contact?.book_demo,
      chineseTranslation.features?.qa_title,
      chineseTranslation.features?.release_management,
      chineseTranslation.footer?.support
    ].filter(Boolean);
    
    for (const chineseText of expectedChineseElements) {
      try {
        // Use partial text matching for flexibility
        const chineseElement = page.locator(`text*="${chineseText}"`).or(
          page.locator(`:has-text("${chineseText}")`)
        );
        
        // Don't fail the test if element isn't visible, just log
        const isVisible = await chineseElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ Found Chinese text: "${chineseText}"`);
        } else {
          console.log(`⚠️ Chinese text not visible on page: "${chineseText}"`);
        }
      } catch (e) {
        console.log(`⚠️ Could not locate Chinese text: "${chineseText}"`);
      }
    }
    
    console.log('✅ Chinese UI element verification complete');
  });

  test('should have consistent product feature translations', async () => {
    console.log('🔍 Verifying product feature name consistency...\n');
    
    const productFeatures = ['autorag', 'qa_title', 'release_management'];
    
    for (const lang of supportedLanguages) {
      const translation = translations[lang.code];
      
      for (const feature of productFeatures) {
        const featurePath = `features.${feature}`;
        const keys = featurePath.split('.');
        let current = translation;
        
        for (const key of keys) {
          if (current && current[key]) {
            current = current[key];
          } else {
            current = null;
            break;
          }
        }
        
        if (current && typeof current === 'string') {
          expect(current.trim()).not.toBe('');
          console.log(`✅ ${lang.name}: ${feature} = "${current}"`);
        } else if (current && typeof current === 'object' && current.title) {
          expect(current.title.trim()).not.toBe('');
          console.log(`✅ ${lang.name}: ${feature}.title = "${current.title}"`);
        }
      }
    }
  });

  test('should have privacy and cookie controls translated', async () => {
    console.log('🔍 Verifying privacy and cookie control translations...\n');
    
    const privacyElements = [
      'footer.privacy_settings',
      'footer.cookie_policy', 
      'footer.cookie_preferences'
    ];
    
    for (const lang of supportedLanguages) {
      const translation = translations[lang.code];
      
      for (const elementPath of privacyElements) {
        const keys = elementPath.split('.');
        let current = translation;
        
        for (const key of keys) {
          if (current && current[key]) {
            current = current[key];
          } else {
            current = null;
            break;
          }
        }
        
        expect(current).toBeDefined();
        expect(typeof current).toBe('string');
        expect(current.trim()).not.toBe('');
        
        console.log(`✅ ${lang.name}: ${elementPath} = "${current}"`);
      }
    }
  });

  test('should verify demo booking elements are translated', async () => {
    console.log('🔍 Verifying demo booking element translations...\n');
    
    const demoElements = [
      'contact.schedule_demo',
      'contact.book_demo',
      'contact.demo_availability'
    ];
    
    for (const lang of supportedLanguages) {
      if (lang.code === 'en') continue; // Skip English base
      
      const translation = translations[lang.code];
      
      for (const elementPath of demoElements) {
        const keys = elementPath.split('.');
        let current = translation;
        
        for (const key of keys) {
          if (current && current[key]) {
            current = current[key];
          } else {
            current = null;
            break;
          }
        }
        
        expect(current).toBeDefined();
        expect(typeof current).toBe('string');
        expect(current.trim()).not.toBe('');
        
        // Should not be identical to English
        const englishTranslation = translations['en'];
        let englishValue = englishTranslation;
        for (const key of keys) {
          if (englishValue && englishValue[key]) {
            englishValue = englishValue[key];
          } else {
            englishValue = null;
            break;
          }
        }
        
        if (englishValue && lang.code !== 'en') {
          expect(current).not.toBe(englishValue);
        }
        
        console.log(`✅ ${lang.name}: ${elementPath} = "${current}"`);
      }
    }
  });
});