const fs = require('fs');
const path = require('path');

// Missing FAQ and Contact translations for all languages
const missingTranslations = {
  'expert_answers.description': {
    zh: '在我们平台上找到关于大型语言模型发布管理和质量保证的全面见解。探索针对您最紧迫问题的详细专业回答。',
    es: 'Encuentre información completa sobre la gestión de lanzamientos y aseguramiento de calidad de nuestra plataforma para modelos de lenguaje grandes. Explore respuestas detalladas y profesionales a sus preguntas más urgentes.',
    fr: 'Trouvez des informations complètes sur la gestion des versions et l\'assurance qualité de notre plateforme pour les grands modèles de langage. Explorez des réponses détaillées et professionnelles à vos questions les plus pressantes.',
    ar: 'اعثر على رؤى شاملة حول إدارة الإصدارات وضمان الجودة لمنصتنا للنماذج اللغوية الكبيرة. استكشف الاستجابات التفصيلية والمهنية لأسئلتكم الأكثر إلحاحاً.',
    ja: '大規模言語モデルのリリース管理と品質保証に関するプラットフォームの包括的な洞察を見つけてください。最も差し迫った質問に対する詳細で専門的な回答を探索してください。',
    it: 'Trova approfondimenti completi sulla gestione delle versioni e garanzia qualità della nostra piattaforma per modelli linguistici di grandi dimensioni. Esplora risposte dettagliate e professionali alle tue domande più urgenti.',
    ru: 'Найдите всесторонние сведения об управлении релизами и обеспечении качества нашей платформы для больших языковых моделей. Изучите подробные профессиональные ответы на ваши самые насущные вопросы.',
    de: 'Finden Sie umfassende Einblicke in das Release-Management und die Qualitätssicherung unserer Plattform für große Sprachmodelle. Erkunden Sie detaillierte, professionelle Antworten auf Ihre dringendsten Fragen.',
    pt: 'Encontre insights abrangentes sobre o gerenciamento de lançamentos e garantia de qualidade da nossa plataforma para modelos de linguagem grandes. Explore respostas detalhadas e profissionais para suas perguntas mais urgentes.',
    ko: '대규모 언어 모델을 위한 플랫폼의 릴리스 관리 및 품질 보증에 대한 포괄적인 통찰력을 찾아보세요. 가장 시급한 질문에 대한 상세하고 전문적인 답변을 살펴보세요.',
    nl: 'Vind uitgebreide inzichten over release management en kwaliteitsborging van ons platform voor grote taalmodellen. Ontdek gedetailleerde, professionele reacties op uw meest urgente vragen.',
    hi: 'बड़े भाषा मॉडल के लिए हमारे प्लेटफॉर्म की रिलीज़ प्रबंधन और गुणवत्ता आश्वासन पर व्यापक अंतर्दृष्टि प्राप्त करें। अपने सबसे दबावपूर्ण प्रश्नों के विस्तृत, पेशेवर उत्तर देखें।'
  },
  
  'expert_answers.faqs.model_reliability.question': {
    zh: '您如何保证模型可靠性？',
    es: '¿Cómo garantizan la confiabilidad del modelo?',
    fr: 'Comment garantissez-vous la fiabilité du modèle ?',
    ar: 'كيف تضمنون موثوقية النموذج؟',
    ja: 'モデルの信頼性をどのように保証しますか？',
    it: 'Come garantite l\'affidabilità del modello?',
    ru: 'Как вы гарантируете надежность модели?',
    de: 'Wie garantieren Sie die Modellzuverlässigkeit?',
    pt: 'Como vocês garantem a confiabilidade do modelo?',
    ko: '모델 신뢰성을 어떻게 보장하나요?',
    nl: 'Hoe garandeert u de betrouwbaarheid van het model?',
    hi: 'आप मॉडल की विश्वसनीयता की गारंटी कैसे देते हैं?'
  },
  
  'expert_answers.faqs.model_reliability.answer': {
    zh: '我们实施多层验证流程，将自动化回归、性能和安全测试与专家手动审查相结合。每个模型发布都经过严格评估，确保始终满足准确性、稳定性和合规性的企业级标准。',
    es: 'Implementamos un proceso de validación de múltiples capas, combinando pruebas automatizadas de regresión, rendimiento y seguridad con revisiones manuales de expertos. Cada lanzamiento de modelo se evalúa rigurosamente para asegurar que cumpla consistentemente con los estándares de nivel empresarial de precisión, estabilidad y cumplimiento.',
    fr: 'Nous implémentons un processus de validation multicouche, combinant des tests automatisés de régression, de performance et de sécurité avec des revues manuelles d\'experts. Chaque version de modèle est rigoureusement évaluée pour s\'assurer qu\'elle répond systématiquement aux normes de niveau entreprise pour la précision, la stabilité et la conformité.',
    ar: 'نحن ننفذ عملية تحقق متعددة الطبقات، تجمع بين اختبارات الانحدار الآلية والأداء والأمان مع مراجعات يدوية من الخبراء. يتم تقييم كل إصدار نموذج بصرامة لضمان وفائه المستمر بمعايير المستوى المؤسسي للدقة والاستقرار والامتثال.',
    ja: '私たちは、自動化された回帰テスト、パフォーマンステスト、セキュリティテストと専門家による手動レビューを組み合わせた多層検証プロセスを実装しています。各モデルリリースは、精度、安定性、コンプライアンスに関する企業グレードの基準を一貫して満たすよう厳格に評価されます。',
    it: 'Implementiamo un processo di validazione multi-livello, combinando test automatizzati di regressione, prestazioni e sicurezza con revisioni manuali di esperti. Ogni rilascio di modello viene rigorosamente valutato per garantire che soddisfi costantemente gli standard di livello aziendale per accuratezza, stabilità e conformità.',
    ru: 'Мы реализуем многоуровневый процесс валидации, сочетающий автоматизированные регрессионные тесты, тесты производительности и безопасности с экспертными ручными проверками. Каждый релиз модели тщательно оценивается для обеспечения постоянного соответствия корпоративным стандартам точности, стабильности и соответствия.',
    de: 'Wir implementieren einen vielschichtigen Validierungsprozess, der automatisierte Regressions-, Leistungs- und Sicherheitstests mit manuellen Expertenüberprüfungen kombiniert. Jede Modellversion wird rigoros bewertet, um sicherzustellen, dass sie konsistent die Unternehmensstandards für Genauigkeit, Stabilität und Compliance erfüllt.',
    pt: 'Implementamos um processo de validação multicamadas, combinando testes automatizados de regressão, performance e segurança com revisões manuais de especialistas. Cada lançamento de modelo é rigorosamente avaliado para garantir que atenda consistentemente aos padrões de nível empresarial para precisão, estabilidade e conformidade.',
    ko: '자동화된 회귀, 성능 및 보안 테스트를 전문가 수동 검토와 결합한 다층 검증 프로세스를 구현합니다. 각 모델 릴리스는 정확성, 안정성 및 규정 준수에 대한 기업급 표준을 일관되게 충족하도록 엄격하게 평가됩니다.',
    nl: 'We implementeren een meerlagig validatieproces, dat geautomatiseerde regressie-, prestatie- en beveiligingstests combineert met handmatige expertrecensies. Elke modelrelease wordt rigoureus beoordeeld om ervoor te zorgen dat deze consistent voldoet aan bedrijfsnormen voor nauwkeurigheid, stabiliteit en compliance.',
    hi: 'हम एक बहु-स्तरीय सत्यापन प्रक्रिया लागू करते हैं, जो विशेषज्ञ मैन्युअल समीक्षा के साथ स्वचालित प्रतिगमन, प्रदर्शन और सुरक्षा परीक्षण को जोड़ती है। प्रत्येक मॉडल रिलीज़ का कठोर मूल्यांकन किया जाता है ताकि यह सुनिश्चित हो सके कि यह सटीकता, स्थिरता और अनुपालन के लिए उद्यम-ग्रेड मानकों को लगातार पूरा करे।'
  },

  'contact.get_in_touch': {
    zh: '联系我们',
    es: 'PONERSE EN CONTACTO',
    fr: 'ENTRER EN CONTACT',
    ar: 'تواصل معنا',
    ja: 'お問い合わせ',
    it: 'METTITI IN CONTATTO',
    ru: 'СВЯЗАТЬСЯ С НАМИ',
    de: 'KONTAKT AUFNEHMEN',
    pt: 'ENTRE EM CONTATO',
    ko: '문의하기',
    nl: 'NEEM CONTACT OP',
    hi: 'संपर्क करें'
  },

  'contact.email_specialists.title': {
    zh: '联系我们的专家',
    es: 'Envíe un correo a nuestros especialistas',
    fr: 'Envoyez un e-mail à nos spécialistes',
    ar: 'راسل متخصصينا بالبريد الإلكتروني',
    ja: '専門家にメールする',
    it: 'Invia un\'email ai nostri specialisti',
    ru: 'Напишите нашим специалистам',
    de: 'Schreiben Sie unseren Spezialisten',
    pt: 'Envie um e-mail para nossos especialistas',
    ko: '전문가에게 이메일 보내기',
    nl: 'E-mail onze specialisten',
    hi: 'हमारे विशेषज्ञों को ईमेल करें'
  },

  'contact.email_specialists.description': {
    zh: '获得针对您的技术和业务询问的详细、周到的回复。',
    es: 'Reciba respuestas detalladas y reflexivas a sus consultas técnicas y comerciales.',
    fr: 'Recevez des réponses détaillées et réfléchies à vos questions techniques et commerciales.',
    ar: 'احصل على إجابات تفصيلية ومدروسة لاستفساراتك التقنية والتجارية.',
    ja: '技術的およびビジネス上のお問い合わせに対する詳細で思慮深い回答を受け取ります。',
    it: 'Ricevi risposte dettagliate e ponderate alle tue domande tecniche e commerciali.',
    ru: 'Получайте подробные, продуманные ответы на ваши технические и деловые запросы.',
    de: 'Erhalten Sie detaillierte, durchdachte Antworten auf Ihre technischen und geschäftlichen Anfragen.',
    pt: 'Receba respostas detalhadas e ponderadas para suas consultas técnicas e comerciais.',
    ko: '기술 및 비즈니스 문의에 대한 상세하고 사려깊은 답변을 받으세요.',
    nl: 'Ontvang gedetailleerde, doordachte reacties op uw technische en zakelijke vragen.',
    hi: 'अपनी तकनीकी और व्यावसायिक पूछताछ के लिए विस्तृत, विचारशील उत्तर प्राप्त करें।'
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

console.log('🔧 Adding missing FAQ and Contact translations...\n');

languages.forEach(lang => {
  try {
    const filePath = `data/translations/${lang}.json`;
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let updatesCount = 0;
    
    // Add missing translations for this language
    for (const [key, values] of Object.entries(missingTranslations)) {
      if (values[lang]) {
        setNestedProperty(translations, key, values[lang]);
        updatesCount++;
      }
    }
    
    // Write back the updated translations
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    
    console.log(`✅ ${lang.toUpperCase()}: Added ${updatesCount} missing translations`);
    
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()}: Error updating translations - ${error.message}`);
  }
});

console.log('\n🎉 FAQ and Contact translation updates complete!');