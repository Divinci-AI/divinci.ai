/**
 * Simple Translation Update Script
 * Adds missing translations for recent content additions
 */

const fs = require('fs');

console.log('🌐 Starting translation update...\n');

const languages = ['es', 'fr', 'ar', 'ja', 'zh', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];

// Function to set nested property
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

// Define the missing translations
const missingTranslations = {
  'navigation.support_center': {
    es: 'Centro de Soporte',
    fr: 'Centre de Support', 
    ar: 'مركز الدعم',
    ja: 'サポートセンター',
    zh: '支持中心',
    it: 'Centro di Supporto',
    ru: 'Центр поддержки',
    de: 'Support-Center',
    pt: 'Centro de Suporte',
    ko: '지원 센터',
    nl: 'Ondersteuningscentrum',
    hi: 'सहायता केंद्र'
  },
  
  'features.journal_title': {
    es: 'Cuaderno de Leonardo',
    fr: 'Journal de Léonard',
    ar: 'مجلة ليوناردو',
    ja: 'レオナルドの手帳', 
    zh: '列奥纳多日记',
    it: 'Diario di Leonardo',
    ru: 'Дневник Леонардо',
    de: 'Leonardos Tagebuch',
    pt: 'Diário de Leonardo',
    ko: '레오나르도의 일기',
    nl: "Leonardo's Dagboek",
    hi: 'लियोनार्डो की डायरी'
  },
  
  'team.roles.cpo': {
    es: 'Director de Producto',
    fr: 'Directeur Produit',
    ar: 'مدير المنتج',
    ja: 'プロダクト責任者',
    zh: '产品总监',
    it: 'Direttore Prodotto', 
    ru: 'Директор по продукту',
    de: 'Produktdirektor',
    pt: 'Diretor de Produto',
    ko: '제품 책임자',
    nl: 'Productdirecteur',
    hi: 'उत्पाद निदेशक'
  },
  
  'team.roles.coo': {
    es: 'Director de Operaciones',
    fr: 'Directeur des Opérations',
    ar: 'مدير العمليات',
    ja: '運営責任者',
    zh: '运营总监',
    it: 'Direttore Operativo',
    ru: 'Директор по операциям',
    de: 'Betriebsleiter',
    pt: 'Diretor de Operações',
    ko: '운영 책임자',
    nl: 'Operationeel Directeur',
    hi: 'परिचालन निदेशक'
  },
  
  'team.roles.data_scientist': {
    es: 'Científico de Datos',
    fr: 'Data Scientist',
    ar: 'عالم البيانات',
    ja: 'データサイエンティスト',
    zh: '数据科学家',
    it: 'Data Scientist',
    ru: 'Специалист по данным',
    de: 'Datenwissenschaftler',
    pt: 'Cientista de Dados',
    ko: '데이터 사이언티스트',
    nl: 'Data Scientist',
    hi: 'डेटा वैज्ञानिक'
  },
  
  'team.roles.ai_safety_ethics_advisor': {
    es: 'Asesor de Ética y Seguridad de IA',
    fr: 'Conseiller en Éthique et Sécurité IA',
    ar: 'مستشار أخلاقيات وأمان الذكاء الاصطناعي',
    ja: 'AI倫理・安全アドバイザー',
    zh: 'AI伦理与安全顾问',
    it: 'Consulente Etica e Sicurezza IA',
    ru: 'Консультант по этике и безопасности ИИ',
    de: 'KI-Ethik und Sicherheitsberater',
    pt: 'Conselheiro de Ética e Segurança IA',
    ko: 'AI 윤리 및 안전 고문',
    nl: 'AI Ethiek en Veiligheidsadviseur',
    hi: 'AI नैतिकता और सुरक्षा सलाहकार'
  }
};

