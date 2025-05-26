/**
 * Language Switcher Fix
 *
 * This script fixes the twitching/reloading issue with the language switcher
 * by preventing multiple initializations and race conditions.
 */

// Track initialization attempts to help with debugging
let initializationCounter = 0;
const MAX_INIT_ATTEMPTS = 3;

// Store initialization timestamps to detect rapid reinitializations
const initTimestamps = [];

// Global variable to prevent initialization race conditions
if (typeof window.isLoadingLanguageSwitcher === 'undefined') {
    window.isLoadingLanguageSwitcher = false;
}

// Override the language switcher initialization to add safeguards
const originalInitLanguageSwitcher = window.initLanguageSwitcher;
window.initLanguageSwitcher = function() {
    // Track initialization attempt
    initializationCounter++;

    // Debug logging
    console.log(`Language switcher initialization attempt ${initializationCounter}`);

    // Store current timestamp
    const now = Date.now();
    initTimestamps.push(now);

    // Check for too many initializations in a short time
    if (initTimestamps.length > MAX_INIT_ATTEMPTS) {
        // Only keep the last MAX_INIT_ATTEMPTS timestamps
        initTimestamps.shift();

        // Check if all timestamps are within a 2-second window
        const oldestTime = initTimestamps[0];
        if (now - oldestTime < 2000) {
            console.warn('Too many language switcher initializations in a short time. Stopping to prevent UI jank.');
            return;
        }
    }

    // Check if already initialized to prevent multiple initializations
    if (window.languageSwitcherInitializedDOM) {
        console.log('Language switcher already initialized. Skipping.');
        return;
    }

    // Check if another initialization is already in progress
    if (window.isLoadingLanguageSwitcher) {
        console.log('Language switcher initialization already in progress. Skipping.');
        return;
    }

    // Mark as initializing
    window.isLoadingLanguageSwitcher = true;

    try {
        // Call the original initialization function
        if (originalInitLanguageSwitcher) {
            originalInitLanguageSwitcher();
        } else {
            console.warn('Original initLanguageSwitcher function not found');
        }
    } finally {
        // Mark as no longer initializing
        window.isLoadingLanguageSwitcher = false;
    }
};

// Disable the loader's automatic initialization
// Safely remove event listener only if loadLanguageSwitcher exists
if (typeof loadLanguageSwitcher === 'function') {
    document.removeEventListener('DOMContentLoaded', loadLanguageSwitcher);
}

// Override the loadLanguageSwitcher function to add safeguards
const originalLoadLanguageSwitcher = window.loadLanguageSwitcher;
window.loadLanguageSwitcher = function() {
    // Skip if already initialized
    if (window.languageSwitcherLoaded) {
        console.log('Language switcher already loaded. Skipping.');
        return;
    }

    // Set a flag to prevent multiple loads
    window.languageSwitcherLoaded = true;

    // Call the original load function
    if (originalLoadLanguageSwitcher) {
        originalLoadLanguageSwitcher();
    }
};

// Add a mutation observer to detect language switcher element changes
// This helps prevent the twitching caused by repeated DOM updates
function setupLanguageSwitcherObserver() {
    // Find all language switcher elements
    const switchers = document.querySelectorAll('.language-switcher');

    if (switchers.length === 0) {
        // No language switchers found yet, try again later
        setTimeout(setupLanguageSwitcherObserver, 200);
        return;
    }

    // Create a mutation observer
    const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;

        // Check if any mutations warrant a language update
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Child nodes were added, likely new content was loaded
                needsUpdate = true;
                break;
            }
        }

        // Update the language switcher if needed
        if (needsUpdate && !window.isLoadingLanguageSwitcher) {
            // Debounce the update to prevent multiple rapid updates
            clearTimeout(window.languageSwitcherUpdateTimer);
            window.languageSwitcherUpdateTimer = setTimeout(() => {
                document.querySelectorAll('.language-switcher').forEach(switcher => {
                    updateCurrentLanguage(switcher);
                });
            }, 300);
        }
    });

    // Observe each language switcher
    switchers.forEach(switcher => {
        observer.observe(switcher, {
            childList: true,
            subtree: true,
            attributes: true
        });
    });
}

// Start observing once the DOM is loaded
document.addEventListener('DOMContentLoaded', setupLanguageSwitcherObserver);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupLanguageSwitcherObserver();
}

// Patch the updateCurrentLanguage function to add debouncing
const originalUpdateCurrentLanguage = window.updateCurrentLanguage;
window.updateCurrentLanguage = function(languageSwitcher) {
    // Skip if an update is already scheduled
    if (window.isUpdatingLanguage) {
        return;
    }

    // Set a flag to prevent multiple updates
    window.isUpdatingLanguage = true;

    // Use a timeout to debounce updates
    setTimeout(() => {
        if (originalUpdateCurrentLanguage) {
            originalUpdateCurrentLanguage(languageSwitcher);
        }
        window.isUpdatingLanguage = false;
    }, 50);
};

// Set CSS to prevent twitching during initialization
document.addEventListener('DOMContentLoaded', () => {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
        .language-switcher {
            min-height: 35px; /* Set a minimum height to prevent layout shifts */
            opacity: 1 !important; /* Prevent flashing */
            transition: none !important; /* Disable transitions during initialization */
        }

        /* Prevent flashing during dropdown animation */
        .language-switcher-dropdown {
            transition: opacity 0.2s ease-in-out !important;
        }

        /* Add hardware acceleration to prevent janky animations */
        .language-switcher.active .language-switcher-dropdown {
            transform: translateZ(0);
            will-change: opacity;
        }
    `;

    // Add the style to the head
    document.head.appendChild(style);
});