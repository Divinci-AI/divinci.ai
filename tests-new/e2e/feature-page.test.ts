import { test, expect } from '@playwright/test';
import { FeaturePage } from '../page-objects/FeaturePage';

test.describe('Feature Section', () => {
  let feature: FeaturePage;

  test.beforeEach(async ({ page }) => {
    feature = new FeaturePage(page);
    await page.goto('/');
    await feature.scrollToFeaturesSection();
  });

  test('should display feature titles', async () => {
    const titles = await feature.getAllFeatureNames();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t).not.toBe('');
  });

  test('should navigate to feature detail and show consumer and company content', async () => {
    const titles = await feature.getAllFeatureNames();
    const firstTitle = titles[0];
    await feature.goToFeatureDetailPage(firstTitle);
    await expect(feature.isFeatureDetailPage()).resolves.toBeTruthy();
    const consumerText = await feature.getConsumerViewText(firstTitle);
    const companyText = await feature.getCompanyViewText(firstTitle);
    expect(consumerText).not.toBe('');
    expect(companyText).not.toBe('');
  });
});