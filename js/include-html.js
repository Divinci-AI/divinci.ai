/**
 * Include HTML Components
 * This script allows for including HTML components like headers and footers across multiple pages
 * Enhanced with safety checks to prevent infinite loops
 */

// Safety flag to prevent multiple simultaneous executions
let includeHTMLRunning = false;
let initComponentsRunning = false;

document.addEventListener('DOMContentLoaded', function() {
    // Only run if not already running
    if (includeHTMLRunning) {
        console.warn('includeHTML already running, skipping duplicate call');
        return;
    }

    // Load all elements with data-include attribute
    includeHTML();

    // CRITICAL FIX: Only initialize components ONCE after initial load
    // Do NOT call initializeIncludedComponents repeatedly as it causes loops
    console.log('Initial includeHTML completed');
});

/**
 * Includes HTML content from external files
 */
function includeHTML() {
    // Prevent multiple simultaneous executions
    if (includeHTMLRunning) {
        console.warn('includeHTML already running, preventing duplicate execution');
        return;
    }

    includeHTMLRunning = true;

    try {
        const includes = document.querySelectorAll('[data-include]');
        console.log(`Found ${includes.length} elements with data-include attribute`);

    includes.forEach(element => {
        // Skip elements marked with data-include-special attribute
        // These elements are handled by their own specialized code
        if (element.getAttribute('data-include-special') === 'true') {
            return;
        }

        // Skip language switchers - they are now implemented directly in HTML
        if (element.getAttribute('data-include') === 'includes/language-switcher.html') {
            return;
        }

        // Skip elements that have already been processed
        if (element.getAttribute('data-processed') === 'true') {
            return;
        }

        // Mark this element as processed to prevent reprocessing
        element.setAttribute('data-processed', 'true');

        const file = element.getAttribute('data-include');

        // Determine the correct path based on the current page location
        let path = file;
        let basePath = '';

        // Set the base path depending on the subdirectory
        if (window.location.pathname.includes('/features/')) {
            // We're in a features subdirectory like /features/quality-assurance/
            basePath = '../../';
        }
        // Check if we're in a language subdirectory (like /fr/, /es/, /ar/)
        else if (/^\/(fr|es|ar)\//.test(window.location.pathname)) {
            basePath = '../';
        }

        // Special handling for includes directory and language subdirectories
        if (file.startsWith('includes/') && /^\/(fr|es|ar)\//.test(window.location.pathname)) {
            // Always use the main includes directory for language versions
            path = '../' + file;
        } else {
            path = basePath + file;
        }

        // For local development with file:// protocol, use a fallback approach
        if (window.location.protocol === 'file:') {
            // Use a more compatible approach for local file system
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        // Success - insert the HTML content
                        element.innerHTML = this.responseText;

                        // Execute any scripts in the included HTML
                        executeScripts(element);

                        // CRITICAL FIX: Do NOT call initializeIncludedComponents again
                        // This was causing infinite loops by re-triggering includeHTML
                        console.log('HTML content loaded successfully via XHR for:', path);
                    } else {
                        // Error handling - provide a more helpful message for local development
                        console.error(`Error loading ${path}. For local development, please use a web server.`);
                        element.innerHTML = `
                            <div style="padding: 20px; border: 1px solid #f44336; background-color: #ffebee; color: #333;">
                                <h3>Component Loading Error</h3>
                                <p>Failed to load: ${path}</p>
                                <p><strong>Note:</strong> When developing locally, you need to use a web server instead of opening files directly.</p>
                                <p>Try one of these methods:</p>
                                <ul>
                                    <li>Python: <code>python -m http.server 8000</code></li>
                                    <li>Node.js: <code>npx http-server</code></li>
                                    <li>VS Code: Use the "Live Server" extension</li>
                                </ul>
                            </div>
                        `;
                    }
                }
            };
            xhr.open("GET", path, true);
            xhr.send();
        } else {
            // Standard fetch approach for http/https protocols
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(html => {
                    // Insert the HTML content
                    element.innerHTML = html;

                    // Execute any scripts in the included HTML
                    executeScripts(element);

                    // CRITICAL FIX: Do NOT call initializeIncludedComponents again
                    // This was causing infinite loops by re-triggering includeHTML
                    console.log('HTML content loaded successfully for:', path);
                })
                .catch(error => {
                    console.error('Error including HTML:', error);
                    element.innerHTML = `<p>Error loading component: ${error.message}</p>`;
                });
        }
    });

    } catch (error) {
        console.error('Error in includeHTML:', error);
    } finally {
        // Reset the flag after a short delay to allow for async operations
        setTimeout(() => {
            includeHTMLRunning = false;
        }, 1000);
    }
}