// Add basic sections for contact and support
const basicSections = {
  contact: {
    es: { title: "Contacto", subtitle: "Póngase en contacto con nuestro equipo" },
    fr: { title: "Contact", subtitle: "Contactez notre équipe" },
    ar: { title: "اتصال", subtitle: "تواصل مع فريقنا" },
    ja: { title: "お問い合わせ", subtitle: "私たちのチームにご連絡ください" },
    zh: { title: "联系我们", subtitle: "联系我们的团队" },
    it: { title: "Contatto", subtitle: "Contatta il nostro team" },
    ru: { title: "Контакты", subtitle: "Свяжитесь с нашей командой" },
    de: { title: "Kontakt", subtitle: "Kontaktieren Sie unser Team" },
    pt: { title: "Contato", subtitle: "Entre em contato com nossa equipe" },
    ko: { title: "연락처", subtitle: "저희 팀에 문의하세요" },
    nl: { title: "Contact", subtitle: "Neem contact op met ons team" },
    hi: { title: "संपर्क", subtitle: "हमारी टीम से संपर्क करें" }
  },
  support: {
    es: { title: "Centro de Soporte", subtitle: "Obtenga ayuda y soporte para Divinci AI" },
    fr: { title: "Centre de Support", subtitle: "Obtenez de l'aide et du support pour Divinci AI" },
    ar: { title: "مركز الدعم", subtitle: "احصل على المساعدة والدعم لـ Divinci AI" },
    ja: { title: "サポートセンター", subtitle: "Divinci AIのヘルプとサポートを取得" },
    zh: { title: "支持中心", subtitle: "获取Divinci AI的帮助和支持" },
    it: { title: "Centro di Supporto", subtitle: "Ottieni aiuto e supporto per Divinci AI" },
    ru: { title: "Центр поддержки", subtitle: "Получите помощь и поддержку для Divinci AI" },
    de: { title: "Support-Center", subtitle: "Erhalten Sie Hilfe und Support für Divinci AI" },
    pt: { title: "Centro de Suporte", subtitle: "Obtenha ajuda e suporte para Divinci AI" },
    ko: { title: "지원 센터", subtitle: "Divinci AI에 대한 도움말과 지원을 받으세요" },
    nl: { title: "Ondersteuningscentrum", subtitle: "Krijg hulp en ondersteuning voor Divinci AI" },
    hi: { title: "सहायता केंद्र", subtitle: "Divinci AI के लिए सहायता और समर्थन प्राप्त करें" }
  },
  expert_answers: {
    es: { title: "Respuestas de Expertos", subtitle: "Orientación de especialistas" },
    fr: { title: "Réponses d'Experts", subtitle: "Conseils de spécialistes" },
    ar: { title: "إجابات الخبراء", subtitle: "إرشادات المتخصصين" },
    ja: { title: "専門家の回答", subtitle: "スペシャリストからの指導" },
    zh: { title: "专家答案", subtitle: "专家指导" },
    it: { title: "Risposte degli Esperti", subtitle: "Guida degli specialisti" },
    ru: { title: "Ответы экспертов", subtitle: "Руководство специалистов" },
    de: { title: "Expertenantworten", subtitle: "Spezialistenführung" },
    pt: { title: "Respostas de Especialistas", subtitle: "Orientação de especialistas" },
    ko: { title: "전문가 답변", subtitle: "전문가 지침" },
    nl: { title: "Expert Antwoorden", subtitle: "Specialistenbegeleiding" },
    hi: { title: "विशेषज्ञ उत्तर", subtitle: "विशेषज्ञ मार्गदर्शन" }
  }
};

// Update each language
languages.forEach(lang => {
  try {
    const filePath = `data/translations/${lang}.json`;
    const translation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let updated = false;
    
    // Add missing nested keys
    Object.keys(missingTranslations).forEach(keyPath => {
      if (missingTranslations[keyPath][lang]) {
        setNestedProperty(translation, keyPath, missingTranslations[keyPath][lang]);
        updated = true;
      }
    });
    
    // Add basic sections if missing
    Object.keys(basicSections).forEach(sectionName => {
      if (!translation[sectionName] && basicSections[sectionName][lang]) {
        translation[sectionName] = basicSections[sectionName][lang];
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(translation, null, 2), 'utf8');
      console.log(`✅ Updated ${lang}.json`);
    } else {
      console.log(`ℹ️  No updates needed for ${lang}.json`);
    }
    
  } catch (error) {
    console.log(`❌ Error updating ${lang}.json: ${error.message}`);
  }
});

console.log('\n🎉 Translation update complete!');