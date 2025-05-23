# Test info

- Name: Signup Form >> should display the signup form and allow input
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/signup-form.test.ts:13:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-YkR8No --remote-debugging-pipe --no-startup-window
<launched> pid=60837
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-YkR8No --remote-debugging-pipe --no-startup-window
  - <launched> pid=60837

```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { SignupForm } from '../page-objects/SignupForm';
   3 |
   4 | test.describe('Signup Form', () => {
   5 |   let signup: SignupForm;
   6 |
   7 |   test.beforeEach(async ({ page }) => {
   8 |     signup = new SignupForm(page);
   9 |     await page.goto('/');
  10 |     await signup.scrollToSignupForm();
  11 |   });
  12 |
> 13 |   test('should display the signup form and allow input', async () => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  14 |     expect(await signup.isFormVisible()).toBe(true);
  15 |     await signup.fillEmail('test@example.com');
  16 |     await expect(signup.emailInput).toHaveValue('test@example.com');
  17 |     await signup.clearEmail();
  18 |     await expect(signup.emailInput).toHaveValue('');
  19 |   });
  20 |
  21 |   test('submit button should be enabled', async () => {
  22 |     expect(await signup.isSubmitButtonEnabled()).toBe(true);
  23 |   });
  24 | });
```