/**
 * Translation Update Script
 * Generates missing translations for all language files
 */

const fs = require('fs');

console.log('🌐 Starting translation update process...\n');

const supportedLanguages = ['es', 'fr', 'ar', 'ja', 'zh', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];

// Load English as reference
const enTranslation = JSON.parse(fs.readFileSync('data/translations/en.json', 'utf8'));

// Define translations for missing content
const translations = {
  // Support Center Navigation
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

  // Features Journal Title
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
    nl: 'Leonardo\'s Dagboek',
    hi: 'लियोनार्डो की डायरी'
  },

  // Team Roles
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
  },

  'team.members.sierra_bio': {
    es: 'Sierra lidera nuestros esfuerzos de ética de IA, asegurando que todos los sistemas estén alineados con valores humanos y marcos regulatorios.',
    fr: 'Sierra dirige nos efforts d\'éthique IA, s\'assurant que tous les systèmes soient alignés avec les valeurs humaines et les cadres réglementaires.',
    ar: 'تقود سييرا جهود أخلاقيات الذكاء الاصطناعي، مما يضمن توافق جميع الأنظمة مع القيم الإنسانية والأطر التنظيمية.',
    ja: 'シエラはAI倫理の取り組みを主導し、すべてのシステムが人間の価値観と規制枠組みに沿うことを確保しています。',
    zh: 'Sierra领导我们的AI伦理工作，确保所有系统与人类价值观和监管框架保持一致。',
    it: 'Sierra guida i nostri sforzi di etica IA, assicurando che tutti i sistemi siano allineati con i valori umani e i quadri normativi.',
    ru: 'Сьерра руководит нашими усилиями по этике ИИ, гарантируя соответствие всех систем человеческим ценностям и регулятивным рамкам.',
    de: 'Sierra leitet unsere KI-Ethik-Bemühungen und stellt sicher, dass alle Systeme mit menschlichen Werten und regulatorischen Rahmen im Einklang stehen.',
    pt: 'Sierra lidera nossos esforços de ética de IA, garantindo que todos os sistemas estejam alinhados com valores humanos e estruturas regulatórias.',
    ko: 'Sierra는 AI 윤리 노력을 이끌며, 모든 시스템이 인간의 가치와 규제 프레임워크에 부합하도록 보장합니다.',
    nl: 'Sierra leidt onze AI-ethiek inspanningen, ervoor zorgend dat alle systemen zijn afgestemd op menselijke waarden en regulatoire kaders.',
    hi: 'सिएरा हमारे AI नैतिकता प्रयासों का नेतृत्व करती है, यह सुनिश्चित करती है कि सभी सिस्टम मानवीय मूल्यों और नियामक ढांचों के साथ संरेखित हैं।'
  }
};

// Simple contact and support sections (abbreviated for key sections)
const contactTranslations = {
  es: {
    title: "Contacto",
    subtitle: "Póngase en contacto con nuestro equipo",
    description: "¿Listo para transformar su flujo de trabajo de IA? Hablemos sobre cómo Divinci AI puede ayudar a su organización a lograr excelencia en implementaciones de IA."
  },
  fr: {
    title: "Contact",
    subtitle: "Contactez notre équipe",
    description: "Prêt à transformer votre flux de travail IA ? Discutons de la façon dont Divinci AI peut aider votre organisation à atteindre l'excellence dans les déploiements IA."
  },
  ar: {
    title: "اتصال",
    subtitle: "تواصل مع فريقنا",
    description: "هل أنت مستعد لتحويل سير عمل الذكاء الاصطناعي الخاص بك؟ دعونا نتحدث عن كيف يمكن لـ Divinci AI مساعدة مؤسستك في تحقيق التميز في نشر الذكاء الاصطناعي."
  },
  ja: {
    title: "お問い合わせ",
    subtitle: "私たちのチームにご連絡ください",
    description: "AIワークフローを変革する準備はできていますか？Divinci AIが組織のAI展開で卓越性を実現する方法についてお話ししましょう。"
  },
  zh: {
    title: "联系我们",
    subtitle: "联系我们的团队",
    description: "准备好转变您的AI工作流程了吗？让我们谈谈Divinci AI如何帮助您的组织在AI部署中实现卓越。"
  },
  it: {
    title: "Contatto",
    subtitle: "Contatta il nostro team",
    description: "Pronto a trasformare il tuo flusso di lavoro IA? Parliamo di come Divinci AI può aiutare la tua organizzazione a raggiungere l'eccellenza nelle implementazioni IA."
  },
  ru: {
    title: "Контакты",
    subtitle: "Свяжитесь с нашей командой",
    description: "Готовы трансформировать свой рабочий процесс ИИ? Давайте обсудим, как Divinci AI может помочь вашей организации достичь превосходства в развертывании ИИ."
  },
  de: {
    title: "Kontakt",
    subtitle: "Kontaktieren Sie unser Team",
    description: "Bereit, Ihren KI-Workflow zu transformieren? Lassen Sie uns darüber sprechen, wie Divinci AI Ihrer Organisation dabei helfen kann, Exzellenz in KI-Bereitstellungen zu erreichen."
  },
  pt: {
    title: "Contato",
    subtitle: "Entre em contato com nossa equipe",
    description: "Pronto para transformar seu fluxo de trabalho de IA? Vamos conversar sobre como a Divinci AI pode ajudar sua organização a alcançar a excelência em implementações de IA."
  },
  ko: {
    title: "연락처",
    subtitle: "저희 팀에 문의하세요",
    description: "AI 워크플로우를 변환할 준비가 되셨나요? Divinci AI가 조직의 AI 배포에서 우수성을 달성하는 데 어떻게 도움을 줄 수 있는지 이야기해봅시다."
  },
  nl: {
    title: "Contact",
    subtitle: "Neem contact op met ons team",
    description: "Klaar om uw AI-workflow te transformeren? Laten we praten over hoe Divinci AI uw organisatie kan helpen excellentie te bereiken in AI-implementaties."
  },
  hi: {
    title: "संपर्क",
    subtitle: "हमारी टीम से संपर्क करें",
    description: "अपने AI वर्कफ़्लो को बदलने के लिए तैयार हैं? आइए बात करते हैं कि Divinci AI आपके संगठन को AI परिनियोजन में उत्कृष्टता प्राप्त करने में कैसे मदद कर सकता है।"
  }
};

