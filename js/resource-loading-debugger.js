/**
 * Resource Loading Debugger
 * 
 * This script helps identify excessive resource loading and infinite loops
 * that may be occurring when switching languages
 */

// Keep track of resource requests
const resourceTracker = {
  requests: new Map(),
  startTime: Date.now(),
  thresholds: {
    total: 50,     // Alert after 50 total requests
    perUrl: 5,     // Alert after 5 requests to the same URL
    interval: 5000 // Time window in ms to track requests
  },
  scriptList: [],  // List of script tags that were added
  lastAlert: 0     // Timestamp of last alert to prevent alert spam
};

// Create a logger element to show debug info on the page
function createDebugLogger() {
  // Check if it already exists
  if (document.getElementById('debug-resource-logger')) return;
  
  const loggerDiv = document.createElement('div');
  loggerDiv.id = 'debug-resource-logger';
  loggerDiv.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 300px;
    height: 200px;
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    overflow: auto;
    z-index: 9999;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  `;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
  `;
  closeButton.onclick = () => {
    loggerDiv.style.display = 'none';
  };
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Resource Loading Debug';
  title.style.margin = '0 0 10px 0';
  
  // Add content area
  const content = document.createElement('div');
  content.id = 'debug-resource-content';
  
  loggerDiv.appendChild(closeButton);
  loggerDiv.appendChild(title);
  loggerDiv.appendChild(content);
  document.body.appendChild(loggerDiv);
}

// Log message to the debug panel
function logDebug(message) {
  createDebugLogger();
  const content = document.getElementById('debug-resource-content');
  if (!content) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.innerHTML = `<span style="color:#aaa;">[${timestamp}]</span> ${message}`;
  
  // Keep only the last 20 messages
  while (content.children.length >= 20) {
    content.removeChild(content.firstChild);
  }
  
  content.appendChild(entry);
  content.scrollTop = content.scrollHeight;
}

// Show an alert only once every 5 seconds to avoid overwhelming the user
function throttledAlert(message) {
  const now = Date.now();
  if (now - resourceTracker.lastAlert > 5000) {
    resourceTracker.lastAlert = now;
    alert(message);
  }
}

// This will monitor all resource requests
function monitorResourceRequests() {
  // Create a PerformanceObserver to watch for resource loads
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    // Process each resource entry
    entries.forEach(entry => {
      if (entry.entryType === 'resource') {
        // Ignore data: URLs and browser extension URLs
        if (entry.name.startsWith('data:') || 
            entry.name.startsWith('chrome-extension:') || 
            entry.name.startsWith('moz-extension:')) {
          return;
        }
        
        // Increment count for this URL
        const count = resourceTracker.requests.get(entry.name) || 0;
        resourceTracker.requests.set(entry.name, count + 1);
        
        // Log significant resource loads
        if (count === 0) {
          logDebug(`Loading: ${entry.name.split('/').pop()}`);
        } else if (count >= 3) {
          logDebug(`<span style="color:red">⚠️ Reloading (${count+1}): ${entry.name.split('/').pop()}</span>`);
        }
        
        // Check thresholds
        if (count + 1 >= resourceTracker.thresholds.perUrl) {
          console.warn(`Resource loaded multiple times: ${entry.name} (${count + 1} times)`);
          
          // Log detailed info about the resource
          if (entry.name.includes('.js')) {
            logDebug(`<strong style="color:orange">Potential script reload loop: ${entry.name}</strong>`);
          }
          
          // Alert on extreme cases (adjust threshold as needed)
          if (count + 1 >= resourceTracker.thresholds.perUrl * 2) {
            throttledAlert(`Warning: Resource is being loaded excessively: ${entry.name.split('/').pop()}`);
          }
        }
        
        // Check total requests
        if (resourceTracker.requests.size >= resourceTracker.thresholds.total) {
          console.warn(`High number of resource requests: ${resourceTracker.requests.size}`);
        }
      }
    });
  });
  
  // Start observing resource timing entries
  observer.observe({ entryTypes: ['resource'] });
}

// Watch for script tag additions which might indicate a reload loop
function watchScriptTags() {
  // Create a MutationObserver to watch for script tag additions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'SCRIPT' && node.src) {
            const scriptPath = node.src.split('/').pop();
            
            // Check if this script was already added
            if (resourceTracker.scriptList.includes(node.src)) {
              logDebug(`<span style="color:red">⚠️ Script re-added: ${scriptPath}</span>`);
            } else {
              resourceTracker.scriptList.push(node.src);
            }
          }
        });
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document, { childList: true, subtree: true });
}

