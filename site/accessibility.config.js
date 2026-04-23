// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Accessibility-focused Playwright configuration
 * Optimized for testing WCAG compliance and user experience
 */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/accessibility*.spec.js',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'accessibility-report' }],
    ['json', { outputFile: 'accessibility-results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:1111',
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Accessibility specific settings */
    reducedMotion: 'reduce',
    colorScheme: 'light',
    
    /* Longer timeouts for accessibility tools */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers and accessibility tools */
  projects: [
    {
      name: 'Accessibility-Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        /* Enable forced-colors mode to test high contrast */
        colorScheme: 'light',
      },
    },
    
    {
      name: 'Accessibility-Chrome-HighContrast',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        forcedColors: 'active',
      },
    },
    
    {
      name: 'Accessibility-Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        reducedMotion: 'reduce',
      },
    },
    
    {
      name: 'Accessibility-Safari',
      use: { 
        ...devices['Desktop Safari'],
        reducedMotion: 'reduce',
      },
    },
    
    {
      name: 'Accessibility-Mobile',
      use: { 
        ...devices['Pixel 5'],
        reducedMotion: 'reduce',
      },
    },
    
    {
      name: 'Accessibility-Mobile-Safari',
      use: { 
        ...devices['iPhone 12'],
        reducedMotion: 'reduce',
      },
    },
    
    {
      name: 'Accessibility-Tablet',
      use: { 
        ...devices['iPad Pro'],
        reducedMotion: 'reduce',
      },
    },
    
    /* Test with simulated screen reader environment */
    {
      name: 'Screen-Reader-Simulation',
      use: {
        ...devices['Desktop Chrome'],
        /* Simulate screen reader by disabling images and focusing on semantic markup */
        hasTouch: false,
        reducedMotion: 'reduce',
        /* Additional viewport settings for screen readers */
        viewport: { width: 1024, height: 768 },
      },
    },
    
    /* Test keyboard-only navigation */
    {
      name: 'Keyboard-Only',
      use: {
        ...devices['Desktop Chrome'],
        /* Simulate keyboard-only user */
        hasTouch: false,
        pointer: 'none',
      },
    },
    
    /* Test zoomed in view (simulating users who need larger text) */
    {
      name: 'Zoomed-200%',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 640, height: 480 }, // Simulates 200% zoom on 1280x960
      },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'zola serve --port 1111',
    port: 1111,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  /* Global test timeout */
  timeout: 30000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});