const supportTranslations = {
  es: {
    title: "Centro de Soporte",
    subtitle: "Obtenga ayuda y soporte para Divinci AI",
    description: "Encuentre respuestas a preguntas frecuentes, guías de implementación y contacte a nuestro equipo de especialistas."
  },
  fr: {
    title: "Centre de Support",
    subtitle: "Obtenez de l'aide et du support pour Divinci AI",
    description: "Trouvez des réponses aux questions fréquentes, des guides d'implémentation et contactez notre équipe de spécialistes."
  },
  ar: {
    title: "مركز الدعم",
    subtitle: "احصل على المساعدة والدعم لـ Divinci AI",
    description: "اعثر على إجابات للأسئلة المتكررة ودلائل التنفيذ وتواصل مع فريق المختصين لدينا."
  },
  ja: {
    title: "サポートセンター",
    subtitle: "Divinci AIのヘルプとサポートを取得",
    description: "よくある質問への回答、実装ガイド、専門家チームへの連絡方法をご確認ください。"
  },
  zh: {
    title: "支持中心",
    subtitle: "获取Divinci AI的帮助和支持",
    description: "查找常见问题答案、实施指南，并联系我们的专家团队。"
  },
  it: {
    title: "Centro di Supporto",
    subtitle: "Ottieni aiuto e supporto per Divinci AI",
    description: "Trova risposte alle domande frequenti, guide all'implementazione e contatta il nostro team di specialisti."
  },
  ru: {
    title: "Центр поддержки",
    subtitle: "Получите помощь и поддержку для Divinci AI",
    description: "Найдите ответы на часто задаваемые вопросы, руководства по внедрению и свяжитесь с нашей командой специалистов."
  },
  de: {
    title: "Support-Center",
    subtitle: "Erhalten Sie Hilfe und Support für Divinci AI",
    description: "Finden Sie Antworten auf häufig gestellte Fragen, Implementierungsleitfäden und kontaktieren Sie unser Spezialistenteam."
  },
  pt: {
    title: "Centro de Suporte",
    subtitle: "Obtenha ajuda e suporte para Divinci AI",
    description: "Encontre respostas para perguntas frequentes, guias de implementação e entre em contato com nossa equipe de especialistas."
  },
  ko: {
    title: "지원 센터",
    subtitle: "Divinci AI에 대한 도움말과 지원을 받으세요",
    description: "자주 묻는 질문에 대한 답변, 구현 가이드를 찾고 전문가 팀에 문의하세요."
  },
  nl: {
    title: "Ondersteuningscentrum",
    subtitle: "Krijg hulp en ondersteuning voor Divinci AI",
    description: "Vind antwoorden op veelgestelde vragen, implementatiegidsen en neem contact op met ons specialistenteam."
  },
  hi: {
    title: "सहायता केंद्र",
    subtitle: "Divinci AI के लिए सहायता और समर्थन प्राप्त करें",
    description: "अक्सर पूछे जाने वाले प्रश्नों के उत्तर, कार्यान्वयन गाइड खोजें और हमारी विशेषज्ञ टीम से संपर्क करें।"
  }
};

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

// Update each language file
supportedLanguages.forEach(lang => {
  try {
    const filePath = `data/translations/${lang}.json`;
    let translation = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add individual missing keys
    Object.keys(translations).forEach(keyPath => {
      if (translations[keyPath][lang]) {
        setNestedProperty(translation, keyPath, translations[keyPath][lang]);
      }
    });
    
    // Add contact section if missing
    if (!translation.contact && contactTranslations[lang]) {
      translation.contact = contactTranslations[lang];
    }
    
    // Add support section if missing
    if (!translation.support && supportTranslations[lang]) {
      translation.support = supportTranslations[lang];
    }
    
    // Add expert_answers section (simplified)
    if (!translation.expert_answers) {
      translation.expert_answers = {
        title: contactTranslations[lang]?.title || "Expert Answers",
        subtitle: contactTranslations[lang]?.subtitle || "Get expert guidance"
      };
    }
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(translation, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}.json`);
    
  } catch (error) {
    console.log(`❌ Error updating ${lang}.json: ${error.message}`);
  }
});

console.log('\n🎉 Translation update complete!');
console.log('📝 Updated missing keys for all languages');
console.log('🔍 Run the audit script again to verify coverage');
"