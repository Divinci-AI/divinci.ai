/**
 * Divinci Performance Detector
 * Detects device capabilities to determine if animations should be shown
 */

const DivinciPerformanceDetector = {
    /**
     * Detect device capabilities and determine if it can handle animations
     * @param {Function} callback - Function to call with results
     * @param {Object} thresholds - Performance thresholds
     */
    detect: function(callback, thresholds = {}) {
        console.log('Running performance detection...');
        
        // Default thresholds
        const defaults = {
            minCpuCores: 2,
            minMemory: 2, // GB
            minFrameRate: 30,
            minJsPerformance: 300, // Operations per second
            webglRequired: false,
            hardwareAcceleration: true
        };
        
        // Merge defaults with provided thresholds
        const config = { ...defaults, ...thresholds };
        
        // Check for previous performance results
        const previousExperience = localStorage.getItem('divinci_animation_performance');
        if (previousExperience) {
            try {
                const parsed = JSON.parse(previousExperience);
                if (parsed.timestamp && (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000)) {
                    // Use cached result if less than a week old
                    console.log('Using cached performance result:', parsed.wasSmooth);
                    return callback({
                        canHandleAnimation: parsed.wasSmooth,
                        source: 'cache'
                    });
                }
            } catch (e) {
                console.warn('Could not parse previous experience');
            }
        }
        
        // Show performance checking indicator
        const indicator = document.querySelector('.performance-checking');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.textContent = 'Checking device capabilities...';
        }
        
        // Results object
        const results = {
            cpuCores: 0,
            memory: 0,
            frameRate: 0,
            jsPerformance: 0,
            hasWebGL: false,
            hasHardwareAcceleration: false,
            canHandleAnimation: false,
            source: 'test'
        };
        
        // Check CPU cores
        if (navigator.hardwareConcurrency) {
            results.cpuCores = navigator.hardwareConcurrency;
        }
        
        // Check memory (approximation)
        if (navigator.deviceMemory) {
            results.memory = navigator.deviceMemory;
        }
        
        // Check WebGL support
        try {
            const canvas = document.createElement('canvas');
            results.hasWebGL = !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            results.hasWebGL = false;
        }
        
        // Check for hardware acceleration
        results.hasHardwareAcceleration = this.checkHardwareAcceleration();
        
        // Measure JavaScript performance
        this.measureJsPerformance((jsScore) => {
            results.jsPerformance = jsScore;
            
            // Measure frame rate
            this.measureFrameRate((fps) => {
                results.frameRate = fps;
                
                // Hide performance checking indicator
                if (indicator) {
                    indicator.style.display = 'none';
                }
                
                // Determine if device can handle animation
                results.canHandleAnimation = (
                    results.cpuCores >= config.minCpuCores ||
                    results.memory >= config.minMemory ||
                    results.frameRate >= config.minFrameRate ||
                    results.jsPerformance >= config.minJsPerformance
                ) && (
                    !config.webglRequired || results.hasWebGL
                ) && (
                    !config.hardwareAcceleration || results.hasHardwareAcceleration
                );
                
                console.log('Performance detection results:', results);
                
                // Call callback with results
                callback(results);
            });
        });
    },
    
    /**
     * Check if hardware acceleration is available
     * @return {Boolean} Whether hardware acceleration is available
     */
    checkHardwareAcceleration: function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return false;
        }
        
        // Test for transform property
        const hasTransform = 'transform' in document.documentElement.style ||
                            'webkitTransform' in document.documentElement.style ||
                            'MozTransform' in document.documentElement.style ||
                            'msTransform' in document.documentElement.style ||
                            'OTransform' in document.documentElement.style;
        
        return hasTransform;
    },
    
    /**
     * Measure JavaScript performance
     * @param {Function} callback - Function to call with results
     */
    measureJsPerformance: function(callback) {
        const startTime = performance.now();
        let operations = 0;
        
        // Run a simple benchmark
        for (let i = 0; i < 10000; i++) {
            Math.sqrt(i);
            operations++;
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const opsPerSecond = Math.floor(operations / (duration / 1000));
        
        callback(opsPerSecond);
    },
    
    /**
     * Measure frame rate
     * @param {Function} callback - Function to call with results
     */
    measureFrameRate: function(callback) {
        let frameCount = 0;
        let lastTime = performance.now();
        let frameTimes = [];
        
        function countFrame() {
            const now = performance.now();
            const elapsed = now - lastTime;
            lastTime = now;
            
            if (elapsed > 0) {
                frameTimes.push(1000 / elapsed);
            }
            
            frameCount++;
            
            if (frameCount < 60) {
                requestAnimationFrame(countFrame);
            } else {
                // Calculate average FPS
                const sum = frameTimes.reduce((a, b) => a + b, 0);
                const avgFps = Math.floor(sum / frameTimes.length);
                
                callback(avgFps);
            }
        }
        
        requestAnimationFrame(countFrame);
    },
    
    /**
     * Record animation performance for future visits
     * @param {Boolean} wasSmooth - Whether animation was smooth
     */
    recordPerformance: function(wasSmooth) {
        const data = {
            wasSmooth: wasSmooth,
            timestamp: Date.now()
        };
        
        localStorage.setItem('divinci_animation_performance', JSON.stringify(data));
        console.log('Recorded animation performance:', wasSmooth);
    }
};
