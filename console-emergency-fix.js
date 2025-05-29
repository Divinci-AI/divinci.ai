/**
 * CONSOLE EMERGENCY FIX
 * 
 * Copy and paste this entire script into the browser console on https://divinci.ai/
 * to immediately stop the infinite loading loops.
 * 
 * This is a standalone fix that doesn't require deployment.
 */

(function() {
    'use strict';
    
    console.log('🚨🚨🚨 CONSOLE EMERGENCY FIX ACTIVATED 🚨🚨🚨');
    console.log('Stopping all infinite loops immediately...');
    
    // 1. NUCLEAR OPTION - DISABLE ALL PROBLEMATIC FUNCTIONS
    const blockedFunctions = [
        'includeHTML', 
        'initializeIncludedComponents', 
        'loadLanguageSwitcher',
        'initLanguageSwitcher',
        'loadComponents',
        'executeScripts',
        'initComponents'
    ];
    
    blockedFunctions.forEach(funcName => {
        if (window[funcName]) {
            console.log(`🚫 Disabling ${funcName}`);
            window[funcName] = function() {
                console.log(`🚫 BLOCKED: ${funcName} called but disabled`);
                return;
            };
        }
    });
    
    // 2. ULTRA AGGRESSIVE FETCH BLOCKING
    if (window.fetch && !window.fetch._emergencyPatched) {
        const originalFetch = window.fetch;
        const blockedUrls = new Set();
        
        window.fetch = function(resource, options) {
            const url = resource.toString();
            
            // Block ANY CSS file that's been requested before
            if (url.includes('.css') || url.includes('styles')) {
                if (blockedUrls.has(url)) {
                    console.log('🚫🚫🚫 EMERGENCY BLOCKED CSS:', url);
                    return Promise.reject(new Error('Emergency CSS block'));
                }
                blockedUrls.add(url);
            }
            
            // Block language and include related requests
            if (url.includes('language') || url.includes('include') || url.includes('component')) {
                if (blockedUrls.has(url)) {
                    console.log('🚫🚫🚫 EMERGENCY BLOCKED COMPONENT:', url);
                    return Promise.reject(new Error('Emergency component block'));
                }
                blockedUrls.add(url);
            }
            
            console.log('✅ Allowing:', url);
            return originalFetch.call(this, resource, options);
        };
        
        window.fetch._emergencyPatched = true;
        console.log('✅ Fetch patched with emergency blocking');
    }
    
    // 3. DISABLE ALL TIMERS THAT MIGHT BE CAUSING LOOPS
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = function(callback, delay, ...args) {
        const callbackStr = callback.toString();
        if (callbackStr.includes('includeHTML') || 
            callbackStr.includes('initializeIncludedComponents') ||
            callbackStr.includes('loadLanguageSwitcher')) {
            console.log('🚫 Blocked problematic setTimeout');
            return -1;
        }
        return originalSetTimeout.call(this, callback, delay, ...args);
    };
    
    window.setInterval = function(callback, delay, ...args) {
        const callbackStr = callback.toString();
        if (callbackStr.includes('includeHTML') || 
            callbackStr.includes('initializeIncludedComponents') ||
            callbackStr.includes('loadLanguageSwitcher')) {
            console.log('🚫 Blocked problematic setInterval');
            return -1;
        }
        return originalSetInterval.call(this, callback, delay, ...args);
    };
    
    // 4. CLEAR ALL EXISTING INTERVALS AND TIMEOUTS
    for (let i = 1; i < 10000; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
    console.log('🧹 Cleared all existing timers');
    
    // 5. DISABLE EVENT LISTENERS THAT MIGHT TRIGGER LOOPS
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
        if (type === 'DOMContentLoaded') {
            const listenerStr = listener.toString();
            if (listenerStr.includes('includeHTML') || 
                listenerStr.includes('initializeIncludedComponents') ||
                listenerStr.includes('loadLanguageSwitcher')) {
                console.log('🚫 Blocked problematic DOMContentLoaded listener');
                return;
            }
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // 6. STOP ANY RUNNING LOOPS BY OVERRIDING COMMON LOOP PATTERNS
    window.requestAnimationFrame = function(callback) {
        const callbackStr = callback.toString();
        if (callbackStr.includes('includeHTML') || 
            callbackStr.includes('loadLanguageSwitcher')) {
            console.log('🚫 Blocked problematic requestAnimationFrame');
            return -1;
        }
        return window.requestAnimationFrame.call(this, callback);
    };
    
    // 7. EMERGENCY STYLE INJECTION
    const emergencyStyles = document.createElement('style');
    emergencyStyles.id = 'console-emergency-fix-styles';
    emergencyStyles.textContent = `
        /* Emergency fix styles */
        body * {
            transition: none !important;
        }
        
        .loading, .spinner, [data-loading="true"] {
            display: none !important;
        }
        
        nav.navbar {
            min-height: 60px;
        }
        
        .language-switcher {
            min-width: 100px;
            min-height: 30px;
            display: inline-block !important;
            opacity: 1 !important;
        }
    `;
    
    if (document.head) {
        document.head.appendChild(emergencyStyles);
        console.log('✅ Emergency styles injected');
    }
    
    // 8. MONITOR AND REPORT
    let reportCount = 0;
    const monitor = setInterval(() => {
        reportCount++;
        console.log(`📊 Emergency fix status report #${reportCount}:`, {
            timestamp: new Date().toISOString(),
            fetchPatched: !!window.fetch._emergencyPatched,
            blockedFunctions: blockedFunctions.length,
            emergencyStylesActive: !!document.getElementById('console-emergency-fix-styles')
        });
        
        // Stop reporting after 10 reports (50 seconds)
        if (reportCount >= 10) {
            clearInterval(monitor);
            console.log('📊 Emergency fix monitoring complete');
        }
    }, 5000);
    
    console.log('✅✅✅ CONSOLE EMERGENCY FIX COMPLETE ✅✅✅');
    console.log('The infinite loading should now be stopped.');
    console.log('Monitor the network tab to confirm no more rapid requests.');
    
})();
