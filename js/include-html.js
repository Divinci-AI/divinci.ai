/**
 * Include HTML Components
 * This script allows for including HTML components like headers and footers across multiple pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load all elements with data-include attribute
    includeHTML();

    // Initialize any event listeners or functionality needed for included components
    initializeIncludedComponents();
});

/**
 * Includes HTML content from external files
 */
function includeHTML() {
    const includes = document.querySelectorAll('[data-include]');

    includes.forEach(element => {
        const file = element.getAttribute('data-include');

        // Determine the correct path based on the current page location
        let path = file;

        // If we're in a subdirectory, adjust the path
        if (window.location.pathname.includes('/features/')) {
            // We're in a subdirectory like /features/quality-assurance/
            path = '../../' + file;
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

                        // Initialize components after insertion
                        initializeIncludedComponents();
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

                    // Initialize components after insertion
                    initializeIncludedComponents();
                })
                .catch(error => {
                    console.error('Error including HTML:', error);
                    element.innerHTML = `<p>Error loading component: ${error.message}</p>`;
                });
        }
    });
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
}
