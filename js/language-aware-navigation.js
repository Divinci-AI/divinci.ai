/**
 * Language-Aware Navigation
 * Handles localStorage for language preferences and updates logo navigation
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initLanguageAwareNavigation, 10);
    } else {
        document.addEventListener('DOMContentLoaded', initLanguageAwareNavigation, { once: true });
    }

    function initLanguageAwareNavigation() {
        // Save current language to localStorage
        saveCurrentLanguageToStorage();
        
        // Update logo navigation to use correct language
        updateLogoNavigation();
        
        // Listen for language changes
        setupLanguageChangeListener();
    }

    function saveCurrentLanguageToStorage() {
        const currentLang = getCurrentLanguage();
        try {
            localStorage.setItem('divinci_preferred_language', currentLang);
        } catch (e) {
            console.warn('Could not save language preference to localStorage:', e);
        }
    }

    function getCurrentLanguage() {
        // Get language from HTML lang attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang && htmlLang !== 'en') {
            return htmlLang;
        }
        
        // Fallback: detect from URL path
        const path = window.location.pathname;
        if (path.includes('/es/')) return 'es';
        if (path.includes('/fr/')) return 'fr';
        if (path.includes('/ar/')) return 'ar';
        
        return 'en'; // default
    }

    function getPreferredLanguage() {
        try {
            return localStorage.getItem('divinci_preferred_language') || 'en';
        } catch (e) {
            console.warn('Could not read language preference from localStorage:', e);
            return 'en';
        }
    }

    function updateLogoNavigation() {
        const logoLinks = document.querySelectorAll('#logoHomeLink, .logo-link');
        const preferredLang = getPreferredLanguage();
        
        logoLinks.forEach(logoLink => {
            if (logoLink) {
                const currentPath = window.location.pathname;
                let basePath = '';
                
                // Determine base path based on current location
                if (currentPath.includes('/features/')) {
                    basePath = '../../';
                } else if (/^\/(fr|es|ar)\//.test(currentPath)) {
                    basePath = '../';
                }
                
                // Set logo link based on preferred language
                let targetPath;
                if (preferredLang === 'en') {
                    targetPath = basePath + 'index.html';
                } else {
                    targetPath = basePath + preferredLang + '/index.html';
                }
                
                logoLink.setAttribute('href', targetPath);
            }
        });
    }

    function setupLanguageChangeListener() {
        // Listen for clicks on language options
        document.addEventListener('click', function(e) {
            const languageOption = e.target.closest('.language-option');
            if (languageOption) {
                const selectedLang = languageOption.getAttribute('data-lang');
                if (selectedLang) {
                    try {
                        localStorage.setItem('divinci_preferred_language', selectedLang);
                    } catch (err) {
                        console.warn('Could not save language preference:', err);
                    }
                }
            }
        });

        // Also listen for direct language changes via the global function
        const originalChangeLanguage = window.changeLanguage;
        if (originalChangeLanguage) {
            window.changeLanguage = function(lang) {
                try {
                    localStorage.setItem('divinci_preferred_language', lang);
                } catch (err) {
                    console.warn('Could not save language preference:', err);
                }
                return originalChangeLanguage.call(this, lang);
            };
        }
    }

    // Auto-redirect to preferred language on homepage if different from current
    function autoRedirectToPreferredLanguage() {
        const currentLang = getCurrentLanguage();
        const preferredLang = getPreferredLanguage();
        const currentPath = window.location.pathname;
        
        // Only auto-redirect on homepage and if languages differ
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html')) {
            if (currentLang !== preferredLang && preferredLang !== 'en') {
                // Redirect to preferred language homepage
                const newPath = preferredLang + '/index.html';
                window.location.href = newPath;
            }
        }
    }

    // Expose functions globally for debugging
    window.DivinciLanguageNav = {
        getCurrentLanguage,
        getPreferredLanguage,
        updateLogoNavigation,
        saveCurrentLanguageToStorage
    };

})();
