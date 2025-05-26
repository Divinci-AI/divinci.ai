// Hybrid approach - fixed position bubbles that sync with emoji movement
document.addEventListener('DOMContentLoaded', function() {
  console.log('Hybrid bubbles script loaded');

  // Enhanced marketing-style feature messages for the chat bubbles
  // Detect current language from HTML lang attribute or URL path
  function getCurrentLanguage() {
    // First try to get from HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang !== 'en') {
      return htmlLang;
    }

    // Fallback: detect from URL path
    const path = window.location.pathname;
    if (path.includes('/es/')) return 'es';
    if (path.includes('/fr/')) return 'fr';
    if (path.includes('/ar/')) return 'ar';

    return 'en'; // default
  }

  // Translated feature messages by language
  const translatedMessages = {
    en: {
      company: [
        "🚀 Staged model releases for safe deployments",
        "🧪 A/B test model behavior with confidence",
        "⚖️ Advanced bias detection & mitigation",
        "📊 Enterprise-grade monitoring & logging",
        "🔄 Custom RLHF pipelines for your needs",
        "🛡️ Powerful guardrails & content filters",
        "📝 Seamless model versioning & rollbacks",
        "✅ Automated evaluations for quality",
        "👥 Human feedback loop integration",
        "🔍 Expert red teaming for your models",
        "🔒 Advanced jailbreak prevention",
        "⚔️ Custom safety filters for your brand",
        "🤖 Auto-RAG for smarter responses",
        "⚡ Enterprise RAG APIs with scale",
        "🧠 Fine-Tuning APIs for domain expertise",
        "🌐 Access 100+ LLMs to build atop!",
        "📋 Transparent AI safety reporting",
        "💰 Cost-efficient inference options",
        "🖼️ Multi-modal model support",
        "📝 Customizable prompt templates"
      ],
      consumer: [
        "🚀 Create your own personal AI assistant",
        "🧪 Try different AI personalities for fun",
        "⚖️ Balanced responses without bias",
        "📊 Track your conversations over time",
        "🔄 Teach your AI your personal preferences",
        "🛡️ Family-friendly content filtering",
        "📝 Save and revisit past conversations",
        "✅ Get accurate answers to your questions",
        "👥 Invite friends to chat with your AI",
        "🔍 Get help researching any topic",
        "🔒 Private conversations stay private",
        "⚔️ Control what your AI can discuss",
        "🤖 Upload docs your AI can learn from",
        "⚡ Fast responses when you need them",
        "🧠 AI that remembers your conversation",
        "🌐 Chat with all the best AIs in one place",
        "📋 Clear explanations in simple language",
        "💰 Affordable plans for everyone",
        "🖼️ Create images and diagrams easily",
        "📝 Write better with AI assistance"
      ]
    },
    es: {
      company: [
        "🚀 Lanzamientos de modelos escalonados para despliegues seguros",
        "🧪 Prueba A/B del comportamiento del modelo con confianza",
        "⚖️ Detección y mitigación avanzada de sesgos",
        "📊 Monitoreo y registro de nivel empresarial",
        "🔄 Pipelines RLHF personalizados para tus necesidades",
        "🛡️ Barreras de protección y filtros de contenido potentes",
        "📝 Versionado y reversiones de modelos sin problemas",
        "✅ Evaluaciones automatizadas para calidad",
        "👥 Integración de bucle de retroalimentación humana",
        "🔍 Equipo rojo experto para tus modelos",
        "🔒 Prevención avanzada de jailbreak",
        "⚔️ Filtros de seguridad personalizados para tu marca",
        "🤖 Auto-RAG para respuestas más inteligentes",
        "⚡ APIs RAG empresariales con escala",
        "🧠 APIs de Fine-Tuning para experiencia de dominio",
        "🌐 ¡Acceso a más de 100 LLMs para construir!",
        "📋 Informes transparentes de seguridad de IA",
        "💰 Opciones de inferencia rentables",
        "🖼️ Soporte de modelos multimodales",
        "📝 Plantillas de prompts personalizables"
      ],
      consumer: [
        "🚀 Crea tu propio asistente de IA personal",
        "🧪 Prueba diferentes personalidades de IA por diversión",
        "⚖️ Respuestas equilibradas sin sesgos",
        "📊 Rastrea tus conversaciones a lo largo del tiempo",
        "🔄 Enseña a tu IA tus preferencias personales",
        "🛡️ Filtrado de contenido familiar",
        "📝 Guarda y revisa conversaciones pasadas",
        "✅ Obtén respuestas precisas a tus preguntas",
        "👥 Invita amigos a chatear con tu IA",
        "🔍 Obtén ayuda investigando cualquier tema",
        "🔒 Las conversaciones privadas se mantienen privadas",
        "⚔️ Controla de qué puede hablar tu IA",
        "🤖 Sube documentos de los que tu IA puede aprender",
        "⚡ Respuestas rápidas cuando las necesites",
        "🧠 IA que recuerda tu conversación",
        "🌐 Chatea con todas las mejores IAs en un lugar",
        "📋 Explicaciones claras en lenguaje simple",
        "💰 Planes asequibles para todos",
        "🖼️ Crea imágenes y diagramas fácilmente",
        "📝 Escribe mejor con asistencia de IA"
      ]
    },
    fr: {
      company: [
        "🚀 Déploiements de modèles échelonnés pour des déploiements sûrs",
        "🧪 Test A/B du comportement du modèle en toute confiance",
        "⚖️ Détection et atténuation avancées des biais",
        "📊 Surveillance et journalisation de niveau entreprise",
        "🔄 Pipelines RLHF personnalisés pour vos besoins",
        "🛡️ Garde-fous puissants et filtres de contenu",
        "📝 Versioning et rollbacks de modèles transparents",
        "✅ Évaluations automatisées pour la qualité",
        "👥 Intégration de boucle de rétroaction humaine",
        "🔍 Équipe rouge experte pour vos modèles",
        "🔒 Prévention avancée de jailbreak",
        "⚔️ Filtres de sécurité personnalisés pour votre marque",
        "🤖 Auto-RAG pour des réponses plus intelligentes",
        "⚡ APIs RAG d'entreprise avec échelle",
        "🧠 APIs de Fine-Tuning pour l'expertise de domaine",
        "🌐 Accès à plus de 100 LLMs pour construire !",
        "📋 Rapports transparents de sécurité IA",
        "💰 Options d'inférence rentables",
        "🖼️ Support de modèles multimodaux",
        "📝 Modèles de prompts personnalisables"
      ],
      consumer: [
        "🚀 Créez votre propre assistant IA personnel",
        "🧪 Essayez différentes personnalités d'IA pour le plaisir",
        "⚖️ Réponses équilibrées sans biais",
        "📊 Suivez vos conversations au fil du temps",
        "🔄 Apprenez à votre IA vos préférences personnelles",
        "🛡️ Filtrage de contenu familial",
        "📝 Sauvegardez et revisitez les conversations passées",
        "✅ Obtenez des réponses précises à vos questions",
        "👥 Invitez des amis à discuter avec votre IA",
        "🔍 Obtenez de l'aide pour rechercher n'importe quel sujet",
        "🔒 Les conversations privées restent privées",
        "⚔️ Contrôlez de quoi votre IA peut discuter",
        "🤖 Téléchargez des docs dont votre IA peut apprendre",
        "⚡ Réponses rapides quand vous en avez besoin",
        "🧠 IA qui se souvient de votre conversation",
        "🌐 Discutez avec toutes les meilleures IA en un seul endroit",
        "📋 Explications claires en langage simple",
        "💰 Plans abordables pour tous",
        "🖼️ Créez des images et diagrammes facilement",
        "📝 Écrivez mieux avec l'assistance IA"
      ]
    },
    ar: {
      company: [
        "🚀 إصدارات نماذج متدرجة للنشر الآمن",
        "🧪 اختبار A/B لسلوك النموذج بثقة",
        "⚖️ كشف وتخفيف التحيز المتقدم",
        "📊 مراقبة وتسجيل على مستوى المؤسسة",
        "🔄 خطوط أنابيب RLHF مخصصة لاحتياجاتك",
        "🛡️ حواجز حماية قوية ومرشحات المحتوى",
        "📝 إصدارات النماذج والتراجع السلس",
        "✅ تقييمات آلية للجودة",
        "👥 تكامل حلقة التغذية الراجعة البشرية",
        "🔍 فريق أحمر خبير لنماذجك",
        "🔒 منع متقدم لكسر الحماية",
        "⚔️ مرشحات أمان مخصصة لعلامتك التجارية",
        "🤖 Auto-RAG للاستجابات الأذكى",
        "⚡ واجهات برمجة تطبيقات RAG للمؤسسات مع التوسع",
        "🧠 واجهات برمجة تطبيقات Fine-Tuning للخبرة المجالية",
        "🌐 الوصول إلى أكثر من 100 نموذج لغوي للبناء عليها!",
        "📋 تقارير شفافة لأمان الذكاء الاصطناعي",
        "💰 خيارات استنتاج فعالة من حيث التكلفة",
        "🖼️ دعم النماذج متعددة الوسائط",
        "📝 قوالب مطالبات قابلة للتخصيص"
      ],
      consumer: [
        "🚀 أنشئ مساعد الذكاء الاصطناعي الشخصي الخاص بك",
        "🧪 جرب شخصيات ذكاء اصطناعي مختلفة للمتعة",
        "⚖️ استجابات متوازنة بدون تحيز",
        "📊 تتبع محادثاتك عبر الزمن",
        "🔄 علم الذكاء الاصطناعي تفضيلاتك الشخصية",
        "🛡️ تصفية المحتوى الصديق للعائلة",
        "📝 احفظ وراجع المحادثات السابقة",
        "✅ احصل على إجابات دقيقة لأسئلتك",
        "👥 ادع الأصدقاء للدردشة مع الذكاء الاصطناعي",
        "🔍 احصل على مساعدة في البحث عن أي موضوع",
        "🔒 المحادثات الخاصة تبقى خاصة",
        "⚔️ تحكم فيما يمكن للذكاء الاصطناعي مناقشته",
        "🤖 ارفع مستندات يمكن للذكاء الاصطناعي التعلم منها",
        "⚡ استجابات سريعة عندما تحتاجها",
        "🧠 ذكاء اصطناعي يتذكر محادثتك",
        "🌐 تحدث مع جميع أفضل الذكاء الاصطناعي في مكان واحد",
        "📋 شروحات واضحة بلغة بسيطة",
        "💰 خطط ميسورة التكلفة للجميع",
        "🖼️ أنشئ صور ومخططات بسهولة",
        "📝 اكتب بشكل أفضل مع مساعدة الذكاء الاصطناعي"
      ]
    }
  };

  // Translated reaction messages by language
  const translatedReactions = {
    en: {
      company: [
        "ROI potential! 💰",
        "Enterprise-ready! 🏢",
        "Time saver! ⏱️",
        "Game changer! 🚀",
        "That's innovative! 💡",
        "Must implement! ✅",
        "Impressive! ⭐",
        "Top-tier solution 🧠",
        "Scalable! 📈",
        "Competitively advantageous 🏆",
        "Security-forward! 🔒"
      ],
      consumer: [
        "Love that! 😍",
        "Amazing! ⭐",
        "That's so cool! ❄️",
        "Can't wait! 🎉",
        "Fun feature! 🎮",
        "Need this! ✅",
        "Awesome! 🤩",
        "Super helpful! 🙌",
        "Perfect! 👌",
        "That's clever! 💡",
        "So exciting! ✨"
      ]
    },
    es: {
      company: [
        "¡Potencial de ROI! 💰",
        "¡Listo para empresas! 🏢",
        "¡Ahorra tiempo! ⏱️",
        "¡Cambia el juego! 🚀",
        "¡Eso es innovador! 💡",
        "¡Debe implementarse! ✅",
        "¡Impresionante! ⭐",
        "Solución de primer nivel 🧠",
        "¡Escalable! 📈",
        "Ventaja competitiva 🏆",
        "¡Enfoque en seguridad! 🔒"
      ],
      consumer: [
        "¡Me encanta! 😍",
        "¡Increíble! ⭐",
        "¡Qué genial! ❄️",
        "¡No puedo esperar! 🎉",
        "¡Función divertida! 🎮",
        "¡Necesito esto! ✅",
        "¡Fantástico! 🤩",
        "¡Súper útil! 🙌",
        "¡Perfecto! 👌",
        "¡Qué inteligente! 💡",
        "¡Tan emocionante! ✨"
      ]
    },
    fr: {
      company: [
        "Potentiel de ROI ! 💰",
        "Prêt pour l'entreprise ! 🏢",
        "Gain de temps ! ⏱️",
        "Révolutionnaire ! 🚀",
        "C'est innovant ! 💡",
        "À implémenter ! ✅",
        "Impressionnant ! ⭐",
        "Solution de premier plan 🧠",
        "Évolutif ! 📈",
        "Avantage concurrentiel 🏆",
        "Axé sécurité ! 🔒"
      ],
      consumer: [
        "J'adore ça ! 😍",
        "Incroyable ! ⭐",
        "C'est si cool ! ❄️",
        "J'ai hâte ! 🎉",
        "Fonction amusante ! 🎮",
        "J'en ai besoin ! ✅",
        "Génial ! 🤩",
        "Super utile ! 🙌",
        "Parfait ! 👌",
        "C'est malin ! 💡",
        "Si excitant ! ✨"
      ]
    },
    ar: {
      company: [
        "إمكانية عائد استثمار! 💰",
        "جاهز للمؤسسات! 🏢",
        "موفر للوقت! ⏱️",
        "يغير قواعد اللعبة! 🚀",
        "هذا مبتكر! 💡",
        "يجب التنفيذ! ✅",
        "مثير للإعجاب! ⭐",
        "حل من الدرجة الأولى 🧠",
        "قابل للتوسع! 📈",
        "ميزة تنافسية 🏆",
        "يركز على الأمان! 🔒"
      ],
      consumer: [
        "أحب ذلك! 😍",
        "مذهل! ⭐",
        "هذا رائع جداً! ❄️",
        "لا أستطيع الانتظار! 🎉",
        "ميزة ممتعة! 🎮",
        "أحتاج هذا! ✅",
        "رائع! 🤩",
        "مفيد جداً! 🙌",
        "مثالي! 👌",
        "هذا ذكي! 💡",
        "مثير جداً! ✨"
      ]
    }
  };

  // Get current language and set appropriate messages
  const currentLang = getCurrentLanguage();
  const companyFeatureMessages = translatedMessages[currentLang].company;
  const consumerFeatureMessages = translatedMessages[currentLang].consumer;
  const companyReactionMessages = translatedReactions[currentLang].company;
  const consumerReactionMessages = translatedReactions[currentLang].consumer;

  // Performance optimization: Check if hero section is visible
  let isHeroVisible = true;
  const heroSection = document.querySelector('.hero');

  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroVisible = entry.isIntersecting;
        if (!isHeroVisible) {
          // Pause animations when hero is not visible
          clearInterval(bubbleInterval);
          bubbleInterval = null;
          clearBubbles();
        } else if (!bubbleInterval) {
          // Resume animations when hero becomes visible
          setTimeout(() => {
            if (isHeroVisible) {
              startBubbles();
            }
          }, 500);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    observer.observe(heroSection);
  }

  // Check the current view toggle state from localStorage (uses the same key as view-toggle.js)
  let isCompanyView = localStorage.getItem('divinciContentView') === 'company';

  // Set initial messages based on current toggle state
  let featureMessages = isCompanyView ? [...companyFeatureMessages] : [...consumerFeatureMessages];

  // Listen for toggle changes
  document.addEventListener('viewToggled', function(event) {
    const isCompany = event.detail.isCompanyView;

    // Update feature messages when the toggle changes
    featureMessages = isCompany ? [...companyFeatureMessages] : [...consumerFeatureMessages];

    // Update reaction messages when the toggle changes
    reactionMessages = isCompany ? [...companyReactionMessages] : [...consumerReactionMessages];

    // Reset indices to start showing the new messages immediately
    currentFeatureIndex = 0;
    currentReactionIndex = 0;

    // Reset cycle to start with features
    isFeatureCycle = true;

    // Force a refresh of the bubbles to show new content right away
    if (bubbleInterval) {
      clearInterval(bubbleInterval);
      clearBubbles();
      showBubbles();
      bubbleInterval = setInterval(showBubbles, 9000);
    }
  });

  // Set initial reaction messages based on view
  let reactionMessages = isCompanyView ? [...companyReactionMessages] : [...consumerReactionMessages];

  // Initialize indices for tracking current message position
  let currentFeatureIndex = 0;
  let currentReactionIndex = 0;

  // Track whether we're showing feature messages or reaction messages in current cycle
  let isFeatureCycle = true;

  // Check for view toggle on page load
  const viewToggle = document.getElementById('viewToggle');
  if (viewToggle) {
    // Initialize based on the actual toggle state rather than just localStorage
    // This ensures consistency between toggle state and messages
    isCompanyView = viewToggle.checked;
    featureMessages = isCompanyView ? [...companyFeatureMessages] : [...consumerFeatureMessages];
    reactionMessages = isCompanyView ? [...companyReactionMessages] : [...consumerReactionMessages];
  }

  // Keep track of active bubbles and their matching circles
  const activeBubbles = [];

  // Predefined circle selectors to simulate attachment
  const circleSelectors = [
    '.geometry-group .circle00',
    '.geometry-group .circle02',
    '.geometry-group .circle04',
    '.geometry-group-outer1 .circle20',
    '.geometry-group-outer1 .circle22',
    '.geometry-group-outer1 .circle24',
    '.geometry-group-outer2 .circle26',
    '.geometry-group-outer2 .circle28',
    '.geometry-group-outer2 .circle30'
  ];

  // Skip AI logo circles
  const aiLogoSelectors = [
    '.geometry-group .circle01',
    '.geometry-group .circle03',
    '.geometry-group-outer1 .circle21',
    '.geometry-group-outer1 .circle23',
    '.geometry-group-outer2 .circle27'
  ];

  // Create a bubble positioned to appear above a specific circle
  function createBubble(circleSelector, isFeature) {
    const circle = document.querySelector(circleSelector);
    if (!circle) {
      console.log(`Circle not found: ${circleSelector}`);
      return null;
    }

    // Create the bubble
    const bubble = document.createElement('div');
    const bubbleId = `bubble-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Set content
    bubble.textContent = isFeature
      ? featureMessages[currentFeatureIndex++ % featureMessages.length]
      : reactionMessages[currentReactionIndex++ % reactionMessages.length];

    bubble.id = bubbleId;
    document.body.appendChild(bubble);

    // Get current view state for styling
    const isCompanyView = localStorage.getItem('divinciContentView') === 'company';

    // Style differences based on company vs consumer view
    const featureBgColor = isCompanyView ? 'rgba(8, 8, 66, 0.97)' : 'white';
    const featureTextColor = isCompanyView ? 'white' : 'black';
    const featureBorderColor = isCompanyView ? 'rgba(92, 114, 226, 0.5)' : 'rgba(0,0,0,0.1)';
    const featureShadowColor = isCompanyView ? 'rgba(92, 114, 226, 0.4)' : 'rgba(0,0,0,0.3)';

    const reactionBgColor = 'white';
    const reactionTextColor = isCompanyView ? 'rgba(8, 8, 66, 1)' : 'rgba(0, 0, 67, 1)';
    const reactionBorderColor = isCompanyView ? 'rgba(92, 114, 226, 0.3)' : 'rgba(0,0,100,0.3)';
    const reactionShadowColor = 'rgba(0,0,0,0.15)';

    // Apply styles directly to the element for maximum reliability
    bubble.style.cssText = `
      position: absolute !important;
      z-index: 100000 !important;
      padding: ${isFeature ? '10px 20px' : '8px 16px'} !important;
      background-color: ${isFeature ? featureBgColor : reactionBgColor} !important;
      color: ${isFeature ? featureTextColor : reactionTextColor} !important;
      border-radius: 20px !important;
      box-shadow: 0 0 20px ${isFeature ? featureShadowColor : reactionShadowColor} !important;
      border: 2px solid ${isFeature ? featureBorderColor : reactionBorderColor} !important;
      font-size: ${isFeature ? '18px' : '16px'} !important;
      font-weight: bold !important;
      font-family: 'Montserrat', sans-serif !important;
      white-space: nowrap !important;
      pointer-events: none !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      max-width: 80% !important;
      text-align: center !important;
      transform: translateX(-50%) !important;
      will-change: transform !important;
      ${isCompanyView && isFeature ? 'letter-spacing: 0.5px !important;' : ''}
    `;

    // Add a pointer/stem (separate element for reliability)
    const pointer = document.createElement('div');
    pointer.id = `pointer-${bubbleId}`;

    pointer.style.cssText = `
      content: '' !important;
      position: absolute !important;
      bottom: -8px !important;
      left: 50% !important;
      margin-left: -8px !important;
      width: 16px !important;
      height: 16px !important;
      background: ${isFeature ? featureBgColor : reactionBgColor} !important;
      transform: rotate(45deg) !important;
      border: 2px solid ${isFeature ? featureBorderColor : reactionBorderColor} !important;
      border-top: none !important;
      border-left: none !important;
      z-index: -1 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;

    bubble.appendChild(pointer);

    // Store bubble and its associated circle
    activeBubbles.push({
      bubble: bubble,
      circle: circle,
      circleSelector: circleSelector
    });

    // Initial position update
    updateBubblePosition(bubble, circle);

    return bubble;
  }

  // Update a bubble's position to match its circle's current position
  function updateBubblePosition(bubble, circle) {
    if (!bubble || !circle) return;

    const rect = circle.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top - 20; // Position higher above the circle (moved up 5px from -15)

    // Update bubble position to match circle
    bubble.style.left = `${centerX}px`;
    bubble.style.top = `${topY}px`;
  }

  // Animation frame ID for position updates
  let positionUpdateFrameId = null;

  // Update all bubble positions to follow their circles
  function updateAllBubblePositions() {
    // Only continue if we have active bubbles
    if (activeBubbles.length === 0) {
      positionUpdateFrameId = null;
      return;
    }

    // Update all bubble positions
    activeBubbles.forEach(item => {
      updateBubblePosition(item.bubble, item.circle);
    });

    // Continue updating positions only if bubbles are active
    positionUpdateFrameId = requestAnimationFrame(updateAllBubblePositions);
  }

  // Start position updates only when needed
  function startPositionUpdates() {
    if (!positionUpdateFrameId && activeBubbles.length > 0) {
      positionUpdateFrameId = requestAnimationFrame(updateAllBubblePositions);
    }
  }

  // Stop position updates
  function stopPositionUpdates() {
    if (positionUpdateFrameId) {
      cancelAnimationFrame(positionUpdateFrameId);
      positionUpdateFrameId = null;
    }
  }

  // Track clear timeout to avoid conflicts
  let clearTimeoutId = null;

  // Show a set of bubbles
  function showBubbles() {
    console.log(`Showing hybrid bubbles - ${isFeatureCycle ? 'Feature' : 'Reaction'} cycle`);

    // Divide circles into 3 distinct groups for organized placement
    const shuffledSelectors = [...circleSelectors].sort(() => Math.random() - 0.5);
    const totalCircles = shuffledSelectors.length;
    const groupSize = Math.floor(totalCircles / 3);

    // Group 1: Main message circles (first third)
    const mainMessageCircles = shuffledSelectors.slice(0, groupSize);
    // Group 2: First reaction circles (middle third)
    const firstReactionCircles = shuffledSelectors.slice(groupSize, groupSize * 2);
    // Group 3: Second reaction circles (last third)
    const secondReactionCircles = shuffledSelectors.slice(groupSize * 2);

    // Get currently used circle selectors to avoid conflicts
    const usedCircleSelectors = activeBubbles.map(item => item.circleSelector);

    // Filter out used circles from each group
    const availableMainCircles = mainMessageCircles.filter(selector => !usedCircleSelectors.includes(selector));
    const availableFirstReactionCircles = firstReactionCircles.filter(selector => !usedCircleSelectors.includes(selector));
    const availableSecondReactionCircles = secondReactionCircles.filter(selector => !usedCircleSelectors.includes(selector));

    if (isFeatureCycle) {
      // Feature cycle: Show 1 main feature message in Group 1
      // DON'T clear existing bubbles - let them coexist
      if (availableMainCircles.length > 0) {
        const randomMainCircle = availableMainCircles[Math.floor(Math.random() * availableMainCircles.length)];
        const mainBubble = createBubble(randomMainCircle, true);
        startPositionUpdates();

        // Remove just this bubble after 5 seconds (right timing for main message)
        setTimeout(() => {
          if (mainBubble && mainBubble.parentNode) {
            mainBubble.parentNode.removeChild(mainBubble);
            // Remove from activeBubbles array
            const index = activeBubbles.findIndex(item => item.bubble === mainBubble);
            if (index > -1) {
              activeBubbles.splice(index, 1);
            }
          }
        }, 5000);
      } else {
        console.log('No available main message circles - skipping this cycle');
      }
    } else {
      // Reaction cycle: Show 1-2 reaction messages in Groups 2 & 3
      // DON'T clear existing bubbles - let them coexist
      // ENSURE reactions never use Group 1 (main message group)

      // First reaction in Group 2 (only if available)
      if (availableFirstReactionCircles.length > 0) {
        const randomFirstCircle = availableFirstReactionCircles[Math.floor(Math.random() * availableFirstReactionCircles.length)];
        const reaction1 = createBubble(randomFirstCircle, false);
        startPositionUpdates();

        // Add a second reaction bubble with delay in Group 3 (only if available)
        setTimeout(() => {
          if (availableSecondReactionCircles.length > 0) {
            const randomSecondCircle = availableSecondReactionCircles[Math.floor(Math.random() * availableSecondReactionCircles.length)];
            const reaction2 = createBubble(randomSecondCircle, false);

            // Remove both reactions after 3 seconds (shorter for cleaner cycle)
            setTimeout(() => {
              [reaction1, reaction2].forEach(bubble => {
                if (bubble && bubble.parentNode) {
                  bubble.parentNode.removeChild(bubble);
                  // Remove from activeBubbles array
                  const index = activeBubbles.findIndex(item => item.bubble === bubble);
                  if (index > -1) {
                    activeBubbles.splice(index, 1);
                  }
                }
              });
            }, 3000);
          } else {
            // If no Group 3 available, just remove the first reaction
            setTimeout(() => {
              if (reaction1 && reaction1.parentNode) {
                reaction1.parentNode.removeChild(reaction1);
                const index = activeBubbles.findIndex(item => item.bubble === reaction1);
                if (index > -1) {
                  activeBubbles.splice(index, 1);
                }
              }
            }, 3000);
          }
        }, 1500);
      } else {
        console.log('No available reaction circles - skipping this cycle');
      }
    }

    // Toggle cycle for next time
    isFeatureCycle = !isFeatureCycle;
  }

  // Clear all bubbles
  function clearBubbles() {
    // Stop position updates first
    stopPositionUpdates();

    // Remove all bubbles efficiently
    activeBubbles.forEach(item => {
      if (item.bubble && item.bubble.parentNode) {
        item.bubble.parentNode.removeChild(item.bubble);
      }
    });

    // Clear the array
    activeBubbles.length = 0;
  }

  // Start showing bubbles on a regular interval
  let bubbleInterval = null;

  function startBubbles() {
    // Only start if hero is visible
    if (!isHeroVisible) return;

    // Show first set immediately
    showBubbles();

    // Set up interval for subsequent sets
    bubbleInterval = setInterval(() => {
      if (isHeroVisible) {
        showBubbles();
      }
    }, 6000);

    // Handle page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!bubbleInterval && isHeroVisible) {
          clearBubbles();
          showBubbles();
          bubbleInterval = setInterval(() => {
            if (isHeroVisible) {
              showBubbles();
            }
          }, 6000);
        }
      } else {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
        clearBubbles();
      }
    });
  }

  // Start displaying bubbles after a short delay
  setTimeout(startBubbles, 1500);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(bubbleInterval);
    if (positionUpdateFrameId) {
      cancelAnimationFrame(positionUpdateFrameId);
    }
    clearBubbles();
  });
});