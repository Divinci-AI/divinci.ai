# Test info

- Name: Core Language Tests for Divinci AI >> should access all supported languages via direct URL and display translated nav labels
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/language-core.test.ts:28:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-vHQaQh --remote-debugging-pipe --no-startup-window
<launched> pid=60833
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-vHQaQh --remote-debugging-pipe --no-startup-window
  - <launched> pid=60833

```

# Test source

```ts
   1 | /**
   2 |  * Core Language Tests for Divinci AI
   3 |  *
   4 |  * Tests the main language functionality focusing on the four supported languages:
   5 |  * - English (en)
   6 |  * - Spanish (es)
   7 |  * - French (fr)
   8 |  * - Arabic (ar)
   9 |  */
  10 |
  11 | import { test, expect } from '@playwright/test';
  12 | import { LanguageHelper, SUPPORTED_LANGUAGES } from '../utils/LanguageHelper';
  13 |
  14 | const EXPECTED_NAV_LABELS: Record<string, string[]> = {
  15 |   en: ['Features', 'Team', 'Sign Up'],
  16 |   es: ['Características', 'Equipo', 'Regístrate'],
  17 |   fr: ['Fonctionnalités', 'Équipe', "S'inscrire"],
  18 |   ar: ['الميزات', 'الفريق', 'التسجيل'],
  19 | };
  20 |
  21 | test.describe('Core Language Tests for Divinci AI', () => {
  22 |   let helper: LanguageHelper;
  23 |
  24 |   test.beforeEach(async ({ page }) => {
  25 |     helper = new LanguageHelper(page);
  26 |   });
  27 |
> 28 |   test('should access all supported languages via direct URL and display translated nav labels', async ({ page }) => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  29 |     for (const lang of SUPPORTED_LANGUAGES) {
  30 |       await helper.goToLanguage(lang.code);
  31 |       const labels = EXPECTED_NAV_LABELS[lang.code];
  32 |       for (let i = 0; i < labels.length; i++) {
  33 |         await expect(page.locator('.nav-menu a').nth(i)).toHaveText(labels[i]);
  34 |       }
  35 |       const isRtl = await helper.isRtl();
  36 |       expect(isRtl).toBe(!!lang.rtl);
  37 |     }
  38 |   });
  39 |
  40 |   test('should change language via switcher and update nav labels accordingly', async ({ page }) => {
  41 |     await helper.goToLanguage('en');
  42 |     for (const lang of SUPPORTED_LANGUAGES) {
  43 |       if (lang.default) continue;
  44 |       await helper.switchLanguage(lang.code);
  45 |       await expect(page).toHaveURL(new RegExp(`/${lang.code}/`));
  46 |       const labels = EXPECTED_NAV_LABELS[lang.code];
  47 |       for (let i = 0; i < labels.length; i++) {
  48 |         await expect(page.locator('.nav-menu a').nth(i)).toHaveText(labels[i]);
  49 |       }
  50 |       const isRtl = await helper.isRtl();
  51 |       expect(isRtl).toBe(!!lang.rtl);
  52 |     }
  53 |   });
  54 | });
```