/**
 * Language Switcher - Simplified Version
 * Streamlined implementation for direct embedding in the header
 */

// Initialize immediately when script is loaded
(function() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initLanguageSwitcher, 10);
    } else {
        document.addEventListener('DOMContentLoaded', initLanguageSwitcher, { once: true });
    }
})();

// Main initialization function
function initLanguageSwitcher() {
    const languageSwitchers = document.querySelectorAll('.language-switcher');
    if (!languageSwitchers.length) return;

    // Initialize each switcher
    languageSwitchers.forEach(switcher => {
        // Skip already initialized switchers
        if (switcher.hasAttribute('data-initialized')) return;

        // Mark as initialized
        switcher.setAttribute('data-initialized', 'true');

        // Set up toggle behavior
        const toggleButton = switcher.querySelector('.language-switcher-current');
        if (toggleButton) {
            toggleButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Close other switchers
                document.querySelectorAll('.language-switcher.active').forEach(s => {
                    if (s !== switcher) s.classList.remove('active');
                });

                // Toggle this switcher
                switcher.classList.toggle('active');
            });
        }

        // Set up click handlers for language options
        const languageOptions = switcher.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const lang = this.getAttribute('data-lang');
                if (lang) {
                    // Close the dropdown
                    switcher.classList.remove('active');

                    // Navigate to the new language
                    navigateToLanguage(lang);
                }
            });
        });

        // Font Awesome icon is now used instead of animated SVG globe

        // Update displayed language
        updateCurrentLanguage(switcher);

        // Fix dropdown positioning
        const dropdown = switcher.querySelector('.language-switcher-dropdown');
        if (dropdown) {
            // Force correct positioning with inline styles
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.zIndex = '9999';
            dropdown.style.transform = 'none';

            if (document.documentElement.dir === 'rtl') {
                dropdown.style.right = 'auto';
                dropdown.style.left = '0';
            } else {
                dropdown.style.right = '0';
                dropdown.style.left = 'auto';
            }
        }
    });

    // Set up global click handler to close dropdowns
    if (!window.hasLanguageSwitcherClickHandler) {
        document.addEventListener('click', function(e) {
            document.querySelectorAll('.language-switcher.active').forEach(switcher => {
                if (!switcher.contains(e.target)) {
                    switcher.classList.remove('active');
                }
            });
        });
        window.hasLanguageSwitcherClickHandler = true;
    }

    // Handle window resize for responsive positioning
    window.addEventListener('resize', function() {
        document.querySelectorAll('.language-switcher-dropdown').forEach(dropdown => {
            if (document.documentElement.dir === 'rtl') {
                dropdown.style.right = 'auto';
                dropdown.style.left = '0';
            } else {
                dropdown.style.right = '0';
                dropdown.style.left = 'auto';
            }
        });
    });
}

// Update displayed language based on HTML lang attribute
function updateCurrentLanguage(switcher) {
    const currentLang = document.documentElement.lang || 'en';
    const currentLanguageEl = switcher.querySelector('.current-language');

    if (currentLanguageEl) {
        const languageNames = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'ar': 'العربية'
        };

        currentLanguageEl.textContent = languageNames[currentLang] || 'English';
    }
}

