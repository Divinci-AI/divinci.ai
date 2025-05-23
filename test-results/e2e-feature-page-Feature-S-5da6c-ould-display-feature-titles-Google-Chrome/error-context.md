# Test info

- Name: Feature Section >> should display feature titles
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/feature-page.test.ts:13:7

# Error details

```
Error: browserType.launch: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Run "npx playwright install chrome"
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
     |       ^ Error: browserType.launch: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
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