const { defineConfig, devices } = require('@playwright/test');

/**
 * New-Divinci Zola Site Test Configuration
 * E2E and Visual Testing for the new-divinci Zola site
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://127.0.0.1:1027',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Desktop E2E Testing
    {
      name: 'Desktop-Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: ['**/new-divinci-site.spec.js', '**/language-*.spec.js'],
    },
    {
      name: 'Desktop-Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: ['**/new-divinci-site.spec.js', '**/language-*.spec.js'],
    },
    {
      name: 'Desktop-Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: ['**/new-divinci-site.spec.js', '**/language-*.spec.js'],
    },

    // Mobile E2E Testing
    {
      name: 'Mobile-Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/new-divinci-site.spec.js', '**/language-*.spec.js'],
    },
    {
      name: 'Mobile-Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/new-divinci-site.spec.js', '**/language-*.spec.js'],
    },

    // Visual Testing - Desktop
    {
      name: 'Visual-Desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: '**/new-divinci-visual.spec.js',
    },

    // Visual Testing - Mobile
    {
      name: 'Visual-Mobile',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
      testMatch: '**/new-divinci-visual.spec.js',
    },

    // Visual Testing - Tablet
    {
      name: 'Visual-Tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
      testMatch: '**/new-divinci-visual.spec.js',
    },
  ],

  // Global test configuration
  expect: {
    timeout: 10000,
    // Visual comparison threshold
    threshold: 0.3,
    toHaveScreenshot: {
      threshold: 0.3,
      maxDiffPixels: 1000,
      animations: 'disabled',
      mode: 'rgb',
    },
  },

  // Start Zola server before running tests
  webServer: {
    command: 'cd /Users/mikeumus/Documents/divinci.ai/new-divinci-zola-site && zola serve --port 1027',
    port: 1027,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      'ZOLA_ENV': 'test'
    }
  },
});