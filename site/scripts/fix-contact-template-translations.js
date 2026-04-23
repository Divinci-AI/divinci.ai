const fs = require('fs');

// Add the missing speak_consultant structure that the template expects
const contactTemplateFixes = {
  'contact.speak_consultant.title': {
    zh: '预订现场演示',
    es: 'Reservar una demostración en vivo',
    fr: 'Réserver une démo en direct',
    ar: 'حجز عرض توضيحي مباشر',
    ja: 'ライブデモを予約',
    it: 'Prenota una demo live',
    ru: 'Забронировать живую демонстрацию',
    de: 'Live-Demo buchen',
    pt: 'Reservar uma demonstração ao vivo',
    ko: '라이브 데모 예약',
    nl: 'Boek een live demo',
    hi: 'लाइव डेमो बुक करें'
  },

  'contact.speak_consultant.description': {
    zh: '提供30分钟个性化演示，向您展示Divinci AI的工作原理。',
    es: 'Disponible para demostraciones personalizadas de 30 minutos para mostrarle cómo funciona Divinci AI.',
    fr: 'Disponible pour des démos personnalisées de 30 minutes pour vous montrer comment fonctionne Divinci AI.',
    ar: 'متاح لعروض توضيحية مخصصة لمدة 30 دقيقة لتوضيح كيف يعمل Divinci AI.',
    ja: 'Divinci AIの動作方法をお見せする30分間のパーソナライズされたデモをご利用いただけます。',
    it: 'Disponibile per demo personalizzate di 30 minuti per mostrarti come funziona Divinci AI.',
    ru: 'Доступны персонализированные 30-минутные демонстрации, чтобы показать, как работает Divinci AI.',
    de: 'Verfügbar für 30-minütige personalisierte Demos, um Ihnen zu zeigen, wie Divinci AI funktioniert.',
    pt: 'Disponível para demonstrações personalizadas de 30 minutos para mostrar como o Divinci AI funciona.',
    ko: 'Divinci AI 작동 방식을 보여주는 30분 맞춤형 데모를 이용할 수 있습니다.',
    nl: 'Beschikbaar voor gepersonaliseerde 30-minuten demo\'s om te laten zien hoe Divinci AI werkt.',
    hi: 'Divinci AI कैसे काम करता है यह दिखाने के लिए 30-मिनट के व्यक्तिगत डेमो उपलब्ध हैं।'
  },

  'contact.speak_consultant.phone': {
    zh: '预订演示',
    es: 'Reservar Demo',
    fr: 'Réserver une Démo',
    ar: 'حجز عرض توضيحي',
    ja: 'デモを予約',
    it: 'Prenota Demo',
    ru: 'Забронировать демо',
    de: 'Demo buchen',
    pt: 'Reservar Demo',
    ko: '데모 예약',
    nl: 'Demo boeken',
    hi: 'डेमो बुक करें'
  },

  'contact.email_specialists.email': {
    zh: '安排演示',
    es: 'Programar Demo',
    fr: 'Planifier une Démo',
    ar: 'جدولة عرض توضيحي',
    ja: 'デモをスケジュール',
    it: 'Programma Demo',
    ru: 'Запланировать демо',
    de: 'Demo planen',
    pt: 'Agendar Demo',
    ko: '데모 예약',
    nl: 'Demo inplannen',
    hi: 'डेमो शेड्यूल करें'
  }
};

// Helper function to set nested properties
function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Update all language files
const languages = ['zh', 'es', 'fr', 'ar', 'ja', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];

console.log('🔧 Fixing contact template translation keys...\n');

let totalUpdatesCount = 0;

languages.forEach(lang => {
  try {
    const filePath = `data/translations/${lang}.json`;
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let updatesCount = 0;
    
    // Add missing contact template translations for this language
    for (const [key, values] of Object.entries(contactTemplateFixes)) {
      if (values[lang]) {
        setNestedProperty(translations, key, values[lang]);
        updatesCount++;
        totalUpdatesCount++;
      }
    }
    
    // Write back the updated translations
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    
    console.log(`✅ ${lang.toUpperCase()}: Added ${updatesCount} contact template translations`);
    
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()}: Error updating translations - ${error.message}`);
  }
});

// Also update English base file
try {
  const filePath = 'data/translations/en.json';
  const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let updatesCount = 0;
  const englishFixes = {
    'contact.speak_consultant.title': 'Book a live demo',
    'contact.speak_consultant.description': 'Available for 30-minute personalized demos to show you how Divinci AI works.',
    'contact.speak_consultant.phone': 'Book Demo',
    'contact.email_specialists.email': 'Schedule Demo'
  };
  
  for (const [key, value] of Object.entries(englishFixes)) {
    setNestedProperty(translations, key, value);
    updatesCount++;
    totalUpdatesCount++;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
  console.log(`✅ EN: Added ${updatesCount} contact template translations`);
  
} catch (error) {
  console.log(`❌ EN: Error updating translations - ${error.message}`);
}

console.log(`\n📊 Summary:`);
console.log(`Total contact template translations added: ${totalUpdatesCount}`);
console.log(`Contact template elements now translated:`);
console.log(`  ✅ speak_consultant.title (Book a live demo)`);
console.log(`  ✅ speak_consultant.description (30-minute demo description)`);  
console.log(`  ✅ speak_consultant.phone (Book Demo button)`);
console.log(`  ✅ email_specialists.email (Schedule Demo button)`);
console.log(`\n🎉 Contact section template should now display Chinese text correctly!`);