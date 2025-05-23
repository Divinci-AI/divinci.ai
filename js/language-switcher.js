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

        // Set up once-per-hover animation for globe SVG
        const globe = switcher.querySelector('.language-icon #globe-animated');
        if (globe) {
            let animating = false;
            const runGlobeAnimation = () => {
                if (animating) return;
                animating = true;
                globe.classList.add('animate-once');
                globe.addEventListener('animationend', () => {
                    globe.classList.remove('animate-once');
                    animating = false;
                }, { once: true });
            };
            // Both mouse and keyboard accessible
            globe.parentElement.addEventListener('mouseenter', runGlobeAnimation);
            globe.parentElement.addEventListener('focus', runGlobeAnimation);
        }
        
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

// Global language change function
window.changeLanguage = function(lang) {
    const currentPath = window.location.pathname;
    const langRegex = /^\/(es|fr|ar)\//;
    const hasLangPrefix = langRegex.test(currentPath);
    
    let newPath;
    if (lang === 'en') {
        newPath = hasLangPrefix ? currentPath.replace(langRegex, '/') : currentPath;
    } else {
        newPath = hasLangPrefix ? currentPath.replace(langRegex, `/${lang}/`) : `/${lang}${currentPath}`;
    }
    
    if (newPath !== currentPath) {
        window.location.href = newPath;
    }
};
