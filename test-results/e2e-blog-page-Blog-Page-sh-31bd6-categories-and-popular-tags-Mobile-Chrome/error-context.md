# Test info

- Name: Blog Page >> should display categories and popular tags
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/blog-page.test.ts:28:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-sR46G3 --remote-debugging-pipe --no-startup-window
<launched> pid=60825
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --enable-use-zoom-for-dsf=false --use-angle --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/Users/mikeumus/Documents/divinci.ai/.tmp/playwright_chromiumdev_profile-sR46G3 --remote-debugging-pipe --no-startup-window
  - <launched> pid=60825

```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { BlogPage } from '../page-objects/BlogPage';
   3 |
   4 | test.describe('Blog Page', () => {
   5 |   let blog: BlogPage;
   6 |
   7 |   test.beforeEach(async ({ page }) => {
   8 |     blog = new BlogPage(page);
   9 |     await page.goto('/blog/');
  10 |   });
  11 |
  12 |   test('should list at least one post with title', async () => {
  13 |     const titles = await blog.getAllPostTitles();
  14 |     expect(titles.length).toBeGreaterThan(0);
  15 |     for (const title of titles) {
  16 |       expect(title).not.toBe('');
  17 |     }
  18 |   });
  19 |
  20 |   test('should navigate to post detail when clicking a post link', async ({ page }) => {
  21 |     const titles = await blog.getAllPostTitles();
  22 |     const firstTitle = titles[0];
  23 |     await blog.clickPostByTitle(firstTitle);
  24 |     await expect(page).toHaveURL(/posts\//);
  25 |     await expect(page.locator('h1')).toHaveText(firstTitle);
  26 |   });
  27 |
> 28 |   test('should display categories and popular tags', async () => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  29 |     const categories = await blog.getCategories();
  30 |     const tags = await blog.getPopularTags();
  31 |     expect(categories.length).toBeGreaterThan(0);
  32 |     expect(tags.length).toBeGreaterThan(0);
  33 |   });
  34 | });
```