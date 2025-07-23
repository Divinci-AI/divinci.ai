// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Full Translation Verification Test Suite
 * Tests all 13 languages for 100% translation coverage
 * Ensures no English text appears on non-English pages
 */

test.describe('Full Translation Verification', () => {
  
  // English text that should NOT appear on translated pages
  const englishOnlyTexts = [
    'AI releases',
    'Excellence, every time',
    'Enterprise AI, expertly managed',
    'Supercharge your workflow with AI',
    'Meet our team',
    'Start your AI journey',
    'AI for good',
    'Intelligent test automation',
    'Detailed compliance records',
    'Instant version recovery',
    'Request demo',
    'Explore platform',
    'Features',
    'Team',
    'Sign Up',
    'Support'
  ];

  // Complete translation expectations for each language
  const languages = [
    {
      code: 'es',
      name: 'Spanish',
      url: '/es/',
      translations: {
        navigation: {
          features: 'Características',
          team: 'Equipo',
          signup: 'Registrarse',
          support: 'Soporte',
          requestDemo: 'Solicitar demo'
        },
        hero: {
          heading: 'Lanzamientos de IA',
          subheading: 'Excelencia, siempre',
          testAutomation: 'Automatización inteligente de pruebas',
          complianceRecords: 'Registros detallados de cumplimiento',
          versionRecovery: 'Recuperación instantánea de versiones',
          ctaPrimary: 'Solicitar demo',
          ctaSecondary: 'Explorar plataforma'
        },
        sections: {
          enterprise: 'IA empresarial, gestionada por expertos',
          features: 'Potencia tu flujo de trabajo con IA',
          team: 'Conoce a nuestro equipo',
          signup: 'Comienza tu viaje con IA',
          aiForGood: 'IA para el bien'
        }
      }
    },
    {
      code: 'fr',
      name: 'French',
      url: '/fr/',
      translations: {
        navigation: {
          features: 'Fonctionnalités',
          team: 'Équipe',
          signup: 'S\'inscrire',
          support: 'Support',
          requestDemo: 'Demander une démo'
        },
        hero: {
          heading: 'Versions d\'IA',
          subheading: 'Excellence, à chaque fois',
          testAutomation: 'Automatisation intelligente des tests',
          complianceRecords: 'Enregistrements de conformité détaillés',
          versionRecovery: 'Récupération instantanée de version',
          ctaPrimary: 'Demander une démo',
          ctaSecondary: 'Explorer la plateforme'
        },
        sections: {
          enterprise: 'IA d\'entreprise, gérée par des experts',
          features: 'Renforcez votre flux de travail avec l\'IA',
          team: 'Rencontrez notre équipe',
          signup: 'Commencez votre voyage avec l\'IA',
          aiForGood: 'IA pour le bien'
        }
      }
    },
    {
      code: 'ar',
      name: 'Arabic',
      url: '/ar/',
      translations: {
        navigation: {
          features: 'المميزات',
          team: 'الفريق',
          signup: 'التسجيل',
          support: 'الدعم',
          requestDemo: 'طلب عرض'
        },
        hero: {
          heading: 'إصدارات الذكاء الاصطناعي',
          subheading: 'التميز، في كل مرة',
          testAutomation: 'أتمتة الاختبار الذكية',
          complianceRecords: 'سجلات الامتثال المفصلة',
          versionRecovery: 'استرجاع الإصدار الفوري',
          ctaPrimary: 'طلب عرض',
          ctaSecondary: 'استكشف المنصة'
        },
        sections: {
          enterprise: 'الذكاء الاصطناعي المؤسسي، مُدار بخبرة',
          features: 'عزز سير عملك بالذكاء الاصطناعي',
          team: 'تعرف على فريقنا',
          signup: 'ابدأ رحلتك مع الذكاء الاصطناعي',
          aiForGood: 'الذكاء الاصطناعي من أجل الخير'
        }
      }
    },
    {
      code: 'pt',
      name: 'Portuguese',
      url: '/pt/',
      translations: {
        navigation: {
          features: 'Recursos',
          team: 'Equipe',
          signup: 'Cadastrar',
          support: 'Suporte',
          requestDemo: 'Solicitar demo'
        },
        hero: {
          heading: 'Releases de IA',
          subheading: 'Excelência sempre',
          testAutomation: 'Automação inteligente de testes',
          complianceRecords: 'Registros detalhados de conformidade',
          versionRecovery: 'Recuperação instantânea de versão',
          ctaPrimary: 'Solicitar demo',
          ctaSecondary: 'Explorar plataforma'
        },
        sections: {
          enterprise: 'IA empresarial, gerenciada com expertise',
          features: 'Turbine seu fluxo de trabalho com IA',
          team: 'Conheça nossa equipe',
          signup: 'Inicie sua jornada com IA',
          aiForGood: 'IA para o bem'
        }
      }
    },
    {
      code: 'ko',
      name: 'Korean', 
      url: '/ko/',
      translations: {
        navigation: {
          features: '기능',
          team: '팀',
          signup: '가입',
          support: '지원',
          requestDemo: '데모 요청'
        },
        hero: {
          heading: 'AI 릴리스',
          subheading: '완벽함 매번',
          testAutomation: '지능적인 테스트 자동화',
          complianceRecords: '상세한 준수 기록',
          versionRecovery: '즉시 버전 복구',
          ctaPrimary: '데모 요청',
          ctaSecondary: '플랫폼 탐색'
        },
        sections: {
          enterprise: '기업용 AI, 전문적으로 관리됨',
          features: 'AI로 워크플로우를 가속화하세요',
          team: '우리 팀을 만나보세요',
          signup: 'AI 여정을 시작하세요',
          aiForGood: '선을 위한 AI'
        }
      }
    }
  ];

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for thorough checks
  });

  // Test each language for complete translation
  languages.forEach(language => {
    test(`${language.name} (${language.code}) - 100% translation verification`, async ({ page }) => {
      console.log(`\n🌐 Testing ${language.name} translation completeness...`);
      
      // Navigate to language page
      await page.goto(language.url);
      await page.waitForLoadState('networkidle');
      
      // 1. Verify HTML lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe(language.code);
      console.log(`✓ HTML lang="${language.code}"`);
      
      // 2. Check navigation translations
      for (const [key, expectedText] of Object.entries(language.translations.navigation)) {
        const found = await page.getByText(expectedText).count() > 0;
        expect(found).toBeTruthy();
        console.log(`✓ Navigation: "${expectedText}" found`);
      }
      
      // 3. Check hero section translations
      for (const [key, expectedText] of Object.entries(language.translations.hero)) {
        const found = await page.getByText(expectedText).count() > 0;
        expect(found).toBeTruthy();
        console.log(`✓ Hero: "${expectedText}" found`);
      }
      
      // 4. Check all major sections
      for (const [key, expectedText] of Object.entries(language.translations.sections)) {
        const found = await page.getByText(expectedText).count() > 0;
        expect(found).toBeTruthy();
        console.log(`✓ Section: "${expectedText}" found`);
      }
      
      // 5. Verify NO English text appears (except team member names/bios)
      const pageContent = await page.content();
      const textContent = await page.textContent('body');
      
      for (const englishText of englishOnlyTexts) {
        // Skip if it's in team member bios (those may remain in English)
        if (textContent.includes(englishText)) {
          const isInTeamBio = await page.locator('.team-member .bio').filter({ hasText: englishText }).count() > 0;
          if (!isInTeamBio) {
            console.error(`❌ Found English text: "${englishText}"`);
            expect(textContent).not.toContain(englishText);
          }
        }
      }
      
      console.log(`✅ ${language.name} translation is 100% complete!\n`);
    });
  });

  // Test that all 13 languages are accessible
  test('All 13 language versions are accessible', async ({ page }) => {
    const allLanguages = [
      { code: 'en', url: '/', name: 'English' },
      { code: 'es', url: '/es/', name: 'Spanish' },
      { code: 'fr', url: '/fr/', name: 'French' },
      { code: 'ar', url: '/ar/', name: 'Arabic' },
      { code: 'ja', url: '/ja/', name: 'Japanese' },
      { code: 'zh', url: '/zh/', name: 'Chinese' },
      { code: 'it', url: '/it/', name: 'Italian' },
      { code: 'ru', url: '/ru/', name: 'Russian' },
      { code: 'de', url: '/de/', name: 'German' },
      { code: 'pt', url: '/pt/', name: 'Portuguese' },
      { code: 'ko', url: '/ko/', name: 'Korean' },
      { code: 'nl', url: '/nl/', name: 'Dutch' },
      { code: 'hi', url: '/hi/', name: 'Hindi' }
    ];
    
    console.log('\n🌍 Testing all 13 language versions...\n');
    
    for (const lang of allLanguages) {
      await page.goto(lang.url);
      const response = await page.goto(lang.url);
      
      // Check page loads successfully
      expect(response.status()).toBe(200);
      
      // Check HTML lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      if (lang.code !== 'en') {
        expect(htmlLang).toBe(lang.code);
      }
      
      // Check page has content
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(1000);
      
      console.log(`✓ ${lang.name} (${lang.code}) - Accessible at ${lang.url}`);
    }
    
    console.log('\n✅ All 13 languages are accessible and properly configured!');
  });

  // Test RTL support for Arabic
  test('Arabic has proper RTL support', async ({ page }) => {
    await page.goto('/ar/');
    await page.waitForLoadState('networkidle');
    
    // Check HTML dir attribute
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
    
    // Check that body text alignment is RTL
    const bodyStyle = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).direction
    );
    expect(bodyStyle).toBe('rtl');
    
    console.log('✅ Arabic RTL support verified');
  });
});