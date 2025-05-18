/**
 * Direct Translations
 * 
 * This script provides a direct approach to applying translations.
 */

// Define translations
const translations = {
  en: {
    'navigation.features': 'Features',
    'navigation.team': 'Team',
    'buttons.signUp': 'Sign Up'
  },
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

// Apply translations for a specific language
function applyTranslations(lang) {
  console.log(`Applying direct translations for language: ${lang}`);
  
  // Skip if language is not supported
  if (!translations[lang]) {
    console.warn(`Language ${lang} is not supported for direct translations.`);
    return;
  }
  
  // Get all elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  console.log(`Found ${elements.length} elements with data-i18n attribute`);
  
  // Apply translations
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    
    // Check if we have a translation for this key
    if (translations[lang][key]) {
      const translation = translations[lang][key];
      console.log(`Directly translating '${key}' to '${translation}'`);
      element.textContent = translation;
    }
  });
  
  console.log('Direct translations applied');
}

// Change language
function changeLanguage(lang) {
  console.log(`Changing language to ${lang} using direct translations`);
  
  // Update HTML attributes
  document.documentElement.lang = lang;
  
  // Apply translations
  applyTranslations(lang);
  
  // Store language preference
  localStorage.setItem('language', lang);
  
  return true;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Direct translations initialized');
  
  // Get the current language from localStorage or default to 'en'
  const currentLang = localStorage.getItem('language') || 'en';
  
  // Apply translations for the current language
  applyTranslations(currentLang);
  
  // Add click handlers to language switcher options
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach(option => {
    const lang = option.getAttribute('data-lang');
    if (lang) {
      option.addEventListener('click', function(e) {
        // Apply translations before navigation
        changeLanguage(lang);
      });
    }
  });
});

// Make functions available globally
window.directTranslations = {
  applyTranslations,
  changeLanguage
};
