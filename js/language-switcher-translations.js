/**
 * Language Switcher Translations
 * 
 * This script ensures that translations are applied when switching languages.
 */

// Wait for the document to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize translations
    initTranslations();
    
    // Listen for language changes
    document.addEventListener('languageChanged', function(event) {
        console.log('Language changed event received:', event.detail);
        applyTranslations();
    });
});

// Initialize translations
function initTranslations() {
    console.log('Initializing translations');
    
    // Get the current language from the HTML lang attribute
    const currentLang = document.documentElement.lang || 'en';
    console.log('Current language:', currentLang);
    
    // Apply translations for the current language
    applyTranslations();
}

// Apply translations based on the current language
function applyTranslations() {
    // Get the current language from the HTML lang attribute
    const currentLang = document.documentElement.lang || 'en';
    console.log('Applying translations for language:', currentLang);
    
    // Skip translation for English (default language)
    if (currentLang === 'en') {
        return;
    }
    
    // Simple translations for demonstration purposes
    const translations = {
        es: {
            'navigation.features': 'Características',
            'navigation.team': 'Equipo',
            'buttons.signUp': 'Registrarse'
        },
        fr: {
            'navigation.features': 'Fonctionnalités',
            'navigation.team': 'Équipe',
            'buttons.signUp': 'S\'inscrire'
        },
        ar: {
            'navigation.features': 'الميزات',
            'navigation.team': 'الفريق',
            'buttons.signUp': 'التسجيل'
        }
    };
    
    // Get all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`Found ${elements.length} elements with data-i18n attribute`);
    
    // Apply translations
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        
        // Check if we have a translation for this key
        if (translations[currentLang] && translations[currentLang][key]) {
            const translation = translations[currentLang][key];
            console.log(`Translating '${key}' to '${translation}'`);
            element.textContent = translation;
        }
    });
    
    console.log('Translations applied');
}

// Make functions available globally
window.languageSwitcherTranslations = {
    initTranslations,
    applyTranslations
};
