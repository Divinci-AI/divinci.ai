# Test info

- Name: Content should be different for all supported languages
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/direct-language-navigation-content.test.js:78:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /Users/mikeumus/Documents/divinci.ai/.tmp/playwright_firefoxdev_profile-HofGt3 -juggler-pipe -silent
<launched> pid=60570
[pid=60570][err] *** You are running in headless mode.
[pid=60570] <process did exit: exitCode=null, signal=SIGABRT>
[pid=60570] starting temporary directories cleanup
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /Users/mikeumus/Documents/divinci.ai/.tmp/playwright_firefoxdev_profile-HofGt3 -juggler-pipe -silent
  - <launched> pid=60570
  - [pid=60570][err] *** You are running in headless mode.
  - [pid=60570] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=60570] starting temporary directories cleanup

```

# Test source

```ts
   1 | /**
   2 |  * Direct Language Navigation Content Tests
   3 |  *
   4 |  * This file contains tests to verify that the content is different when directly navigating to different language versions.
   5 |  */
   6 |
   7 | const { test, expect } = require('@playwright/test');
   8 |
   9 | // Configuration
   10 | const config = {
   11 |   languages: [
   12 |     { code: 'en', name: 'English', dir: 'ltr', default: true },
   13 |     { code: 'es', name: 'Español', dir: 'ltr' },
   14 |     { code: 'fr', name: 'Français', dir: 'ltr' },
   15 |     { code: 'ar', name: 'العربية', dir: 'rtl' }
   16 |   ],
   17 |   baseUrl: 'http://localhost:8001'
   18 | };
   19 |
   20 | // Test that the content is different when directly navigating to different language versions
   21 | test('Content should be different when directly navigating to different language versions', async ({ page }) => {
   22 |   // Go to the English version
   23 |   await page.goto(config.baseUrl);
   24 |   
   25 |   // Wait for the page to load
   26 |   await page.waitForSelector('.signup-button');
   27 |   
   28 |   // Get the text of the navigation links in English
   29 |   const englishFeaturesText = await page.textContent('a[href="#features"]');
   30 |   const englishTeamText = await page.textContent('a[href="#team"]');
   31 |   const englishSignUpText = await page.textContent('.signup-button');
   32 |   
   33 |   console.log('English texts:', {
   34 |     features: englishFeaturesText,
   35 |     team: englishTeamText,
   36 |     signUp: englishSignUpText
   37 |   });
   38 |   
   39 |   // Take a screenshot of the English version
   40 |   await page.screenshot({ path: 'test-results/direct-navigation-english.png' });
   41 |   
   42 |   // Go to the Spanish version
   43 |   await page.goto(`${config.baseUrl}/es/`);
   44 |   
   45 |   // Wait for the page to load
   46 |   await page.waitForSelector('.signup-button');
   47 |   
   48 |   // Get the text of the navigation links in Spanish
   49 |   const spanishFeaturesText = await page.textContent('a[href="#features"]');
   50 |   const spanishTeamText = await page.textContent('a[href="#team"]');
   51 |   const spanishSignUpText = await page.textContent('.signup-button');
   52 |   
   53 |   console.log('Spanish texts:', {
   54 |     features: spanishFeaturesText,
   55 |     team: spanishTeamText,
   56 |     signUp: spanishSignUpText
   57 |   });
   58 |   
   59 |   // Take a screenshot of the Spanish version
   60 |   await page.screenshot({ path: 'test-results/direct-navigation-spanish.png' });
   61 |   
   62 |   // Verify that the text is different
   63 |   expect(spanishFeaturesText).not.toBe(englishFeaturesText);
   64 |   expect(spanishTeamText).not.toBe(englishTeamText);
   65 |   expect(spanishSignUpText).not.toBe(englishSignUpText);
   66 |   
   67 |   // Verify that the Spanish text matches the expected translations
   68 |   expect(spanishFeaturesText).toBe('Características');
   69 |   expect(spanishTeamText).toBe('Equipo');
   70 |   expect(spanishSignUpText).toBe('Registrarse');
   71 |   
   72 |   // Check that the HTML lang attribute is set correctly
   73 |   const htmlLang = await page.evaluate(() => document.documentElement.lang);
   74 |   expect(htmlLang).toBe('es');
   75 | });
   76 |
   77 | // Test that the content is different for all supported languages
>  78 | test('Content should be different for all supported languages', async ({ page }) => {
      | ^ Error: browserType.launch: Target page, context or browser has been closed
   79 |   // Expected translations for the navigation links
   80 |   const expectedTranslations = {
   81 |     en: {
   82 |       features: 'Features',
   83 |       team: 'Team',
   84 |       signUp: 'Sign Up'
   85 |     },
   86 |     es: {
   87 |       features: 'Características',
   88 |       team: 'Equipo',
   89 |       signUp: 'Registrarse'
   90 |     },
   91 |     fr: {
   92 |       features: 'Fonctionnalités',
   93 |       team: 'Équipe',
   94 |       signUp: 'S\'inscrire'
   95 |     },
   96 |     ar: {
   97 |       features: 'الميزات',
   98 |       team: 'الفريق',
   99 |       signUp: 'التسجيل'
  100 |     }
  101 |   };
  102 |   
  103 |   // Test each language
  104 |   for (const lang of config.languages) {
  105 |     // Go to the language-specific version
  106 |     await page.goto(`${config.baseUrl}${lang.code === 'en' ? '' : `/${lang.code}/`}`);
  107 |     
  108 |     // Wait for the page to load
  109 |     await page.waitForSelector('.signup-button');
  110 |     
  111 |     // Get the text of the navigation links
  112 |     const featuresText = await page.textContent('a[href="#features"]');
  113 |     const teamText = await page.textContent('a[href="#team"]');
  114 |     const signUpText = await page.textContent('.signup-button');
  115 |     
  116 |     console.log(`${lang.name} texts:`, {
  117 |       features: featuresText,
  118 |       team: teamText,
  119 |       signUp: signUpText
  120 |     });
  121 |     
  122 |     // Take a screenshot
  123 |     await page.screenshot({ path: `test-results/direct-navigation-${lang.code}.png` });
  124 |     
  125 |     // Verify that the text matches the expected translations
  126 |     expect(featuresText).toBe(expectedTranslations[lang.code].features);
  127 |     expect(teamText).toBe(expectedTranslations[lang.code].team);
  128 |     expect(signUpText).toBe(expectedTranslations[lang.code].signUp);
  129 |     
  130 |     // Verify that the HTML lang attribute is set correctly
  131 |     const htmlLang = await page.evaluate(() => document.documentElement.lang);
  132 |     expect(htmlLang).toBe(lang.code);
  133 |     
  134 |     // Verify that the HTML dir attribute is set correctly
  135 |     const htmlDir = await page.evaluate(() => document.documentElement.dir);
  136 |     expect(htmlDir).toBe(lang.dir);
  137 |   }
  138 | });
  139 |
```