
// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testMatch: 'tests-new/e2e/footer-links.test.ts',
  use: {
    baseURL: 'http://localhost:8001',
  },
  webServer: {
    command: 'npx serve -l 8001',
    port: 8001,
    reuseExistingServer: !process.env.CI,
  },
});