// Look for recurring timers that might be causing reloads
function checkForRecurringTimers() {
  let timerWarningLogged = false;
  
  // Override setTimeout to detect potential problematic patterns
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = function(callback, delay, ...args) {
    // Look for short recurring timers (often a source of problems)
    if (delay < 100 && !timerWarningLogged) {
      console.warn('Detected very short timeout which may cause performance issues:', delay);
      
      // Get the stack trace to identify where it's coming from
      const stack = new Error().stack;
      console.log('Short timer stack:', stack);
      
      logDebug(`<span style="color:orange">Short timer detected (${delay}ms)</span>`);
      timerWarningLogged = true; // Only log once
    }
    
    return originalSetTimeout.call(this, callback, delay, ...args);
  };
}

// Check for multiple event listeners that might be duplicating
function detectEventListenerDuplication() {
  // Store original addEventListener
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  // Keep count of event listeners per element and type
  const eventCounts = new Map();
  
  // Override addEventListener
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Generate a key for this element+event type
    const key = this + '::' + type;
    
    // Increment count
    const count = (eventCounts.get(key) || 0) + 1;
    eventCounts.set(key, count);
    
    // Warn about potential duplication
    if (count > 3) {
      console.warn(`Multiple (${count}) event listeners of type '${type}' on:`, this);
      logDebug(`<span style="color:red">Duplicate listeners: ${count}x ${type}</span>`);
    }
    
    // Call original method
    return originalAddEventListener.call(this, type, listener, options);
  };
}

// Check if elements are being repeatedly added and removed
function watchForDOMChurn() {
  // Keep track of element counts
  let elementsAdded = 0;
  let elementsRemoved = 0;
  const updateTime = Date.now();
  
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    let addedThisRound = 0;
    let removedThisRound = 0;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        addedThisRound += mutation.addedNodes.length;
        removedThisRound += mutation.removedNodes.length;
      }
    });
    
    // Update counters
    elementsAdded += addedThisRound;
    elementsRemoved += removedThisRound;
    
    // Time since tracking started
    const elapsedTime = (Date.now() - updateTime) / 1000;
    
    // Only check after 2 seconds of activity
    if (elapsedTime > 2 && (addedThisRound > 10 || removedThisRound > 10)) {
      const rate = Math.round((elementsAdded + elementsRemoved) / elapsedTime);
      
      // Alert on extremely high DOM churn
      if (rate > 50) {
        console.warn(`High DOM manipulation rate: ${rate} elements/second`);
        logDebug(`<span style="color:red">⚠️ DOM churn: ${rate} elements/sec</span>`);
      }
    }
  });
  
  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });
}

// Fix common issues that might be causing reloads
function applyEmergencyFixes() {
  // 1. Prevent document.write which can cause page reloads
  document.write = function(string) {
    console.error('document.write is being used which can cause page reloads');
    console.trace('Called from:');
    logDebug('<span style="color:red">⚠️ document.write blocked</span>');
  };
  
  // 2. Fix broken event loops in include-html.js
  if (typeof includeHTML === 'function') {
    // Patch the includeHTML function to prevent multiple calls
    const originalIncludeHTML = includeHTML;
    window.includeHTML = function() {
      if (window.includeHTMLRunning) {
        console.warn('includeHTML called while already running, preventing potential loop');
        return;
      }
      
      window.includeHTMLRunning = true;
      try {
        originalIncludeHTML();
      } finally {
        setTimeout(() => { window.includeHTMLRunning = false; }, 1000);
      }
    };
    
    logDebug('Applied includeHTML safety patch');
  }
  
  // 3. Prevent excessive initLanguageSwitcher calls
  if (typeof initLanguageSwitcher === 'function') {
    const patchedAlready = window.initLanguageSwitcherPatched;
    
    if (!patchedAlready) {
      window.initLanguageSwitcherPatched = true;
      
      // Add a counter for how many times it was called
      window.initLanguageSwitcherCalls = 0;
      
      // Replace with a version that limits calls
      const originalInit = window.initLanguageSwitcher;
      window.initLanguageSwitcher = function() {
        window.initLanguageSwitcherCalls++;
        
        if (window.initLanguageSwitcherCalls > 5) {
          console.warn('initLanguageSwitcher called too many times, limiting to prevent potential issues');
          logDebug('<span style="color:red">⚠️ Excessive language switcher init calls</span>');
          return;
        }
        
        return originalInit.apply(this, arguments);
      };
      
      logDebug('Applied language switcher safeguards');
    }
  }
}

// Wait for page to be fully loaded before monitoring
window.addEventListener('load', () => {
  console.log('Resource loading debugger activated');
  
  setTimeout(() => {
    monitorResourceRequests();
    watchScriptTags();
    checkForRecurringTimers();
    detectEventListenerDuplication();
    watchForDOMChurn();
    applyEmergencyFixes();
    
    logDebug('Debugging tools initialized');
  }, 2000); // Wait 2 seconds after load to start monitoring
});