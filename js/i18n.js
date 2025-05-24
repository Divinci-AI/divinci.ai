/**
 * Internationalization (i18n) module for Divinci AI
 * This module provides functionality for translating the website into multiple languages
 */

// Load i18n configuration
document.write('<script src="' + (window.location.pathname.includes('/features/') ? '../../' : '') + 'js/i18n-config.js"></script>');

// Initialize variables from config
let LANGUAGES = {};
let translations = {};
let DEFAULT_LANGUAGE = 'en';
let currentLanguage = DEFAULT_LANGUAGE;

// Function to initialize variables from config
function initFromConfig() {
  if (window.i18nConfig) {
    // Convert array of languages to object
    LANGUAGES = {};
    window.i18nConfig.availableLanguages.forEach(lang => {
      LANGUAGES[lang.code] = {
        name: lang.name,
        dir: lang.dir,
        default: lang.default || false
      };

      // Set default language
      if (lang.default) {
        DEFAULT_LANGUAGE = lang.code;
      }
    });

    // Set translations
    translations = window.i18nConfig.translations || {};

    // Set current language
    currentLanguage = DEFAULT_LANGUAGE;
  }
}

/**
 * Initialize the i18n module
 * @returns {Promise} A promise that resolves when initialization is complete
 */
async function init() {
  // Initialize from config
  initFromConfig();

  // Detect user language
  const detectedLanguage = detectLanguage();

  // Load translations for detected language
  await loadLanguage(detectedLanguage);

  // Set up language switcher
  setupLanguageSwitcher();

  // Apply translations to the page
  translatePage();

  // Listen for dynamic content changes
  observeDOMChanges();

  return true;
}

/**
 * Detect the user's preferred language
 * @returns {string} The detected language code
 */
function detectLanguage() {
  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && LANGUAGES[langParam]) {
    return langParam;
  }

  // Check localStorage
  const storedLang = localStorage.getItem('language');
  if (storedLang && LANGUAGES[storedLang]) {
    return storedLang;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang && LANGUAGES[browserLang]) {
    return browserLang;
  }

  // Fall back to default language
  return DEFAULT_LANGUAGE;
}

/**
 * Load translations for a specific language
 * @param {string} lang - The language code to load
 * @returns {Promise} A promise that resolves when the language is loaded
 */
async function loadLanguage(lang) {
  // If language is not supported, fall back to default
  if (!LANGUAGES[lang]) {
    console.warn(`Language ${lang} is not supported. Falling back to ${DEFAULT_LANGUAGE}.`);
    lang = DEFAULT_LANGUAGE;
  }

  // Update current language
  currentLanguage = lang;

  // Update HTML attributes
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGUAGES[lang].dir;

  // Store language preference
  localStorage.setItem('language', lang);

  // Apply translations immediately
  translatePage();

  // Dispatch language change event
  const event = new CustomEvent('languageChanged', { detail: { language: lang } });
  document.dispatchEvent(event);

  console.log(`Language changed to ${lang}`);
  return true;
}

/**
 * Get the current page name
 * @returns {string|null} The page name or null if not found
 */
function getPageName() {
  const path = window.location.pathname;
  const pageName = path.split('/').pop().split('.')[0];

  if (pageName === '' || pageName === 'index') {
    return 'home';
  }

  return pageName || null;
}

/**
 * Set up the language switcher
 */
function setupLanguageSwitcher() {
  const container = document.getElementById('language-switcher');
  if (!container) return;

  // Create select element
  const select = document.createElement('select');
  select.className = 'language-switcher-select';
  select.setAttribute('aria-label', 'Select language');

  // Add options for each language
  Object.entries(LANGUAGES).forEach(([code, { name }]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    option.selected = code === currentLanguage;
    select.appendChild(option);
  });

  // Add change event listener
  select.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });

  // Clear container and add select
  container.innerHTML = '';
  container.appendChild(select);
}

/**
 * Change the current language
 * @param {string} lang - The language code to change to
 * @returns {Promise} A promise that resolves when the language is changed
 */
