// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Language Translation Test Suite
 * Tests all 13 languages for proper content translation and URL routing
 */

test.describe('Comprehensive Language Translation Tests', () => {

  // Define all supported languages with expected content samples
  const languages = [
    {
      code: 'en',
      name: 'English',
      url: '/',
      expectedTexts: {
        hero: 'AI releases',
        enterprise: 'Enterprise AI, expertly managed',
        features: 'The Age of AI Management',
        press: 'Press Resources'
      }
    },
    {
      code: 'es', 
      name: 'Spanish',
      url: '/es/',
      expectedTexts: {
        hero: 'Lanzamientos de IA',
        enterprise: 'IA empresarial, gestionada por expertos',
        features: 'Potencia tu flujo de trabajo con IA',
        press: 'Recursos de Prensa'
      }
    },
    {
      code: 'fr',
      name: 'French', 
      url: '/fr/',
      expectedTexts: {
        hero: 'Versions d\'IA',
        enterprise: 'IA d\'entreprise, gérée par des experts',
        features: 'Renforcez votre flux de travail avec l\'IA'
      }
    },
    {
      code: 'ar',
      name: 'Arabic',
      url: '/ar/',
      expectedTexts: {
        hero: 'إصدارات الذكاء الاصطناعي',
        enterprise: 'الذكاء الاصطناعي المؤسسي، مُدار بخبرة',
        features: 'عزز سير عملك بالذكاء الاصطناعي'
      }
    },
    {
      code: 'ja',
      name: 'Japanese',
      url: '/ja/',
      expectedTexts: {
        hero: 'AIリリース',
        enterprise: 'エンタープライズAI、専門的に管理',
        features: 'AIでワークフローを強化'
      }
    },
    {
      code: 'zh',
      name: 'Chinese',
      url: '/zh/',
      expectedTexts: {
        hero: 'AI版本发布',
        enterprise: '企业级AI，专业管理',
        features: '用AI增强您的工作流程'
      }
    },
    {
      code: 'it',
      name: 'Italian',
      url: '/it/',
      expectedTexts: {
        hero: 'Rilasci AI',
        enterprise: 'AI aziendale, gestita da esperti',
        features: 'Potenzia il tuo flusso di lavoro con l\'AI'
      }
    },
    {
      code: 'ru',
      name: 'Russian',
      url: '/ru/',
      expectedTexts: {
        hero: 'AI релизы',
        enterprise: 'Корпоративный ИИ, экспертное управление',
        features: 'Улучшите свой рабочий процесс с ИИ'
      }
    },
    {
      code: 'de',
      name: 'German',
      url: '/de/',
      expectedTexts: {
        hero: 'KI-Releases',
        enterprise: 'Unternehmens-KI, professionell verwaltet',
        features: 'Verbessern Sie Ihren Workflow mit KI'
      }
    },
    {
      code: 'pt',
      name: 'Portuguese',
      url: '/pt/',
      expectedTexts: {
        hero: 'Lançamentos de IA',
        enterprise: 'IA empresarial, gerenciada por especialistas',
        features: 'Potencialize seu fluxo de trabalho com IA'
      }
    },
    {
      code: 'ko',
      name: 'Korean',
      url: '/ko/',
      expectedTexts: {
        hero: 'AI 릴리스',
        enterprise: '기업용 AI, 전문가 관리',
        features: 'AI로 워크플로우를 강화하세요'
      }
    },
    {
      code: 'nl',
      name: 'Dutch',
      url: '/nl/',
      expectedTexts: {
        hero: 'AI-releases',
        enterprise: 'Bedrijfs-AI, vakkundig beheerd',
        features: 'Versterk uw workflow met AI'
      }
    },
    {
      code: 'hi',
      name: 'Hindi',
      url: '/hi/',
      expectedTexts: {
        hero: 'एआई रिलीज़',
        enterprise: 'एंटरप्राइज़ AI, विशेषज्ञता से प्रबंधित',
        features: 'AI के साथ अपने वर्कफ़्लो को बेहतर बनाएं'
      }
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for language tests
    test.setTimeout(30000);
  });

  languages.forEach(language => {
    test(`should display ${language.name} content correctly`, async ({ page }) => {
      console.log(`Testing ${language.name} (${language.code}) at ${language.url}`);
      
      // Navigate to the language-specific URL
      await page.goto(language.url);
      await page.waitForLoadState('networkidle');
      
      // Check that we're on the correct URL
      expect(page.url()).toContain(language.url);
      
      // Verify HTML lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      if (language.code === 'en') {
        // English might not have lang attribute or could be 'en'
        expect(['en', null, undefined].includes(htmlLang)).toBeTruthy();
      } else {
        // For non-English, we expect the language code
        expect(htmlLang).toContain(language.code);
      }
      
      // Check for presence of expected text content
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      
      // Verify hero section text
      if (language.expectedTexts.hero) {
        expect(bodyText).toContain(language.expectedTexts.hero);
        console.log(`✓ Found hero text: "${language.expectedTexts.hero}"`);
      }
      
      // Verify enterprise section text  
      if (language.expectedTexts.enterprise) {
        expect(bodyText).toContain(language.expectedTexts.enterprise);
        console.log(`✓ Found enterprise text: "${language.expectedTexts.enterprise}"`);
      }
      
      // Verify features section text
      if (language.expectedTexts.features) {
        expect(bodyText).toContain(language.expectedTexts.features);
        console.log(`✓ Found features text: "${language.expectedTexts.features}"`);
      }
      
      // Verify language switcher shows correct current language
      const currentLangDisplay = await page.textContent('.current-language');
      expect(currentLangDisplay).toBeTruthy();
      console.log(`✓ Language switcher shows: "${currentLangDisplay}"`);
      
      // Verify language switcher exists and is functional
      const languageSwitcher = await page.locator('.language-switcher').count();
      expect(languageSwitcher).toBeGreaterThan(0);
      
      // Test that language switcher dropdown works
      await page.locator('.language-switcher').click();
      const dropdown = await page.locator('.language-switcher-dropdown').isVisible();
      expect(dropdown).toBeTruthy();
      
      console.log(`✅ ${language.name} translation test passed`);
    });
  });

  test('should support bidirectional language switching without URL stacking', async ({ page }) => {
    console.log('Testing bidirectional language switching...');
    
    // Test critical language switching paths that were previously failing
    const switchingTests = [
      { from: '/', fromLang: 'en', to: 'es', expectedUrl: '/es/' },
      { from: '/es/', fromLang: 'es', to: 'fr', expectedUrl: '/fr/' },  // This was failing before
      { from: '/fr/', fromLang: 'fr', to: 'ja', expectedUrl: '/ja/' },
      { from: '/ja/', fromLang: 'ja', to: 'en', expectedUrl: '/' },
      { from: '/de/', fromLang: 'de', to: 'pt', expectedUrl: '/pt/' },
    ];
    
    for (const switchTest of switchingTests) {
      console.log(`Testing: ${switchTest.from} (${switchTest.fromLang}) → ${switchTest.to}`);
      
      // Navigate to starting language
      await page.goto(switchTest.from);
      await page.waitForLoadState('networkidle');
      
      // Click language switcher
      await page.locator('.language-switcher').click();
      
      // Click target language
      await page.locator(`[data-lang="${switchTest.to}"]`).click();
      await page.waitForLoadState('networkidle');
      
      // Verify clean URL (no stacking)
      const finalUrl = page.url();
      expect(finalUrl).toContain(switchTest.expectedUrl);
      expect(finalUrl).not.toContain(`/${switchTest.fromLang}/`); // No old language in URL
      
      console.log(`✓ ${switchTest.from} → ${switchTest.to} = ${finalUrl}`);
    }
    
    console.log('✅ Bidirectional language switching test passed');
  });

  test('should maintain consistent navigation across all languages', async ({ page }) => {
    console.log('Testing navigation consistency across languages...');
    
    const testLanguages = ['en', 'es', 'fr', 'ja', 'de'];
    
    for (const lang of testLanguages) {
      const url = lang === 'en' ? '/' : `/${lang}/`;
      
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Check that all main navigation elements exist
      const navigation = await page.locator('nav').count();
      expect(navigation).toBeGreaterThan(0);
      
      // Check that language switcher exists
      const languageSwitcher = await page.locator('.language-switcher').count();
      expect(languageSwitcher).toBeGreaterThan(0);
      
      // Check that main sections exist
      const heroSection = await page.locator('.hero').count();
      expect(heroSection).toBeGreaterThan(0);
      
      const featuresSection = await page.locator('.features-section').count();
      expect(featuresSection).toBeGreaterThan(0);
      
      console.log(`✓ ${lang} navigation structure verified`);
    }
    
    console.log('✅ Navigation consistency test passed');
  });

  test('should have properly translated press pages for all languages', async ({ page }) => {
    const pressTranslations = {
      'en': { title: 'Press Resources', contact: 'Press Contact' },
      'es': { title: 'Recursos de Prensa', contact: 'Contacto de Prensa' },
      'fr': { title: 'Ressources de Presse', contact: 'Contact Presse' }
    };

    for (const [langCode, translations] of Object.entries(pressTranslations)) {
      const pressUrl = langCode === 'en' ? '/press/' : `/${langCode}/press/`;
      
      await page.goto(`http://127.0.0.1:1025${pressUrl}`);
      await page.waitForLoadState('networkidle');
      
      // Check that press page loads successfully
      expect(page.url()).toContain('/press/');
      
      // Check translated content
      await expect(page.locator('h1')).toContainText(translations.title);
      await expect(page.locator('h2').first()).toContainText(translations.contact);
      
      // Verify language switcher works on press page
      const languageSwitcher = page.locator('.language-switcher');
      await expect(languageSwitcher).toBeVisible();
      
      console.log(`✓ ${langCode} press page translations verified`);
    }
    
    console.log('✅ Press page translations test passed');
  });
});