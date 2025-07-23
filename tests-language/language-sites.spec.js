const { test, expect } = require('@playwright/test');

const languages = [
  { code: 'en', path: '/', title: 'Divinci™ Multiplayer AI Chat - English' },
  { code: 'es', path: '/es/', title: 'Divinci™ Chat de IA Multijugador - Español' },
  { code: 'fr', path: '/fr/', title: "Divinci™ Chat d'IA Multijoueur - Français" },
  { code: 'ar', path: '/ar/', title: 'ديفينشي™ دردشة الذكاء الاصطناعي متعددة اللاعبين - العربية' },
];

for (const lang of languages) {
  test(`Language: ${lang.code}`, async ({ page }) => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.goto(lang.path);
    await expect(page).toHaveTitle(new RegExp(lang.title));
    await page.screenshot({ path: `tests-language/screenshots/${lang.code}.png`, fullPage: true });
  });
}
