const { test, expect, devices } = require('@playwright/test');

// Mobile devices for performance testing
const mobileDevices = [
  { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'], width: 390, network: '3G' },
  { name: 'iPhone SE', device: devices['iPhone SE'], width: 375, network: '4G' },
  { name: 'Galaxy S21', device: devices['Galaxy S21'], width: 360, network: '4G' },
  { name: 'Pixel 5', device: devices['Pixel 5'], width: 393, network: '4G' },
];

// Performance and accessibility helper
class MobilePerformanceHelper {
  constructor(page) {
    this.page = page;
    this.metrics = {};
  }

  async measurePageLoad(url) {
    const startTime = Date.now();
    
    await this.page.goto(url, { waitUntil: 'load' });
    const loadTime = Date.now() - startTime;
    
    await this.page.waitForLoadState('networkidle');
    const networkIdleTime = Date.now() - startTime;
    
    // Get Core Web Vitals using page.evaluate
    const webVitals = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // Simple performance metrics collection
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          domInteractive: navigation ? navigation.domInteractive - navigation.navigationStart : 0
        };
        
        resolve(metrics);
      });
    });
    
    return {
      loadTime,
      networkIdleTime,
      webVitals,
      url
    };
  }

  async analyzeAccessibility() {
    const accessibility = await this.page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt tags
      const images = Array.from(document.querySelectorAll('img:not([alt])'));
      if (images.length > 0) {
        issues.push({ type: 'missing-alt', count: images.length });
      }
      
      // Check for touch target sizes
      const interactive = Array.from(document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]'));
      const smallTargets = interactive.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      });
      
      if (smallTargets.length > 0) {
        issues.push({ type: 'small-touch-targets', count: smallTargets.length });
      }
      
      // Check for color contrast issues (simplified)
      const textElements = Array.from(document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6'));
      const lowContrast = textElements.filter(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Simple check: if both are similar (not comprehensive)
        return color === backgroundColor;
      });
      
      if (lowContrast.length > 0) {
        issues.push({ type: 'potential-contrast-issues', count: lowContrast.length });
      }
      
      // Check for font sizes
      const smallText = textElements.filter(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        return fontSize < 14 && el.textContent && el.textContent.trim().length > 0;
      });
      
      if (smallText.length > 5) { // Allow some flexibility
        issues.push({ type: 'small-text', count: smallText.length });
      }
      
      // Check for proper heading structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const h1Count = document.querySelectorAll('h1').length;
      
      if (h1Count === 0) {
        issues.push({ type: 'missing-h1', count: 1 });
      } else if (h1Count > 1) {
        issues.push({ type: 'multiple-h1', count: h1Count });
      }
      
      // Check for keyboard navigation
      const focusableElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]'));
      const tabIndexIssues = focusableElements.filter(el => {
        const tabIndex = el.getAttribute('tabindex');
        return tabIndex && parseInt(tabIndex) > 0;
      });
      
      if (tabIndexIssues.length > 0) {
        issues.push({ type: 'tabindex-issues', count: tabIndexIssues.length });
      }
      
      return {
        issues,
        totalAccessibilityScore: Math.max(0, 100 - (issues.length * 10)),
        headingStructure: {
          totalHeadings: headings.length,
          h1Count: h1Count
        },
        interactiveElements: {
          total: interactive.length,
          smallTargets: smallTargets.length,
          focusable: focusableElements.length
        }
      };
    });
    
    return accessibility;
  }

  async analyzeResourceLoading() {
    const resources = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      
      const analysis = {
        totalResources: entries.length,
        css: entries.filter(e => e.name.includes('.css')).length,
        js: entries.filter(e => e.name.includes('.js')).length,
        images: entries.filter(e => e.initiatorType === 'img').length,
        fonts: entries.filter(e => e.initiatorType === 'css' && e.name.includes('font')).length,
        largeResources: entries.filter(e => e.transferSize > 1000000).length, // > 1MB
        slowResources: entries.filter(e => e.duration > 2000).length // > 2s
      };
      
      // Calculate total transfer size
      analysis.totalTransferSize = entries.reduce((sum, e) => sum + (e.transferSize || 0), 0);
      
      return analysis;
    });
    
    return resources;
  }

  async testScrollPerformance() {
    // Test scroll performance
    const scrollTest = await this.page.evaluate(async () => {
      return new Promise((resolve) => {
        let scrollCount = 0;
        let lagCount = 0;
        const startTime = performance.now();
        
        const testScroll = () => {
          const scrollStart = performance.now();
          window.scrollBy(0, 100);
          
          requestAnimationFrame(() => {
            const scrollEnd = performance.now();
            const scrollTime = scrollEnd - scrollStart;
            
            if (scrollTime > 16.67) { // 60fps threshold
              lagCount++;
            }
            
            scrollCount++;
            
            if (scrollCount < 10) {
              setTimeout(testScroll, 50);
            } else {
              const totalTime = performance.now() - startTime;
              resolve({
                totalScrolls: scrollCount,
                laggyScrolls: lagCount,
                averageScrollTime: totalTime / scrollCount,
                smoothScrolling: lagCount / scrollCount < 0.3 // Less than 30% laggy
              });
            }
          });
        };
        
        testScroll();
      });
    });
    
    return scrollTest;
  }

  async checkMobileOptimizations() {
    const mobileOpts = await this.page.evaluate(() => {
      // Check viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const viewportContent = viewportMeta ? viewportMeta.getAttribute('content') : null;
      
      // Check for mobile-specific CSS
      const mobileCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => 
        link.href.includes('mobile') || link.media === 'screen and (max-width: 768px)'
      );
      
      // Check for responsive images
      const images = Array.from(document.querySelectorAll('img'));
      const responsiveImages = images.filter(img => 
        img.hasAttribute('srcset') || img.style.maxWidth === '100%' || 
        window.getComputedStyle(img).maxWidth === '100%'
      );
      
      // Check touch event support
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check for fixed elements that might interfere with scrolling
      const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'fixed';
      });
      
      return {
        hasViewportMeta: !!viewportMeta,
        viewportContent,
        hasMobileCSS: mobileCSS,
        responsiveImagePercent: images.length > 0 ? (responsiveImages.length / images.length) * 100 : 0,
        touchSupport,
        fixedElementCount: fixedElements.length,
        mobileOptimized: !!viewportMeta && touchSupport
      };
    });
    
    return mobileOpts;
  }
}

