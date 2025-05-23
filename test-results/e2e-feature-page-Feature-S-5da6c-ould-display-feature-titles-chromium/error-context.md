# Test info

- Name: Feature Section >> should display feature titles
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/feature-page.test.ts:13:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-7DWZgE --remote-debugging-pipe --no-startup-window
<launched> pid=60536
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-7DWZgE --remote-debugging-pipe --no-startup-window
  - <launched> pid=60536

```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { FeaturePage } from '../page-objects/FeaturePage';
   3 |
   4 | test.describe('Feature Section', () => {
   5 |   let feature: FeaturePage;
   6 |
   7 |   test.beforeEach(async ({ page }) => {
   8 |     feature = new FeaturePage(page);
   9 |     await page.goto('/');
  10 |     await feature.scrollToFeaturesSection();
  11 |   });
  12 |
> 13 |   test('should display feature titles', async () => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  14 |     const titles = await feature.getAllFeatureNames();
  15 |     expect(titles.length).toBeGreaterThan(0);
  16 |     for (const t of titles) expect(t).not.toBe('');
  17 |   });
  18 |
  19 |   test('should navigate to feature detail and show consumer and company content', async () => {
  20 |     const titles = await feature.getAllFeatureNames();
  21 |     const firstTitle = titles[0];
  22 |     await feature.goToFeatureDetailPage(firstTitle);
  23 |     await expect(feature.isFeatureDetailPage()).resolves.toBeTruthy();
  24 |     const consumerText = await feature.getConsumerViewText(firstTitle);
  25 |     const companyText = await feature.getCompanyViewText(firstTitle);
  26 |     expect(consumerText).not.toBe('');
  27 |     expect(companyText).not.toBe('');
  28 |   });
  29 | });
```