/**
 * Execute scripts within included HTML content
 */
function executeScripts(element) {
    const scripts = element.querySelectorAll('script');
    scripts.forEach(script => {
        const newScript = document.createElement('script');

        // Copy all attributes
        Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });

        // Copy the content
        newScript.innerHTML = script.innerHTML;

        // Replace the old script with the new one
        script.parentNode.replaceChild(newScript, script);
    });
}

/**
 * Initialize any JavaScript functionality needed for included components
 */
function initializeIncludedComponents() {
    // Prevent multiple simultaneous executions
    if (initComponentsRunning) {
        console.warn('initializeIncludedComponents already running, preventing duplicate execution');
        return;
    }

    initComponentsRunning = true;

    try {
        // Initialize view toggle if it exists
        const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('change', function() {
            const customerView = document.querySelector('.customer-view');
            const companyView = document.querySelector('.company-view');

            if (this.checked) {
                customerView.classList.remove('active');
                companyView.classList.add('active');
            } else {
                customerView.classList.add('active');
                companyView.classList.remove('active');
            }
        });

        // Support for conditional header
        // This will be called by include-html.js and potentially overridden by conditional-header.js
        const currentPath = window.location.pathname;

        // Default list of pages for no toggle (minimal version, extended in conditional-header.js)
        const noTogglePages = [
            '/internships.html',
            '/internships'
        ];

        // Check if we're on a no-toggle page
        const shouldHideToggle = noTogglePages.some(page =>
            currentPath.endsWith(page) || currentPath === page
        );

        // Hide toggle if needed - will be overridden by conditional-header.js if loaded
        if (shouldHideToggle) {
            const toggleContainer = document.querySelector('.view-toggle-container');
            if (toggleContainer) {
                toggleContainer.style.display = 'none';
            }
        }
    }

    // Initialize language switchers
    // This ensures language switcher dropdowns are positioned correctly on all pages
    setTimeout(() => {
        const languageSwitchers = document.querySelectorAll('.language-switcher');
        languageSwitchers.forEach(switcher => {
            // Add special class for positioning
            switcher.classList.add('initialized-language-switcher');

            // Fix positioning of dropdown
            const dropdown = switcher.querySelector('.language-switcher-dropdown');
            if (dropdown) {
                dropdown.style.position = 'absolute';
                dropdown.style.top = '100%';
                dropdown.style.right = '0';
                dropdown.style.zIndex = '9999';

                // RTL support
                if (document.documentElement.dir === 'rtl') {
                    dropdown.style.right = 'auto';
                    dropdown.style.left = '0';
                }
            }

            // Add click handler if not already present
            const toggleButton = switcher.querySelector('.language-switcher-current');
            if (toggleButton && !toggleButton.hasAttribute('data-handler-attached')) {
                toggleButton.setAttribute('data-handler-attached', 'true');
                toggleButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Toggle active class
                    switcher.classList.toggle('active');

                    // Update dropdown visibility
                    if (dropdown) {
                        if (switcher.classList.contains('active')) {
                            dropdown.style.display = 'block';
                        } else {
                            dropdown.style.display = 'none';
                        }
                    }
                });
            }
        });
    }, 100);

    // Fix navigation links for subdirectory pages
    if (window.location.pathname.includes('/features/')) {
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            if (link.getAttribute('href').startsWith('index.html')) {
                link.setAttribute('href', '../../' + link.getAttribute('href'));
            }
        });

        // Fix logo path
        const logoImg = document.querySelector('.nav-logo img');
        if (logoImg && logoImg.getAttribute('src').startsWith('images/')) {
            logoImg.setAttribute('src', '../../' + logoImg.getAttribute('src'));
        }
    }
    // Handle language subdirectories
    else if (/^\/(fr|es|ar)\//.test(window.location.pathname)) {
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            if (link.getAttribute('href').startsWith('index.html')) {
                link.setAttribute('href', '../' + link.getAttribute('href'));
            }
        });

        // Fix logo path
        const logoImg = document.querySelector('.nav-logo img');
        if (logoImg && logoImg.getAttribute('src').startsWith('images/')) {
            logoImg.setAttribute('src', '../' + logoImg.getAttribute('src'));
        }
    }

    } catch (error) {
        console.error('Error in initializeIncludedComponents:', error);
    } finally {
        // Reset the flag
        initComponentsRunning = false;
    }
}
