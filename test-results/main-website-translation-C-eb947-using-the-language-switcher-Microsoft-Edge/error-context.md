# Test info

- Name: Content should change when using the language switcher
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/main-website-translation.test.js:64:1

# Error details

```
Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
Run "npx playwright install msedge"
```

# Test source

```ts
   1 | /**
   2 |  * Main Website Translation Tests
   3 |  *
   4 |  * This file contains tests to verify that the content changes when switching languages on the main website.
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
   20 | // Test that the content changes when switching languages using the debug button
   21 | test('Content should change when clicking the Spanish debug button', async ({ page }) => {
   22 |   // Go to the homepage
   23 |   await page.goto(config.baseUrl);
   24 |   
   25 |   // Wait for the page to load
   26 |   await page.waitForSelector('.signup-button');
   27 |   
   28 |   // Get the text of the Sign Up button in English
   29 |   const englishSignUpText = await page.textContent('.signup-button');
   30 |   console.log('English Sign Up text:', englishSignUpText);
   31 |   
   32 |   // Take a screenshot of the English version
   33 |   await page.screenshot({ path: 'test-results/main-website-english.png' });
   34 |   
   35 |   // Click the debug button to go to Spanish version
   36 |   await page.click('button:has-text("Go to Spanish Version")');
   37 |   
   38 |   // Wait for navigation to complete
   39 |   await page.waitForURL('**/es/**');
   40 |   
   41 |   // Wait for the page to load
   42 |   await page.waitForSelector('.signup-button');
   43 |   
   44 |   // Wait for translations to be applied
   45 |   await page.waitForTimeout(1000);
   46 |   
   47 |   // Take a screenshot of the Spanish version
   48 |   await page.screenshot({ path: 'test-results/main-website-spanish.png' });
   49 |   
   50 |   // Get the text of the Sign Up button in Spanish
   51 |   const spanishSignUpText = await page.textContent('.signup-button');
   52 |   console.log('Spanish Sign Up text:', spanishSignUpText);
   53 |   
   54 |   // Verify that the text has changed
   55 |   expect(spanishSignUpText).not.toBe(englishSignUpText);
   56 |   expect(spanishSignUpText).toBe('Registrarse');
   57 |   
   58 |   // Check that the HTML lang attribute is set correctly
   59 |   const htmlLang = await page.evaluate(() => document.documentElement.lang);
   60 |   expect(htmlLang).toBe('es');
   61 | });
   62 |
   63 | // Test that the content changes when using the language switcher
>  64 | test('Content should change when using the language switcher', async ({ page }) => {
      | ^ Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
   65 |   // Go to the homepage
   66 |   await page.goto(config.baseUrl);
   67 |   
   68 |   // Wait for the page to load
   69 |   await page.waitForSelector('.signup-button');
   70 |   
   71 |   // Get the text of the Sign Up button in English
   72 |   const englishSignUpText = await page.textContent('.signup-button');
   73 |   console.log('English Sign Up text:', englishSignUpText);
   74 |   
   75 |   // Click the language switcher to open the dropdown
   76 |   await page.click('button:has-text("Toggle Language Dropdown")');
   77 |   
   78 |   // Wait for the dropdown to appear
   79 |   await page.waitForSelector('.language-switcher-dropdown:visible');
   80 |   
   81 |   // Take a screenshot of the open dropdown
   82 |   await page.screenshot({ path: 'test-results/main-website-language-switcher-open.png' });
   83 |   
   84 |   // Click on the Spanish option
   85 |   await page.click('.language-option[data-lang="es"]');
   86 |   
   87 |   // Wait for navigation to complete
   88 |   await page.waitForURL('**/es/**');
   89 |   
   90 |   // Wait for the page to load
   91 |   await page.waitForSelector('.signup-button');
   92 |   
   93 |   // Wait for translations to be applied
   94 |   await page.waitForTimeout(1000);
   95 |   
   96 |   // Get the text of the Sign Up button in Spanish
   97 |   const spanishSignUpText = await page.textContent('.signup-button');
   98 |   console.log('Spanish Sign Up text:', spanishSignUpText);
   99 |   
  100 |   // Verify that the text has changed
  101 |   expect(spanishSignUpText).not.toBe(englishSignUpText);
  102 |   expect(spanishSignUpText).toBe('Registrarse');
  103 |   
  104 |   // Check that the HTML lang attribute is set correctly
  105 |   const htmlLang = await page.evaluate(() => document.documentElement.lang);
  106 |   expect(htmlLang).toBe('es');
  107 | });
  108 |
```