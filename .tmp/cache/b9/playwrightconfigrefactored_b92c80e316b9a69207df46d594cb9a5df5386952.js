"use strict";

// @ts-check
const {
  defineConfig,
  devices
} = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests-new/e2e',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  // Increased timeout for language tests
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:61443',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },
  /* Configure projects for major browsers */
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome']
    }
  }, {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox']
    }
  }, {
    name: 'webkit',
    use: {
      ...devices['Desktop Safari']
    }
  }, /* Test against mobile viewports. */
  {
    name: 'Mobile Chrome',
    use: {
      ...devices['Pixel 5']
    }
  }, {
    name: 'Mobile Safari',
    use: {
      ...devices['iPhone 12']
    }
  }, /* Test against branded browsers. */
  {
    name: 'Microsoft Edge',
    use: {
      channel: 'msedge'
    }
  }, {
    name: 'Google Chrome',
    use: {
      channel: 'chrome'
    }
  }],
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
  /* Start web server for tests */
  webServer: {
    command: 'npx http-server . -p 61443',
    port: 61443,
    reuseExistingServer: !process.env.CI
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZWZpbmVDb25maWciLCJkZXZpY2VzIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJ0ZXN0RGlyIiwidGltZW91dCIsImV4cGVjdCIsImZ1bGx5UGFyYWxsZWwiLCJmb3JiaWRPbmx5IiwicHJvY2VzcyIsImVudiIsIkNJIiwicmV0cmllcyIsIndvcmtlcnMiLCJ1bmRlZmluZWQiLCJyZXBvcnRlciIsInVzZSIsImFjdGlvblRpbWVvdXQiLCJiYXNlVVJMIiwidHJhY2UiLCJwcm9qZWN0cyIsIm5hbWUiLCJjaGFubmVsIiwib3V0cHV0RGlyIiwid2ViU2VydmVyIiwiY29tbWFuZCIsInBvcnQiLCJyZXVzZUV4aXN0aW5nU2VydmVyIl0sInNvdXJjZXMiOlsicGxheXdyaWdodC5jb25maWcucmVmYWN0b3JlZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtY2hlY2tcbmNvbnN0IHsgZGVmaW5lQ29uZmlnLCBkZXZpY2VzIH0gPSByZXF1aXJlKCdAcGxheXdyaWdodC90ZXN0Jyk7XG5cbi8qKlxuICogQHNlZSBodHRwczovL3BsYXl3cmlnaHQuZGV2L2RvY3MvdGVzdC1jb25maWd1cmF0aW9uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZGVmaW5lQ29uZmlnKHtcbiAgdGVzdERpcjogJy4vdGVzdHMtbmV3L2UyZScsXG4gIC8qIE1heGltdW0gdGltZSBvbmUgdGVzdCBjYW4gcnVuIGZvci4gKi9cbiAgdGltZW91dDogNjAgKiAxMDAwLCAvLyBJbmNyZWFzZWQgdGltZW91dCBmb3IgbGFuZ3VhZ2UgdGVzdHNcbiAgZXhwZWN0OiB7XG4gICAgLyoqXG4gICAgICogTWF4aW11bSB0aW1lIGV4cGVjdCgpIHNob3VsZCB3YWl0IGZvciB0aGUgY29uZGl0aW9uIHRvIGJlIG1ldC5cbiAgICAgKiBGb3IgZXhhbXBsZSBpbiBgYXdhaXQgZXhwZWN0KGxvY2F0b3IpLnRvSGF2ZVRleHQoKTtgXG4gICAgICovXG4gICAgdGltZW91dDogNTAwMFxuICB9LFxuICAvKiBSdW4gdGVzdHMgaW4gZmlsZXMgaW4gcGFyYWxsZWwgKi9cbiAgZnVsbHlQYXJhbGxlbDogdHJ1ZSxcbiAgLyogRmFpbCB0aGUgYnVpbGQgb24gQ0kgaWYgeW91IGFjY2lkZW50YWxseSBsZWZ0IHRlc3Qub25seSBpbiB0aGUgc291cmNlIGNvZGUuICovXG4gIGZvcmJpZE9ubHk6ICEhcHJvY2Vzcy5lbnYuQ0ksXG4gIC8qIFJldHJ5IG9uIENJIG9ubHkgKi9cbiAgcmV0cmllczogcHJvY2Vzcy5lbnYuQ0kgPyAyIDogMCxcbiAgLyogT3B0IG91dCBvZiBwYXJhbGxlbCB0ZXN0cyBvbiBDSS4gKi9cbiAgd29ya2VyczogcHJvY2Vzcy5lbnYuQ0kgPyAxIDogdW5kZWZpbmVkLFxuICAvKiBSZXBvcnRlciB0byB1c2UuIFNlZSBodHRwczovL3BsYXl3cmlnaHQuZGV2L2RvY3MvdGVzdC1yZXBvcnRlcnMgKi9cbiAgcmVwb3J0ZXI6ICdodG1sJyxcbiAgLyogU2hhcmVkIHNldHRpbmdzIGZvciBhbGwgdGhlIHByb2plY3RzIGJlbG93LiBTZWUgaHR0cHM6Ly9wbGF5d3JpZ2h0LmRldi9kb2NzL2FwaS9jbGFzcy10ZXN0b3B0aW9ucy4gKi9cbiAgdXNlOiB7XG4gICAgLyogTWF4aW11bSB0aW1lIGVhY2ggYWN0aW9uIHN1Y2ggYXMgYGNsaWNrKClgIGNhbiB0YWtlLiBEZWZhdWx0cyB0byAwIChubyBsaW1pdCkuICovXG4gICAgYWN0aW9uVGltZW91dDogMCxcbiAgICAvKiBCYXNlIFVSTCB0byB1c2UgaW4gYWN0aW9ucyBsaWtlIGBhd2FpdCBwYWdlLmdvdG8oJy8nKWAuICovXG4gICAgYmFzZVVSTDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NjE0NDMnLFxuXG4gICAgLyogQ29sbGVjdCB0cmFjZSB3aGVuIHJldHJ5aW5nIHRoZSBmYWlsZWQgdGVzdC4gU2VlIGh0dHBzOi8vcGxheXdyaWdodC5kZXYvZG9jcy90cmFjZS12aWV3ZXIgKi9cbiAgICB0cmFjZTogJ29uLWZpcnN0LXJldHJ5JyxcbiAgfSxcblxuICAvKiBDb25maWd1cmUgcHJvamVjdHMgZm9yIG1ham9yIGJyb3dzZXJzICovXG4gIHByb2plY3RzOiBbXG4gICAge1xuICAgICAgbmFtZTogJ2Nocm9taXVtJyxcbiAgICAgIHVzZToge1xuICAgICAgICAuLi5kZXZpY2VzWydEZXNrdG9wIENocm9tZSddLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAge1xuICAgICAgbmFtZTogJ2ZpcmVmb3gnLFxuICAgICAgdXNlOiB7XG4gICAgICAgIC4uLmRldmljZXNbJ0Rlc2t0b3AgRmlyZWZveCddLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAge1xuICAgICAgbmFtZTogJ3dlYmtpdCcsXG4gICAgICB1c2U6IHtcbiAgICAgICAgLi4uZGV2aWNlc1snRGVza3RvcCBTYWZhcmknXSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qIFRlc3QgYWdhaW5zdCBtb2JpbGUgdmlld3BvcnRzLiAqL1xuICAgIHtcbiAgICAgIG5hbWU6ICdNb2JpbGUgQ2hyb21lJyxcbiAgICAgIHVzZToge1xuICAgICAgICAuLi5kZXZpY2VzWydQaXhlbCA1J10sXG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ01vYmlsZSBTYWZhcmknLFxuICAgICAgdXNlOiB7XG4gICAgICAgIC4uLmRldmljZXNbJ2lQaG9uZSAxMiddLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyogVGVzdCBhZ2FpbnN0IGJyYW5kZWQgYnJvd3NlcnMuICovXG4gICAge1xuICAgICAgbmFtZTogJ01pY3Jvc29mdCBFZGdlJyxcbiAgICAgIHVzZToge1xuICAgICAgICBjaGFubmVsOiAnbXNlZGdlJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnR29vZ2xlIENocm9tZScsXG4gICAgICB1c2U6IHtcbiAgICAgICAgY2hhbm5lbDogJ2Nocm9tZScsXG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG5cbiAgLyogRm9sZGVyIGZvciB0ZXN0IGFydGlmYWN0cyBzdWNoIGFzIHNjcmVlbnNob3RzLCB2aWRlb3MsIHRyYWNlcywgZXRjLiAqL1xuICBvdXRwdXREaXI6ICd0ZXN0LXJlc3VsdHMvJyxcblxuICAvKiBTdGFydCB3ZWIgc2VydmVyIGZvciB0ZXN0cyAqL1xuICB3ZWJTZXJ2ZXI6IHtcbiAgICBjb21tYW5kOiAnbnB4IGh0dHAtc2VydmVyIC4gLXAgNjE0NDMnLFxuICAgIHBvcnQ6IDYxNDQzLFxuICAgIHJldXNlRXhpc3RpbmdTZXJ2ZXI6ICFwcm9jZXNzLmVudi5DSSxcbiAgfSxcbn0pO1xuIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0EsTUFBTTtFQUFFQSxZQUFZO0VBQUVDO0FBQVEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsa0JBQWtCLENBQUM7O0FBRTdEO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBR0osWUFBWSxDQUFDO0VBQzVCSyxPQUFPLEVBQUUsaUJBQWlCO0VBQzFCO0VBQ0FDLE9BQU8sRUFBRSxFQUFFLEdBQUcsSUFBSTtFQUFFO0VBQ3BCQyxNQUFNLEVBQUU7SUFDTjtBQUNKO0FBQ0E7QUFDQTtJQUNJRCxPQUFPLEVBQUU7RUFDWCxDQUFDO0VBQ0Q7RUFDQUUsYUFBYSxFQUFFLElBQUk7RUFDbkI7RUFDQUMsVUFBVSxFQUFFLENBQUMsQ0FBQ0MsT0FBTyxDQUFDQyxHQUFHLENBQUNDLEVBQUU7RUFDNUI7RUFDQUMsT0FBTyxFQUFFSCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQy9CO0VBQ0FFLE9BQU8sRUFBRUosT0FBTyxDQUFDQyxHQUFHLENBQUNDLEVBQUUsR0FBRyxDQUFDLEdBQUdHLFNBQVM7RUFDdkM7RUFDQUMsUUFBUSxFQUFFLE1BQU07RUFDaEI7RUFDQUMsR0FBRyxFQUFFO0lBQ0g7SUFDQUMsYUFBYSxFQUFFLENBQUM7SUFDaEI7SUFDQUMsT0FBTyxFQUFFLHdCQUF3QjtJQUVqQztJQUNBQyxLQUFLLEVBQUU7RUFDVCxDQUFDO0VBRUQ7RUFDQUMsUUFBUSxFQUFFLENBQ1I7SUFDRUMsSUFBSSxFQUFFLFVBQVU7SUFDaEJMLEdBQUcsRUFBRTtNQUNILEdBQUdoQixPQUFPLENBQUMsZ0JBQWdCO0lBQzdCO0VBQ0YsQ0FBQyxFQUVEO0lBQ0VxQixJQUFJLEVBQUUsU0FBUztJQUNmTCxHQUFHLEVBQUU7TUFDSCxHQUFHaEIsT0FBTyxDQUFDLGlCQUFpQjtJQUM5QjtFQUNGLENBQUMsRUFFRDtJQUNFcUIsSUFBSSxFQUFFLFFBQVE7SUFDZEwsR0FBRyxFQUFFO01BQ0gsR0FBR2hCLE9BQU8sQ0FBQyxnQkFBZ0I7SUFDN0I7RUFDRixDQUFDLEVBRUQ7RUFDQTtJQUNFcUIsSUFBSSxFQUFFLGVBQWU7SUFDckJMLEdBQUcsRUFBRTtNQUNILEdBQUdoQixPQUFPLENBQUMsU0FBUztJQUN0QjtFQUNGLENBQUMsRUFDRDtJQUNFcUIsSUFBSSxFQUFFLGVBQWU7SUFDckJMLEdBQUcsRUFBRTtNQUNILEdBQUdoQixPQUFPLENBQUMsV0FBVztJQUN4QjtFQUNGLENBQUMsRUFFRDtFQUNBO0lBQ0VxQixJQUFJLEVBQUUsZ0JBQWdCO0lBQ3RCTCxHQUFHLEVBQUU7TUFDSE0sT0FBTyxFQUFFO0lBQ1g7RUFDRixDQUFDLEVBQ0Q7SUFDRUQsSUFBSSxFQUFFLGVBQWU7SUFDckJMLEdBQUcsRUFBRTtNQUNITSxPQUFPLEVBQUU7SUFDWDtFQUNGLENBQUMsQ0FDRjtFQUVEO0VBQ0FDLFNBQVMsRUFBRSxlQUFlO0VBRTFCO0VBQ0FDLFNBQVMsRUFBRTtJQUNUQyxPQUFPLEVBQUUsNEJBQTRCO0lBQ3JDQyxJQUFJLEVBQUUsS0FBSztJQUNYQyxtQkFBbUIsRUFBRSxDQUFDbEIsT0FBTyxDQUFDQyxHQUFHLENBQUNDO0VBQ3BDO0FBQ0YsQ0FBQyxDQUFDIiwiaWdub3JlTGlzdCI6W119