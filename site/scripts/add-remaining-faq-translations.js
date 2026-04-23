const fs = require('fs');

// Complete FAQ translations for all remaining questions
const missingFaqTranslations = {
  // Language Models Compatibility FAQ
  'expert_answers.faqs.language_models.question': {
    zh: '支持哪些语言模型？',
    es: '¿Qué modelos de lenguaje son compatibles?',
    fr: 'Quels modèles de langage sont compatibles ?',
    ar: 'ما هي نماذج اللغة المتوافقة؟',
    ja: 'どの言語モデルが対応していますか？',
    it: 'Quali modelli linguistici sono compatibili?',
    ru: 'Какие языковые модели поддерживаются?',
    de: 'Welche Sprachmodelle sind kompatibel?',
    pt: 'Quais modelos de linguagem são compatíveis?',
    ko: '어떤 언어 모델이 호환되나요?',
    nl: 'Welke taalmodellen zijn compatibel?',
    hi: 'कौन से भाषा मॉडल संगत हैं?'
  },
  
  'expert_answers.faqs.language_models.answer': {
    zh: '我们的平台支持广泛的大型语言模型，从开源到专有架构。灵活的集成支持跨多种框架和企业环境的无缝部署，确保适应不断发展的业务需求。',
    es: 'Nuestra plataforma admite un amplio espectro de modelos de lenguaje grandes, desde arquitecturas de código abierto hasta propietarias. La integración flexible permite un despliegue perfecto en diversos marcos y entornos empresariales, asegurando adaptabilidad a las necesidades comerciales en evolución.',
    fr: 'Notre plateforme prend en charge un large spectre de grands modèles de langage, des architectures open source aux architectures propriétaires. L\'intégration flexible permet un déploiement transparent dans divers cadres et environnements d\'entreprise, garantissant l\'adaptabilité aux besoins commerciaux en évolution.',
    ar: 'تدعم منصتنا طيفاً واسعاً من نماذج اللغة الكبيرة، من الهياكل مفتوحة المصدر إلى الهياكل الملكية. يتيح التكامل المرن النشر السلس عبر الأطر والبيئات المؤسسية المتنوعة، مما يضمن القدرة على التكيف مع احتياجات العمل المتطورة.',
    ja: '当社のプラットフォームは、オープンソースから独自アーキテクチャまで、幅広い大規模言語モデルをサポートします。柔軟な統合により、多様なフレームワークと企業環境でのシームレスなデプロイメントが可能で、進化するビジネスニーズへの適応性を保証します。',
    it: 'La nostra piattaforma supporta un ampio spettro di modelli linguistici di grandi dimensioni, dalle architetture open source a quelle proprietarie. L\'integrazione flessibile consente un deployment senza soluzione di continuità attraverso diversi framework e ambienti aziendali, garantendo adattabilità alle esigenze aziendali in evoluzione.',
    ru: 'Наша платформа поддерживает широкий спектр больших языковых моделей, от архитектур с открытым исходным кодом до проприетарных. Гибкая интеграция обеспечивает бесшовное развертывание в различных фреймворках и корпоративных средах, гарантируя адаптируемость к развивающимся бизнес-потребностям.',
    de: 'Unsere Plattform unterstützt ein breites Spektrum großer Sprachmodelle, von Open-Source- bis hin zu proprietären Architekturen. Flexible Integration ermöglicht nahtlose Bereitstellung in verschiedenen Frameworks und Unternehmensumgebungen und gewährleistet Anpassungsfähigkeit an sich entwickelnde Geschäftsanforderungen.',
    pt: 'Nossa plataforma suporta um amplo espectro de modelos de linguagem grandes, de arquiteturas de código aberto a proprietárias. A integração flexível permite implantação perfeita em diversas estruturas e ambientes empresariais, garantindo adaptabilidade às necessidades comerciais em evolução.',
    ko: '저희 플랫폼은 오픈소스에서 독점 아키텍처까지 광범위한 대규모 언어 모델을 지원합니다. 유연한 통합으로 다양한 프레임워크와 기업 환경에서 원활한 배포를 가능하게 하여 진화하는 비즈니스 요구에 대한 적응성을 보장합니다.',
    nl: 'Ons platform ondersteunt een breed spectrum van grote taalmodellen, van open-source tot eigendomsarchitecturen. Flexibele integratie maakt naadloze implementatie mogelijk in diverse frameworks en bedrijfsomgevingen, wat aanpasbaarheid aan evoluerende zakelijke behoeften garandeert.',
    hi: 'हमारा प्लेटफॉर्म बड़े भाषा मॉडल की एक व्यापक स्पेक्ट्रम का समर्थन करता है, ओपन-सोर्स से लेकर स्वामित्व वाले आर्किटेक्चर तक। लचीला एकीकरण विविध फ्रेमवर्क और उद्यम वातावरण में निर्बाध तैनाती को सक्षम बनाता है, विकसित होती व्यावसायिक आवश्यकताओं के लिए अनुकूलन क्षमता सुनिश्चित करता है।'
  },

  // Quality Assurance FAQ
  'expert_answers.faqs.quality_assurance.question': {
    zh: '如何实现持续质量保证？',
    es: '¿Cómo se logra el aseguramiento de calidad continuo?',
    fr: 'Comment l\'assurance qualité continue est-elle obtenue ?',
    ar: 'كيف يتم تحقيق ضمان الجودة المستمر؟',
    ja: '継続的な品質保証はどのように実現されますか？',
    it: 'Come viene ottenuta la garanzia qualità continua?',
    ru: 'Как достигается непрерывное обеспечение качества?',
    de: 'Wie wird kontinuierliche Qualitätssicherung erreicht?',
    pt: 'Como é alcançada a garantia de qualidade contínua?',
    ko: '지속적인 품질 보증은 어떻게 달성되나요?',
    nl: 'Hoe wordt continue kwaliteitsborging bereikt?',
    hi: 'निरंतर गुणवत्ता आश्वासन कैसे प्राप्त किया जाता है?'
  },

  'expert_answers.faqs.quality_assurance.answer': {
    zh: '我们通过持续监控、定期审计和实时性能跟踪来维持质量。通过分析用户反馈和新兴风险，我们主动改进模型和流程，以长期维持严格的质量基准。',
    es: 'Mantenemos la calidad a través de monitoreo continuo, auditorías programadas y seguimiento de rendimiento en tiempo real. Al analizar los comentarios de los usuarios y los riesgos emergentes, refinamos proactivamente los modelos y procesos para mantener estándares de calidad rigurosos a lo largo del tiempo.',
    fr: 'Nous maintenons la qualité grâce à une surveillance continue, des audits programmés et un suivi des performances en temps réel. En analysant les retours des utilisateurs et les risques émergents, nous affinons proactivement les modèles et processus pour maintenir des références de qualité strictes dans le temps.',
    ar: 'نحن نحافظ على الجودة من خلال المراقبة المستمرة والمراجعات المجدولة وتتبع الأداء في الوقت الفعلي. من خلال تحليل ملاحظات المستخدمين والمخاطر الناشئة، نقوم بتحسين النماذج والعمليات بشكل استباقي للحفاظ على معايير الجودة الصارمة مع مرور الوقت.',
    ja: '継続的な監視、定期的な監査、リアルタイムでのパフォーマンス追跡により品質を維持しています。ユーザーフィードバックと新たなリスクを分析することで、長期にわたって厳格な品質基準を維持するため、モデルとプロセスを積極的に改善しています。',
    it: 'Manteniamo la qualità attraverso monitoraggio continuo, audit programmati e tracciamento delle prestazioni in tempo reale. Analizzando il feedback degli utenti e i rischi emergenti, raffiniamo proattivamente modelli e processi per mantenere standard qualitativi rigorosi nel tempo.',
    ru: 'Мы поддерживаем качество через непрерывный мониторинг, запланированные аудиты и отслеживание производительности в реальном времени. Анализируя отзывы пользователей и возникающие риски, мы проактивно улучшаем модели и процессы для поддержания строгих стандартов качества с течением времени.',
    de: 'Wir erhalten die Qualität durch kontinuierliche Überwachung, geplante Audits und Echtzeit-Leistungsverfolgung. Durch die Analyse von Nutzerfeedback und aufkommenden Risiken verfeinern wir proaktiv Modelle und Prozesse, um strenge Qualitätsmaßstäbe über die Zeit aufrechtzuerhalten.',
    pt: 'Mantemos a qualidade através de monitoramento contínuo, auditorias programadas e rastreamento de desempenho em tempo real. Ao analisar feedback do usuário e riscos emergentes, refinamos proativamente modelos e processos para manter padrões de qualidade rigorosos ao longo do tempo.',
    ko: '지속적인 모니터링, 정기 감사 및 실시간 성능 추적을 통해 품질을 유지합니다. 사용자 피드백과 새로운 위험을 분석함으로써 시간이 지나도 엄격한 품질 기준을 유지하기 위해 모델과 프로세스를 능동적으로 개선합니다.',
    nl: 'We behouden kwaliteit door continue monitoring, geplande audits en realtime prestatietracking. Door gebruikersfeedback en opkomende risico\'s te analyseren, verfijnen we proactief modellen en processen om strenge kwaliteitsnormen in de tijd te handhaven.',
    hi: 'हम निरंतर निगरानी, निर्धारित ऑडिट और वास्तविक समय प्रदर्शन ट्रैकिंग के माध्यम से गुणवत्ता बनाए रखते हैं। उपयोगकर्ता फीडबैक और उभरते जोखिमों का विश्लेषण करके, हम समय के साथ कठोर गुणवत्ता मानकों को बनाए रखने के लिए मॉडल और प्रक्रियाओं को सक्रिय रूप से परिष्कृत करते हैं।'
  },

  // Workflow Integration FAQ  
  'expert_answers.faqs.workflow_integration.question': {
    zh: '该平台是否适合现有工作流程？',
    es: '¿Se adapta la plataforma a los flujos de trabajo existentes?',
    fr: 'La plateforme s\'adapte-t-elle aux flux de travail existants ?',
    ar: 'هل تتناسب المنصة مع سير العمل الحالي؟',
    ja: 'プラットフォームは既存のワークフローに適合しますか？',
    it: 'La piattaforma si adatta ai flussi di lavoro esistenti?',
    ru: 'Подходит ли платформа для существующих рабочих процессов?',
    de: 'Passt die Plattform zu bestehenden Arbeitsabläufen?',
    pt: 'A plataforma se adapta aos fluxos de trabalho existentes?',
    ko: '플랫폼이 기존 워크플로우에 맞나요？',
    nl: 'Past het platform bij bestaande workflows?',
    hi: 'क्या प्लेटफॉर्म मौजूदा वर्कफ़्लो के अनुकूल है?'
  },

  'expert_answers.faqs.workflow_integration.answer': {
    zh: '我们的解决方案专为与企业系统无缝集成而设计。强大的API和可配置选项允许与您当前的发布管理和开发管道轻松对齐，最大限度地减少中断并最大化效率。',
    es: 'Nuestra solución está diseñada para una integración perfecta con los sistemas empresariales. Las API robustas y las opciones configurables permiten una alineación sin esfuerzo con sus pipelines actuales de gestión de lanzamientos y desarrollo, minimizando la interrupción y maximizando la eficiencia.',
    fr: 'Notre solution est conçue pour une intégration transparente avec les systèmes d\'entreprise. Des API robustes et des options configurables permettent un alignement sans effort avec vos pipelines actuels de gestion des versions et de développement, minimisant les perturbations et maximisant l\'efficacité.',
    ar: 'تم تصميم حلولنا للتكامل السلس مع أنظمة المؤسسات. تتيح واجهات برمجة التطبيقات القوية والخيارات القابلة للتكوين التوافق السهل مع خطوط أنابيب إدارة الإصدارات والتطوير الحالية، مما يقلل الاضطراب ويعظم الكفاءة.',
    ja: '当社のソリューションは、企業システムとのシームレスな統合のために設計されています。堅牢なAPIと構成可能なオプションにより、現在のリリース管理および開発パイプラインとの簡単な連携が可能で、中断を最小化し効率性を最大化します。',
    it: 'La nostra soluzione è progettata per un\'integrazione perfetta con i sistemi aziendali. API robuste e opzioni configurabili consentono un allineamento senza sforzo con le tue attuali pipeline di gestione delle versioni e sviluppo, minimizzando le interruzioni e massimizzando l\'efficienza.',
    ru: 'Наше решение спроектировано для бесшовной интеграции с корпоративными системами. Надежные API и настраиваемые опции позволяют легко выровняться с вашими текущими конвейерами управления релизами и разработки, минимизируя нарушения и максимизируя эффективность.',
    de: 'Unsere Lösung ist für nahtlose Integration mit Unternehmenssystemen entwickelt. Robuste APIs und konfigurierbare Optionen ermöglichen mühelose Ausrichtung mit Ihren aktuellen Release-Management- und Entwicklungs-Pipelines, minimieren Störungen und maximieren Effizienz.',
    pt: 'Nossa solução é projetada para integração perfeita com sistemas empresariais. APIs robustas e opções configuráveis permitem alinhamento sem esforço com seus pipelines atuais de gerenciamento de lançamentos e desenvolvimento, minimizando interrupções e maximizando eficiência.',
    ko: '저희 솔루션은 기업 시스템과의 원활한 통합을 위해 설계되었습니다. 강력한 API와 구성 가능한 옵션으로 현재의 릴리스 관리 및 개발 파이프라인과 쉽게 연동하여 중단을 최소화하고 효율성을 최대화합니다.',
    nl: 'Onze oplossing is ontworpen voor naadloze integratie met bedrijfssystemen. Robuuste API\'s en configureerbare opties maken moeiteloze afstemming mogelijk met uw huidige release management en ontwikkelingspijplijnen, waardoor verstoring wordt geminimaliseerd en efficiëntie wordt gemaximaliseerd.',
    hi: 'हमारा समाधान उद्यम सिस्टम के साथ निर्बाध एकीकरण के लिए डिज़ाइन किया गया है। मजबूत API और कॉन्फ़िगरेशन योग्य विकल्प आपकी वर्तमान रिलीज़ प्रबंधन और विकास पाइपलाइनों के साथ सहज संरेखण की अनुमति देते हैं, व्यवधान को कम करते हुए दक्षता को अधिकतम करते हैं।'
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

console.log('🔧 Adding remaining FAQ translations for all languages...\n');

let totalUpdatesCount = 0;

languages.forEach(lang => {
  try {
    const filePath = `data/translations/${lang}.json`;
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let updatesCount = 0;
    
    // Add missing FAQ translations for this language
    for (const [key, values] of Object.entries(missingFaqTranslations)) {
      if (values[lang]) {
        setNestedProperty(translations, key, values[lang]);
        updatesCount++;
        totalUpdatesCount++;
      }
    }
    
    // Write back the updated translations
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    
    console.log(`✅ ${lang.toUpperCase()}: Added ${updatesCount} FAQ translations`);
    
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()}: Error updating translations - ${error.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Total FAQ translations added: ${totalUpdatesCount}`);
console.log(`FAQ sections now complete:`);
console.log(`  - Model Reliability (previously added)`);
console.log(`  - Language Models Compatibility (✅ added)`);
console.log(`  - Quality Assurance (✅ added)`);  
console.log(`  - Workflow Integration (✅ added)`);
console.log(`\n🎉 All FAQ sections are now fully translated across all languages!`);