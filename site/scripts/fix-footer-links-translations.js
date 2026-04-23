const fs = require('fs');
const path = require('path');

// Define missing footer link translations
const footerLinkTranslations = {
  'footer.sections.product.links.autorag': {
    en: 'AutoRAG',
    es: 'AutoRAG',
    fr: 'AutoRAG', 
    ar: 'AutoRAG',
    zh: 'AutoRAG',
    de: 'AutoRAG',
    it: 'AutoRAG',
    pt: 'AutoRAG',
    ru: 'AutoRAG',
    ja: 'AutoRAG',
    ko: 'AutoRAG',
    hi: 'AutoRAG',
    nl: 'AutoRAG'
  },
  'footer.sections.product.links.quality_assurance': {
    en: 'Quality Assurance',
    es: 'Garantía de Calidad',
    fr: 'Assurance Qualité',
    ar: 'ضمان الجودة',
    zh: '质量保证',
    de: 'Qualitätssicherung',
    it: 'Garanzia di Qualità',
    pt: 'Garantia de Qualidade',
    ru: 'Обеспечение Качества',
    ja: '品質保証',
    ko: '품질 보장',
    hi: 'गुणवत्ता आश्वासन',
    nl: 'Kwaliteitsborging'
  },
  'footer.sections.product.links.release_management': {
    en: 'Release Management',
    es: 'Gestión de Lanzamientos',
    fr: 'Gestion des Versions',
    ar: 'إدارة الإصدارات',
    zh: '发布管理',
    de: 'Release-Management',
    it: 'Gestione delle Release',
    pt: 'Gestão de Lançamentos',
    ru: 'Управление Релизами',
    ja: 'リリース管理',
    ko: '릴리스 관리',
    hi: 'रिलीज़ प्रबंधन',
    nl: 'Release Management'
  },
  'footer.sections.resources.links.support': {
    en: 'Support',
    es: 'Soporte',
    fr: 'Support',
    ar: 'الدعم',
    zh: '支持',
    de: 'Support',
    it: 'Supporto',
    pt: 'Suporte',
    ru: 'Поддержка',
    ja: 'サポート',
    ko: '지원',
    hi: 'समर्थन',
    nl: 'Ondersteuning'
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
    
    // Add missing footer link translations
    Object.entries(footerLinkTranslations).forEach(([key, translations]) => {
      if (translations[lang]) {
        setNestedProperty(data, key, translations[lang]);
      }
    });
    
    // Write updated data back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ Updated ${lang}.json with footer link translations`);
    
  } catch (error) {
    console.error(`❌ Error processing ${lang}.json:`, error.message);
  }
});

console.log('\n🎉 Footer link translation updates completed!');