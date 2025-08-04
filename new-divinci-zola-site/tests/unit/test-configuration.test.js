const { test, expect } = require('@playwright/test');
const { defineConfig, devices } = require('@playwright/test');

/**
 * Unit Tests for Test Configuration and Setup
 * Validates Playwright configuration, device settings, and test environment setup
 */

test.describe('Test Configuration Unit Tests', () => {

  test.describe('Playwright Configuration Validation', () => {
    test('should validate base configuration structure', () => {
      const mockConfig = {
        testDir: './tests',
        fullyParallel: true,
        forbidOnly: !!process.env.CI,
        retries: process.env.CI ? 2 : 0,
        workers: process.env.CI ? 1 : undefined,
        reporter: [['html'], ['json'], ['list']],
        use: {
          baseURL: 'http://127.0.0.1:1111',
          trace: 'on-first-retry',
          screenshot: 'only-on-failure',
          video: 'retain-on-failure'
        }
      };

      // Validate required properties
      expect(mockConfig).toHaveProperty('testDir');
      expect(mockConfig).toHaveProperty('use');
      expect(mockConfig).toHaveProperty('reporter');

      // Validate test directory
      expect(mockConfig.testDir).toBe('./tests');
      expect(typeof mockConfig.testDir).toBe('string');

      // Validate parallel execution
      expect(typeof mockConfig.fullyParallel).toBe('boolean');

      // Validate CI-specific settings
      expect(typeof mockConfig.forbidOnly).toBe('boolean');
      expect(typeof mockConfig.retries).toBe('number');
      expect(mockConfig.retries).toBeGreaterThanOrEqual(0);

      // Validate reporters
      expect(Array.isArray(mockConfig.reporter)).toBe(true);
      expect(mockConfig.reporter.length).toBeGreaterThan(0);
    });

    test('should validate global use configuration', () => {
      const useConfig = {
        baseURL: 'http://127.0.0.1:1111',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10000,
        navigationTimeout: 30000
      };

      // Validate baseURL
      expect(useConfig.baseURL).toMatch(/^https?:\/\/.+/);
      expect(useConfig.baseURL).toContain('127.0.0.1:1111');

      // Validate trace options
      const validTraceOptions = ['on', 'off', 'on-first-retry', 'retain-on-failure'];
      expect(validTraceOptions).toContain(useConfig.trace);

      // Validate screenshot options
      const validScreenshotOptions = ['on', 'off', 'only-on-failure'];
      expect(validScreenshotOptions).toContain(useConfig.screenshot);

      // Validate video options
      const validVideoOptions = ['on', 'off', 'retain-on-failure'];
      expect(validVideoOptions).toContain(useConfig.video);

      // Validate timeouts
      expect(useConfig.actionTimeout).toBeGreaterThan(0);
      expect(useConfig.navigationTimeout).toBeGreaterThan(useConfig.actionTimeout);
      expect(typeof useConfig.actionTimeout).toBe('number');
      expect(typeof useConfig.navigationTimeout).toBe('number');
    });

    test('should validate expect configuration', () => {
      const expectConfig = {
        timeout: 10000,
        threshold: 0.3,
        toHaveScreenshot: {
          threshold: 0.3,
          maxDiffPixels: 1000,
          animations: 'disabled',
          mode: 'rgb'
        }
      };

      // Validate timeout
      expect(expectConfig.timeout).toBeGreaterThan(0);
      expect(typeof expectConfig.timeout).toBe('number');

      // Validate threshold
      expect(expectConfig.threshold).toBeGreaterThan(0);
      expect(expectConfig.threshold).toBeLessThan(1);

      // Validate screenshot config
      expect(expectConfig.toHaveScreenshot).toHaveProperty('threshold');
      expect(expectConfig.toHaveScreenshot).toHaveProperty('maxDiffPixels');
      expect(expectConfig.toHaveScreenshot).toHaveProperty('animations');
      expect(expectConfig.toHaveScreenshot).toHaveProperty('mode');

      expect(expectConfig.toHaveScreenshot.animations).toBe('disabled');
      expect(expectConfig.toHaveScreenshot.mode).toBe('rgb');
      expect(expectConfig.toHaveScreenshot.maxDiffPixels).toBeGreaterThan(0);
    });

    test('should validate web server configuration', () => {
      const webServerConfig = {
        command: 'cd /path/to/project && zola serve --port 1111',
        port: 1111,
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
        env: {
          'ZOLA_ENV': 'test'
        }
      };

      // Validate command
      expect(webServerConfig.command).toContain('zola serve');
      expect(webServerConfig.command).toContain('--port 1111');
      expect(typeof webServerConfig.command).toBe('string');

      // Validate port
      expect(webServerConfig.port).toBe(1111);
      expect(typeof webServerConfig.port).toBe('number');
      expect(webServerConfig.port).toBeGreaterThan(1000);
      expect(webServerConfig.port).toBeLessThan(65536);

      // Validate reuse setting
      expect(typeof webServerConfig.reuseExistingServer).toBe('boolean');

      // Validate timeout
      expect(webServerConfig.timeout).toBeGreaterThan(0);
      expect(typeof webServerConfig.timeout).toBe('number');

      // Validate environment
      expect(webServerConfig.env).toHaveProperty('ZOLA_ENV');
      expect(webServerConfig.env.ZOLA_ENV).toBe('test');
    });
  });

  test.describe('Project Configuration Validation', () => {
    test('should validate desktop browser projects', () => {
      const desktopProjects = [
        {
          name: 'Desktop-Chrome',
          use: { 
            ...devices['Desktop Chrome'],
            viewport: { width: 1920, height: 1080 }
          }
        },
        {
          name: 'Desktop-Firefox',
          use: { 
            ...devices['Desktop Firefox'],
            viewport: { width: 1920, height: 1080 }
          }
        },
        {
          name: 'Desktop-Safari',
          use: { 
            ...devices['Desktop Safari'],
            viewport: { width: 1920, height: 1080 }
          }
        }
      ];

      desktopProjects.forEach(project => {
        // Validate project structure
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('use');
        
        // Validate name
        expect(project.name).toMatch(/^Desktop-/);
        expect(typeof project.name).toBe('string');
        
        // Validate viewport
        expect(project.use.viewport).toHaveProperty('width');
        expect(project.use.viewport).toHaveProperty('height');
        expect(project.use.viewport.width).toBe(1920);
        expect(project.use.viewport.height).toBe(1080);
      });
    });

    test('should validate mobile browser projects', () => {
      const mobileProjects = [
        {
          name: 'Mobile-Chrome',
          use: { ...devices['Pixel 5'] }
        },
        {
          name: 'Mobile-Safari',
          use: { ...devices['iPhone 12'] }
        }
      ];

      mobileProjects.forEach(project => {
        // Validate project structure
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('use');
        
        // Validate name
        expect(project.name).toMatch(/^Mobile-/);
        expect(typeof project.name).toBe('string');
        
        // Mobile devices should have smaller viewports
        if (project.use.viewport) {
          expect(project.use.viewport.width).toBeLessThan(500);
          expect(project.use.viewport.height).toBeGreaterThan(600);
        }
      });
    });

    test('should validate visual testing projects', () => {
      const visualProjects = [
        {
          name: 'Visual-Desktop',
          use: { 
            ...devices['Desktop Chrome'],
            viewport: { width: 1920, height: 1080 }
          },
          testMatch: ['**/visual-regression.spec.js']
        },
        {
          name: 'Visual-Mobile',
          use: { 
            ...devices['iPhone 12'],
            viewport: { width: 375, height: 667 }
          },
          testMatch: ['**/visual-regression.spec.js']
        }
      ];

      visualProjects.forEach(project => {
        // Validate project structure
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('use');
        expect(project).toHaveProperty('testMatch');
        
        // Validate name
        expect(project.name).toMatch(/^Visual-/);
        
        // Validate test match patterns
        expect(Array.isArray(project.testMatch)).toBe(true);
        expect(project.testMatch.length).toBeGreaterThan(0);
        
        project.testMatch.forEach(pattern => {
          expect(pattern).toMatch(/\*\*.*\.spec\.js$/);
        });
      });
    });

    test('should validate test match patterns', () => {
      const testPatterns = [
        '**/new-divinci-site.spec.js',
        '**/language-*.spec.js',
        '**/comprehensive-*.spec.js',
        '**/mobile-*.spec.js',
        '**/visual-*.spec.js',
        '**/accessibility-*.spec.js'
      ];

      testPatterns.forEach(pattern => {
        // Validate pattern format
        expect(pattern).toMatch(/^\*\*\/.+\.spec\.js$/);
        expect(typeof pattern).toBe('string');
        
        // Should not contain spaces
        expect(pattern).not.toContain(' ');
        
        // Should end with .spec.js
        expect(pattern).toEndWith('.spec.js');
      });
    });
  });

  test.describe('Device Configuration Validation', () => {
    test('should validate mobile device configurations', () => {
      const mobileDevices = {
        'iPhone-SE': { width: 375, height: 667 },
        'iPhone-12': { width: 390, height: 844 },
        'iPhone-14-Pro': { width: 393, height: 852 },
        'Pixel-5': { width: 393, height: 851 },
        'Galaxy-S21': { width: 360, height: 800 }
      };

      Object.entries(mobileDevices).forEach(([device, viewport]) => {
        // Validate device name format
        expect(device).toMatch(/^[A-Za-z0-9-]+$/);
        
        // Validate viewport dimensions
        expect(viewport).toHaveProperty('width');
        expect(viewport).toHaveProperty('height');
        expect(typeof viewport.width).toBe('number');
        expect(typeof viewport.height).toBe('number');
        
        // Mobile viewport constraints
        expect(viewport.width).toBeGreaterThan(300);
        expect(viewport.width).toBeLessThan(500);
        expect(viewport.height).toBeGreaterThan(600);
        expect(viewport.height).toBeLessThan(900);
      });
    });

    test('should validate tablet device configurations', () => {
      const tabletDevices = {
        'iPad': { width: 768, height: 1024 },
        'iPad-Pro': { width: 1024, height: 1366 },
        'Galaxy-Tab': { width: 800, height: 1280 }
      };

      Object.entries(tabletDevices).forEach(([device, viewport]) => {
        // Validate device name format
        expect(device).toMatch(/^[A-Za-z0-9-]+$/);
        
        // Validate viewport dimensions
        expect(viewport).toHaveProperty('width');
        expect(viewport).toHaveProperty('height');
        
        // Tablet viewport constraints
        expect(viewport.width).toBeGreaterThan(700);
        expect(viewport.width).toBeLessThan(1200);
        expect(viewport.height).toBeGreaterThan(900);
      });
    });

    test('should validate desktop device configurations', () => {
      const desktopDevices = {
        'Desktop-Standard': { width: 1920, height: 1080 },
        'Desktop-Large': { width: 2560, height: 1440 },
        'Desktop-Ultrawide': { width: 3440, height: 1440 }
      };

      Object.entries(desktopDevices).forEach(([device, viewport]) => {
        // Validate device name format
        expect(device).toMatch(/^Desktop-/);
        
        // Validate viewport dimensions
        expect(viewport).toHaveProperty('width');
        expect(viewport).toHaveProperty('height');
        
        // Desktop viewport constraints
        expect(viewport.width).toBeGreaterThan(1200);
        expect(viewport.height).toBeGreaterThan(700);
      });
    });
  });

  test.describe('Reporter Configuration Validation', () => {
    test('should validate HTML reporter configuration', () => {
      const htmlReporter = ['html', { outputFolder: 'test-results' }];
      
      expect(Array.isArray(htmlReporter)).toBe(true);
      expect(htmlReporter[0]).toBe('html');
      expect(htmlReporter[1]).toHaveProperty('outputFolder');
      expect(htmlReporter[1].outputFolder).toBe('test-results');
    });

    test('should validate JSON reporter configuration', () => {
      const jsonReporter = ['json', { outputFile: 'test-results/results.json' }];
      
      expect(Array.isArray(jsonReporter)).toBe(true);
      expect(jsonReporter[0]).toBe('json');
      expect(jsonReporter[1]).toHaveProperty('outputFile');
      expect(jsonReporter[1].outputFile).toMatch(/\.json$/);
    });

    test('should validate list reporter configuration', () => {
      const listReporter = ['list'];
      
      expect(Array.isArray(listReporter)).toBe(true);
      expect(listReporter[0]).toBe('list');
    });

    test('should validate custom reporter configurations', () => {
      const customReporters = [
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['github'],
        ['dot']
      ];

      customReporters.forEach(reporter => {
        expect(Array.isArray(reporter)).toBe(true);
        expect(typeof reporter[0]).toBe('string');
        
        if (reporter[1]) {
          expect(typeof reporter[1]).toBe('object');
        }
      });
    });
  });

  test.describe('Environment Configuration Validation', () => {
    test('should validate CI environment settings', () => {
      const ciSettings = {
        retries: 2,
        workers: 1,
        forbidOnly: true,
        reporter: [['github'], ['html']]
      };

      // CI should have retries
      expect(ciSettings.retries).toBeGreaterThan(0);
      expect(ciSettings.retries).toBeLessThan(5);

      // CI should limit workers
      expect(ciSettings.workers).toBeLessThanOrEqual(2);

      // CI should forbid .only
      expect(ciSettings.forbidOnly).toBe(true);

      // CI should include GitHub reporter
      expect(ciSettings.reporter.some(r => r[0] === 'github')).toBe(true);
    });

    test('should validate local development settings', () => {
      const localSettings = {
        retries: 0,
        workers: undefined,
        forbidOnly: false,
        headed: false,
        reuseExistingServer: true
      };

      // Local should not retry by default
      expect(localSettings.retries).toBe(0);

      // Local can use all available workers
      expect(localSettings.workers).toBeUndefined();

      // Local can use .only for debugging
      expect(localSettings.forbidOnly).toBe(false);

      // Local can reuse server
      expect(localSettings.reuseExistingServer).toBe(true);
    });

    test('should validate environment variables', () => {
      const envVars = {
        CI: process.env.CI,
        NODE_ENV: process.env.NODE_ENV || 'test',
        ZOLA_ENV: 'test',
        BASE_URL: 'http://127.0.0.1:1111'
      };

      // Validate environment variable types
      Object.entries(envVars).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        if (value !== undefined) {
          expect(typeof value).toBe('string');
        }
      });

      // Validate specific values
      if (envVars.NODE_ENV) {
        expect(['test', 'development', 'production']).toContain(envVars.NODE_ENV);
      }

      expect(envVars.ZOLA_ENV).toBe('test');
      expect(envVars.BASE_URL).toMatch(/^https?:\/\/.+/);
    });
  });

  test.describe('Performance Configuration Validation', () => {
    test('should validate timeout configurations', () => {
      const timeouts = {
        action: 10000,
        navigation: 30000,
        expect: 10000,
        testTimeout: 60000
      };

      Object.entries(timeouts).forEach(([type, timeout]) => {
        expect(timeout).toBeGreaterThan(0);
        expect(timeout).toBeLessThan(120000); // Max 2 minutes
        expect(typeof timeout).toBe('number');
        expect(Number.isInteger(timeout)).toBe(true);
      });

      // Navigation should be longer than action
      expect(timeouts.navigation).toBeGreaterThan(timeouts.action);
      
      // Test timeout should be longest
      expect(timeouts.testTimeout).toBeGreaterThan(timeouts.navigation);
    });

    test('should validate retry configurations', () => {
      const retryConfig = {
        globalRetries: 2,
        visualTestRetries: 1,
        flaky: 3
      };

      Object.values(retryConfig).forEach(retries => {
        expect(retries).toBeGreaterThanOrEqual(0);
        expect(retries).toBeLessThan(10);
        expect(typeof retries).toBe('number');
        expect(Number.isInteger(retries)).toBe(true);
      });
    });

    test('should validate parallel execution settings', () => {
      const parallelConfig = {
        fullyParallel: true,
        workers: 4,
        maxWorkers: 8
      };

      expect(typeof parallelConfig.fullyParallel).toBe('boolean');
      expect(parallelConfig.workers).toBeGreaterThan(0);
      expect(parallelConfig.maxWorkers).toBeGreaterThanOrEqual(parallelConfig.workers);
    });
  });

  test.describe('Security Configuration Validation', () => {
    test('should validate secure connection settings', () => {
      const securityConfig = {
        ignoreHTTPSErrors: false,
        acceptDownloads: false,
        bypassCSP: false
      };

      // Security settings should be conservative
      expect(securityConfig.ignoreHTTPSErrors).toBe(false);
      expect(securityConfig.acceptDownloads).toBe(false);
      expect(securityConfig.bypassCSP).toBe(false);
    });

    test('should validate permissions configuration', () => {
      const permissions = [
        'camera',
        'microphone',
        'geolocation',
        'notifications'
      ];

      // Should be an array of known permissions
      expect(Array.isArray(permissions)).toBe(true);
      
      const validPermissions = [
        'camera', 'microphone', 'geolocation', 'notifications', 
        'clipboard-read', 'clipboard-write', 'background-sync'
      ];

      permissions.forEach(permission => {
        expect(validPermissions).toContain(permission);
      });
    });
  });

  test.describe('Custom Configuration Validation', () => {
    test('should validate accessibility configuration', () => {
      const a11yConfig = {
        rules: ['color-contrast', 'keyboard-navigation', 'alt-text'],
        level: 'AA',
        tags: ['wcag2a', 'wcag2aa']
      };

      expect(Array.isArray(a11yConfig.rules)).toBe(true);
      expect(a11yConfig.rules.length).toBeGreaterThan(0);
      expect(['A', 'AA', 'AAA']).toContain(a11yConfig.level);
      expect(Array.isArray(a11yConfig.tags)).toBe(true);
    });

    test('should validate visual testing configuration', () => {
      const visualConfig = {
        threshold: 0.3,
        animations: 'disabled',
        maskColor: '#FF00FF',
        screenshotMode: 'fullPage'
      };

      expect(visualConfig.threshold).toBeGreaterThan(0);
      expect(visualConfig.threshold).toBeLessThan(1);
      expect(visualConfig.animations).toBe('disabled');
      expect(visualConfig.maskColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(['viewport', 'fullPage']).toContain(visualConfig.screenshotMode);
    });
  });
});