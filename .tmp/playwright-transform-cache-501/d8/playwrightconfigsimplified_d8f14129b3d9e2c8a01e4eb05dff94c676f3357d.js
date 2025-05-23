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
    baseURL: 'http://localhost:8001',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },
  /* Configure projects for major browsers */
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome']
    }
  }],
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'python3 -m http.server 8001',
    port: 8001,
    reuseExistingServer: !process.env.CI
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJkZWZpbmVDb25maWciLCJkZXZpY2VzIiwicmVxdWlyZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJ0ZXN0RGlyIiwidGltZW91dCIsImV4cGVjdCIsImZ1bGx5UGFyYWxsZWwiLCJmb3JiaWRPbmx5IiwicHJvY2VzcyIsImVudiIsIkNJIiwicmV0cmllcyIsIndvcmtlcnMiLCJ1bmRlZmluZWQiLCJyZXBvcnRlciIsInVzZSIsImFjdGlvblRpbWVvdXQiLCJiYXNlVVJMIiwidHJhY2UiLCJwcm9qZWN0cyIsIm5hbWUiLCJvdXRwdXREaXIiLCJ3ZWJTZXJ2ZXIiLCJjb21tYW5kIiwicG9ydCIsInJldXNlRXhpc3RpbmdTZXJ2ZXIiXSwic291cmNlcyI6WyJwbGF5d3JpZ2h0LmNvbmZpZy5zaW1wbGlmaWVkLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1jaGVja1xuY29uc3QgeyBkZWZpbmVDb25maWcsIGRldmljZXMgfSA9IHJlcXVpcmUoJ0BwbGF5d3JpZ2h0L3Rlc3QnKTtcblxuLyoqXG4gKiBAc2VlIGh0dHBzOi8vcGxheXdyaWdodC5kZXYvZG9jcy90ZXN0LWNvbmZpZ3VyYXRpb25cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBkZWZpbmVDb25maWcoe1xuICB0ZXN0RGlyOiAnLi90ZXN0cy1uZXcnLFxuICAvKiBNYXhpbXVtIHRpbWUgb25lIHRlc3QgY2FuIHJ1biBmb3IuICovXG4gIHRpbWVvdXQ6IDYwICogMTAwMCwgLy8gSW5jcmVhc2VkIHRpbWVvdXQgZm9yIGxhbmd1YWdlIHRlc3RzXG4gIGV4cGVjdDoge1xuICAgIC8qKlxuICAgICAqIE1heGltdW0gdGltZSBleHBlY3QoKSBzaG91bGQgd2FpdCBmb3IgdGhlIGNvbmRpdGlvbiB0byBiZSBtZXQuXG4gICAgICogRm9yIGV4YW1wbGUgaW4gYGF3YWl0IGV4cGVjdChsb2NhdG9yKS50b0hhdmVUZXh0KCk7YFxuICAgICAqL1xuICAgIHRpbWVvdXQ6IDUwMDBcbiAgfSxcbiAgLyogUnVuIHRlc3RzIGluIGZpbGVzIGluIHBhcmFsbGVsICovXG4gIGZ1bGx5UGFyYWxsZWw6IHRydWUsXG4gIC8qIEZhaWwgdGhlIGJ1aWxkIG9uIENJIGlmIHlvdSBhY2NpZGVudGFsbHkgbGVmdCB0ZXN0Lm9ubHkgaW4gdGhlIHNvdXJjZSBjb2RlLiAqL1xuICBmb3JiaWRPbmx5OiAhIXByb2Nlc3MuZW52LkNJLFxuICAvKiBSZXRyeSBvbiBDSSBvbmx5ICovXG4gIHJldHJpZXM6IHByb2Nlc3MuZW52LkNJID8gMiA6IDAsXG4gIC8qIE9wdCBvdXQgb2YgcGFyYWxsZWwgdGVzdHMgb24gQ0kuICovXG4gIHdvcmtlcnM6IHByb2Nlc3MuZW52LkNJID8gMSA6IHVuZGVmaW5lZCxcbiAgLyogUmVwb3J0ZXIgdG8gdXNlLiBTZWUgaHR0cHM6Ly9wbGF5d3JpZ2h0LmRldi9kb2NzL3Rlc3QtcmVwb3J0ZXJzICovXG4gIHJlcG9ydGVyOiAnaHRtbCcsXG4gIC8qIFNoYXJlZCBzZXR0aW5ncyBmb3IgYWxsIHRoZSBwcm9qZWN0cyBiZWxvdy4gU2VlIGh0dHBzOi8vcGxheXdyaWdodC5kZXYvZG9jcy9hcGkvY2xhc3MtdGVzdG9wdGlvbnMuICovXG4gIHVzZToge1xuICAgIC8qIE1heGltdW0gdGltZSBlYWNoIGFjdGlvbiBzdWNoIGFzIGBjbGljaygpYCBjYW4gdGFrZS4gRGVmYXVsdHMgdG8gMCAobm8gbGltaXQpLiAqL1xuICAgIGFjdGlvblRpbWVvdXQ6IDAsXG4gICAgLyogQmFzZSBVUkwgdG8gdXNlIGluIGFjdGlvbnMgbGlrZSBgYXdhaXQgcGFnZS5nb3RvKCcvJylgLiAqL1xuICAgIGJhc2VVUkw6ICdodHRwOi8vbG9jYWxob3N0OjgwMDEnLFxuXG4gICAgLyogQ29sbGVjdCB0cmFjZSB3aGVuIHJldHJ5aW5nIHRoZSBmYWlsZWQgdGVzdC4gU2VlIGh0dHBzOi8vcGxheXdyaWdodC5kZXYvZG9jcy90cmFjZS12aWV3ZXIgKi9cbiAgICB0cmFjZTogJ29uLWZpcnN0LXJldHJ5JyxcbiAgfSxcblxuICAvKiBDb25maWd1cmUgcHJvamVjdHMgZm9yIG1ham9yIGJyb3dzZXJzICovXG4gIHByb2plY3RzOiBbXG4gICAge1xuICAgICAgbmFtZTogJ2Nocm9taXVtJyxcbiAgICAgIHVzZToge1xuICAgICAgICAuLi5kZXZpY2VzWydEZXNrdG9wIENocm9tZSddLFxuICAgICAgfSxcbiAgICB9LFxuICBdLFxuXG4gIC8qIEZvbGRlciBmb3IgdGVzdCBhcnRpZmFjdHMgc3VjaCBhcyBzY3JlZW5zaG90cywgdmlkZW9zLCB0cmFjZXMsIGV0Yy4gKi9cbiAgb3V0cHV0RGlyOiAndGVzdC1yZXN1bHRzLycsXG5cbiAgLyogUnVuIHlvdXIgbG9jYWwgZGV2IHNlcnZlciBiZWZvcmUgc3RhcnRpbmcgdGhlIHRlc3RzICovXG4gIHdlYlNlcnZlcjoge1xuICAgIGNvbW1hbmQ6ICdweXRob24zIC1tIGh0dHAuc2VydmVyIDgwMDEnLFxuICAgIHBvcnQ6IDgwMDEsXG4gICAgcmV1c2VFeGlzdGluZ1NlcnZlcjogIXByb2Nlc3MuZW52LkNJLFxuICB9LFxufSk7Il0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0EsTUFBTTtFQUFFQSxZQUFZO0VBQUVDO0FBQVEsQ0FBQyxHQUFHQyxPQUFPLENBQUMsa0JBQWtCLENBQUM7O0FBRTdEO0FBQ0E7QUFDQTtBQUNBQyxNQUFNLENBQUNDLE9BQU8sR0FBR0osWUFBWSxDQUFDO0VBQzVCSyxPQUFPLEVBQUUsYUFBYTtFQUN0QjtFQUNBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLElBQUk7RUFBRTtFQUNwQkMsTUFBTSxFQUFFO0lBQ047QUFDSjtBQUNBO0FBQ0E7SUFDSUQsT0FBTyxFQUFFO0VBQ1gsQ0FBQztFQUNEO0VBQ0FFLGFBQWEsRUFBRSxJQUFJO0VBQ25CO0VBQ0FDLFVBQVUsRUFBRSxDQUFDLENBQUNDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxFQUFFO0VBQzVCO0VBQ0FDLE9BQU8sRUFBRUgsT0FBTyxDQUFDQyxHQUFHLENBQUNDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUMvQjtFQUNBRSxPQUFPLEVBQUVKLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxFQUFFLEdBQUcsQ0FBQyxHQUFHRyxTQUFTO0VBQ3ZDO0VBQ0FDLFFBQVEsRUFBRSxNQUFNO0VBQ2hCO0VBQ0FDLEdBQUcsRUFBRTtJQUNIO0lBQ0FDLGFBQWEsRUFBRSxDQUFDO0lBQ2hCO0lBQ0FDLE9BQU8sRUFBRSx1QkFBdUI7SUFFaEM7SUFDQUMsS0FBSyxFQUFFO0VBQ1QsQ0FBQztFQUVEO0VBQ0FDLFFBQVEsRUFBRSxDQUNSO0lBQ0VDLElBQUksRUFBRSxVQUFVO0lBQ2hCTCxHQUFHLEVBQUU7TUFDSCxHQUFHaEIsT0FBTyxDQUFDLGdCQUFnQjtJQUM3QjtFQUNGLENBQUMsQ0FDRjtFQUVEO0VBQ0FzQixTQUFTLEVBQUUsZUFBZTtFQUUxQjtFQUNBQyxTQUFTLEVBQUU7SUFDVEMsT0FBTyxFQUFFLDZCQUE2QjtJQUN0Q0MsSUFBSSxFQUFFLElBQUk7SUFDVkMsbUJBQW1CLEVBQUUsQ0FBQ2pCLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQztFQUNwQztBQUNGLENBQUMsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==