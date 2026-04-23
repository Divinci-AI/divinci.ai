const { defineConfig } = require('@playwright/test');

/**
 * Unit Test Configuration for E2E Test Infrastructure
 * Validates test utilities, configurations, and workflows
 */
module.exports = defineConfig({
  testDir: './tests/unit',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'unit-test-results' }],
    ['json', { outputFile: 'unit-test-results/unit-results.json' }],
    ['list']
  ],
  
  use: {
    // Unit tests don't need browser functionality
    // but we keep basic timeout settings
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },

  projects: [
    {
      name: 'Unit Tests',
      testMatch: ['**/*.test.js'],
      use: {
        // Unit tests run without browser context
      }
    }
  ],

  // Global test configuration
  expect: {
    timeout: 5000,
  },

  // No web server needed for unit tests
  // webServer: undefined,
});