const fs = require('fs');
const path = require('path');

// Define missing footer privacy translations
const footerPrivacyTranslations = {
  'footer.bottom.privacy_settings': {
    en: 'Privacy Settings',
    es: 'Configuración de Privacidad', 
    fr: 'Paramètres de Confidentialité',
    ar: 'إعدادات الخصوصية',
    zh: '隐私设置',
    de: 'Datenschutz-Einstellungen',
    it: 'Impostazioni Privacy',
    pt: 'Configurações de Privacidade',
    ru: 'Настройки Конфиденциальности',
    ja: 'プライバシー設定',
    ko: '개인정보 설정',
    hi: 'गोपनीयता सेटिंग्स',
    nl: 'Privacy-instellingen'
  },
  'footer.bottom.cookie_policy': {
    en: 'Cookie Policy',
    es: 'Política de Cookies',
    fr: 'Politique de Cookies', 
    ar: 'سياسة ملفات تعريف الارتباط',
    zh: 'Cookie政策',
    de: 'Cookie-Richtlinie',
    it: 'Politica dei Cookie',
    pt: 'Política de Cookies',
    ru: 'Политика Cookies',
    ja: 'Cookieポリシー',
    ko: '쿠키 정책',
    hi: 'कुकी नीति',
    nl: 'Cookiebeleid'
  },
  'footer.bottom.cookie_preferences': {
    en: 'Cookie Preferences',
    es: 'Preferencias de Cookies',
    fr: 'Préférences de Cookies',
    ar: 'تفضيلات ملفات تعريف الارتباط', 
    zh: 'Cookie偏好',
    de: 'Cookie-Einstellungen',
    it: 'Preferenze Cookie',
    pt: 'Preferências de Cookies',
    ru: 'Настройки Cookies',
    ja: 'Cookie設定',
    ko: '쿠키 기본 설정',
    hi: 'कुकी प्राथमिकताएं',
    nl: 'Cookie-voorkeuren'
  }
};

// Function to safely set nested object properties
function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Process each language
const languages = ['ar', 'de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'zh'];

languages.forEach(lang => {
  const filePath = path.join(__dirname, '..', 'data', 'translations', `${lang}.json`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add missing footer privacy translations
    Object.entries(footerPrivacyTranslations).forEach(([key, translations]) => {
      if (translations[lang]) {
        setNestedProperty(data, key, translations[lang]);
      }
    });
    
    // Write updated data back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ Updated ${lang}.json with footer privacy translations`);
    
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 Footer privacy translation updates completed!');