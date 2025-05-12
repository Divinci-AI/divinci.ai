/**
 * Divinci Animation with Performance Detection
 * This script enhances the standard animation with performance detection
 * to show a static image for low-end devices.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking device capabilities...');
    
    // Get hero container
    const heroContainer = document.querySelector('.hero');
    
    // Path to static hero image for fallback
    const staticImagePath = 'images/still-hero.png';
    
    // Configure performance thresholds (adjust as needed)
    const performanceThresholds = {
        minCpuCores: 2,
        minMemory: 2,
        minFrameRate: 30,
        minJsPerformance: 300,
        webglRequired: false, // Make this optional for wider device support
        hardwareAcceleration: true
    };
    
    /**
     * Sets up the hero animation
     */
    function setupHeroAnimation() {
        // Run performance detection
        DivinciPerformanceDetector.detect((results) => {
            if (results.canHandleAnimation) {
                console.log('Device is capable of running animations, initializing...');
                initAnimatedHero();
            } else {
                console.log('Device may struggle with animations, showing static image...');
                initStaticHero();
            }
        }, performanceThresholds);
    }
    
    /**
     * Initialize animated hero experience
     */
    function initAnimatedHero() {
        console.log('Setting up animated hero...');
        
        // Keep existing animation elements visible
        if (heroContainer) {
            // Show hero elements
            heroContainer.querySelectorAll('.geometry-group, .geometry-group-outer1, .geometry-group-outer2, .flower-of-life').forEach(el => {
                el.style.display = 'block';
            });
            
            // Add monitoring for animation performance
            let frameDropCount = 0;
            let lastFrameTime = performance.now();
            let frameCheckCount = 0;
            
            function checkFrameRate() {
                const now = performance.now();
                const frameTime = now - lastFrameTime;
                lastFrameTime = now;
                
                // Frame time over 50ms means less than 20fps (choppy)
                if (frameTime > 50) {
                    frameDropCount++;
                }
                
                frameCheckCount++;
                
                // Check 100 frames then decide if animation is smooth
                if (frameCheckCount >= 100) {
                    const performanceRatio = frameDropCount / frameCheckCount;
                    const isSmooth = performanceRatio < 0.2; // Less than 20% dropped frames
                    
                    console.log(`Animation performance: ${isSmooth ? 'Smooth' : 'Poor'} (${frameDropCount} dropped frames out of ${frameCheckCount})`);
                    
                    // Record performance for future visits
                    DivinciPerformanceDetector.recordPerformance(isSmooth);
                    
                    // If performance is poor, switch to static image
                    if (!isSmooth) {
                        console.log('Poor animation performance detected, switching to static image');
                        initStaticHero();
                    }
                    
                    return;
                }
                
                requestAnimationFrame(checkFrameRate);
            }
            
            // Start checking frame rate after animation has started
            setTimeout(() => {
                requestAnimationFrame(checkFrameRate);
            }, 1000);
        }
    }
    
    /**
     * Initialize static hero experience
     */
    function initStaticHero() {
        console.log('Setting up static hero...');
        
        if (heroContainer) {
            // Hide animated elements
            heroContainer.querySelectorAll('.geometry-group, .geometry-group-outer1, .geometry-group-outer2, .flower-of-life').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show central logo only
            const centralCircle = heroContainer.querySelector('.circle.central');
            if (centralCircle) {
                centralCircle.style.display = 'flex';
                centralCircle.style.position = 'relative';
                centralCircle.style.zIndex = '10';
            }
            
            // Add static background image
            heroContainer.style.backgroundImage = `url(${staticImagePath})`;
            heroContainer.style.backgroundSize = 'cover';
            heroContainer.style.backgroundPosition = 'center center';
            
            // Apply additional styles for better visual appearance
            heroContainer.classList.add('static-hero');
        }
    }
    
    // User preference toggle has been removed per request
    
    // Check if performance detection script is loaded
    if (typeof DivinciPerformanceDetector !== 'undefined') {
        // Start the process
        setupHeroAnimation();
        
        // Toggle animation preference functionality has been removed
    } else {
        console.error('Performance detection script not loaded. Defaulting to animated hero.');
        initAnimatedHero();
    }
});