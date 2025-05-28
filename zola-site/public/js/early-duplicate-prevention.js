/**
 * Early Duplicate Prevention Script
 *
 * This script must be loaded as early as possible to prevent duplicate
 * script and style loading from Zola-generated pages and other sources.
 * It runs immediately when loaded, before DOMContentLoaded.
 */

(function() {
  'use strict';

  console.log('Early duplicate prevention script loaded');

  // Track loaded scripts and styles globally
  window.divinciLoadedResources = window.divinciLoadedResources || {
    scripts: new Set(),
    styles: new Set(),
    components: new Set()
  };

  // Component scripts that should only be loaded once
  const componentScripts = [
    'view-toggle.js',
    'language-switcher.js',
    'mobile-menu.js',
    'components/view-toggle.js',
    'components/language-switcher.js',
    'components/mobile-menu.js'
  ];

  // Override document.createElement to prevent duplicate component scripts
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);

    if (tagName.toLowerCase() === 'script') {
      // Override the src setter to check for duplicates
      let srcValue = '';
      Object.defineProperty(element, 'src', {
        set: function(value) {
          srcValue = value;

          // Check if this is a component script
          const isComponentScript = componentScripts.some(script => value.includes(script));

          if (isComponentScript) {
            const scriptName = value.split('/').pop();

            if (window.divinciLoadedResources.components.has(scriptName)) {
              console.log(`🚫 Prevented duplicate component script: ${scriptName}`);
              // Don't actually set the src - this prevents the script from loading
              return;
            }

            window.divinciLoadedResources.components.add(scriptName);
            console.log(`✅ Allowing component script: ${scriptName}`);
          }

          // Set the actual src attribute
          element.setAttribute('src', value);
        },
        get: function() {
          return srcValue;
        },
        configurable: true
      });
    }

    return element;
  };

  // Override appendChild for both head and body to catch all additions
  function createAppendChildOverride(originalMethod, context) {
    return function(node) {
      // Handle script elements
      if (node.nodeName === 'SCRIPT' && node.src) {
        const scriptSrc = node.src;

        if (window.divinciLoadedResources.scripts.has(scriptSrc)) {
          console.log(`🚫 Prevented duplicate script via appendChild: ${scriptSrc.split('/').pop()}`);
          return node; // Return without appending
        }

        window.divinciLoadedResources.scripts.add(scriptSrc);
      }

      // Handle CSS link elements
      if (node.nodeName === 'LINK' && node.rel === 'stylesheet' && node.href) {
        const href = node.href;

        if (window.divinciLoadedResources.styles.has(href)) {
          console.log(`🚫 Prevented duplicate CSS link: ${href.split('/').pop()}`);
          return node; // Return without appending
        }

        window.divinciLoadedResources.styles.add(href);
      }

      // Handle style elements with IDs
      if (node.nodeName === 'STYLE' && node.id) {
        if (document.getElementById(node.id)) {
          console.log(`🚫 Prevented duplicate style element: ${node.id}`);
          return node; // Return without appending
        }
      }

      // Call original method
      return originalMethod.call(this, node);
    };
  }

  // Apply overrides when DOM is available
  function applyOverrides() {
    if (document.head && document.body) {
      document.head.appendChild = createAppendChildOverride(document.head.appendChild, document.head);
      document.body.appendChild = createAppendChildOverride(document.body.appendChild, document.body);
      console.log('✅ Applied appendChild overrides to head and body');
    } else {
      // Try again in a few milliseconds
      setTimeout(applyOverrides, 10);
    }
  }

  // Apply overrides immediately if possible, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOverrides);
  } else {
    applyOverrides();
  }

  // Also apply on next tick to catch any late additions
  setTimeout(applyOverrides, 0);

  // SPECIAL FIX: Prevent Zola-generated script loading patterns
  // Override addEventListener to catch DOMContentLoaded handlers that create scripts
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'DOMContentLoaded' && typeof listener === 'function') {
      // Wrap the listener to intercept script creation
      const wrappedListener = function(event) {
        // Temporarily override createElement during this handler
        const tempCreateElement = document.createElement;
        let scriptCreationCount = 0;

        document.createElement = function(tagName) {
          const element = tempCreateElement.call(this, tagName);

          if (tagName.toLowerCase() === 'script') {
            scriptCreationCount++;

            // If this handler is creating multiple scripts, it's likely a Zola pattern
            if (scriptCreationCount > 1) {
              console.log(`🚫 Detected potential Zola script creation pattern, blocking script #${scriptCreationCount}`);

              // Return a dummy script element that won't actually load
              const dummyScript = tempCreateElement.call(this, 'script');
              Object.defineProperty(dummyScript, 'src', {
                set: function(value) {
                  console.log(`🚫 Blocked Zola script: ${value.split('/').pop()}`);
                  // Don't actually set the src
                },
                get: function() { return ''; },
                configurable: true
              });
              return dummyScript;
            }
          }

          return element;
        };

        // Call the original listener
        try {
          listener.call(this, event);
        } finally {
          // Restore original createElement
          document.createElement = tempCreateElement;
        }
      };

      return originalAddEventListener.call(this, type, wrappedListener, options);
    }

    return originalAddEventListener.call(this, type, listener, options);
  };

})();
