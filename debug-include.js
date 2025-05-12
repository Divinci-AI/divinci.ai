/**
 * Debug version of include-html.js with enhanced logging
 */

console.log('Debug include-html.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, starting to process includes');

    // Load all elements with data-include attribute
    try {
        includeHTML();
    } catch (e) {
        console.error('Error in includeHTML():', e);
    }
});

/**
 * Includes HTML content from external files
 */
function includeHTML() {
    console.log('includeHTML() called');

    const includes = document.querySelectorAll('[data-include]');
    console.log(`Found ${includes.length} elements with data-include attribute`);

    includes.forEach((element, index) => {
        console.log(`Processing include #${index + 1}`);

        try {
            const file = element.getAttribute('data-include');
            console.log(`Include file path: ${file}`);

            // Determine the correct path based on the current page location
            let path = file;
            console.log(`Current location: ${window.location.pathname}`);

            // If the path starts with a slash, it's an absolute path
            if (file.startsWith('/')) {
                // Remove the leading slash for fetch (relative to domain root)
                path = file.substring(1);
                console.log(`Absolute path detected, adjusted to: ${path}`);
            }
            // If we're in a subdirectory, adjust the path
            else if (window.location.pathname.includes('/features/')) {
                // We're in a subdirectory like /features/quality-assurance/
                path = '../../' + file;
                console.log(`In features subdirectory, adjusted path to: ${path}`);
            }

            console.log(`Final path to fetch: ${path}`);
            console.log(`Protocol: ${window.location.protocol}`);

            // For local development with file:// protocol, use a fallback approach
            if (window.location.protocol === 'file:') {
                console.log('Using XHR for file:// protocol');

                // Use a more compatible approach for local file system
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    console.log(`XHR state changed: readyState=${this.readyState}, status=${this.status}`);

                    if (this.readyState == 4) {
                        if (this.status == 200) {
                            // Success - insert the HTML content
                            console.log(`XHR success, content length: ${this.responseText.length}`);
                            element.innerHTML = this.responseText;

                            // Execute any scripts in the included HTML
                            executeScripts(element);

                            // Initialize components after insertion
                            initializeIncludedComponents();

                            // Dispatch an event to notify that the header has been loaded
                            if (file.includes('header.html')) {
                                console.log('Header loaded, dispatching headerLoaded event');
                                document.dispatchEvent(new CustomEvent('headerLoaded'));
                            }
                        } else {
                            // Error handling - provide a more helpful message for local development
                            console.error(`Error loading ${path}. Status: ${this.status}`);
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
                console.log(`Using fetch API for ${window.location.protocol} protocol`);

                fetch(path)
                    .then(response => {
                        console.log(`Fetch response: ${response.status} ${response.statusText}`);
                        if (!response.ok) {
                            throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
                        }
                        return response.text();
                    })
                    .then(html => {
                        // Insert the HTML content
                        console.log(`HTML content received, length: ${html.length}`);
                        element.innerHTML = html;

                        // Execute any scripts in the included HTML
                        executeScripts(element);

                        // Initialize components after insertion
                        initializeIncludedComponents();

                        // Dispatch an event to notify that the header has been loaded
                        if (file.includes('header.html')) {
                            console.log('Header loaded, dispatching headerLoaded event');
                            document.dispatchEvent(new CustomEvent('headerLoaded'));
                        }
                    })
                    .catch(error => {
                        console.error('Error including HTML:', error);
                        element.innerHTML = `
                            <div style="padding: 20px; border: 1px solid #f44336; background-color: #ffebee; color: #333;">
                                <h3>Component Loading Error</h3>
                                <p>Failed to load: ${path}</p>
                                <p>Error: ${error.message}</p>
                            </div>
                        `;
                    });
            }
        } catch (e) {
            console.error(`Error processing include element #${index + 1}:`, e);
        }
    });
}

/**
 * Execute scripts within included HTML content
 */
function executeScripts(element) {
    console.log('Executing scripts in included content');

    try {
        const scripts = element.querySelectorAll('script');
        console.log(`Found ${scripts.length} scripts in included content`);

        scripts.forEach((script, index) => {
            console.log(`Processing script #${index + 1}`);

            try {
                const newScript = document.createElement('script');

                // Copy all attributes
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                    console.log(`Copied attribute: ${attr.name}="${attr.value}"`);
                });

                // Copy the content
                newScript.innerHTML = script.innerHTML;
                console.log(`Script content length: ${script.innerHTML.length}`);

                // Replace the old script with the new one
                script.parentNode.replaceChild(newScript, script);
                console.log(`Script #${index + 1} replaced successfully`);
            } catch (e) {
                console.error(`Error processing script #${index + 1}:`, e);
            }
        });
    } catch (e) {
        console.error('Error in executeScripts():', e);
    }
}

/**
 * Initialize any JavaScript functionality needed for included components
 */
function initializeIncludedComponents() {
    console.log('Initializing included components');

    try {
        // Check for view toggle but don't add event listener (handled by view-toggle.js)
        const viewToggle = document.getElementById('viewToggle');
        if (viewToggle) {
            console.log('Found viewToggle element, but not setting up event listener (handled by view-toggle.js)');

            // Support for conditional header
            // This will be called by include-html.js and potentially overridden by conditional-header.js
            const currentPath = window.location.pathname;
            console.log(`Current path: ${currentPath}`);

            // Default list of pages for no toggle (minimal version, extended in conditional-header.js)
            const noTogglePages = [
                '/internships.html',
                '/internships'
            ];
            console.log('No toggle pages:', noTogglePages);

            // Check if we're on a no-toggle page
            const shouldHideToggle = noTogglePages.some(page =>
                currentPath.endsWith(page) || currentPath === page
            );
            console.log(`Should hide toggle: ${shouldHideToggle}`);

            // Hide toggle if needed - will be overridden by conditional-header.js if loaded
            if (shouldHideToggle) {
                const toggleContainer = document.querySelector('.view-toggle-container');
                if (toggleContainer) {
                    toggleContainer.style.display = 'none';
                    console.log('Toggle container hidden');
                } else {
                    console.log('Toggle container not found');
                }
            }
        } else {
            console.log('viewToggle element not found');
        }

        // Fix navigation links for subdirectory pages
        if (window.location.pathname.includes('/features/')) {
            console.log('In features subdirectory, fixing navigation links');

            const navLinks = document.querySelectorAll('.nav-menu a');
            console.log(`Found ${navLinks.length} navigation links`);

            navLinks.forEach((link, index) => {
                const href = link.getAttribute('href');
                console.log(`Link #${index + 1} href: ${href}`);

                if (href && href.startsWith('index.html')) {
                    const newHref = '../../' + href;
                    link.setAttribute('href', newHref);
                    console.log(`Updated link #${index + 1} href to: ${newHref}`);
                }
            });

            // Fix logo path
            const logoImg = document.querySelector('.nav-logo img');
            if (logoImg) {
                const src = logoImg.getAttribute('src');
                console.log(`Logo image src: ${src}`);

                if (src && src.startsWith('images/')) {
                    const newSrc = '../../' + src;
                    logoImg.setAttribute('src', newSrc);
                    console.log(`Updated logo image src to: ${newSrc}`);
                }
            } else {
                console.log('Logo image not found');
            }
        }
    } catch (e) {
        console.error('Error in initializeIncludedComponents():', e);
    }
}