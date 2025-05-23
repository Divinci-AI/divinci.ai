# Test info

- Name: Navigation to non-existent language should fallback to default
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/direct-language-navigation.test.js:137:1

# Error details

```
Error: browserType.launch: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Run "npx playwright install chrome"
```

# Test source

```ts
   37 |     if (lang.code === 'en') {
   38 |       expect(page.url()).not.toContain('/es/');
   39 |       expect(page.url()).not.toContain('/fr/');
   40 |       expect(page.url()).not.toContain('/ar/');
   41 |     } else {
   42 |       expect(page.url()).toContain(`/${lang.code}/`);
   43 |     }
   44 |
   45 |     // Verify that the HTML lang attribute is set correctly
   46 |     const htmlLang = await page.evaluate(() => document.documentElement.lang);
   47 |     expect(htmlLang).toBe(lang.code);
   48 |
   49 |     // Verify that the HTML dir attribute is set correctly
   50 |     const htmlDir = await page.evaluate(() => document.documentElement.dir);
   51 |     expect(htmlDir).toBe(lang.dir);
   52 |
   53 |     // Skip the language switcher check as it might not be loaded yet
   54 |     // This is a separate test concern
   55 |   }
   56 | });
   57 |
   58 | // Test navigation between languages using direct URLs
   59 | test('Navigation between languages using direct URLs should work', async ({ page }) => {
   60 |   // Start with English
   61 |   await page.goto(config.baseUrl);
   62 |
   63 |   // Wait for the page to load
   64 |   await page.waitForSelector('h1');
   65 |
   66 |   // Take a screenshot
   67 |   await page.screenshot({ path: 'test-results/start-english.png' });
   68 |
   69 |   // Navigate to Spanish
   70 |   await page.goto(`${config.baseUrl}/es/`);
   71 |
   72 |   // Wait for the page to load
   73 |   await page.waitForSelector('h1');
   74 |
   75 |   // Take a screenshot
   76 |   await page.screenshot({ path: 'test-results/navigate-spanish.png' });
   77 |
   78 |   // Verify that the URL contains the language code
   79 |   expect(page.url()).toContain('/es/');
   80 |
   81 |   // Verify that the HTML lang attribute is set correctly
   82 |   const htmlLangEs = await page.evaluate(() => document.documentElement.lang);
   83 |   expect(htmlLangEs).toBe('es');
   84 |
   85 |   // Navigate to French
   86 |   await page.goto(`${config.baseUrl}/fr/`);
   87 |
   88 |   // Wait for the page to load
   89 |   await page.waitForSelector('h1');
   90 |
   91 |   // Take a screenshot
   92 |   await page.screenshot({ path: 'test-results/navigate-french.png' });
   93 |
   94 |   // Verify that the URL contains the language code
   95 |   expect(page.url()).toContain('/fr/');
   96 |
   97 |   // Verify that the HTML lang attribute is set correctly
   98 |   const htmlLangFr = await page.evaluate(() => document.documentElement.lang);
   99 |   expect(htmlLangFr).toBe('fr');
  100 |
  101 |   // Navigate to Arabic
  102 |   await page.goto(`${config.baseUrl}/ar/`);
  103 |
  104 |   // Wait for the page to load
  105 |   await page.waitForSelector('h1');
  106 |
  107 |   // Take a screenshot
  108 |   await page.screenshot({ path: 'test-results/navigate-arabic.png' });
  109 |
  110 |   // Verify that the URL contains the language code
  111 |   expect(page.url()).toContain('/ar/');
  112 |
  113 |   // Verify that the HTML lang attribute is set correctly
  114 |   const htmlLangAr = await page.evaluate(() => document.documentElement.lang);
  115 |   expect(htmlLangAr).toBe('ar');
  116 |
  117 |   // Navigate back to English
  118 |   await page.goto(config.baseUrl);
  119 |
  120 |   // Wait for the page to load
  121 |   await page.waitForSelector('h1');
  122 |
  123 |   // Take a screenshot
  124 |   await page.screenshot({ path: 'test-results/navigate-back-english.png' });
  125 |
  126 |   // Verify that the URL does not contain any language code
  127 |   expect(page.url()).not.toContain('/es/');
  128 |   expect(page.url()).not.toContain('/fr/');
  129 |   expect(page.url()).not.toContain('/ar/');
  130 |
  131 |   // Verify that the HTML lang attribute is set correctly
  132 |   const htmlLangEn = await page.evaluate(() => document.documentElement.lang);
  133 |   expect(htmlLangEn).toBe('en');
  134 | });
  135 |
  136 | // Test navigation to non-existent language
> 137 | test('Navigation to non-existent language should fallback to default', async ({ page }) => {
      | ^ Error: browserType.launch: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
  138 |   // Navigate to a non-existent language
  139 |   await page.goto(`${config.baseUrl}/de/`);
  140 |
  141 |   // Wait for the page to load
  142 |   await page.waitForTimeout(2000);
  143 |
  144 |   // Take a screenshot
  145 |   await page.screenshot({ path: 'test-results/non-existent-language.png' });
  146 |
  147 |   // Check the current URL and language
  148 |   console.log(`Current URL: ${page.url()}`);
  149 |
  150 |   const htmlLang = await page.evaluate(() => document.documentElement.lang || 'not-set');
  151 |   console.log(`HTML lang attribute: ${htmlLang}`);
  152 | });
  153 |
```