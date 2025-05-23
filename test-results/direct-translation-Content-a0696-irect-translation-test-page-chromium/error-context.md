# Test info

- Name: Content should change on the direct translation test page
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/direct-translation.test.js:21:1

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-QPbfAY --remote-debugging-pipe --no-startup-window
<launched> pid=60524
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-QPbfAY --remote-debugging-pipe --no-startup-window
  - <launched> pid=60524

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
     | ^ Error: browserType.launch: Target page, context or browser has been closed
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