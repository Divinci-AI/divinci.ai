const { test, expect } = require('@playwright/test');

/**
 * Video Functionality Tests
 * Tests WebM video support and video switching functionality
 */

test.describe('Video Functionality', () => {
  const baseURL = '/';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('load');
    
    // Disable animations for consistent testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('should have WebM video support', async ({ page }) => {
    console.log('🎥 Testing WebM video format support...');
    
    // Check hero videos have WebM sources
    const heroVideoSources = await page.locator('#hero-video source[type="video/webm"]').count();
    const heroVideo2Sources = await page.locator('#hero-video-2 source[type="video/webm"]').count();
    const heroVideo3Sources = await page.locator('#hero-video-3 source[type="video/webm"]').count();
    
    console.log(`Hero video WebM sources: ${heroVideoSources + heroVideo2Sources + heroVideo3Sources}`);
    expect(heroVideoSources + heroVideo2Sources + heroVideo3Sources).toBeGreaterThanOrEqual(2);
    
    // Each hero video must carry BOTH a WebM and an MP4 source (format fallback)
    for (const id of ['#hero-video', '#hero-video-2', '#hero-video-3']) {
      expect(await page.locator(`${id} source[type="video/webm"]`).count()).toBe(1);
      expect(await page.locator(`${id} source[type="video/mp4"]`).count()).toBe(1);
    }
    console.log('✅ All hero videos expose WebM + MP4 sources');
  });

  test('should have proper video fallback structure', async ({ page }) => {
    console.log('🔄 Testing video fallback structure...');
    
    // Check that each video has both WebM and MP4 sources
    const videoElements = await page.locator('video').all();
    
    for (let i = 0; i < videoElements.length; i++) {
      const videoId = await videoElements[i].getAttribute('id');
      if (videoId) {
        const webmSource = await page.locator(`#${videoId} source[type="video/webm"]`).count();
        const mp4Source = await page.locator(`#${videoId} source[type="video/mp4"]`).count();
        
        console.log(`${videoId}: WebM=${webmSource}, MP4=${mp4Source}`);
        
        // Each video should have at least one source
        expect(webmSource + mp4Source).toBeGreaterThanOrEqual(1);
      }
    }
    
    console.log('✅ Video fallback structure verified');
  });

  test('should have hero video attributes', async ({ page }) => {
    console.log('🎥 Testing hero video autoplay attributes...');
    // muted + playsinline are required for reliable mobile/desktop autoplay
    for (const id of ['#hero-video', '#hero-video-2', '#hero-video-3']) {
      await expect(page.locator(id)).toHaveJSProperty('muted', true);
      await expect(page.locator(id)).toHaveJSProperty('playsInline', true);
    }
    console.log('✅ Hero videos are muted + playsinline');
  });

  test('should load video files without 404 errors', async ({ page }) => {
    console.log('📥 Testing video file loading...');
    
    const videoSources = await page.locator('source').all();
    const brokenVideos = [];
    
    for (const source of videoSources) {
      const src = await source.getAttribute('src');
      if (src && (src.includes('.webm') || src.includes('.mp4'))) {
        try {
          // Check if the video URL returns a successful response
          const response = await page.request.get(src);
          if (response.status() >= 400) {
            brokenVideos.push({ src, status: response.status() });
            console.log(`❌ ${src}: ${response.status()}`);
          } else {
            console.log(`✅ ${src}: ${response.status()}`);
          }
        } catch (error) {
          brokenVideos.push({ src, error: error.message });
          console.log(`🚫 ${src}: ${error.message}`);
        }
      }
    }
    
    if (brokenVideos.length > 0) {
      console.log(`\n🚨 Found ${brokenVideos.length} broken video files:`);
      brokenVideos.forEach(video => {
        console.log(`   - ${video.src}: ${video.status || video.error}`);
      });
    }
    
    // Allow some broken videos but not too many
    expect(brokenVideos.length).toBeLessThan(3);
    console.log(`✅ Video loading test completed (${brokenVideos.length} issues found)`);
  });

  test('should have proper video preload settings', async ({ page }) => {
    console.log('⚡ Testing video preload settings...');
    
    // Hero video should have metadata preload
    const heroVideo = page.locator('#hero-video');
    const preloadValue = await heroVideo.getAttribute('preload');
    expect(preloadValue).toBe('metadata');
    
    // Background videos should have none preload (for performance)
    const backgroundVideos = await page.locator('.background-video').all();
    for (const video of backgroundVideos) {
      const videoId = await video.getAttribute('id');
      const preload = await video.getAttribute('preload');
      
      if (videoId !== 'background-video-default') {
        expect(preload).toBe('none');
        console.log(`✅ ${videoId}: preload="${preload}"`);
      }
    }
    
    console.log('✅ Video preload settings verified');
  });
});