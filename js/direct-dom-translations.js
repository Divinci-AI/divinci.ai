/**
 * Direct DOM Translations
 *
 * This script directly modifies the DOM to apply translations.
 */

// Define translations
let translations = {
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

// Load translations from JSON files
async function loadTranslationsFromFiles() {
  try {
    // Load Spanish translations
    const esResponse = await fetch('/translations/es.json');
    if (esResponse.ok) {
      const esData = await esResponse.json();
      translations.es = {
        'navigation.features': esData.navigation.features,
        'navigation.team': esData.navigation.team,
        'buttons.signUp': esData.navigation.buttons.signUp
      };
      console.log('Spanish translations loaded from file');
    }

    // Load French translations
    const frResponse = await fetch('/translations/fr.json');
    if (frResponse.ok) {
      const frData = await frResponse.json();
      translations.fr = {
        'navigation.features': frData.navigation.features,
        'navigation.team': frData.navigation.team,
        'buttons.signUp': frData.navigation.buttons.signUp
      };
      console.log('French translations loaded from file');
    }

    // Load Arabic translations
    const arResponse = await fetch('/translations/ar.json');
    if (arResponse.ok) {
      const arData = await arResponse.json();
      translations.ar = {
        'navigation.features': arData.navigation.features,
        'navigation.team': arData.navigation.team,
        'buttons.signUp': arData.navigation.buttons.signUp
      };
      console.log('Arabic translations loaded from file');
    }
  } catch (error) {
    console.error('Error loading translations from files:', error);
  }
}

// Apply translations for a specific language
function applyTranslations(lang) {
  console.log(`Applying direct DOM translations for language: ${lang}`);

  // Skip if language is not supported
  if (!translations[lang]) {
    console.warn(`Language ${lang} is not supported for direct translations.`);
    return;
  }

  // Directly modify the DOM for specific elements
  const featuresLink = document.querySelector('a[href="#features"]');
  if (featuresLink) {
    featuresLink.textContent = translations[lang]['navigation.features'];
    console.log(`Set features link text to: ${translations[lang]['navigation.features']}`);
  }

  const teamLink = document.querySelector('a[href="#team"]');
  if (teamLink) {
    teamLink.textContent = translations[lang]['navigation.team'];
    console.log(`Set team link text to: ${translations[lang]['navigation.team']}`);
  }

  const signUpButton = document.querySelector('.signup-button');
  if (signUpButton) {
    signUpButton.textContent = translations[lang]['buttons.signUp'];
    console.log(`Set sign up button text to: ${translations[lang]['buttons.signUp']}`);
  }

  // Also apply translations to elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  console.log(`Found ${elements.length} elements with data-i18n attribute`);

  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');

    // Check if we have a translation for this key
    if (translations[lang][key]) {
      const translation = translations[lang][key];
      console.log(`Translating '${key}' to '${translation}'`);
      element.textContent = translation;
    }
  });

  console.log('Direct DOM translations applied');
}

// Change language
function changeLanguage(lang) {
  console.log(`Changing language to ${lang} using direct DOM translations`);

  // Update HTML attributes
  document.documentElement.lang = lang;

  // Apply translations
  applyTranslations(lang);

  // Store language preference
  localStorage.setItem('language', lang);

  return true;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Direct DOM translations initialized');

  // Load translations from files
  await loadTranslationsFromFiles();

  // Get the current language from the URL path or HTML lang attribute
  let currentLang = 'en';

  // Check URL path for language code
  const path = window.location.pathname;
  if (path.startsWith('/es/')) {
    currentLang = 'es';
  } else if (path.startsWith('/fr/')) {
    currentLang = 'fr';
  } else if (path.startsWith('/ar/')) {
    currentLang = 'ar';
  }

  // Update HTML lang attribute
  document.documentElement.lang = currentLang;

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

  // Add click handler to the debug button
  const debugButton = document.querySelector('button:has-text("Go to Spanish Version")');
  if (debugButton) {
    debugButton.addEventListener('click', function() {
      changeLanguage('es');
    });
  }

  // Log that initialization is complete
  console.log(`Initialization complete. Current language: ${currentLang}`);
});

// Make functions available globally
window.directDomTranslations = {
  applyTranslations,
  changeLanguage
};
