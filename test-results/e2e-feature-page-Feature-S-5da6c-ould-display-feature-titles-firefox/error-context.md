# Test info

- Name: Feature Section >> should display feature titles
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/feature-page.test.ts:13:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /Users/mikeumus/Documents/divinci.ai/.tmp/playwright_firefoxdev_profile-HHxksi -juggler-pipe -silent
<launched> pid=60590
[pid=60590][err] *** You are running in headless mode.
[pid=60590] <process did exit: exitCode=null, signal=SIGABRT>
[pid=60590] starting temporary directories cleanup
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /Users/mikeumus/Documents/divinci.ai/.tmp/playwright_firefoxdev_profile-HHxksi -juggler-pipe -silent
  - <launched> pid=60590
  - [pid=60590][err] *** You are running in headless mode.
  - [pid=60590] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=60590] starting temporary directories cleanup

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