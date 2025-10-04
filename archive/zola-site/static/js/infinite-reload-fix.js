/**
 * Infinite Reload Fix
 *
 * This script aggressively addresses the issue of resources being continuously loaded
 * after switching to a different language version of the site.
 */

// Run this script immediately
(function() {
  console.log('Applying infinite reload fix...');

  // ISSUE #1: Multiple initialization of include-html.js
  // Override the includeHTML function to run only once per page load
  if (typeof window.includeHTML === 'function') {
    const originalIncludeHTML = window.includeHTML;
    let includeHTMLCounter = 0;

    window.includeHTML = function() {
      includeHTMLCounter++;

      if (includeHTMLCounter > 1) {
        console.log(`Blocked duplicate includeHTML call #${includeHTMLCounter}`);
        return; // Only allow the first call to proceed
      }

      // Call the original function
      originalIncludeHTML();
    };
  }

  // ISSUE #2: Recursive initialization in initializeIncludedComponents
  // This function gets called by includeHTML and can trigger a cascade of includes
  if (typeof window.initializeIncludedComponents === 'function') {
    const originalInitComponents = window.initializeIncludedComponents;
    let initComponentsDepth = 0;

    window.initializeIncludedComponents = function() {
      initComponentsDepth++;

      if (initComponentsDepth > 2) {
        console.log(`Blocked deep initializeIncludedComponents call at depth ${initComponentsDepth}`);
        initComponentsDepth--;
        return; // Prevent deep recursion
      }

      // Call the original function
      originalInitComponents();
      initComponentsDepth--;
    };
  }

  // ISSUE #3: Fix race condition with language related scripts
  // This can occur when a page loads multiple instances of language-related scripts
  const scriptNames = ['include-html.js', 'language-switcher.js', 'language-switcher-loader.js'];

  // Keep track of script loads to prevent duplicates
  if (typeof window.loadedScripts === 'undefined') {
    window.loadedScripts = new Set();
  }

  // Override the appendChild method for the document head and body
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function(node) {
    // Only intercept script nodes
    if (node.nodeName === 'SCRIPT' && node.src) {
      // Check if this is a script we want to monitor
      const scriptName = node.src.split('/').pop();
      if (scriptNames.some(name => scriptName.includes(name))) {
        // Check if this script has already been loaded
        if (window.loadedScripts.has(node.src)) {
          console.log(`Prevented duplicate loading of ${scriptName}`);
          return node; // Return the node without appending it
        }

        // Remember this script
        window.loadedScripts.add(node.src);
      }
    }

    // Call the original method for all other cases
    return originalAppendChild.call(this, node);
  };

  // ISSUE #4: Multiple DOMContentLoaded handlers
  // Only allow each handler to run once
  const handlerNames = ['includeHTML', 'initLanguageSwitcher', 'loadLanguageSwitcher'];

  // Keep track of which handlers have run
  if (typeof window.executedHandlers === 'undefined') {
    window.executedHandlers = new Set();
  }

  // Wrap the addEventListener method to intercept DOMContentLoaded
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Only intercept DOMContentLoaded event
    if (type === 'DOMContentLoaded' && typeof listener === 'function') {
      // Create a wrapper that only calls the listener once
      const wrappedListener = function(event) {
        // Try to identify the handler by checking its toString representation
        const handlerString = listener.toString();
        const matchedHandler = handlerNames.find(name => handlerString.includes(name));

        if (matchedHandler) {
          // Check if this handler has already been executed
          const handlerId = matchedHandler + handlerString.length;
          if (window.executedHandlers.has(handlerId)) {
            console.log(`Prevented duplicate execution of ${matchedHandler}`);
            return;
          }

          // Mark this handler as executed
          window.executedHandlers.add(handlerId);
        }

        // Call the original listener
        listener.call(this, event);
      };

      // Replace the listener with our wrapped version
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }

    // Call the original method for all other cases
    return originalAddEventListener.call(this, type, listener, options);
  };

  // ISSUE #5: Fetch loops related to language components
  // Override fetch to prevent repeated calls to the same URL
  const originalFetch = window.fetch;
  const fetchCalls = new Map();

  window.fetch = function(resource, options) {
    const url = resource.toString();

    // Only intercept language-related resources
    if (url.includes('language-') ||
        url.includes('language_switcher') ||
        url.includes('/includes/')) {

      const now = Date.now();
      const lastCall = fetchCalls.get(url) || 0;

      // If this URL was fetched less than 1 second ago, prevent the fetch
      if (now - lastCall < 1000) {
        console.log(`Prevented rapid re-fetch of ${url}`);
        return Promise.reject(new Error('Fetch throttled to prevent loops'));
      }

      // Remember this fetch
      fetchCalls.set(url, now);
    }

    // Call the original fetch
    return originalFetch.call(this, resource, options);
  };

  // ISSUE #6: Style element duplication
  // This can happen if the same styles are added multiple times
  // Add a utility to prevent duplicate style injection
  window.addStyleOnce = function(css, id) {
    // Check if this style already exists
    const existingStyle = id ? document.getElementById(id) : null;
    if (existingStyle) {
      return existingStyle; // Style already exists
    }

    // Create a new style element
    const style = document.createElement('style');
    if (id) {
      style.id = id;
    }

    style.textContent = css;
    document.head.appendChild(style);
    return style;
  };

  // ISSUE #7: Prevent duplicate CSS link elements and script elements
  // Override appendChild to prevent duplicate CSS links and scripts
  const originalAppendChildHead = document.head.appendChild;
  const originalAppendChildBody = document.body.appendChild;

  // Track loaded scripts to prevent duplicates
  const loadedScriptSrcs = new Set();

  function preventDuplicateAppend(originalMethod, context) {
    return function(node) {
      // Handle CSS link elements
      if (node.nodeName === 'LINK' && node.rel === 'stylesheet' && node.href) {
        // Check if a link with the same href already exists
        const existingLinks = document.querySelectorAll(`link[href="${node.href}"]`);
        if (existingLinks.length > 0) {
          console.log(`Prevented duplicate CSS link: ${node.href}`);
          return node; // Return the node without appending it
        }

        // Also check for similar paths that might be duplicates
        const normalizedHref = node.href.replace(/\/+/g, '/').replace(/^\//, '');
        const existingSimilar = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(link => {
          const existingNormalized = link.href.replace(/\/+/g, '/').replace(/^\//, '');
          return existingNormalized.includes(normalizedHref) || normalizedHref.includes(existingNormalized);
        });

        if (existingSimilar) {
          console.log(`Prevented similar CSS link: ${node.href} (similar to ${existingSimilar.href})`);
          return node;
        }
      }

      // Handle script elements
      if (node.nodeName === 'SCRIPT' && node.src) {
        if (loadedScriptSrcs.has(node.src)) {
          console.log(`Prevented duplicate script: ${node.src}`);
          return node;
        }
        loadedScriptSrcs.add(node.src);
      }

      // Handle style elements with IDs (from component scripts)
      if (node.nodeName === 'STYLE' && node.id) {
        const existingStyle = document.getElementById(node.id);
        if (existingStyle) {
          console.log(`Prevented duplicate style element: ${node.id}`);
          return node;
        }
      }

      // Call the original method for all other cases
      return originalMethod.call(this, node);
    };
  }

  document.head.appendChild = preventDuplicateAppend(originalAppendChildHead, document.head);
  document.body.appendChild = preventDuplicateAppend(originalAppendChildBody, document.body);

  // ISSUE #8: Prevent duplicate component script initialization
  // Track which component scripts have been initialized
  const initializedComponents = new Set();

  // Override createElement to track component script creation
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);

    // If it's a script element, add a setter for src to track component scripts
    if (tagName.toLowerCase() === 'script') {
      const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
      Object.defineProperty(element, 'src', {
        set: function(value) {
          // Check if this is a component script that's already been loaded
          if (value && (value.includes('/components/') || value.includes('view-toggle') || value.includes('language-switcher') || value.includes('mobile-menu'))) {
            const scriptName = value.split('/').pop();
            if (initializedComponents.has(scriptName)) {
              console.log(`Prevented duplicate component script: ${scriptName}`);
              return; // Don't set the src, effectively preventing the script from loading
            }
            initializedComponents.add(scriptName);
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

  // Add emergency styles to prevent visual glitches
  window.addStyleOnce(`
    /* Prevent content jumping during language switch */
    body * {
      transition: none !important;
    }

    /* Stabilize the header during language switching */
    nav.navbar {
      min-height: 60px;
    }

    /* Prevent layout shifts in language switcher */
    .language-switcher {
      min-width: 100px;
      min-height: 30px;
      display: inline-block !important;
      opacity: 1 !important;
    }
  `, 'emergency-style-fix');

  console.log('Infinite reload fix applied');
})();