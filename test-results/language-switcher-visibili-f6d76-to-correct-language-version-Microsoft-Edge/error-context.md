# Test info

- Name: Clicking language options navigates to correct language version
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/language-switcher-visibility.test.js:81:5

# Error details

```
Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
Run "npx playwright install msedge"
```

# Test source

```ts
   1 | /**
   2 |  * Language Switcher Visibility Test
   3 |  * 
   4 |  * Tests that the language switcher is visible on all language versions of the site
   5 |  */
   6 |
   7 | import { test, expect } from '@playwright/test';
   8 |
   9 | // Configuration for supported languages
   10 | const languages = [
   11 |   { code: 'en', name: 'English', path: '/' },
   12 |   { code: 'es', name: 'Spanish', path: '/es/' },
   13 |   { code: 'fr', name: 'French', path: '/fr/' },
   14 |   { code: 'ar', name: 'Arabic', path: '/ar/', rtl: true }
   15 | ];
   16 |
   17 | // Base URL for testing
   18 | const baseUrl = 'http://localhost:8001';
   19 |
   20 | // Test that the language switcher is visible on all language versions
   21 | test('Language switcher should be visible on all language versions', async ({ page }) => {
   22 |   for (const lang of languages) {
   23 |     // Construct the full URL for this language
   24 |     const url = `${baseUrl}${lang.path}`;
   25 |     console.log(`Testing language switcher visibility on ${lang.name} site: ${url}`);
   26 |     
   27 |     // Navigate to the language-specific version
   28 |     await page.goto(url, { 
   29 |       timeout: 30000,
   30 |       waitUntil: 'domcontentloaded'
   31 |     });
   32 |     
   33 |     // Take a screenshot for debugging
   34 |     await page.screenshot({ 
   35 |       path: `test-results/language-switcher-${lang.code}.png`,
   36 |       fullPage: false 
   37 |     });
   38 |     
   39 |     // Check if language switcher is visible
   40 |     const languageSwitcher = page.locator('.language-switcher');
   41 |     await expect(languageSwitcher).toBeVisible({ timeout: 5000 });
   42 |     
   43 |     // Check that the current language display is correct
   44 |     const currentLanguage = page.locator('.language-switcher-current .current-language');
   45 |     await expect(currentLanguage).toBeVisible({ timeout: 2000 });
   46 |     
   47 |     // Optional: Verify the language name is displayed correctly
   48 |     const languageNames = {
   49 |       'en': 'English',
   50 |       'es': 'Español',
   51 |       'fr': 'Français',
   52 |       'ar': 'العربية'
   53 |     };
   54 |     
   55 |     const expectedLanguage = languageNames[lang.code];
   56 |     const currentLangText = await currentLanguage.textContent();
   57 |     console.log(`Current language text: "${currentLangText}", Expected: "${expectedLanguage}"`);
   58 |     
   59 |     // Test clicking the language switcher opens the dropdown
   60 |     await languageSwitcher.locator('.language-switcher-current').click();
   61 |     
   62 |     // Verify the dropdown appears
   63 |     const dropdown = page.locator('.language-switcher-dropdown');
   64 |     await expect(dropdown).toBeVisible({ timeout: 3000 });
   65 |     
   66 |     // Take a screenshot with open dropdown for debugging
   67 |     await page.screenshot({ 
   68 |       path: `test-results/language-switcher-dropdown-${lang.code}.png`,
   69 |       fullPage: false 
   70 |     });
   71 |     
   72 |     // Check all language options are in the dropdown
   73 |     for (const option of languages) {
   74 |       const langOption = page.locator(`.language-option[data-lang="${option.code}"]`);
   75 |       await expect(langOption).toBeVisible({ timeout: 2000 });
   76 |     }
   77 |   }
   78 | });
   79 |
   80 | // Test that clicking language options works on the current page
>  81 | test('Clicking language options navigates to correct language version', async ({ page }) => {
      |     ^ Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
   82 |   // Start with English
   83 |   await page.goto(`${baseUrl}/`, { 
   84 |     timeout: 30000,
   85 |     waitUntil: 'domcontentloaded'
   86 |   });
   87 |   
   88 |   // Open language switcher dropdown
   89 |   const languageSwitcher = page.locator('.language-switcher');
   90 |   await languageSwitcher.locator('.language-switcher-current').click();
   91 |   
   92 |   // Wait for dropdown to be visible
   93 |   const dropdown = page.locator('.language-switcher-dropdown');
   94 |   await expect(dropdown).toBeVisible({ timeout: 3000 });
   95 |   
   96 |   // Click Spanish language option
   97 |   await page.locator('.language-option[data-lang="es"]').click();
   98 |   
   99 |   // Verify URL contains Spanish path
  100 |   await page.waitForURL('**/es/**', { timeout: 30000 });
  101 |   expect(page.url()).toContain('/es/');
  102 |   
  103 |   // Check that Spanish language switcher is visible
  104 |   await expect(page.locator('.language-switcher')).toBeVisible({ timeout: 5000 });
  105 |   
  106 |   // Verify the current language display shows Spanish
  107 |   const currentLanguage = page.locator('.language-switcher-current .current-language');
  108 |   const currentLangText = await currentLanguage.textContent();
  109 |   console.log(`After navigation, current language text: "${currentLangText}"`);
  110 | });
```