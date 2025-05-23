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
  testDir: './tests-new',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
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
  outputDir: 'test-results/'

  /* Using existing server instead of starting a new one */
  /* webServer: {
    command: 'npx serve',
    port: 58287,
    reuseExistingServer: !process.env.CI,
  }, */
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZWZpbmVDb25maWciLCJkZXZpY2VzIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJ0ZXN0RGlyIiwidGltZW91dCIsImV4cGVjdCIsImZ1bGx5UGFyYWxsZWwiLCJmb3JiaWRPbmx5IiwicHJvY2VzcyIsImVudiIsIkNJIiwicmV0cmllcyIsIndvcmtlcnMiLCJ1bmRlZmluZWQiLCJyZXBvcnRlciIsInVzZSIsImFjdGlvblRpbWVvdXQiLCJiYXNlVVJMIiwidHJhY2UiLCJwcm9qZWN0cyIsIm5hbWUiLCJjaGFubmVsIiwib3V0cHV0RGlyIl0sInNvdXJjZXMiOlsicGxheXdyaWdodC5jb25maWcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQHRzLWNoZWNrXG5jb25zdCB7IGRlZmluZUNvbmZpZywgZGV2aWNlcyB9ID0gcmVxdWlyZSgnQHBsYXl3cmlnaHQvdGVzdCcpO1xuXG4vKipcbiAqIEBzZWUgaHR0cHM6Ly9wbGF5d3JpZ2h0LmRldi9kb2NzL3Rlc3QtY29uZmlndXJhdGlvblxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZUNvbmZpZyh7XG4gIHRlc3REaXI6ICcuL3Rlc3RzLW5ldycsXG4gIC8qIE1heGltdW0gdGltZSBvbmUgdGVzdCBjYW4gcnVuIGZvci4gKi9cbiAgdGltZW91dDogMzAgKiAxMDAwLFxuICBleHBlY3Q6IHtcbiAgICAvKipcbiAgICAgKiBNYXhpbXVtIHRpbWUgZXhwZWN0KCkgc2hvdWxkIHdhaXQgZm9yIHRoZSBjb25kaXRpb24gdG8gYmUgbWV0LlxuICAgICAqIEZvciBleGFtcGxlIGluIGBhd2FpdCBleHBlY3QobG9jYXRvcikudG9IYXZlVGV4dCgpO2BcbiAgICAgKi9cbiAgICB0aW1lb3V0OiA1MDAwXG4gIH0sXG4gIC8qIFJ1biB0ZXN0cyBpbiBmaWxlcyBpbiBwYXJhbGxlbCAqL1xuICBmdWxseVBhcmFsbGVsOiB0cnVlLFxuICAvKiBGYWlsIHRoZSBidWlsZCBvbiBDSSBpZiB5b3UgYWNjaWRlbnRhbGx5IGxlZnQgdGVzdC5vbmx5IGluIHRoZSBzb3VyY2UgY29kZS4gKi9cbiAgZm9yYmlkT25seTogISFwcm9jZXNzLmVudi5DSSxcbiAgLyogUmV0cnkgb24gQ0kgb25seSAqL1xuICByZXRyaWVzOiBwcm9jZXNzLmVudi5DSSA/IDIgOiAwLFxuICAvKiBPcHQgb3V0IG9mIHBhcmFsbGVsIHRlc3RzIG9uIENJLiAqL1xuICB3b3JrZXJzOiBwcm9jZXNzLmVudi5DSSA/IDEgOiB1bmRlZmluZWQsXG4gIC8qIFJlcG9ydGVyIHRvIHVzZS4gU2VlIGh0dHBzOi8vcGxheXdyaWdodC5kZXYvZG9jcy90ZXN0LXJlcG9ydGVycyAqL1xuICByZXBvcnRlcjogJ2h0bWwnLFxuICAvKiBTaGFyZWQgc2V0dGluZ3MgZm9yIGFsbCB0aGUgcHJvamVjdHMgYmVsb3cuIFNlZSBodHRwczovL3BsYXl3cmlnaHQuZGV2L2RvY3MvYXBpL2NsYXNzLXRlc3RvcHRpb25zLiAqL1xuICB1c2U6IHtcbiAgICAvKiBNYXhpbXVtIHRpbWUgZWFjaCBhY3Rpb24gc3VjaCBhcyBgY2xpY2soKWAgY2FuIHRha2UuIERlZmF1bHRzIHRvIDAgKG5vIGxpbWl0KS4gKi9cbiAgICBhY3Rpb25UaW1lb3V0OiAwLFxuICAgIC8qIEJhc2UgVVJMIHRvIHVzZSBpbiBhY3Rpb25zIGxpa2UgYGF3YWl0IHBhZ2UuZ290bygnLycpYC4gKi9cbiAgICBiYXNlVVJMOiAnaHR0cDovL2xvY2FsaG9zdDo2MTQ0MycsXG5cbiAgICAvKiBDb2xsZWN0IHRyYWNlIHdoZW4gcmV0cnlpbmcgdGhlIGZhaWxlZCB0ZXN0LiBTZWUgaHR0cHM6Ly9wbGF5d3JpZ2h0LmRldi9kb2NzL3RyYWNlLXZpZXdlciAqL1xuICAgIHRyYWNlOiAnb24tZmlyc3QtcmV0cnknLFxuICB9LFxuXG4gIC8qIENvbmZpZ3VyZSBwcm9qZWN0cyBmb3IgbWFqb3IgYnJvd3NlcnMgKi9cbiAgcHJvamVjdHM6IFtcbiAgICB7XG4gICAgICBuYW1lOiAnY2hyb21pdW0nLFxuICAgICAgdXNlOiB7XG4gICAgICAgIC4uLmRldmljZXNbJ0Rlc2t0b3AgQ2hyb21lJ10sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICB7XG4gICAgICBuYW1lOiAnZmlyZWZveCcsXG4gICAgICB1c2U6IHtcbiAgICAgICAgLi4uZGV2aWNlc1snRGVza3RvcCBGaXJlZm94J10sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICB7XG4gICAgICBuYW1lOiAnd2Via2l0JyxcbiAgICAgIHVzZToge1xuICAgICAgICAuLi5kZXZpY2VzWydEZXNrdG9wIFNhZmFyaSddLFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLyogVGVzdCBhZ2FpbnN0IG1vYmlsZSB2aWV3cG9ydHMuICovXG4gICAge1xuICAgICAgbmFtZTogJ01vYmlsZSBDaHJvbWUnLFxuICAgICAgdXNlOiB7XG4gICAgICAgIC4uLmRldmljZXNbJ1BpeGVsIDUnXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnTW9iaWxlIFNhZmFyaScsXG4gICAgICB1c2U6IHtcbiAgICAgICAgLi4uZGV2aWNlc1snaVBob25lIDEyJ10sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvKiBUZXN0IGFnYWluc3QgYnJhbmRlZCBicm93c2Vycy4gKi9cbiAgICB7XG4gICAgICBuYW1lOiAnTWljcm9zb2Z0IEVkZ2UnLFxuICAgICAgdXNlOiB7XG4gICAgICAgIGNoYW5uZWw6ICdtc2VkZ2UnLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdHb29nbGUgQ2hyb21lJyxcbiAgICAgIHVzZToge1xuICAgICAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcblxuICAvKiBGb2xkZXIgZm9yIHRlc3QgYXJ0aWZhY3RzIHN1Y2ggYXMgc2NyZWVuc2hvdHMsIHZpZGVvcywgdHJhY2VzLCBldGMuICovXG4gIG91dHB1dERpcjogJ3Rlc3QtcmVzdWx0cy8nLFxuXG4gIC8qIFVzaW5nIGV4aXN0aW5nIHNlcnZlciBpbnN0ZWFkIG9mIHN0YXJ0aW5nIGEgbmV3IG9uZSAqL1xuICAvKiB3ZWJTZXJ2ZXI6IHtcbiAgICBjb21tYW5kOiAnbnB4IHNlcnZlJyxcbiAgICBwb3J0OiA1ODI4NyxcbiAgICByZXVzZUV4aXN0aW5nU2VydmVyOiAhcHJvY2Vzcy5lbnYuQ0ksXG4gIH0sICovXG59KTtcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLE1BQU07RUFBRUEsWUFBWTtFQUFFQztBQUFRLENBQUMsR0FBR0MsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztBQUU3RDtBQUNBO0FBQ0E7QUFDQUMsTUFBTSxDQUFDQyxPQUFPLEdBQUdKLFlBQVksQ0FBQztFQUM1QkssT0FBTyxFQUFFLGFBQWE7RUFDdEI7RUFDQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxJQUFJO0VBQ2xCQyxNQUFNLEVBQUU7SUFDTjtBQUNKO0FBQ0E7QUFDQTtJQUNJRCxPQUFPLEVBQUU7RUFDWCxDQUFDO0VBQ0Q7RUFDQUUsYUFBYSxFQUFFLElBQUk7RUFDbkI7RUFDQUMsVUFBVSxFQUFFLENBQUMsQ0FBQ0MsT0FBTyxDQUFDQyxHQUFHLENBQUNDLEVBQUU7RUFDNUI7RUFDQUMsT0FBTyxFQUFFSCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQy9CO0VBQ0FFLE9BQU8sRUFBRUosT0FBTyxDQUFDQyxHQUFHLENBQUNDLEVBQUUsR0FBRyxDQUFDLEdBQUdHLFNBQVM7RUFDdkM7RUFDQUMsUUFBUSxFQUFFLE1BQU07RUFDaEI7RUFDQUMsR0FBRyxFQUFFO0lBQ0g7SUFDQUMsYUFBYSxFQUFFLENBQUM7SUFDaEI7SUFDQUMsT0FBTyxFQUFFLHdCQUF3QjtJQUVqQztJQUNBQyxLQUFLLEVBQUU7RUFDVCxDQUFDO0VBRUQ7RUFDQUMsUUFBUSxFQUFFLENBQ1I7SUFDRUMsSUFBSSxFQUFFLFVBQVU7SUFDaEJMLEdBQUcsRUFBRTtNQUNILEdBQUdoQixPQUFPLENBQUMsZ0JBQWdCO0lBQzdCO0VBQ0YsQ0FBQyxFQUVEO0lBQ0VxQixJQUFJLEVBQUUsU0FBUztJQUNmTCxHQUFHLEVBQUU7TUFDSCxHQUFHaEIsT0FBTyxDQUFDLGlCQUFpQjtJQUM5QjtFQUNGLENBQUMsRUFFRDtJQUNFcUIsSUFBSSxFQUFFLFFBQVE7SUFDZEwsR0FBRyxFQUFFO01BQ0gsR0FBR2hCLE9BQU8sQ0FBQyxnQkFBZ0I7SUFDN0I7RUFDRixDQUFDLEVBRUQ7RUFDQTtJQUNFcUIsSUFBSSxFQUFFLGVBQWU7SUFDckJMLEdBQUcsRUFBRTtNQUNILEdBQUdoQixPQUFPLENBQUMsU0FBUztJQUN0QjtFQUNGLENBQUMsRUFDRDtJQUNFcUIsSUFBSSxFQUFFLGVBQWU7SUFDckJMLEdBQUcsRUFBRTtNQUNILEdBQUdoQixPQUFPLENBQUMsV0FBVztJQUN4QjtFQUNGLENBQUMsRUFFRDtFQUNBO0lBQ0VxQixJQUFJLEVBQUUsZ0JBQWdCO0lBQ3RCTCxHQUFHLEVBQUU7TUFDSE0sT0FBTyxFQUFFO0lBQ1g7RUFDRixDQUFDLEVBQ0Q7SUFDRUQsSUFBSSxFQUFFLGVBQWU7SUFDckJMLEdBQUcsRUFBRTtNQUNITSxPQUFPLEVBQUU7SUFDWDtFQUNGLENBQUMsQ0FDRjtFQUVEO0VBQ0FDLFNBQVMsRUFBRTs7RUFFWDtFQUNBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLENBQUMiLCJpZ25vcmVMaXN0IjpbXX0=