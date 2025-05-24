const { defineConfig, devices } = require('@playwright/test');

/**
 * Visual Testing Configuration for Divinci AI Website
 * Comprehensive cross-device and cross-browser visual validation
 */
module.exports = defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'visual-test-results' }],
    ['json', { outputFile: 'visual-test-results/results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Ensure consistent rendering
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  projects: [
    // Desktop Testing
    {
      name: 'Desktop-Chrome-1920',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'Desktop-Chrome-1366',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'Desktop-Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop-Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Tablet Testing
    {
      name: 'iPad-Portrait',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
    {
      name: 'iPad-Landscape',
      use: { 
        ...devices['iPad Pro landscape'],
        viewport: { width: 1366, height: 1024 },
      },
    },

    // Mobile Testing
    {
      name: 'iPhone-13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'iPhone-13-Pro-Max',
      use: { ...devices['iPhone 13 Pro Max'] },
    },
    {
      name: 'iPhone-SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'Samsung-Galaxy-S21',
      use: { ...devices['Galaxy S III'] }, // Using as proxy for modern Android
    },
    {
      name: 'Pixel-5',
      use: { ...devices['Pixel 5'] },
    },

    // Small Mobile (Edge Cases)
    {
      name: 'Small-Mobile',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 320, height: 568 },
      },
    },

    // Large Desktop (4K)
    {
      name: 'Desktop-4K',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 2,
      },
    },
  ],

  // Global test configuration
  expect: {
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 1000,
      animations: 'disabled', // Disable animations for consistent screenshots
    },
  },

  webServer: {
    command: 'npx serve . -p 8000',
    port: 8000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
