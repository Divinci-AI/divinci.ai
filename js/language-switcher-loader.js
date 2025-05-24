/**
 * Language Switcher Loader
 * This script loads the language switcher component and ensures it doesn't conflict with include-html.js
 */

document.addEventListener('DOMContentLoaded', function() {
    loadLanguageSwitcher();
});

// Load the language switcher component
function loadLanguageSwitcher() {
    // Find language switcher containers
    const containers = document.querySelectorAll('[data-include="includes/language-switcher.html"]');
    
    containers.forEach(container => {
        // Skip if already loaded
        if (container.getAttribute('data-loaded') === 'true') {
            return;
        }
        
        // Mark as special handling to prevent includes-html.js from processing
        container.setAttribute('data-include-special', 'true');
        
        // Mark as processing
        container.setAttribute('data-loading', 'true');
        
        // Determine correct path
        let basePath = '';
        
        // Check if we're in a features subdirectory
        if (window.location.pathname.includes('/features/')) {
            basePath = '../../';
        } 
        // Check if we're in a language subdirectory (like /fr/, /es/, /ar/)
        else if (/^\/(fr|es|ar)\//.test(window.location.pathname)) {
            basePath = '../';
        }
        
        // Always use the main site's language switcher for consistency
        const path = basePath + 'includes/language-switcher.html';
        
        // Mark any local language switcher as not to be used (if one exists in the language subdirectory)
        if (/^\/(fr|es|ar)\//.test(window.location.pathname)) {
            const localSwitcher = document.querySelector('[data-include="includes/language-switcher.html"]');
            if (localSwitcher) {
                // Remove it from the DOM to avoid conflicts
                localSwitcher.setAttribute('data-include-ignore', 'true');
            }
        }
        
        // Fetch the language switcher HTML
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load language switcher: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Insert the HTML
                container.innerHTML = html;
                
                // Mark as loaded
                container.setAttribute('data-loaded', 'true');
                container.removeAttribute('data-loading');
                
                // Initialize the language switcher
                if (window.initLanguageSwitcher) {
                    window.initLanguageSwitcher();
                }
            })
            .catch(error => {
                console.error('Error loading language switcher:', error);
                container.innerHTML = `<div class="language-switcher-error">Error loading language switcher</div>`;
                container.removeAttribute('data-loading');
            });
    });
}