// Navigate to a specific language
function navigateToLanguage(lang) {
    const currentPath = window.location.pathname;
    const currentOrigin = window.location.origin;
    const currentHref = window.location.href;

    // Detect if we're on a static site
    const isStaticSite = currentOrigin.startsWith('file://') ||
                        (!currentOrigin.includes('localhost') &&
                         !currentOrigin.includes('127.0.0.1') &&
                         !currentOrigin.includes('dev') &&
                         !currentOrigin.includes('staging'));

    // For file:// URLs, we need to extract the relative path from the full file path
    let relativePath = currentPath;
    if (isStaticSite && currentOrigin.startsWith('file://')) {
        // Extract the relative path by finding the project directory or root
        // currentPath might be something like: /Users/mikeumus/Documents/divinci.ai/fr/index.html
        // We want to extract: /fr/index.html or /index.html
        const pathParts = currentPath.split('/');
        const projectIndex = pathParts.findIndex(part => part === 'divinci.ai');
        if (projectIndex !== -1 && projectIndex < pathParts.length - 1) {
            // Get everything after the project directory
            const relativePathParts = pathParts.slice(projectIndex + 1);
            relativePath = '/' + relativePathParts.join('/');
        }
    }
    // For hosted static sites (like Cloudflare Pages), currentPath is already relative

    const langRegex = /^\/(es|fr|ar)\//;
    const hasLangPrefix = langRegex.test(relativePath);



    // Get the current page filename (default to index.html)
    let currentPage = 'index.html';
    if (relativePath && relativePath !== '/') {
        // Extract the filename from the relative path
        const pathParts = relativePath.split('/').filter(part => part.length > 0);

        // Remove language prefix if present
        if (hasLangPrefix && pathParts.length > 0) {
            pathParts.shift(); // Remove language code
        }

        // Get the last part as the filename, or use index.html if it's a directory
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart.includes('.html') || lastPart.includes('.htm')) {
                currentPage = lastPart;
            } else {
                // It's a directory, so we want index.html
                currentPage = 'index.html';
            }
        }
    }

    let targetUrl;

    if (isStaticSite) {
        // For static sites, construct the full URL with proper directory structure
        if (lang === 'en') {
            // For English, navigate to root directory
            if (currentOrigin.startsWith('file://')) {
                // For file:// protocol, we need to construct the path differently
                const basePath = currentHref.substring(0, currentHref.lastIndexOf('/') + 1);
                // Remove any language directory from the base path
                let cleanBasePath = basePath;
                if (hasLangPrefix) {
                    // Remove the language directory part
                    cleanBasePath = basePath.replace(/\/(es|fr|ar)\//, '/');
                }
                targetUrl = cleanBasePath + currentPage;
            } else {
                // For hosted static sites (like Cloudflare Pages)
                targetUrl = currentOrigin + '/' + currentPage;
            }
        } else {
            // For other languages, navigate to language subdirectory
            if (currentOrigin.startsWith('file://')) {
                // For file:// protocol
                const basePath = currentHref.substring(0, currentHref.lastIndexOf('/') + 1);
                // Remove any existing language directory from the base path
                let cleanBasePath = basePath;
                if (hasLangPrefix) {
                    // Replace existing language directory
                    cleanBasePath = basePath.replace(/\/(es|fr|ar)\//, '/');
                }
                targetUrl = cleanBasePath + lang + '/' + currentPage;
            } else {
                // For hosted static sites (like Cloudflare Pages)
                targetUrl = currentOrigin + '/' + lang + '/' + currentPage;
            }
        }
    } else {
        // For development/server-based sites, use the original path-based approach
        let newPath;
        if (lang === 'en') {
            // For English, remove language prefix
            newPath = hasLangPrefix ? relativePath.replace(langRegex, '/') : relativePath;
        } else {
            // For other languages, add or replace language prefix
            if (hasLangPrefix) {
                newPath = relativePath.replace(langRegex, `/${lang}/`);
            } else {
                // Handle root path specially
                if (relativePath === '/' || relativePath === '') {
                    newPath = `/${lang}/`;
                } else {
                    newPath = `/${lang}${relativePath}`;
                }
            }
        }

        if (newPath !== relativePath) {
            targetUrl = newPath;
        } else {
            return; // No change needed
        }
    }

    // Navigate to the target URL
    if (targetUrl) {
        // Check if the target URL is different from current URL
        if (targetUrl !== currentHref) {
            window.location.href = targetUrl;
        }
    }
}

// Global language change function (for backward compatibility)
window.changeLanguage = navigateToLanguage;