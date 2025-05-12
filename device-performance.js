/**
 * Device Performance Detection
 * Utility to detect if a device can handle complex animations
 */

const DivinciPerformanceDetector = {
    // Configuration
    thresholds: {
        minCpuCores: 2,             // Minimum CPU cores
        minMemory: 2,               // Minimum memory in GB
        minFrameRate: 30,           // Minimum frame rate
        minJsPerformance: 500,      // Minimum JS performance score
        webglRequired: true,        // Require WebGL support
        hardwareAcceleration: true, // Require hardware acceleration
    },

    // Detection results
    results: {
        cpuCores: 0,
        memory: 0,
        frameRate: 0,
        jsPerformance: 0,
        webglSupport: false,
        hardwareAcceleration: false,
        userAgent: '',
        isMobile: false,
        isModernBrowser: false,
        canHandleAnimation: false,
    },

    /**
     * Run all performance tests and determine if animation can run
     * @param {Function} callback - Function to call when detection is complete
     * @param {Object} customThresholds - Optional custom thresholds
     */
    detect: function(callback, customThresholds = {}) {
        console.log('Running performance detection...');
        
        // Apply custom thresholds if provided
        if (customThresholds && typeof customThresholds === 'object') {
            this.thresholds = {...this.thresholds, ...customThresholds};
        }
        
        // Store user agent info
        this.results.userAgent = navigator.userAgent;
        this.results.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check browser modernity
        this.results.isModernBrowser = this._detectModernBrowser();
        
        // If device is ancient, don't bother with more tests
        if (!this.results.isModernBrowser) {
            this.results.canHandleAnimation = false;
            callback(this.results);
            return;
        }
        
        // Run CPU core detection
        this._detectCpuCores();
        
        // Run memory detection
        this._detectMemory();
        
        // Check hardware acceleration
        this.results.hardwareAcceleration = this._detectHardwareAcceleration();
        
        // Check WebGL support
        this._detectWebGL();
        
        // Run performance test in parallel with frame rate test
        Promise.all([
            this._measureJsPerformance(),
            this._measureFrameRate()
        ]).then(() => {
            // Determine if device can handle animation
            this._evaluateCapabilities();
            
            // Return results
            callback(this.results);
        });
    },

    /**
     * Check if CPU has enough cores
     */
    _detectCpuCores: function() {
        try {
            this.results.cpuCores = navigator.hardwareConcurrency || 1;
            console.log(`CPU cores: ${this.results.cpuCores}`);
        } catch (e) {
            console.warn('Could not detect CPU cores:', e);
            this.results.cpuCores = 1; // Assume 1 core as fallback
        }
    },

    /**
     * Check device memory if supported
     */
    _detectMemory: function() {
        try {
            if (navigator.deviceMemory) {
                this.results.memory = navigator.deviceMemory;
                console.log(`Device memory: ${this.results.memory}GB`);
            } else {
                // Make a reasonable guess based on device type
                this.results.memory = this.results.isMobile ? 2 : 4;
                console.log(`Memory not detectable, assuming ${this.results.memory}GB`);
            }
        } catch (e) {
            console.warn('Could not detect device memory:', e);
            this.results.memory = this.results.isMobile ? 2 : 4;
        }
    },

    /**
     * Check for WebGL support
     */
    _detectWebGL: function() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            this.results.webglSupport = gl !== null;
            
            if (this.results.webglSupport && gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    console.log(`WebGL renderer: ${renderer}`);
                    
                    // Detect software rendering
                    if (/SwiftShader|llvmpipe|Software|Microsoft Basic Renderer/i.test(renderer)) {
                        console.log('Software rendering detected, downgrading WebGL support assessment');
                        this.results.webglSupport = false;
                    }
                }
            }
            
            console.log(`WebGL support: ${this.results.webglSupport}`);
        } catch (e) {
            console.warn('Could not detect WebGL support:', e);
            this.results.webglSupport = false;
        }
    },

    /**
     * Check for hardware acceleration support
     */
    _detectHardwareAcceleration: function() {
        try {
            // Create test element
            const el = document.createElement('div');
            el.style.cssText = 'position: absolute; width: 1px; height: 1px; ' +
                'transform: translate3d(0, 0, 0); visibility: hidden;';
            document.body.appendChild(el);
            
            // Get computed style
            const computedStyle = window.getComputedStyle(el);
            const hasTransform = computedStyle.getPropertyValue('transform');
            document.body.removeChild(el);
            
            const hasAcceleration = hasTransform && hasTransform !== 'none';
            console.log(`Hardware acceleration: ${hasAcceleration}`);
            return hasAcceleration;
        } catch (e) {
            console.warn('Could not detect hardware acceleration:', e);
            return false;
        }
    },

    /**
     * Measure JavaScript execution performance
     */
    _measureJsPerformance: function() {
        return new Promise(resolve => {
            try {
                const iterations = 10000;
                const start = performance.now();
                
                // Simple math operations to test performance
                let result = 0;
                for (let i = 0; i < iterations; i++) {
                    result += Math.sqrt(i) * Math.cos(i) / (i + 1);
                }
                
                const end = performance.now();
                const duration = end - start;
                
                // Calculate performance score (lower is better)
                // Scale it so higher is better for easier comparison
                this.results.jsPerformance = Math.floor(1000 / (duration + 1) * 100);
                console.log(`JS performance score: ${this.results.jsPerformance}`);
                resolve();
            } catch (e) {
                console.warn('Could not measure JS performance:', e);
                this.results.jsPerformance = 0;
                resolve();
            }
        });
    },

    /**
     * Measure frame rate capability
     */
    _measureFrameRate: function() {
        return new Promise(resolve => {
            try {
                const el = document.createElement('div');
                el.style.cssText = 'position: absolute; top: -100px; left: -100px; width: 10px; height: 10px; background: transparent;';
                document.body.appendChild(el);
                
                let frames = 0;
                let lastTime = performance.now();
                const maxTestTime = 500; // Test for 500ms max
                
                const rafCallback = (timestamp) => {
                    frames++;
                    const elapsed = timestamp - lastTime;
                    
                    // Move the element to force a repaint
                    el.style.transform = `translate(${Math.random() * 5}px, ${Math.random() * 5}px)`;
                    
                    if (elapsed < maxTestTime) {
                        requestAnimationFrame(rafCallback);
                    } else {
                        document.body.removeChild(el);
                        
                        // Calculate frames per second
                        this.results.frameRate = Math.floor(frames / elapsed * 1000);
                        console.log(`Measured frame rate: ${this.results.frameRate}fps`);
                        resolve();
                    }
                };
                
                requestAnimationFrame(rafCallback);
            } catch (e) {
                console.warn('Could not measure frame rate:', e);
                this.results.frameRate = 30; // Assume 30fps as fallback
                resolve();
            }
        });
    },

    /**
     * Check if browser is modern enough
     */
    _detectModernBrowser: function() {
        try {
            // Test for crucial modern features
            const features = [
                'querySelector' in document,
                'addEventListener' in window,
                'requestAnimationFrame' in window,
                'classList' in document.documentElement,
                typeof Blob !== 'undefined',
                typeof Promise !== 'undefined'
            ];
            
            const isModern = features.every(feature => feature === true);
            console.log(`Modern browser: ${isModern}`);
            return isModern;
        } catch (e) {
            console.warn('Error detecting browser modernity:', e);
            return false;
        }
    },

    /**
     * Evaluate if device meets required capabilities
     */
    _evaluateCapabilities: function() {
        // For each threshold, check if it's required and if so, if the device meets it
        const checks = [
            this.results.cpuCores >= this.thresholds.minCpuCores,
            this.results.memory >= this.thresholds.minMemory,
            this.results.frameRate >= this.thresholds.minFrameRate,
            this.results.jsPerformance >= this.thresholds.minJsPerformance,
            !this.thresholds.webglRequired || this.results.webglSupport,
            !this.thresholds.hardwareAcceleration || this.results.hardwareAcceleration,
            this.results.isModernBrowser
        ];
        
        // Check if all requirements are met
        this.results.canHandleAnimation = checks.every(check => check === true);
        
        // Special case: explicitly whitelist/blacklist certain devices
        this._adjustForKnownDevices();
        
        console.log(`Can handle complex animation: ${this.results.canHandleAnimation}`);
    },

    /**
     * Adjust results for known problematic or capable devices
     */
    _adjustForKnownDevices: function() {
        const ua = navigator.userAgent.toLowerCase();
        
        // Blacklist very old devices
        if (/msie [6-8]\./i.test(ua) || /android 4\.[0-3]/i.test(ua)) {
            console.log('Blacklisted old browser/device detected');
            this.results.canHandleAnimation = false;
            return;
        }
        
        // Whitelist high-end devices even if detection was borderline
        if (/iphone 1[3-9]|ipad pro|samsung galaxy s2[0-9]|pixel [6-9]/i.test(ua)) {
            console.log('Whitelisted modern high-end device detected');
            this.results.canHandleAnimation = true;
            return;
        }
        
        // Check localStorage for user's previous experience
        try {
            const previousExperience = localStorage.getItem('divinci_animation_performance');
            if (previousExperience) {
                const experience = JSON.parse(previousExperience);
                const timeSinceLastCheck = Date.now() - (experience.timestamp || 0);
                
                // If we've recorded poor performance in the last 30 days, don't try again
                if (!experience.wasSmooth && timeSinceLastCheck < 30 * 24 * 60 * 60 * 1000) {
                    console.log('Using previous performance experience: poor');
                    this.results.canHandleAnimation = false;
                    return;
                }
            }
        } catch (e) {
            console.warn('Could not check localStorage for previous experience:', e);
        }
    },

    /**
     * Record animation performance for future reference
     * @param {boolean} wasSmooth - Whether the animation ran smoothly
     */
    recordPerformance: function(wasSmooth) {
        try {
            localStorage.setItem('divinci_animation_performance', JSON.stringify({
                wasSmooth,
                timestamp: Date.now()
            }));
            console.log(`Recorded animation performance: ${wasSmooth ? 'smooth' : 'poor'}`);
        } catch (e) {
            console.warn('Could not save performance experience:', e);
        }
    },

    /**
     * Reset stored performance data
     */
    resetPerformanceData: function() {
        try {
            localStorage.removeItem('divinci_animation_performance');
            console.log('Reset animation performance data');
        } catch (e) {
            console.warn('Could not reset performance data:', e);
        }
    }
};