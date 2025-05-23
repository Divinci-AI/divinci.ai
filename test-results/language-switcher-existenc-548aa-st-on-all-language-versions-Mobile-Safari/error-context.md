# Test info

- Name: Language switcher should exist on all language versions
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/language-switcher-existence.test.js:18:5

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/webkit-2158/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=60985
[pid=60985][err] /Users/mikeumus/Library/Caches/ms-playwright/webkit-2158/pw_run.sh: line 7: 60991 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/webkit-2158/pw_run.sh --inspector-pipe --headless --no-startup-window
  - <launched> pid=60985
  - [pid=60985][err] /Users/mikeumus/Library/Caches/ms-playwright/webkit-2158/pw_run.sh: line 7: 60991 Abort trap: 6           DYLD_FRAMEWORK_PATH="$DYLIB_PATH" DYLD_LIBRARY_PATH="$DYLIB_PATH" "$PLAYWRIGHT" "$@"

```

# Test source

```ts
   1 | /**
   2 |  * Language Switcher Existence Test
   3 |  * 
   4 |  * Tests that the language switcher exists and is visible on all language versions of the site
   5 |  */
   6 |
   7 | import { test, expect } from '@playwright/test';
   8 |
   9 | // Configuration for supported languages
   10 | const languages = [
   11 |   { code: 'en', name: 'English', path: '/' },
   12 |   { code: 'es', name: 'Spanish', path: '/es/' },
   13 |   { code: 'fr', name: 'French', path: '/fr/' },
   14 |   { code: 'ar', name: 'Arabic', path: '/ar/' }
   15 | ];
   16 |
   17 | // Test that the language switcher exists on all language versions
>  18 | test('Language switcher should exist on all language versions', async ({ page }) => {
      |     ^ Error: browserType.launch: Target page, context or browser has been closed
   19 |   // Check each language version
   20 |   for (const lang of languages) {
   21 |     // Construct the URL
   22 |     const url = `http://localhost:61443${lang.path}`;
   23 |     console.log(`Testing language switcher existence on ${lang.name} site: ${url}`);
   24 |     
   25 |     // Navigate to the language version
   26 |     await page.goto(url, { 
   27 |       timeout: 30000,
   28 |       waitUntil: 'domcontentloaded'
   29 |     });
   30 |     
   31 |     // Take a screenshot for debugging
   32 |     await page.screenshot({ 
   33 |       path: `test-results/language-switcher-${lang.code}.png`,
   34 |       fullPage: false 
   35 |     });
   36 |     
   37 |     // Check if the language switcher exists - both with class and ID selectors 
   38 |     // as implementations might differ
   39 |     const languageSwitcherByClass = page.locator('.language-switcher');
   40 |     const languageSwitcherById = page.locator('#language-switcher');
   41 |     
   42 |     // Log what we find
   43 |     const classExists = await languageSwitcherByClass.count() > 0;
   44 |     const idExists = await languageSwitcherById.count() > 0;
   45 |     console.log(`Lang: ${lang.code} - By class exists: ${classExists}, By ID exists: ${idExists}`);
   46 |     
   47 |     // Check the HTML structure for debugging
   48 |     const htmlContent = await page.content();
   49 |     const hasLanguageSwitcherText = htmlContent.includes('language-switcher');
   50 |     console.log(`HTML contains 'language-switcher' text: ${hasLanguageSwitcherText}`);
   51 |     
   52 |     // Assert that at least one selector finds the language switcher
   53 |     expect(classExists || idExists).toBeTruthy();
   54 |     
   55 |     // Check if any element with data-include attribute for language switcher exists
   56 |     const includeElement = page.locator('[data-include*="language-switcher.html"]');
   57 |     const includeExists = await includeElement.count() > 0;
   58 |     console.log(`Element with data-include for language switcher exists: ${includeExists}`);
   59 |     
   60 |     // Check which scripts related to language switching are loaded
   61 |     const scripts = await page.evaluate(() => {
   62 |       return Array.from(document.querySelectorAll('script'))
   63 |         .map(script => script.src)
   64 |         .filter(src => src.includes('language') || src.includes('include'))
   65 |         .map(src => src.split('/').pop());
   66 |     });
   67 |     console.log(`Language-related scripts loaded: ${scripts.join(', ') || 'none'}`);
   68 |   }
   69 | });
   70 |
   71 | // Test that the current language text in the switcher is correct
   72 | test('Current language in switcher should match page language', async ({ page }) => {
   73 |   for (const lang of languages) {
   74 |     // Navigate to the language version
   75 |     const url = `http://localhost:61443${lang.path}`;
   76 |     await page.goto(url, { timeout: 30000 });
   77 |     
   78 |     // Expected display text for the current language
   79 |     const expectedLanguageNames = {
   80 |       'en': 'English',
   81 |       'es': 'Español',
   82 |       'fr': 'Français',
   83 |       'ar': 'العربية'
   84 |     };
   85 |     
   86 |     // Try to find the current language element
   87 |     const currentLanguage = page.locator('.language-switcher-current .current-language');
   88 |     if (await currentLanguage.count() > 0) {
   89 |       // Get the displayed text
   90 |       const displayedText = await currentLanguage.textContent();
   91 |       console.log(`${lang.code}: Current language text is "${displayedText}"`);
   92 |       
   93 |       // Check if the language name contains the expected language name
   94 |       // The comparison is loose to handle cases where the format might differ slightly
   95 |       const expectedText = expectedLanguageNames[lang.code];
   96 |       
   97 |       // Check if one contains the other (case insensitive)
   98 |       const isMatch = 
   99 |         displayedText.toLowerCase().includes(expectedText.toLowerCase()) ||
  100 |         expectedText.toLowerCase().includes(displayedText.toLowerCase());
  101 |         
  102 |       expect(isMatch).toBeTruthy();
  103 |     } else {
  104 |       console.log(`${lang.code}: No current language element found`);
  105 |       // Taking a screenshot for debugging
  106 |       await page.screenshot({ path: `test-results/missing-language-text-${lang.code}.png` });
  107 |       
  108 |       // This is a failure case
  109 |       expect(false).toBeTruthy();
  110 |     }
  111 |   }
  112 | });
```