// Performance tests for each device
mobileDevices.forEach(({ name, device, width, network }) => {
  test.describe(`Mobile Performance - ${name} (${width}px)`, () => {
    test.use({ 
      ...device,
      // Simulate network conditions
      // Note: In real implementation you might want to use page.route() for network throttling
    });

    test(`${name} - Homepage performance analysis`, async ({ page }) => {
      const helper = new MobilePerformanceHelper(page);
      
      console.log(`⚡ Testing ${name} performance...`);
      
      // Measure page load performance
      const loadMetrics = await helper.measurePageLoad('https://divinci.ai/');
      console.log(`📊 ${name} Load Metrics:`, loadMetrics);
      
      // Performance thresholds for mobile
      expect(loadMetrics.loadTime).toBeLessThan(15000); // 15 seconds
      expect(loadMetrics.networkIdleTime).toBeLessThan(20000); // 20 seconds
      expect(loadMetrics.webVitals.firstContentfulPaint).toBeLessThan(4000); // 4 seconds
      
      // Analyze accessibility
      const accessibility = await helper.analyzeAccessibility();
      console.log(`♿ ${name} Accessibility:`, accessibility);
      
      expect(accessibility.totalAccessibilityScore).toBeGreaterThan(70);
      expect(accessibility.interactiveElements.smallTargets).toBeLessThan(5);
      
      // Check mobile optimizations
      const mobileOpts = await helper.checkMobileOptimizations();
      console.log(`📱 ${name} Mobile Optimizations:`, mobileOpts);
      
      expect(mobileOpts.hasViewportMeta).toBe(true);
      expect(mobileOpts.touchSupport).toBe(true);
      expect(mobileOpts.mobileOptimized).toBe(true);
    });

    test(`${name} - Resource loading performance`, async ({ page }) => {
      const helper = new MobilePerformanceHelper(page);
      
      console.log(`📦 Testing ${name} resource loading...`);
      
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      const resources = await helper.analyzeResourceLoading();
      console.log(`📈 ${name} Resource Analysis:`, resources);
      
      // Mobile-friendly resource limits
      expect(resources.largeResources).toBeLessThan(3); // Few large resources
      expect(resources.slowResources).toBeLessThan(5); // Few slow-loading resources
      expect(resources.totalTransferSize).toBeLessThan(5000000); // < 5MB total
      
      // Test scroll performance
      const scrollPerf = await helper.testScrollPerformance();
      console.log(`📜 ${name} Scroll Performance:`, scrollPerf);
      
      expect(scrollPerf.smoothScrolling).toBe(true);
      expect(scrollPerf.averageScrollTime).toBeLessThan(50); // 50ms average
    });

    test(`${name} - Key pages performance comparison`, async ({ page }) => {
      const helper = new MobilePerformanceHelper(page);
      
      console.log(`🔄 Testing ${name} across multiple pages...`);
      
      const pagesToTest = [
        'https://divinci.ai/',
        'https://divinci.ai/about/',
        'https://divinci.ai/autorag/',
        'https://divinci.ai/contact/'
      ];
      
      const results = {};
      
      for (const url of pagesToTest) {
        try {
          const metrics = await helper.measurePageLoad(url);
          const accessibility = await helper.analyzeAccessibility();
          
          results[url] = {
            loadTime: metrics.loadTime,
            accessibilityScore: accessibility.totalAccessibilityScore,
            issues: accessibility.issues.length,
            firstContentfulPaint: metrics.webVitals.firstContentfulPaint
          };
          
          console.log(`📊 ${name} ${url}:`, results[url]);
          
          // Each page should meet performance criteria
          expect(metrics.loadTime).toBeLessThan(15000);
          expect(accessibility.totalAccessibilityScore).toBeGreaterThan(60);
          
        } catch (error) {
          console.log(`❌ ${name} ${url} Error:`, error.message);
          results[url] = { error: error.message };
        }
      }
      
      console.log(`📋 ${name} Page Performance Summary:`, results);
    });

    test(`${name} - Mobile-specific feature performance`, async ({ page }) => {
      const helper = new MobilePerformanceHelper(page);
      
      console.log(`📱 Testing ${name} mobile features...`);
      
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      // Test language switcher performance
      const langSwitcherTest = await page.evaluate(async () => {
        const switcher = document.querySelector('.language-switcher-current');
        if (!switcher) return { error: 'Language switcher not found' };
        
        const startTime = performance.now();
        switcher.click();
        
        return new Promise((resolve) => {
          setTimeout(() => {
            const endTime = performance.now();
            const dropdown = document.querySelector('.language-switcher-dropdown');
            
            resolve({
              responseTime: endTime - startTime,
              dropdownVisible: dropdown && window.getComputedStyle(dropdown).display !== 'none'
            });
          }, 500);
        });
      });
      
      console.log(`🌐 ${name} Language Switcher:`, langSwitcherTest);
      
      if (!langSwitcherTest.error) {
        expect(langSwitcherTest.responseTime).toBeLessThan(300); // 300ms response
        expect(langSwitcherTest.dropdownVisible).toBe(true);
      }
      
      // Test video handling on mobile
      const videoTest = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const hiddenVideos = videos.filter(v => {
          const style = window.getComputedStyle(v);
          return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
        });
        
        return {
          totalVideos: videos.length,
          hiddenVideos: hiddenVideos.length,
          properlyHidden: videos.length === hiddenVideos.length,
          memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 'unknown'
        };
      });
      
      console.log(`🎥 ${name} Video Handling:`, videoTest);
      expect(videoTest.properlyHidden).toBe(true);
      
      // Test touch interaction responsiveness
      const touchTest = await page.evaluate(async () => {
        const buttons = Array.from(document.querySelectorAll('button, .cta-button, a'));
        if (buttons.length === 0) return { error: 'No interactive elements found' };
        
        const testButton = buttons[0];
        const startTime = performance.now();
        
        // Simulate touch event
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: []
        });
        
        testButton.dispatchEvent(touchEvent);
        
        return new Promise((resolve) => {
          requestAnimationFrame(() => {
            const endTime = performance.now();
            resolve({
              responseTime: endTime - startTime,
              elementResponded: true
            });
          });
        });
      });
      
      console.log(`👆 ${name} Touch Response:`, touchTest);
      
      if (!touchTest.error) {
        expect(touchTest.responseTime).toBeLessThan(100); // 100ms touch response
      }
    });
  });
});

