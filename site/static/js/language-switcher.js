/**
 * Language Switcher for New Divinci Zola Site
 * Clean implementation with proper language detection
 */

document.addEventListener('DOMContentLoaded', function() {
    initLanguageSwitcher();
});

function initLanguageSwitcher() {
    const languageSwitcher = document.querySelector('.language-switcher');
    if (!languageSwitcher) return;

    // Skip if already initialized
    if (languageSwitcher.hasAttribute('data-initialized')) return;
    languageSwitcher.setAttribute('data-initialized', 'true');

    const toggleButton = languageSwitcher.querySelector('.language-switcher-current');
    const dropdown = languageSwitcher.querySelector('.language-switcher-dropdown');
    const languageOptions = languageSwitcher.querySelectorAll('.language-option');

    if (!toggleButton || !dropdown) return;

    // Set up toggle behavior
    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        languageSwitcher.classList.toggle('active');
        
        // Show/hide dropdown
        if (languageSwitcher.classList.contains('active')) {
            dropdown.style.display = 'block';
            positionDropdown();
        } else {
            dropdown.style.display = 'none';
        }
    });

    // Set up language option clicks
    languageOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const lang = this.getAttribute('data-lang');
            navigateToLanguage(lang);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!languageSwitcher.contains(e.target) && !dropdown.contains(e.target)) {
            languageSwitcher.classList.remove('active');
            dropdown.style.display = 'none';
        }
    });

    // Update current language display
    updateCurrentLanguage();

    // Handle responsive positioning
    window.addEventListener('resize', function() {
        if (languageSwitcher.classList.contains('active')) {
            positionDropdown();
        }
    });
    
    // Move dropdown to body for better z-index handling
    dropdown.classList.add('language-switcher-dropdown-portal');
    document.body.appendChild(dropdown);
    
    // Position dropdown function
    function positionDropdown() {
        const rect = toggleButton.getBoundingClientRect();
        const isRTL = document.documentElement.dir === 'rtl';
        
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 8) + 'px';
        
        if (isRTL) {
            dropdown.style.right = 'auto';
            dropdown.style.left = rect.left + 'px';
        } else {
            dropdown.style.left = 'auto';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        }
    }
}

function updateCurrentLanguage() {
    const currentLang = detectCurrentLanguage();
    const currentLanguageEl = document.querySelector('.current-language');
    
    if (currentLanguageEl) {
        const languageNames = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'ar': 'العربية',
            'ja': '日本語',
            'zh': '中文',
            'it': 'Italiano',
            'ru': 'Русский',
            'de': 'Deutsch',
            'pt': 'Português',
            'ko': '한국어',
            'nl': 'Nederlands',
            'hi': 'हिन्दी'
        };
        
        currentLanguageEl.textContent = languageNames[currentLang] || 'English';
    }

    // Update active state for language options
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        const lang = option.getAttribute('data-lang');
        if (lang === currentLang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

function detectCurrentLanguage() {
    const path = window.location.pathname;
    
    // Check if path starts with language prefix
    const supportedLangs = ['es', 'fr', 'ar', 'ja', 'zh', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];
    
    for (const lang of supportedLangs) {
        if (path.startsWith(`/${lang}/`)) {
            return lang;
        }
    }
    
    // Default to English
    return 'en';
}

function navigateToLanguage(lang) {
    const currentPath = window.location.pathname;
    const currentLang = detectCurrentLanguage();
    
    // Don't navigate if already on the same language
    if (currentLang === lang) {
        const switcher = document.querySelector('.language-switcher');
        const dropdown = document.querySelector('.language-switcher-dropdown-portal');
        if (switcher) switcher.classList.remove('active');
        if (dropdown) dropdown.style.display = 'none';
        return;
    }
    
    let newPath;
    
    // First, always strip any existing language prefix to get the base path
    let basePath = currentPath.replace(/^\/(es|fr|ar|ja|zh|it|ru|de|pt|ko|nl|hi)\//, '/');
    
    if (lang === 'en') {
        // For English, use the base path without language prefix
        newPath = basePath;
        if (newPath === '/index.html') newPath = '/';
    } else {
        // For other languages, add language prefix to base path
        if (basePath === '/') {
            newPath = `/${lang}/`;
        } else {
            newPath = `/${lang}${basePath}`;
        }
    }
    
    // Navigate to the new path
    if (newPath !== currentPath) {
        window.location.href = newPath;
    }
}

// Re-initialize on navigation (for SPA-like behavior)
window.addEventListener('popstate', function() {
    updateCurrentLanguage();
});

// Global function for backward compatibility
window.changeLanguage = navigateToLanguage;