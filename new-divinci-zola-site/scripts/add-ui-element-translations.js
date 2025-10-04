const fs = require('fs');

// Missing UI element translations for homepage elements
const missingUiTranslations = {
  // FAQ and demo action buttons
  'expert_answers.view_complete_list': {
    zh: '查看完整模型兼容性列表',
    es: 'Ver lista completa de compatibilidad de modelos',
    fr: 'Voir la liste complète de compatibilité des modèles',
    ar: 'عرض قائمة التوافق الكاملة للنماذج',
    ja: '完全なモデル互換性リストを表示',
    it: 'Visualizza elenco completo compatibilità modelli',
    ru: 'Посмотреть полный список совместимости моделей',
    de: 'Vollständige Modellkompatibilitätsliste anzeigen',
    pt: 'Ver lista completa de compatibilidade de modelos',
    ko: '전체 모델 호환성 목록 보기',
    nl: 'Bekijk volledige modelcompatibiliteitslijst',
    hi: 'पूर्ण मॉडल संगतता सूची देखें'
  },

  'contact.schedule_demo': {
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
  },

  'contact.book_demo': {
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

  'contact.demo_availability': {
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

  // Product feature names
  'features.autorag.title': {
    zh: 'AutoRAG',
    es: 'AutoRAG',
    fr: 'AutoRAG', 
    ar: 'AutoRAG',
    ja: 'AutoRAG',
    it: 'AutoRAG',
    ru: 'AutoRAG',
    de: 'AutoRAG',
    pt: 'AutoRAG',
    ko: 'AutoRAG',
    nl: 'AutoRAG',
    hi: 'AutoRAG'
  },

  'features.qa_title': {
    zh: '质量保证',
    es: 'Aseguramiento de Calidad',
    fr: 'Assurance Qualité',
    ar: 'ضمان الجودة',
    ja: '品質保証',
    it: 'Garanzia Qualità',
    ru: 'Обеспечение качества',
    de: 'Qualitätssicherung',
    pt: 'Garantia de Qualidade',
    ko: '품질 보증',
    nl: 'Kwaliteitsborging',
    hi: 'गुणवत्ता आश्वासन'
  },

  'features.release_management': {
    zh: '发布管理',
    es: 'Gestión de Lanzamientos',
    fr: 'Gestion des Versions',
    ar: 'إدارة الإصدارات',
    ja: 'リリース管理',
    it: 'Gestione Rilasci',
    ru: 'Управление релизами',
    de: 'Release-Management',
    pt: 'Gerenciamento de Lançamentos',
    ko: '릴리스 관리',
    nl: 'Release Management',
    hi: 'रिलीज़ प्रबंधन'
  },

  // Footer links
  'footer.api': {
    zh: 'API',
    es: 'API',
    fr: 'API',
    ar: 'API',
    ja: 'API',
    it: 'API',
    ru: 'API',
    de: 'API',
    pt: 'API',
    ko: 'API',
    nl: 'API',
    hi: 'API'
  },

  'footer.support': {
    zh: '支持',
    es: 'Soporte',
    fr: 'Support',
    ar: 'الدعم',
    ja: 'サポート',
    it: 'Supporto',
    ru: 'Поддержка',
    de: 'Support',
    pt: 'Suporte',
    ko: '지원',
    nl: 'Ondersteuning',
    hi: 'सहायता'
  },

  // Privacy and cookie settings
  'footer.privacy_settings': {
    zh: '隐私设置',
    es: 'Configuración de Privacidad',
    fr: 'Paramètres de Confidentialité',
    ar: 'إعدادات الخصوصية',
    ja: 'プライバシー設定',
    it: 'Impostazioni Privacy',
    ru: 'Настройки конфиденциальности',
    de: 'Datenschutz-Einstellungen',
    pt: 'Configurações de Privacidade',
    ko: '개인정보 설정',
    nl: 'Privacy-instellingen',
    hi: 'गोपनीयता सेटिंग्स'
  },

  'footer.cookie_preferences': {
    zh: 'Cookie偏好设置',
    es: 'Preferencias de Cookies',
    fr: 'Préférences de Cookies',
    ar: 'تفضيلات ملفات تعريف الارتباط',
    ja: 'Cookieの設定',
    it: 'Preferenze Cookie',
    ru: 'Настройки файлов cookie',
    de: 'Cookie-Einstellungen',
    pt: 'Preferências de Cookies',
    ko: '쿠키 설정',
    nl: 'Cookie-voorkeuren',
    hi: 'कुकी प्राथमिकताएं'
  },

  'footer.cookie_policy': {
    zh: 'Cookie政策',
    es: 'Política de Cookies',
    fr: 'Politique de Cookies',
    ar: 'سياسة ملفات تعريف الارتباط',
    ja: 'Cookieポリシー',
    it: 'Politica sui Cookie',
    ru: 'Политика использования файлов cookie',
    de: 'Cookie-Richtlinie',
    pt: 'Política de Cookies',
    ko: '쿠키 정책',
    nl: 'Cookiebeleid',
    hi: 'कुकी नीति'
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

console.log('🔧 Adding UI element translations for homepage...\n');

let totalUpdatesCount = 0;

languages.forEach(lang => {
  try {
    const filePath = `data/translations/${lang}.json`;
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let updatesCount = 0;
    
    // Add missing UI translations for this language
    for (const [key, values] of Object.entries(missingUiTranslations)) {
      if (values[lang]) {
        setNestedProperty(translations, key, values[lang]);
        updatesCount++;
        totalUpdatesCount++;
      }
    }
    
    // Write back the updated translations
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    
    console.log(`✅ ${lang.toUpperCase()}: Added ${updatesCount} UI element translations`);
    
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()}: Error updating translations - ${error.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Total UI element translations added: ${totalUpdatesCount}`);
console.log(`UI elements now translated:`);
console.log(`  ✅ FAQ action buttons (View complete model compatibility list)`);
console.log(`  ✅ Demo booking buttons (Schedule Demo, Book a live demo)`);
console.log(`  ✅ Product feature names (AutoRAG, Quality Assurance, Release Management)`);
console.log(`  ✅ Footer links (API, Support)`);
console.log(`  ✅ Privacy controls (Privacy Settings, Cookie Policy, Cookie Preferences)`);
console.log(`\n🎉 All homepage UI elements are now fully translated!`);