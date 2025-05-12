/**
 * Conditional Header Elements
 * This script handles conditional display of header elements based on the current page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for the include-html.js to load the header
    setTimeout(configureHeaderForCurrentPage, 100);
});

/**
 * Configure header elements based on the current page
 */
function configureHeaderForCurrentPage() {
    // Get the current page path
    const currentPath = window.location.pathname;
    
    // Pages where we should hide the view toggle
    const noTogglePages = [
        '/internships.html',
        '/internships',
        '/about-us.html',
        '/about-us',
        '/careers.html',
        '/careers',
        '/privacy-policy.html',
        '/privacy-policy',
        '/terms-of-service.html',
        '/terms-of-service',
        '/ai-safety-ethics.html',
        '/ai-safety-ethics'
    ];
    
    // Check if we're on a page that should hide the toggle
    const shouldHideToggle = noTogglePages.some(page => 
        currentPath.endsWith(page) || currentPath === page
    );
    
    // Get the toggle container
    const toggleContainer = document.querySelector('.view-toggle-container');
    
    // If we should hide the toggle and it exists, hide it
    if (shouldHideToggle && toggleContainer) {
        toggleContainer.style.display = 'none';
    }
}