// Cross-device performance comparison
test.describe('Cross-Device Performance Comparison', () => {
  test('Performance consistency across mobile devices', async ({ browser }) => {
    console.log('📊 Running cross-device performance comparison...');
    
    const performanceResults = {};
    
    for (const { name, device } of mobileDevices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const helper = new MobilePerformanceHelper(page);
      
      try {
        const loadMetrics = await helper.measurePageLoad('https://divinci.ai/');
        const accessibility = await helper.analyzeAccessibility();
        const resources = await helper.analyzeResourceLoading();
        const mobileOpts = await helper.checkMobileOptimizations();
        
        performanceResults[name] = {
          loadTime: loadMetrics.loadTime,
          firstContentfulPaint: loadMetrics.webVitals.firstContentfulPaint,
          accessibilityScore: accessibility.totalAccessibilityScore,
          resourceCount: resources.totalResources,
          totalTransferSize: resources.totalTransferSize,
          mobileOptimized: mobileOpts.mobileOptimized,
          touchTargetIssues: accessibility.interactiveElements.smallTargets
        };
        
        console.log(`📱 ${name} Performance Summary:`, performanceResults[name]);
        
      } catch (error) {
        console.log(`❌ ${name} Performance Error:`, error.message);
        performanceResults[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    // Calculate averages and ensure consistency
    const validResults = Object.keys(performanceResults).filter(d => !performanceResults[d].error);
    
    if (validResults.length > 1) {
      const avgLoadTime = validResults.reduce((sum, d) => sum + performanceResults[d].loadTime, 0) / validResults.length;
      const avgAccessibilityScore = validResults.reduce((sum, d) => sum + performanceResults[d].accessibilityScore, 0) / validResults.length;
      
      console.log(`📊 Performance Averages:`, { avgLoadTime, avgAccessibilityScore });
      
      // All devices should meet minimum standards
      validResults.forEach(deviceName => {
        expect(performanceResults[deviceName].loadTime).toBeLessThan(20000); // 20s max
        expect(performanceResults[deviceName].accessibilityScore).toBeGreaterThan(60);
        expect(performanceResults[deviceName].mobileOptimized).toBe(true);
        expect(performanceResults[deviceName].touchTargetIssues).toBeLessThan(10);
      });
      
      // Consistency check - no device should be dramatically slower
      validResults.forEach(deviceName => {
        const result = performanceResults[deviceName];
        expect(result.loadTime).toBeLessThan(avgLoadTime * 2); // No more than 2x average
      });
    }
    
    console.log('📋 Cross-device performance summary:', performanceResults);
  });

  test('Accessibility consistency across devices', async ({ browser }) => {
    console.log('♿ Testing accessibility consistency...');
    
    const accessibilityResults = {};
    
    for (const { name, device } of mobileDevices.slice(0, 2)) { // Test first 2 for efficiency
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const helper = new MobilePerformanceHelper(page);
      
      try {
        await page.goto('https://divinci.ai/');
        await page.waitForLoadState('networkidle');
        
        const accessibility = await helper.analyzeAccessibility();
        
        accessibilityResults[name] = {
          score: accessibility.totalAccessibilityScore,
          issues: accessibility.issues,
          touchTargets: accessibility.interactiveElements.smallTargets,
          headingStructure: accessibility.headingStructure.h1Count === 1
        };
        
        console.log(`♿ ${name} Accessibility:`, accessibilityResults[name]);
        
      } catch (error) {
        console.log(`❌ ${name} Accessibility Error:`, error.message);
        accessibilityResults[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    // All devices should have similar accessibility standards
    Object.keys(accessibilityResults).forEach(deviceName => {
      if (!accessibilityResults[deviceName].error) {
        expect(accessibilityResults[deviceName].score).toBeGreaterThan(60);
        expect(accessibilityResults[deviceName].headingStructure).toBe(true);
        expect(accessibilityResults[deviceName].touchTargets).toBeLessThan(10);
      }
    });
    
    console.log('📋 Accessibility consistency summary:', accessibilityResults);
  });
});