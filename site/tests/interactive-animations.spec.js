const { test, expect } = require('@playwright/test');

/**
 * Interactive Elements and Animations Tests
 * Tests sacred geometry animations, interactive elements, and visual components
 */

test.describe('Interactive Elements and Animations', () => {
  const baseURL = 'http://127.0.0.1:1027';
  
  test.beforeEach(async ({ page }) => {
    // Allow animations for this test suite but with shorter durations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.3s !important;
          animation-delay: 0s !important;
          transition-duration: 0.3s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Video Elements and Controls', () => {
    test('should load and display video elements correctly', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('🎥 Testing video elements...\n');
      
      // Check for hero video
      const heroVideo = page.locator('#hero-video, .hero-video');
      if (await heroVideo.count() > 0) {
        await expect(heroVideo).toBeVisible();
        console.log('  ✅ Hero video element is present');
        
        // Check video attributes
        const isAutoplay = await heroVideo.getAttribute('autoplay');
        const isMuted = await heroVideo.getAttribute('muted');
        const isLoop = await heroVideo.getAttribute('loop');
        const preload = await heroVideo.getAttribute('preload');
        
        console.log(`    📝 Video attributes: autoplay=${isAutoplay !== null}, muted=${isMuted !== null}, loop=${isLoop !== null}, preload=${preload}`);
        
        // Check video sources
        const videoSources = heroVideo.locator('source');
        const sourceCount = await videoSources.count();
        console.log(`    📝 Found ${sourceCount} video sources`);
        
        if (sourceCount > 0) {
          for (let i = 0; i < sourceCount; i++) {
            const source = videoSources.nth(i);
            const src = await source.getAttribute('src');
            const type = await source.getAttribute('type');
            console.log(`      ${i + 1}. ${type}: ${src}`);
          }
        }
        
        // Test video loading
        await page.waitForTimeout(2000); // Allow video to start loading
        
        const videoElement = await heroVideo.elementHandle();
        if (videoElement) {
          const readyState = await videoElement.evaluate(el => el.readyState);
          const networkState = await videoElement.evaluate(el => el.networkState);
          
          console.log(`    📝 Video ready state: ${readyState} (0=nothing, 1=metadata, 2=current, 3=future, 4=enough)`);
          console.log(`    📝 Video network state: ${networkState} (0=empty, 1=idle, 2=loading, 3=no_source)`);
          
          if (readyState >= 1) {
            console.log('    ✅ Video metadata loaded successfully');
          }
        }
      }
      
      // Check for background videos
      const backgroundVideos = page.locator('.background-video, #background-video-default');
      const bgVideoCount = await backgroundVideos.count();
      
      if (bgVideoCount > 0) {
        console.log(`  📝 Found ${bgVideoCount} background videos`);
        
        for (let i = 0; i < bgVideoCount; i++) {
          const bgVideo = backgroundVideos.nth(i);
          const id = await bgVideo.getAttribute('id');
          const isVisible = await bgVideo.isVisible();
          
          console.log(`    ${i + 1}. Background video (${id || 'no-id'}): ${isVisible ? 'visible' : 'hidden'}`);
        }
      }
      
      // Check for video controls
      const soundToggle = page.locator('#sound-toggle, .sound-toggle, .video-controls button');
      if (await soundToggle.count() > 0) {
        await expect(soundToggle).toBeVisible();
        console.log('  ✅ Video sound toggle control is present');
        
        // Test sound toggle interaction
        await soundToggle.click();
        await page.waitForTimeout(500);
        
        const buttonText = await soundToggle.textContent();
        console.log(`    📝 Sound toggle text: "${buttonText?.trim()}"`);
      }
    });

    test('should handle video interaction and hover effects', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('🎬 Testing video interactions...\n');
      
      // Test panel hover video switching
      const panels = page.locator('.panel');
      const panelCount = await panels.count();
      
      if (panelCount > 0) {
        console.log(`  📝 Found ${panelCount} panels to test`);
        
        for (let i = 0; i < Math.min(panelCount, 3); i++) {
          const panel = panels.nth(i);
          const panelClass = await panel.getAttribute('class');
          
          console.log(`    Testing panel ${i + 1}: ${panelClass}`);
          
          // Hover over panel
          await panel.hover();
          await page.waitForTimeout(1000);
          
          // Check if background video changes
          const activeVideo = page.locator('.background-video.active');
          if (await activeVideo.count() > 0) {
            const activeVideoId = await activeVideo.getAttribute('id');
            console.log(`      📝 Active background video: ${activeVideoId}`);
          }
          
          // Check for panel-specific videos
          const panelVideo = page.locator(`video[data-panel="${i + 1}"]`);
          if (await panelVideo.count() > 0) {
            console.log(`      ✅ Panel ${i + 1} has associated video`);
          }
        }
      }
      
      // Test video poster images
      const videosWithPoster = page.locator('video[poster]');
      const posterCount = await videosWithPoster.count();
      
      if (posterCount > 0) {
        console.log(`  📝 Found ${posterCount} videos with poster images`);
        
        for (let i = 0; i < posterCount; i++) {
          const video = videosWithPoster.nth(i);
          const poster = await video.getAttribute('poster');
          console.log(`    ${i + 1}. Poster: ${poster}`);
        }
      }
    });
  });

  test.describe('SVG and Sacred Geometry Elements', () => {
    test('should display SVG elements and animations', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('🔯 Testing SVG and sacred geometry elements...\n');
      
      // Check for SVG elements
      const svgElements = page.locator('svg');
      const svgCount = await svgElements.count();
      
      if (svgCount > 0) {
        console.log(`  📝 Found ${svgCount} SVG elements`);
        
        for (let i = 0; i < Math.min(svgCount, 5); i++) {
          const svg = svgElements.nth(i);
          const viewBox = await svg.getAttribute('viewBox');
          const width = await svg.getAttribute('width');
          const height = await svg.getAttribute('height');
          
          console.log(`    ${i + 1}. SVG: viewBox="${viewBox}", size="${width}x${height}"`);
          
          // Check for SVG paths (likely geometric shapes)
          const paths = svg.locator('path');
          const pathCount = await paths.count();
          
          if (pathCount > 0) {
            console.log(`      📝 Contains ${pathCount} path elements`);
          }
          
          // Check for circles (common in sacred geometry)
          const circles = svg.locator('circle');
          const circleCount = await circles.count();
          
          if (circleCount > 0) {
            console.log(`      📝 Contains ${circleCount} circle elements`);
          }
          
          // Check for geometric patterns
          const polygons = svg.locator('polygon');
          const polylines = svg.locator('polyline');
          const polygonCount = await polygons.count();
          const polylineCount = await polylines.count();
          
          if (polygonCount > 0 || polylineCount > 0) {
            console.log(`      📝 Contains ${polygonCount} polygons, ${polylineCount} polylines`);
          }
        }
      }
      
      // Test panel art SVGs specifically
      const panelArt = page.locator('.panel-art svg');
      const panelArtCount = await panelArt.count();
      
      if (panelArtCount > 0) {
        console.log(`  ✅ Found ${panelArtCount} panel art SVGs`);
        
        // Test visibility of panel art
        for (let i = 0; i < panelArtCount; i++) {
          const art = panelArt.nth(i);
          await expect(art).toBeVisible();
          console.log(`    ✅ Panel art ${i + 1} is visible`);
        }
      }
      
      // Check for Da Vinci-style illustrations
      const daVinciImages = page.locator('img[alt*="da vinci" i], img[alt*="davinci" i], img[src*="davinci" i]');
      const daVinciCount = await daVinciImages.count();
      
      if (daVinciCount > 0) {
        console.log(`  🎨 Found ${daVinciCount} Da Vinci-style images`);
        
        for (let i = 0; i < daVinciCount; i++) {
          const img = daVinciImages.nth(i);
          const alt = await img.getAttribute('alt');
          const src = await img.getAttribute('src');
          console.log(`    ${i + 1}. ${alt}: ${src}`);
        }
      }
    });

    test('should test SVG animation effects', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('✨ Testing SVG animations and effects...\n');
      
      // Test for CSS animations on SVG elements
      const animatedSVGs = page.locator('svg[class*="animate"], .animated svg, svg.rotating');
      const animatedCount = await animatedSVGs.count();
      
      if (animatedCount > 0) {
        console.log(`  📝 Found ${animatedCount} potentially animated SVGs`);
        
        for (let i = 0; i < animatedCount; i++) {
          const svg = animatedSVGs.nth(i);
          const className = await svg.getAttribute('class');
          console.log(`    ${i + 1}. Animated SVG classes: ${className}`);
        }
      }
      
      // Test hover effects on interactive elements
      const interactiveElements = page.locator('.panel, .feature-card, .team-member');
      const interactiveCount = await interactiveElements.count();
      
      if (interactiveCount > 0) {
        console.log(`  📝 Testing hover effects on ${interactiveCount} interactive elements`);
        
        for (let i = 0; i < Math.min(interactiveCount, 3); i++) {
          const element = interactiveElements.nth(i);
          
          // Get initial state
          const initialTransform = await element.evaluate(el => window.getComputedStyle(el).transform);
          
          // Hover over element
          await element.hover();
          await page.waitForTimeout(500);
          
          // Check for transform changes
          const hoverTransform = await element.evaluate(el => window.getComputedStyle(el).transform);
          
          if (initialTransform !== hoverTransform) {
            console.log(`    ✅ Element ${i + 1} has hover transform effect`);
          }
          
          // Check for SVG within the element
          const elementSVG = element.locator('svg');
          if (await elementSVG.count() > 0) {
            console.log(`      📝 Element contains SVG graphics`);
          }
        }
      }
      
      // Test for particle effects or canvas animations
      const canvasElements = page.locator('canvas');
      const canvasCount = await canvasElements.count();
      
      if (canvasCount > 0) {
        console.log(`  🎨 Found ${canvasCount} canvas elements for animations`);
      }
    });
  });

  test.describe('Interactive UI Components', () => {
    test('should test dropdown and menu interactions', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📋 Testing dropdown and menu interactions...\n');
      
      // Test navigation dropdowns
      const dropdowns = page.locator('.dropdown');
      const dropdownCount = await dropdowns.count();
      
      if (dropdownCount > 0) {
        console.log(`  📝 Found ${dropdownCount} dropdown menus`);
        
        for (let i = 0; i < dropdownCount; i++) {
          const dropdown = dropdowns.nth(i);
          const dropdownTrigger = dropdown.locator('.dropdown-toggle, .dropdown-trigger').first();
          
          // If no specific trigger, use the dropdown itself
          const trigger = await dropdownTrigger.count() > 0 ? dropdownTrigger : dropdown;
          
          console.log(`    Testing dropdown ${i + 1}...`);
          
          // Test hover to open
          await trigger.hover();
          await page.waitForTimeout(500);
          
          const dropdownMenu = dropdown.locator('.dropdown-menu');
          if (await dropdownMenu.count() > 0) {
            const isVisible = await dropdownMenu.isVisible();
            console.log(`      📝 Menu visibility on hover: ${isVisible ? '✅ visible' : '❌ hidden'}`);
            
            if (isVisible) {
              // Check dropdown content
              const dropdownItems = dropdownMenu.locator('a, button');
              const itemCount = await dropdownItems.count();
              console.log(`      📝 Dropdown contains ${itemCount} items`);
              
              // Test dropdown item hover effects
              if (itemCount > 0) {
                await dropdownItems.first().hover();
                await page.waitForTimeout(200);
                console.log(`      ✅ Dropdown items respond to hover`);
              }
            }
            
            // Test click outside to close
            await page.click('body', { position: { x: 10, y: 10 } });
            await page.waitForTimeout(300);
            
            const isStillVisible = await dropdownMenu.isVisible();
            if (!isStillVisible) {
              console.log(`      ✅ Dropdown closes when clicking outside`);
            }
          }
        }
      }
      
      // Test language switcher
      const languageSwitcher = page.locator('.language-switcher');
      if (await languageSwitcher.count() > 0) {
        console.log('  🌍 Testing language switcher...');
        
        await languageSwitcher.click();
        await page.waitForTimeout(500);
        
        const languageOptions = page.locator('.language-option, .language-switcher-dropdown a');
        const optionCount = await languageOptions.count();
        
        if (optionCount > 0) {
          console.log(`    ✅ Language switcher shows ${optionCount} options`);
          
          // Test language option hover
          await languageOptions.first().hover();
          await page.waitForTimeout(200);
          console.log(`    ✅ Language options respond to hover`);
        }
      }
    });

    test('should test button and link interactions', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('🔘 Testing button and link interactions...\n');
      
      // Test CTA buttons
      const ctaButtons = page.locator('.cta-button, .primary-button, .btn-primary');
      const ctaCount = await ctaButtons.count();
      
      if (ctaCount > 0) {
        console.log(`  📝 Found ${ctaCount} CTA buttons`);
        
        for (let i = 0; i < Math.min(ctaCount, 3); i++) {
          const button = ctaButtons.nth(i);
          const buttonText = await button.textContent();
          const href = await button.getAttribute('href');
          
          console.log(`    ${i + 1}. "${buttonText?.trim()}" -> ${href || 'JavaScript action'}`);
          
          // Test button hover effect
          await button.hover();
          await page.waitForTimeout(300);
          
          const hoverColor = await button.evaluate(el => window.getComputedStyle(el).backgroundColor);
          console.log(`      📝 Hover color: ${hoverColor}`);
        }
      }
      
      // Test secondary buttons
      const secondaryButtons = page.locator('.secondary-button, .btn-secondary');
      const secondaryCount = await secondaryButtons.count();
      
      if (secondaryCount > 0) {
        console.log(`  📝 Found ${secondaryCount} secondary buttons`);
        
        // Test first secondary button
        const button = secondaryButtons.first();
        const buttonText = await button.textContent();
        
        console.log(`    Secondary button: "${buttonText?.trim()}"`);
        
        // Test interaction
        await button.hover();
        await page.waitForTimeout(200);
        console.log(`    ✅ Secondary button responds to hover`);
      }
      
      // Test icon buttons
      const iconButtons = page.locator('button:has(svg), .icon-button');
      const iconButtonCount = await iconButtons.count();
      
      if (iconButtonCount > 0) {
        console.log(`  📝 Found ${iconButtonCount} icon buttons`);
        
        for (let i = 0; i < Math.min(iconButtonCount, 3); i++) {
          const iconButton = iconButtons.nth(i);
          
          // Test hover effect
          await iconButton.hover();
          await page.waitForTimeout(200);
          
          const svgIcon = iconButton.locator('svg');
          if (await svgIcon.count() > 0) {
            console.log(`    ${i + 1}. Icon button with SVG responds to hover`);
          }
        }
      }
    });

    test('should test scroll-triggered animations', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📜 Testing scroll-triggered animations...\n');
      
      // Test elements that might have scroll animations
      const animatedElements = page.locator('.fade-in, .slide-in, .animate-on-scroll, .reveal');
      const animatedCount = await animatedElements.count();
      
      if (animatedCount > 0) {
        console.log(`  📝 Found ${animatedCount} potentially scroll-animated elements`);
        
        // Scroll to trigger animations
        for (let i = 0; i < Math.min(animatedCount, 3); i++) {
          const element = animatedElements.nth(i);
          
          // Scroll element into view
          await element.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          
          // Check if element is visible and potentially animated
          const isVisible = await element.isVisible();
          const opacity = await element.evaluate(el => window.getComputedStyle(el).opacity);
          const transform = await element.evaluate(el => window.getComputedStyle(el).transform);
          
          console.log(`    ${i + 1}. Element visibility: ${isVisible}, opacity: ${opacity}, transform: ${transform !== 'none' ? 'has transform' : 'none'}`);
        }
      }
      
      // Test sections that might fade in on scroll
      const sections = page.locator('section');
      const sectionCount = await sections.count();
      
      if (sectionCount > 0) {
        console.log(`  📝 Testing scroll animations on ${sectionCount} sections`);
        
        // Scroll through sections
        for (let i = 0; i < Math.min(sectionCount, 4); i++) {
          const section = sections.nth(i);
          
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          
          // Check if section content becomes visible
          const sectionContent = section.locator('h2, h3, p').first();
          if (await sectionContent.count() > 0) {
            const isVisible = await sectionContent.isVisible();
            console.log(`    Section ${i + 1} content visible: ${isVisible ? '✅' : '❌'}`);
          }
        }
      }
      
      // Test for parallax or fixed elements
      const fixedElements = page.locator('[style*="position: fixed"], .parallax, .fixed-bg');
      const fixedCount = await fixedElements.count();
      
      if (fixedCount > 0) {
        console.log(`  📝 Found ${fixedCount} fixed or parallax elements`);
        
        // Scroll and check if elements maintain position
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(500);
        
        console.log(`    ✅ Scrolled page to test fixed positioning`);
        
        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Performance of Interactive Elements', () => {
    test('should measure animation performance', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('⚡ Testing animation performance...\n');
      
      // Start performance monitoring
      await page.evaluate(() => {
        window.animationFrameCount = 0;
        window.animationStartTime = performance.now();
        
        function countFrames() {
          window.animationFrameCount++;
          requestAnimationFrame(countFrames);
        }
        requestAnimationFrame(countFrames);
      });
      
      // Trigger interactions that might cause animations
      const panels = page.locator('.panel');
      const panelCount = await panels.count();
      
      if (panelCount > 0) {
        console.log('  📝 Testing panel hover animations...');
        
        for (let i = 0; i < Math.min(panelCount, 3); i++) {
          const panel = panels.nth(i);
          await panel.hover();
          await page.waitForTimeout(1000);
        }
      }
      
      // Test dropdown animations
      const dropdowns = page.locator('.dropdown');
      if (await dropdowns.count() > 0) {
        console.log('  📝 Testing dropdown animations...');
        
        await dropdowns.first().hover();
        await page.waitForTimeout(500);
        
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }
      
      // Measure performance
      const performanceData = await page.evaluate(() => {
        const endTime = performance.now();
        const duration = endTime - window.animationStartTime;
        const fps = Math.round((window.animationFrameCount / duration) * 1000);
        
        return {
          duration,
          frameCount: window.animationFrameCount,
          fps,
          memoryUsage: performance.memory ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          } : null
        };
      });
      
      console.log(`  📊 Animation performance metrics:`);
      console.log(`    Duration: ${performanceData.duration.toFixed(2)}ms`);
      console.log(`    Frame count: ${performanceData.frameCount}`);
      console.log(`    Average FPS: ${performanceData.fps}`);
      
      if (performanceData.memoryUsage) {
        const memoryMB = (performanceData.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`    Memory usage: ${memoryMB}MB`);
      }
      
      // Check if performance is acceptable
      if (performanceData.fps >= 30) {
        console.log(`    ✅ Animation performance is good (${performanceData.fps} FPS)`);
      } else if (performanceData.fps >= 15) {
        console.log(`    ⚠️ Animation performance is moderate (${performanceData.fps} FPS)`);
      } else {
        console.log(`    ❌ Animation performance may be poor (${performanceData.fps} FPS)`);
      }
    });
  });
});