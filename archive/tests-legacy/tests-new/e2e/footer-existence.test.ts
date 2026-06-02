
import { test, expect } from '@playwright/test';

const languages = [
  { code: 'en', name: 'English', path: '/' },
  { code: 'es', name: 'Spanish', path: '/es' },
  { code: 'fr', name: 'French', path: '/fr' },
  { code: 'ar', name: 'Arabic', path: '/ar' }
];

for (const lang of languages) {
  test(`Footer should exist on ${lang.name} homepage`, async ({ page }) => {
    await page.goto(`http://localhost:8001${lang.path}`);
    const footer = page.locator('.site-footer');
    await expect(footer).toBeVisible();
  });
}