async function changeLanguage(lang) {
  if (!LANGUAGES[lang]) {
    console.error(`Language ${lang} is not supported.`);
    return;
  }

  console.log(`Changing language to ${lang}`);

  // Load the language
  await loadLanguage(lang);

  // Apply translations
  translatePage();

  // Force a re-translation after a short delay to ensure all elements are translated
  setTimeout(() => {
    console.log(`Re-applying translations for ${lang}`);
    translatePage();
  }, 500);

  return true;
}

/**
 * Translate the current page
 */
function translatePage() {
  // Translate elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = translate(key);
    if (translation) {
      element.textContent = translation;
    }
  });

  // Translate elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = translate(key);
    if (translation) {
      element.placeholder = translation;
    }
  });

  // Translate elements with data-i18n-html attribute (for HTML content)
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    const translation = translate(key);
    if (translation) {
      element.innerHTML = translation;
    }
  });

  // Translate elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = translate(key);
    if (translation) {
      element.title = translation;
    }
  });

  // Translate elements with data-i18n-aria-label attribute
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    const key = element.getAttribute('data-i18n-aria-label');
    const translation = translate(key);
    if (translation) {
      element.setAttribute('aria-label', translation);
    }
  });
}

/**
 * Translate a key with optional interpolation
 * @param {string} key - The translation key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} The translated string
 */
function translate(key, params = {}) {
  // Get the translation object for the current language
  const langTranslations = translations[currentLanguage] || {};

  // Split the key by dots to access nested properties
  const keys = key.split('.');

  // Navigate through the nested properties
  let translation = langTranslations;
  for (const k of keys) {
    translation = translation?.[k];
    if (translation === undefined) break;
  }

  // If translation is not found, try fallback language
  if (translation === undefined && currentLanguage !== DEFAULT_LANGUAGE) {
    const fallbackTranslations = translations[DEFAULT_LANGUAGE] || {};
    translation = fallbackTranslations;
    for (const k of keys) {
      translation = translation?.[k];
      if (translation === undefined) break;
    }
  }

  // If still not found, return the key
  if (translation === undefined) {
    // Don't log warnings for keys that start with "data-i18n"
    if (!key.startsWith('data-i18n')) {
      console.warn(`Translation key not found: ${key}`);
    }
    return key;
  }

  // Handle pluralization
  if (typeof params.count === 'number') {
    const pluralKey = `${key}_${params.count === 1 ? 'one' : 'other'}`;
    const pluralTranslation = translate(pluralKey);
    if (pluralTranslation !== pluralKey) {
      translation = pluralTranslation;
    }
  }

  // If translation is not a string, return the key
  if (typeof translation !== 'string') {
    console.warn(`Translation for key ${key} is not a string:`, translation);
    return key;
  }

  // Log successful translation for debugging
  console.log(`Translated '${key}' to '${translation}' (${currentLanguage})`);

  // Interpolate parameters
  return interpolate(translation, params);
}

/**
 * Interpolate parameters in a string
 * @param {string} str - The string to interpolate
 * @param {Object} params - Parameters for interpolation
 * @returns {string} The interpolated string
 */
function interpolate(str, params) {
  return str.replace(/{{([^{}]*)}}/g, (match, key) => {
    const value = params[key.trim()];
    return value !== undefined ? value : match;
  });
}

/**
 * Observe DOM changes to translate dynamically added elements
 */
function observeDOMChanges() {
  // Create a MutationObserver to watch for changes to the DOM
  const observer = new MutationObserver(mutations => {
    let shouldTranslate = false;

    // Check if any of the mutations added elements with data-i18n attributes
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.hasAttribute('data-i18n') ||
              node.hasAttribute('data-i18n-placeholder') ||
              node.hasAttribute('data-i18n-html') ||
              node.hasAttribute('data-i18n-title') ||
              node.hasAttribute('data-i18n-aria-label') ||
              node.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-html], [data-i18n-title], [data-i18n-aria-label]')
            ) {
              shouldTranslate = true;
              break;
            }
          }
        }
      }

      if (shouldTranslate) break;
    }

    // If elements with data-i18n attributes were added, translate the page
    if (shouldTranslate) {
      translatePage();
    }
  });

  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Export public API
window.i18n = {
  init,
  changeLanguage,
  translate,
  getCurrentLanguage: () => currentLanguage,
  getSupportedLanguages: () => ({ ...LANGUAGES })
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
