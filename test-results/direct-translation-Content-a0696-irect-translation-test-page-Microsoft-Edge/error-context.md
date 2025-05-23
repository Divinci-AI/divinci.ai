# Test info

- Name: Content should change on the direct translation test page
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/direct-translation.test.js:21:1

# Error details

```
Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
Run "npx playwright install msedge"
```

# Test source

```ts
   1 | /**
   2 |  * Direct Translation Tests
   3 |  *
   4 |  * This file contains tests for the direct translation implementation.
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
  20 | // Test that the content changes on the direct translation test page
> 21 | test('Content should change on the direct translation test page', async ({ page }) => {
     | ^ Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
  22 |   // Go to the direct translation test page
  23 |   await page.goto(`${config.baseUrl}/direct-translation-test.html`);
  24 |   
  25 |   // Wait for the page to load
  26 |   await page.waitForSelector('#signup-text');
  27 |   
  28 |   // Get the initial text
  29 |   const initialSignUpText = await page.textContent('#signup-text');
  30 |   console.log('Initial Sign Up text:', initialSignUpText);
  31 |   
  32 |   // Click the Spanish button
  33 |   await page.click('button:has-text("Español")');
  34 |   
  35 |   // Wait for the language to change
  36 |   await page.waitForTimeout(500);
  37 |   
  38 |   // Get the text after changing the language
  39 |   const spanishSignUpText = await page.textContent('#signup-text');
  40 |   console.log('Spanish Sign Up text:', spanishSignUpText);
  41 |   
  42 |   // Verify that the text has changed
  43 |   expect(spanishSignUpText).not.toBe(initialSignUpText);
  44 |   expect(spanishSignUpText).toBe('Registrarse');
  45 |   
  46 |   // Check that the HTML lang attribute is set correctly
  47 |   const htmlLang = await page.evaluate(() => document.documentElement.lang);
  48 |   expect(htmlLang).toBe('es');
  49 |   
  50 |   // Check other translations
  51 |   const featuresText = await page.textContent('#features-text');
  52 |   const teamText = await page.textContent('#team-text');
  53 |   
  54 |   expect(featuresText).toBe('Características');
  55 |   expect(teamText).toBe('Equipo');
  56 | });
  57 |
```