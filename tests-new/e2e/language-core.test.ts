/**
 * Core Language Tests for Divinci AI
 *
 * Tests the main language functionality focusing on the four supported languages:
 * - English (en)
 * - Spanish (es)
 * - French (fr)
 * - Arabic (ar)
 */

import { test, expect } from '@playwright/test';
import { LanguageHelper, SUPPORTED_LANGUAGES } from '../utils/LanguageHelper';

const EXPECTED_NAV_LABELS: Record<string, string[]> = {
  en: ['Features', 'Team', 'Sign Up'],
  es: ['Características', 'Equipo', 'Regístrate'],
  fr: ['Fonctionnalités', 'Équipe', "S'inscrire"],
  ar: ['الميزات', 'الفريق', 'التسجيل'],
};

test.describe('Core Language Tests for Divinci AI', () => {
  let helper: LanguageHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LanguageHelper(page);
  });

  test('should access all supported languages via direct URL and display translated nav labels', async ({ page }) => {
    for (const lang of SUPPORTED_LANGUAGES) {
      await helper.goToLanguage(lang.code);
      const labels = EXPECTED_NAV_LABELS[lang.code];
      for (let i = 0; i < labels.length; i++) {
        await expect(page.locator('.nav-menu a').nth(i)).toHaveText(labels[i]);
      }
      const isRtl = await helper.isRtl();
      expect(isRtl).toBe(!!lang.rtl);
    }
  });

  test('should change language via switcher and update nav labels accordingly', async ({ page }) => {
    await helper.goToLanguage('en');
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.default) continue;
      await helper.switchLanguage(lang.code);
      await expect(page).toHaveURL(new RegExp(`/${lang.code}/`));
      const labels = EXPECTED_NAV_LABELS[lang.code];
      for (let i = 0; i < labels.length; i++) {
        await expect(page.locator('.nav-menu a').nth(i)).toHaveText(labels[i]);
      }
      const isRtl = await helper.isRtl();
      expect(isRtl).toBe(!!lang.rtl);
    }
  });
});