const { test, expect } = require('@playwright/test');

/**
 * Performance and Asset Loading Tests
 * Tests page load performance, asset optimization, and loading efficiency
 */

test.describe('Performance and Asset Loading', () => {
  const baseURL = 'http://127.0.0.1:1027';
  
  test.beforeEach(async ({ page }) => {
    // Enable network domain for performance monitoring
    await page.context().addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.timing.navigationStart,
        loadStart: performance.timing.loadStart,
        resources: []
      };
    });
  });

  test.describe('Page Load Performance', () => {
    test('should measure homepage load performance', async ({ page }) => {
      console.log('⚡ Testing homepage load performance...\n');
      
      const startTime = Date.now();
      
      // Start navigation
      const response = await page.goto(`${baseURL}/`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`  📊 Page load time: ${loadTime}ms`);
      
      // Check response status
      expect(response?.status()).toBe(200);
      console.log(`  ✅ HTTP Status: ${response?.status()}`);
      
      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            }
          }).observe({ entryTypes: ['paint'] });
          
          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              vitals.lcp = lastEntry.startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Layout Shift
          let cumulativeLayoutShift = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                cumulativeLayoutShift += entry.value;
              }
            }
            vitals.cls = cumulativeLayoutShift;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Wait a bit to collect metrics
          setTimeout(() => {
            // Get additional metrics
            vitals.domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
            vitals.windowLoad = performance.timing.loadEventEnd - performance.timing.navigationStart;
            vitals.ttfb = performance.timing.responseStart - performance.timing.navigationStart;
            
            resolve(vitals);
          }, 3000);
        });
      });
      
      console.log('  📈 Core Web Vitals:');
      
      if (webVitals.fcp) {
        console.log(`    First Contentful Paint: ${webVitals.fcp.toFixed(2)}ms`);
        if (webVitals.fcp < 1800) {
          console.log('      ✅ Good FCP (< 1.8s)');
        } else if (webVitals.fcp < 3000) {
          console.log('      ⚠️ Needs improvement (1.8s - 3.0s)');
        } else {
          console.log('      ❌ Poor FCP (> 3.0s)');
        }
      }
      
      if (webVitals.lcp) {
        console.log(`    Largest Contentful Paint: ${webVitals.lcp.toFixed(2)}ms`);
        if (webVitals.lcp < 2500) {
          console.log('      ✅ Good LCP (< 2.5s)');
        } else if (webVitals.lcp < 4000) {
          console.log('      ⚠️ Needs improvement (2.5s - 4.0s)');
        } else {
          console.log('      ❌ Poor LCP (> 4.0s)');
        }
      }
      
      if (webVitals.cls !== undefined) {
        console.log(`    Cumulative Layout Shift: ${webVitals.cls.toFixed(4)}`);
        if (webVitals.cls < 0.1) {
          console.log('      ✅ Good CLS (< 0.1)');
        } else if (webVitals.cls < 0.25) {
          console.log('      ⚠️ Needs improvement (0.1 - 0.25)');
        } else {
          console.log('      ❌ Poor CLS (> 0.25)');
        }
      }
      
      console.log(`    Time to First Byte: ${webVitals.ttfb}ms`);
      console.log(`    DOM Content Loaded: ${webVitals.domContentLoaded}ms`);
      console.log(`    Window Load: ${webVitals.windowLoad}ms`);
      
      // Performance score based on metrics
      let performanceScore = 100;
      if (loadTime > 3000) performanceScore -= 20;
      if (webVitals.fcp && webVitals.fcp > 3000) performanceScore -= 20;
      if (webVitals.lcp && webVitals.lcp > 4000) performanceScore -= 20;
      if (webVitals.cls && webVitals.cls > 0.25) performanceScore -= 20;
      if (webVitals.ttfb > 800) performanceScore -= 10;
      
      console.log(`  📊 Performance Score: ${Math.max(0, performanceScore)}/100`);
    });

    test('should test performance across different pages', async ({ page }) => {
      const testPages = [
        { path: '/', name: 'Homepage' },
        { path: '/about/', name: 'About' },
        { path: '/contact/', name: 'Contact' },
        { path: '/autorag/', name: 'AutoRAG' }
      ];
      
      console.log('🏃 Testing performance across multiple pages...\n');
      
      const pageMetrics = [];
      
      for (const testPage of testPages) {
        console.log(`  Testing ${testPage.name} (${testPage.path})...`);
        
        try {
          const startTime = Date.now();
          const response = await page.goto(`${baseURL}${testPage.path}`, {
            waitUntil: 'networkidle',
            timeout: 20000
          });
          const loadTime = Date.now() - startTime;
          
          if (response && response.status() === 200) {
            // Get basic performance metrics
            const metrics = await page.evaluate(() => ({
              domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
              windowLoad: performance.timing.loadEventEnd - performance.timing.navigationStart,
              ttfb: performance.timing.responseStart - performance.timing.navigationStart
            }));
            
            pageMetrics.push({
              name: testPage.name,
              path: testPage.path,
              loadTime,
              ...metrics,
              status: response.status()
            });
            
            console.log(`    ✅ ${testPage.name}: ${loadTime}ms (DOM: ${metrics.domContentLoaded}ms)`);
          } else {
            console.log(`    ❌ ${testPage.name}: Failed to load (Status: ${response?.status()})`);
          }
        } catch (error) {
          console.log(`    🚫 ${testPage.name}: Error - ${error.message}`);
        }
      }
      
      // Analyze performance consistency
      if (pageMetrics.length > 1) {
        console.log('\n  📊 Performance Analysis:');
        
        const avgLoadTime = pageMetrics.reduce((sum, page) => sum + page.loadTime, 0) / pageMetrics.length;
        const maxLoadTime = Math.max(...pageMetrics.map(page => page.loadTime));
        const minLoadTime = Math.min(...pageMetrics.map(page => page.loadTime));
        
        console.log(`    Average load time: ${avgLoadTime.toFixed(2)}ms`);
        console.log(`    Fastest page: ${minLoadTime}ms`);
        console.log(`    Slowest page: ${maxLoadTime}ms`);
        console.log(`    Load time variance: ${(maxLoadTime - minLoadTime)}ms`);
        
        // Check for consistency
        const isConsistent = (maxLoadTime - minLoadTime) < 2000; // Less than 2s difference
        console.log(`    Performance consistency: ${isConsistent ? '✅ Good' : '⚠️ Needs improvement'}`);
      }
    });
  });

  test.describe('Asset Loading and Optimization', () => {
    test('should analyze image loading and optimization', async ({ page }) => {
      console.log('🖼️ Testing image loading and optimization...\n');
      
      // Track network requests
      const imageRequests = [];
      
      page.on('response', response => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.startsWith('image/')) {
          imageRequests.push({
            url,
            status: response.status(),
            contentType,
            size: parseInt(response.headers()['content-length'] || '0')
          });
        }
      });
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log(`  📝 Found ${imageRequests.length} image requests`);
      
      let totalImageSize = 0;
      let optimizedImages = 0;
      let unoptimizedImages = 0;
      
      for (const request of imageRequests) {
        console.log(`    ${request.status} - ${request.contentType} - ${(request.size / 1024).toFixed(2)}KB - ${request.url}`);
        
        totalImageSize += request.size;
        
        // Check for modern image formats
        if (request.contentType.includes('webp') || request.contentType.includes('avif')) {
          optimizedImages++;
        } else if (request.contentType.includes('jpeg') || request.contentType.includes('png')) {
          unoptimizedImages++;
        }
      }
      
      console.log(`\n  📊 Image Analysis:`);
      console.log(`    Total image size: ${(totalImageSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`    Optimized formats (WebP/AVIF): ${optimizedImages}`);
      console.log(`    Legacy formats (JPEG/PNG): ${unoptimizedImages}`);
      
      if (optimizedImages > 0) {
        console.log(`    ✅ Uses modern image formats`);
      }
      
      if (totalImageSize > 5 * 1024 * 1024) { // 5MB
        console.log(`    ⚠️ Total image size is large (${(totalImageSize / 1024 / 1024).toFixed(2)}MB)`);
      } else {
        console.log(`    ✅ Total image size is reasonable`);
      }
      
      // Test for lazy loading
      const lazyImages = await page.locator('img[loading="lazy"], img[data-lazy]').count();
      if (lazyImages > 0) {
        console.log(`    ✅ ${lazyImages} images use lazy loading`);
      }
      
      // Check for broken images
      const images = await page.locator('img').all();
      let brokenImages = 0;
      
      for (const img of images) {
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        const naturalHeight = await img.evaluate(el => el.naturalHeight);
        
        if (naturalWidth === 0 || naturalHeight === 0) {
          brokenImages++;
          const src = await img.getAttribute('src');
          console.log(`    ❌ Broken image: ${src}`);
        }
      }
      
      if (brokenImages === 0) {
        console.log(`    ✅ All ${images.length} images loaded successfully`);
      } else {
        console.log(`    ❌ ${brokenImages} broken images found`);
      }
    });

    test('should analyze video loading and optimization', async ({ page }) => {
      console.log('🎥 Testing video loading and optimization...\n');
      
      const videoRequests = [];
      
      page.on('response', response => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.startsWith('video/') || url.includes('.mp4') || url.includes('.webm')) {
          videoRequests.push({
            url,
            status: response.status(),
            contentType,
            size: parseInt(response.headers()['content-length'] || '0')
          });
        }
      });
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Wait for videos to start loading
      await page.waitForTimeout(3000);
      
      console.log(`  📝 Found ${videoRequests.length} video requests`);
      
      let totalVideoSize = 0;
      let webmVideos = 0;
      let mp4Videos = 0;
      
      for (const request of videoRequests) {
        console.log(`    ${request.status} - ${request.contentType} - ${(request.size / 1024 / 1024).toFixed(2)}MB - ${request.url.split('/').pop()}`);
        
        totalVideoSize += request.size;
        
        if (request.url.includes('.webm') || request.contentType.includes('webm')) {
          webmVideos++;
        } else if (request.url.includes('.mp4') || request.contentType.includes('mp4')) {
          mp4Videos++;
        }
      }
      
      console.log(`\n  📊 Video Analysis:`);
      console.log(`    Total video size loaded: ${(totalVideoSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`    WebM videos: ${webmVideos}`);
      console.log(`    MP4 videos: ${mp4Videos}`);
      
      if (webmVideos > 0) {
        console.log(`    ✅ Uses efficient WebM format`);
      }
      
      // Test video elements on page
      const videos = await page.locator('video').all();
      console.log(`  📝 Found ${videos.length} video elements on page`);
      
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const id = await video.getAttribute('id');
        const preload = await video.getAttribute('preload');
        const autoplay = await video.getAttribute('autoplay');
        const muted = await video.getAttribute('muted');
        
        console.log(`    Video ${i + 1} (${id || 'no-id'}):`);
        console.log(`      Preload: ${preload || 'auto'}`);
        console.log(`      Autoplay: ${autoplay !== null}`);
        console.log(`      Muted: ${muted !== null}`);
        
        // Check video sources
        const sources = await video.locator('source').all();
        for (const source of sources) {
          const src = await source.getAttribute('src');
          const type = await source.getAttribute('type');
          console.log(`      Source: ${type} - ${src?.split('/').pop()}`);
        }
      }
      
      // Check for video optimization attributes
      const lazyVideos = await page.locator('video[data-lazy], video[data-lazy-video]').count();
      if (lazyVideos > 0) {
        console.log(`    ✅ ${lazyVideos} videos use lazy loading`);
      }
    });

    test('should analyze CSS and JavaScript loading', async ({ page }) => {
      console.log('📜 Testing CSS and JavaScript loading...\n');
      
      const cssRequests = [];
      const jsRequests = [];
      
      page.on('response', response => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.includes('text/css') || url.endsWith('.css')) {
          cssRequests.push({
            url,
            status: response.status(),
            size: parseInt(response.headers()['content-length'] || '0')
          });
        } else if (contentType.includes('javascript') || url.endsWith('.js')) {
          jsRequests.push({
            url,
            status: response.status(),
            size: parseInt(response.headers()['content-length'] || '0')
          });
        }
      });
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log(`  📝 CSS Resources: ${cssRequests.length}`);
      let totalCSSSize = 0;
      
      for (const request of cssRequests) {
        totalCSSSize += request.size;
        console.log(`    ${request.status} - ${(request.size / 1024).toFixed(2)}KB - ${request.url.split('/').pop()}`);
      }
      
      console.log(`  📊 Total CSS size: ${(totalCSSSize / 1024).toFixed(2)}KB`);
      
      console.log(`\n  📝 JavaScript Resources: ${jsRequests.length}`);
      let totalJSSize = 0;
      
      for (const request of jsRequests) {
        totalJSSize += request.size;
        console.log(`    ${request.status} - ${(request.size / 1024).toFixed(2)}KB - ${request.url.split('/').pop()}`);
      }
      
      console.log(`  📊 Total JavaScript size: ${(totalJSSize / 1024).toFixed(2)}KB`);
      
      // Analyze resource optimization
      console.log(`\n  📈 Resource Optimization Analysis:`);
      
      if (totalCSSSize < 100 * 1024) { // 100KB
        console.log(`    ✅ CSS size is good (${(totalCSSSize / 1024).toFixed(2)}KB)`);
      } else {
        console.log(`    ⚠️ CSS size could be optimized (${(totalCSSSize / 1024).toFixed(2)}KB)`);
      }
      
      if (totalJSSize < 500 * 1024) { // 500KB
        console.log(`    ✅ JavaScript size is reasonable (${(totalJSSize / 1024).toFixed(2)}KB)`);
      } else {
        console.log(`    ⚠️ JavaScript size could be optimized (${(totalJSSize / 1024).toFixed(2)}KB)`);
      }
      
      // Check for minification
      const minifiedCSS = cssRequests.filter(req => req.url.includes('.min.css')).length;
      const minifiedJS = jsRequests.filter(req => req.url.includes('.min.js')).length;
      
      if (minifiedCSS > 0 || cssRequests.length === 0) {
        console.log(`    ✅ CSS appears to be minified`);
      }
      
      if (minifiedJS > 0 || jsRequests.length === 0) {
        console.log(`    ✅ JavaScript appears to be minified`);
      }
    });
  });

  test.describe('Caching and Compression', () => {
    test('should check HTTP caching headers', async ({ page }) => {
      console.log('🗄️ Testing HTTP caching headers...\n');
      
      const cacheableResources = [];
      
      page.on('response', response => {
        const url = response.url();
        const headers = response.headers();
        
        // Check static resources
        if (url.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|ico|mp4|webm)$/)) {
          cacheableResources.push({
            url: url.split('/').pop(),
            cacheControl: headers['cache-control'],
            expires: headers['expires'],
            etag: headers['etag'],
            lastModified: headers['last-modified']
          });
        }
      });
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log(`  📝 Found ${cacheableResources.length} cacheable resources`);
      
      let resourcesWithCaching = 0;
      let resourcesWithoutCaching = 0;
      
      for (const resource of cacheableResources.slice(0, 10)) { // Limit output
        console.log(`    ${resource.url}:`);
        
        if (resource.cacheControl) {
          console.log(`      Cache-Control: ${resource.cacheControl}`);
          resourcesWithCaching++;
        } else {
          console.log(`      ❌ No Cache-Control header`);
          resourcesWithoutCaching++;
        }
        
        if (resource.etag) {
          console.log(`      ETag: ${resource.etag}`);
        }
        
        if (resource.lastModified) {
          console.log(`      Last-Modified: ${resource.lastModified}`);
        }
      }
      
      console.log(`\n  📊 Caching Analysis:`);
      console.log(`    Resources with caching: ${resourcesWithCaching}`);
      console.log(`    Resources without caching: ${resourcesWithoutCaching}`);
      
      if (resourcesWithCaching > resourcesWithoutCaching) {
        console.log(`    ✅ Most resources have proper caching headers`);
      } else {
        console.log(`    ⚠️ Many resources lack caching headers`);
      }
    });

    test('should check compression headers', async ({ page }) => {
      console.log('🗜️ Testing content compression...\n');
      
      const compressibleResources = [];
      
      page.on('response', response => {
        const url = response.url();
        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        
        // Check text-based resources that should be compressed
        if (contentType.includes('text/') || 
            contentType.includes('application/javascript') ||
            contentType.includes('application/json') ||
            url.endsWith('.css') || 
            url.endsWith('.js')) {
          
          compressibleResources.push({
            url: url.split('/').pop(),
            contentType,
            contentEncoding: headers['content-encoding'],
            contentLength: headers['content-length']
          });
        }
      });
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log(`  📝 Found ${compressibleResources.length} compressible resources`);
      
      let compressedResources = 0;
      let uncompressedResources = 0;
      
      for (const resource of compressibleResources.slice(0, 8)) { // Limit output
        console.log(`    ${resource.url} (${resource.contentType}):`);
        
        if (resource.contentEncoding) {
          console.log(`      ✅ Compressed with: ${resource.contentEncoding}`);
          compressedResources++;
        } else {
          console.log(`      ❌ Not compressed`);
          uncompressedResources++;
        }
        
        if (resource.contentLength) {
          console.log(`      Size: ${(parseInt(resource.contentLength) / 1024).toFixed(2)}KB`);
        }
      }
      
      console.log(`\n  📊 Compression Analysis:`);
      console.log(`    Compressed resources: ${compressedResources}`);
      console.log(`    Uncompressed resources: ${uncompressedResources}`);
      
      if (compressedResources > uncompressedResources) {
        console.log(`    ✅ Most text resources are compressed`);
      } else {
        console.log(`    ⚠️ Many text resources lack compression`);
      }
    });
  });

  test.describe('Resource Loading Efficiency', () => {
    test('should analyze resource loading waterfall', async ({ page }) => {
      console.log('🌊 Analyzing resource loading waterfall...\n');
      
      const resourceTimings = [];
      
      // Capture performance entries
      await page.addInitScript(() => {
        window.addEventListener('load', () => {
          const entries = performance.getEntriesByType('resource');
          window.resourceTimings = entries.map(entry => ({
            name: entry.name.split('/').pop(),
            initiatorType: entry.initiatorType,
            startTime: entry.startTime,
            duration: entry.duration,
            transferSize: entry.transferSize
          }));
        });
      });
      
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const timings = await page.evaluate(() => window.resourceTimings || []);
      
      if (timings.length > 0) {
        console.log(`  📝 Captured ${timings.length} resource timings`);
        
        // Sort by start time to see loading order
        timings.sort((a, b) => a.startTime - b.startTime);
        
        console.log(`\n  ⏱️ Resource Loading Timeline (first 10):`);
        
        for (let i = 0; i < Math.min(timings.length, 10); i++) {
          const timing = timings[i];
          console.log(`    ${(timing.startTime / 1000).toFixed(2)}s - ${timing.name} (${timing.initiatorType}) - ${timing.duration.toFixed(2)}ms`);
        }
        
        // Analyze by resource type
        const byType = {};
        for (const timing of timings) {
          if (!byType[timing.initiatorType]) {
            byType[timing.initiatorType] = [];
          }
          byType[timing.initiatorType].push(timing);
        }
        
        console.log(`\n  📊 Resources by Type:`);
        for (const [type, resources] of Object.entries(byType)) {
          const avgDuration = resources.reduce((sum, r) => sum + r.duration, 0) / resources.length;
          const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
          
          console.log(`    ${type}: ${resources.length} resources, avg ${avgDuration.toFixed(2)}ms, ${(totalSize / 1024).toFixed(2)}KB total`);
        }
        
        // Find slow resources
        const slowResources = timings.filter(t => t.duration > 1000); // > 1 second
        if (slowResources.length > 0) {
          console.log(`\n  ⚠️ Slow loading resources (> 1s):`);
          for (const resource of slowResources) {
            console.log(`    ${resource.name}: ${resource.duration.toFixed(2)}ms`);
          }
        } else {
          console.log(`\n  ✅ All resources loaded efficiently (< 1s each)`);
        }
      } else {
        console.log('  ❌ Could not capture resource timing data');
      }
    });

    test('should test critical resource prioritization', async ({ page }) => {
      console.log('🎯 Testing critical resource prioritization...\n');
      
      // Track when critical resources load
      const criticalResourceTimes = {};
      
      page.on('response', response => {
        const url = response.url();
        const resourceType = response.request().resourceType();
        
        // Identify critical resources
        if (url.includes('style.css') || url.includes('main.css')) {
          criticalResourceTimes.css = Date.now();
        } else if (url.includes('main.js') || url.includes('app.js')) {
          criticalResourceTimes.js = Date.now();
        } else if (resourceType === 'document') {
          criticalResourceTimes.html = Date.now();
        }
      });
      
      const startTime = Date.now();
      await page.goto(`${baseURL}/`);
      
      // Measure when content becomes visible
      await page.waitForSelector('h1', { timeout: 10000 });
      const firstContentTime = Date.now();
      
      await page.waitForLoadState('networkidle');
      const completeTime = Date.now();
      
      console.log(`  ⏱️ Loading Timeline:`);
      console.log(`    HTML loaded: ${criticalResourceTimes.html ? (criticalResourceTimes.html - startTime) : 'N/A'}ms`);
      console.log(`    CSS loaded: ${criticalResourceTimes.css ? (criticalResourceTimes.css - startTime) : 'N/A'}ms`);
      console.log(`    JS loaded: ${criticalResourceTimes.js ? (criticalResourceTimes.js - startTime) : 'N/A'}ms`);
      console.log(`    First content visible: ${firstContentTime - startTime}ms`);
      console.log(`    Page complete: ${completeTime - startTime}ms`);
      
      // Check if critical resources loaded in good order
      if (criticalResourceTimes.css && criticalResourceTimes.js) {
        if (criticalResourceTimes.css < criticalResourceTimes.js) {
          console.log(`    ✅ CSS loaded before JavaScript (good for rendering)`);
        } else {
          console.log(`    ⚠️ JavaScript loaded before CSS (may cause layout shift)`);
        }
      }
      
      // Check render-blocking resources
      const renderBlockingCSS = await page.locator('link[rel="stylesheet"]:not([media])').count();
      const renderBlockingJS = await page.locator('script[src]:not([async]):not([defer])').count();
      
      console.log(`\n  🚫 Render-blocking resources:`);
      console.log(`    Blocking CSS files: ${renderBlockingCSS}`);
      console.log(`    Blocking JS files: ${renderBlockingJS}`);
      
      if (renderBlockingCSS === 0 && renderBlockingJS === 0) {
        console.log(`    ✅ No render-blocking resources detected`);
      } else {
        console.log(`    ⚠️ Consider optimizing render-blocking resources`);
      }
    });
  });
});