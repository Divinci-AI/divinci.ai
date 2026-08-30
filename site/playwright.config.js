const { defineConfig, devices } = require('@playwright/test');

/**
 * New-Divinci Zola Site Test Configuration
 * E2E and Visual Testing for the new-divinci Zola site
 */
module.exports = defineConfig({
  testDir: './tests',

  /**
   * 60s, not Playwright's default 30s.
   *
   * Many specs here sweep the whole language matrix — thirteen homepages, or
   * every page in every locale — in ONE test. Measured on CI runners those
   * take 32-40s, which straddles the 30s default: the same test fails on one
   * run and passes on the next depending on which side of the line the runner
   * lands. That reads as flakiness and is not. It is a correct test on a
   * budget sized for a single-page test.
   *
   * This was found by reading DURATIONS rather than verdicts. Three tests had
   * already been written off as nondeterministic before the durations showed
   * every attempt clustered at 32-37s. A pass/fail column cannot tell a
   * marginal budget from a real race; a duration column does it at a glance.
   *
   * Still bounded, and not the only bound: actionTimeout is 10s and
   * navigationTimeout 30s, so a genuinely hung action fails well before this.
   */
  timeout: 60000,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results' }],
    // NOT inside test-results/: the html reporter above owns that folder and
    // CLEARS it, which silently deleted this file on every run — so the JSON
    // report the config has always declared has never actually existed.
    ['json', { outputFile: 'playwright-results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://127.0.0.1:1111',
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
      testMatch: [
        // Stubs /api/status and asserts what a visitor actually sees: that an
        // attributed day is banded, an unattributed one is NOT, a
        // hand-written note beats the derived one, and a note is rendered as
        // text. None of that is reachable from the module tests.
        '**/status-attribution.spec.js',
        // These two run under Chromium rather than the Mobile-* projects on
        // purpose: each sets its own viewport AND its own isMobile/hasTouch per
        // describe (both assert phone AND desktop behaviour in one file), and
        // isMobile is a Chromium-only emulation flag.
        '**/mobile-zoom-guard.spec.js',
        '**/accessibility-axe-wcag.spec.js',
        '**/mobile-media.spec.js',
        '**/new-divinci-site.spec.js', 
        '**/language-*.spec.js', 
        '**/comprehensive-navigation-test.spec.js',
        '**/comprehensive-site-navigation.spec.js',
        '**/form-functionality.spec.js',
        '**/responsive-mobile.spec.js',
        '**/interactive-animations.spec.js',
        '**/performance-assets.spec.js',
        '**/journal-cycling.spec.js',
        '**/scroll-animation.spec.js',
        '**/debug-scroll.spec.js',
        '**/video-functionality.spec.js',
        '**/layout-alignment.spec.js',
        '**/journal-functionality.spec.js',
        '**/footer-language-navigation.spec.js',
        '**/accessibility-compliance.spec.js',
        '**/gdpr-compliance.spec.js',
        '**/social-media-sharing.spec.js',
        '**/mobile-navigation-comprehensive.spec.js',
        // Sets its own viewport per test (desktop and phone in one file), so
        // it runs here rather than under the Mobile-* projects.
        '**/www-rag-directory.spec.js',
        '**/www-rag-universe.spec.js'
      ],
    },
    {
      name: 'Desktop-Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: [
        '**/new-divinci-site.spec.js', 
        '**/language-*.spec.js', 
        '**/comprehensive-navigation-test.spec.js',
        '**/comprehensive-site-navigation.spec.js',
        '**/form-functionality.spec.js',
        '**/responsive-mobile.spec.js',
        '**/interactive-animations.spec.js',
        '**/performance-assets.spec.js',
        '**/journal-cycling.spec.js',
        '**/scroll-animation.spec.js',
        '**/debug-scroll.spec.js',
        '**/video-functionality.spec.js',
        '**/layout-alignment.spec.js',
        '**/journal-functionality.spec.js',
        '**/footer-language-navigation.spec.js',
        '**/accessibility-compliance.spec.js',
        '**/gdpr-compliance.spec.js',
        '**/social-media-sharing.spec.js',
        '**/mobile-navigation-comprehensive.spec.js'
      ],
    },
    {
      name: 'Desktop-Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: [
        '**/new-divinci-site.spec.js', 
        '**/language-*.spec.js', 
        '**/comprehensive-navigation-test.spec.js',
        '**/comprehensive-site-navigation.spec.js',
        '**/form-functionality.spec.js',
        '**/responsive-mobile.spec.js',
        '**/interactive-animations.spec.js',
        '**/performance-assets.spec.js',
        '**/journal-cycling.spec.js',
        '**/scroll-animation.spec.js',
        '**/debug-scroll.spec.js',
        '**/video-functionality.spec.js',
        '**/layout-alignment.spec.js',
        '**/journal-functionality.spec.js',
        '**/footer-language-navigation.spec.js',
        '**/accessibility-compliance.spec.js',
        '**/gdpr-compliance.spec.js',
        '**/social-media-sharing.spec.js',
        '**/mobile-navigation-comprehensive.spec.js'
      ],
    },

    // Mobile E2E Testing
    {
      name: 'Mobile-Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: [
        '**/new-divinci-site.spec.js', 
        '**/language-*.spec.js', 
        '**/comprehensive-navigation-test.spec.js',
        '**/comprehensive-site-navigation.spec.js',
        '**/form-functionality.spec.js',
        '**/responsive-mobile.spec.js',
        '**/interactive-animations.spec.js',
        '**/performance-assets.spec.js',
        '**/journal-cycling.spec.js',
        '**/scroll-animation.spec.js',
        '**/debug-scroll.spec.js',
        '**/video-functionality.spec.js',
        '**/layout-alignment.spec.js',
        '**/journal-functionality.spec.js',
        '**/footer-language-navigation.spec.js',
        '**/accessibility-compliance.spec.js',
        '**/gdpr-compliance.spec.js',
        '**/social-media-sharing.spec.js',
        '**/mobile-navigation-comprehensive.spec.js'
      ],
    },
    {
      name: 'Mobile-Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: [
        // WebKit is the point here, not a bonus: the hero-video landscape
        // overflow and navigator.audioSession are both invisible in Chromium.
        '**/mobile-media.spec.js',
        '**/new-divinci-site.spec.js', 
        '**/language-*.spec.js', 
        '**/comprehensive-navigation-test.spec.js',
        '**/comprehensive-site-navigation.spec.js',
        '**/form-functionality.spec.js',
        '**/responsive-mobile.spec.js',
        '**/interactive-animations.spec.js',
        '**/performance-assets.spec.js',
        '**/journal-cycling.spec.js',
        '**/scroll-animation.spec.js',
        '**/debug-scroll.spec.js',
        '**/video-functionality.spec.js',
        '**/layout-alignment.spec.js',
        '**/journal-functionality.spec.js',
        '**/footer-language-navigation.spec.js',
        '**/accessibility-compliance.spec.js',
        '**/gdpr-compliance.spec.js',
        '**/social-media-sharing.spec.js',
        '**/mobile-navigation-comprehensive.spec.js'
      ],
    },

    // Enhanced Visual Testing - Desktop
    {
      name: 'Visual-Desktop-Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: [
        '**/new-divinci-visual.spec.js', 
        '**/visual-regression.spec.js',
        '**/comprehensive-visual-testing.spec.js',
        '**/visual-performance-testing.spec.js'
      ],
    },
    {
      name: 'Visual-Desktop-Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: [
        '**/new-divinci-visual.spec.js', 
        '**/visual-regression.spec.js',
        '**/comprehensive-visual-testing.spec.js'
      ],
    },
    {
      name: 'Visual-Desktop-Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
      testMatch: [
        '**/new-divinci-visual.spec.js', 
        '**/visual-regression.spec.js',
        '**/comprehensive-visual-testing.spec.js'
      ],
    },

    // Enhanced Visual Testing - Mobile
    {
      name: 'Visual-Mobile-Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
      testMatch: [
        '**/new-divinci-visual.spec.js', 
        '**/visual-regression.spec.js', 
        '**/comprehensive-mobile-visual.spec.js',
        '**/comprehensive-visual-testing.spec.js',
        '**/visual-performance-testing.spec.js'
      ],
    },
    {
      name: 'Visual-Mobile-Safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
      testMatch: [
        '**/new-divinci-visual.spec.js', 
        '**/visual-regression.spec.js', 
        '**/comprehensive-mobile-visual.spec.js',
        '**/comprehensive-visual-testing.spec.js'
      ],
    },
    {
      name: 'Visual-Mobile-iPhone13',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
      },
      testMatch: [
        '**/comprehensive-visual-testing.spec.js'
      ],
    },

    // Enhanced Visual Testing - Tablet
    {
      name: 'Visual-Tablet-iPad',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
      testMatch: [
        '**/new-divinci-visual.spec.js', 
        '**/visual-regression.spec.js', 
        '**/comprehensive-mobile-visual.spec.js',
        '**/comprehensive-visual-testing.spec.js'
      ],
    },
    {
      name: 'Visual-Tablet-Landscape',
      use: { 
        ...devices['iPad Pro landscape'],
        viewport: { width: 1366, height: 1024 },
      },
      testMatch: [
        '**/comprehensive-visual-testing.spec.js'
      ],
    },

    // Comprehensive Mobile Testing - Multiple Devices
    {
      name: 'Mobile-Multi-Device',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
      testMatch: ['**/comprehensive-mobile-visual.spec.js'],
    },

    // The in-file device matrices. These specs choose their own viewport per
    // describe (see tests/helpers/device.js), so this project supplies only the
    // engine — hence a plain chromium `use` rather than a device descriptor.
    //
    // They need a project at all because every project here carries an explicit
    // testMatch, and for a long time none of them named these files: the specs
    // existed, were edited, and were never once collected. Adding a file to
    // tests/ is not enough to run it.
    {
      name: 'Mobile-Matrix',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/comprehensive-mobile-journeys.spec.js',
        '**/comprehensive-mobile-language.spec.js',
        '**/comprehensive-mobile-navigation.spec.js',
        '**/comprehensive-mobile-performance.spec.js',
        '**/mobile-comprehensive-suite.spec.js',
      ],
    },

    // The iPhone specs declare `devices['iPhone 12 Pro']` at file scope, which
    // carries defaultBrowserType: 'webkit' and overrides whatever this project
    // sets. The `use` here is therefore a formality — the file wins.
    {
      name: 'Mobile-iPhone-WebKit',
      use: { ...devices['iPhone 12 Pro'] },
      testMatch: [
        '**/iphone-12-pro-validation.spec.js',
        '**/iphone-homepage-visual.spec.js',
        '**/iphone-quick-test.spec.js',
      ],
    },
  ],

  // Global test configuration
  expect: {
    timeout: 15000,
    // Enhanced visual comparison settings
    threshold: 0.2,
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 1500,
      animations: 'disabled',
      mode: 'rgb',
      // Better handling of flaky visual tests
      clip: null, // Allow full element clipping
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 1500,
    },
  },

  // Start Zola server before running tests.
  // No `cd` and no absolute path: Playwright runs webServer.command from the
  // config's own directory, so hardcoding one developer's checkout only ever
  // breaks on every other machine. It used to point at a path that no longer
  // exists, which `reuseExistingServer` hid locally and CI could not.
  webServer: {
    command: 'zola serve --port 1111',
    port: 1111,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      'ZOLA_ENV': 'test'
    }
  },
});