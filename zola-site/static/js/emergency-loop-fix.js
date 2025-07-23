/**
 * ULTRA-AGGRESSIVE EMERGENCY INFINITE LOOP FIX
 *
 * This script immediately stops ALL infinite loading loops on the production site.
 * Load this script FIRST before any other scripts to prevent the loops.
 * This version is more aggressive and catches more edge cases.
 */

(function() {
    'use strict';

    console.log('🚨🚨🚨 ULTRA-AGGRESSIVE EMERGENCY LOOP FIX ACTIVATED 🚨🚨🚨');
    console.log('Timestamp:', new Date().toISOString());
    
    // 0. NUCLEAR OPTION - DISABLE ALL PROBLEMATIC PATTERNS IMMEDIATELY

    // Block ALL functions that might cause loops
    const blockedFunctions = [
        'includeHTML',
        'initializeIncludedComponents',
        'loadLanguageSwitcher',
        'initLanguageSwitcher',
        'loadComponents',
        'executeScripts'
    ];

    blockedFunctions.forEach(funcName => {
        window[funcName] = function() {
            console.log(`🚫 BLOCKED: ${funcName} disabled by emergency fix`);
            return;
        };
    });

    // 1. IMMEDIATELY DISABLE PROBLEMATIC FUNCTIONS

    // Disable includeHTML completely to stop the loop
    window.includeHTML = function() {
        console.log('🚫 includeHTML disabled by emergency fix');
        return;
    };

    // Disable initializeIncludedComponents to stop recursive calls
    window.initializeIncludedComponents = function() {
        console.log('🚫 initializeIncludedComponents disabled by emergency fix');
        return;
    };
    
    // 2. PREVENT DUPLICATE RESOURCE LOADING
    
    const loadedResources = new Set();
    
    // Override fetch to prevent rapid duplicate requests - ULTRA AGGRESSIVE
    const originalFetch = window.fetch;
    const fetchCallCounts = new Map();

    window.fetch = function(resource, options) {
        const url = resource.toString();

        // ULTRA AGGRESSIVE: Block ANY CSS file that's been requested more than once
        if (url.includes('.css') || url.includes('styles')) {
            const count = fetchCallCounts.get(url) || 0;
            if (count > 0) {
                console.log('🚫🚫🚫 BLOCKED DUPLICATE CSS FETCH:', url, 'Count:', count + 1);
                return Promise.reject(new Error('CSS fetch blocked - already loaded'));
            }
            fetchCallCounts.set(url, count + 1);
        }

        // Block rapid duplicate requests (less than 5 seconds apart for any resource)
        const now = Date.now();
        const resourceKey = url + '_' + Math.floor(now / 5000); // 5-second buckets

        if (loadedResources.has(resourceKey)) {
            console.log('🚫 Blocked rapid duplicate fetch:', url);
            return Promise.reject(new Error('Rapid duplicate fetch blocked by emergency fix'));
        }

        loadedResources.add(resourceKey);

        // Clean up old entries every 30 seconds
        setTimeout(() => {
            loadedResources.delete(resourceKey);
        }, 30000);

        console.log('✅ Allowing fetch:', url);
        return originalFetch.call(this, resource, options);
    };
    
    // 3. PREVENT DUPLICATE SCRIPT LOADING
    
    const loadedScripts = new Set();
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
            
            Object.defineProperty(element, 'src', {
                set: function(value) {
                    if (value && loadedScripts.has(value)) {
                        console.log('🚫 Blocked duplicate script:', value);
                        return; // Don't load duplicate scripts
                    }
                    
                    if (value) {
                        loadedScripts.add(value);
                    }
                    
                    originalSrcSetter.call(this, value);
                },
                get: function() {
                    return this.getAttribute('src');
                },
                configurable: true
            });
        }
        
        return element;
    };
    
    // 4. PREVENT DUPLICATE CSS LOADING
    
    const loadedStyles = new Set();
    const originalCreateElementForStyles = document.createElement;
    
    // Override link element creation for stylesheets
    const originalLinkSrcSetter = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, 'href');
    if (originalLinkSrcSetter) {
        Object.defineProperty(HTMLLinkElement.prototype, 'href', {
            set: function(value) {
                if (value && this.rel === 'stylesheet' && loadedStyles.has(value)) {
                    console.log('🚫 Blocked duplicate stylesheet:', value);
                    return; // Don't load duplicate stylesheets
                }
                
                if (value && this.rel === 'stylesheet') {
                    loadedStyles.add(value);
                }
                
                originalLinkSrcSetter.set.call(this, value);
            },
            get: originalLinkSrcSetter.get,
            configurable: true
        });
    }
    
    // 5. DISABLE PROBLEMATIC EVENT LISTENERS
    
    // Prevent DOMContentLoaded from triggering more loops
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type, listener, options) {
        if (type === 'DOMContentLoaded') {
            // Check if the listener might cause loops
            const listenerStr = listener.toString();
            if (listenerStr.includes('includeHTML') || 
                listenerStr.includes('initializeIncludedComponents') ||
                listenerStr.includes('loadLanguageSwitcher')) {
                console.log('🚫 Blocked potentially problematic DOMContentLoaded listener');
                return;
            }
        }
        
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // 6. EMERGENCY STYLE INJECTION TO PREVENT VISUAL ISSUES
    
    const emergencyStyles = document.createElement('style');
    emergencyStyles.id = 'emergency-loop-fix-styles';
    emergencyStyles.textContent = `
        /* Prevent content jumping during emergency fix */
        body * {
            transition: none !important;
        }
        
        /* Stabilize header */
        nav.navbar {
            min-height: 60px;
        }
        
        /* Hide loading indicators that might be stuck */
        .loading, .spinner, [data-loading="true"] {
            display: none !important;
        }
        
        /* Ensure language switcher is visible */
        .language-switcher {
            min-width: 100px;
            min-height: 30px;
            display: inline-block !important;
            opacity: 1 !important;
        }
    `;
    
    // Insert emergency styles immediately
    if (document.head) {
        document.head.appendChild(emergencyStyles);
    } else {
        // If head doesn't exist yet, wait for it
        const observer = new MutationObserver(function(mutations) {
            if (document.head) {
                document.head.appendChild(emergencyStyles);
                observer.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
    
    console.log('✅ Emergency loop fix applied successfully');
    
    // 7. REPORT STATUS EVERY 5 SECONDS
    setInterval(() => {
        console.log('🔍 Emergency fix status:', {
            loadedResources: loadedResources.size,
            loadedScripts: loadedScripts.size,
            loadedStyles: loadedStyles.size,
            timestamp: new Date().toISOString()
        });
    }, 5000);
    
})();
