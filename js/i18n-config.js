/**
 * Internationalization Configuration
 * 
 * This file contains the configuration for the i18n system.
 */

// Define available languages
const availableLanguages = [
  { code: 'en', name: 'English', dir: 'ltr', default: true },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' }
];

// Define translations
const translations = {
  en: {
    navigation: {
      features: 'Features',
      team: 'Team',
      blog: 'Blog',
      contact: 'Contact',
      about: 'About Us'
    },
    buttons: {
      signUp: 'Sign Up',
      learnMore: 'Learn More',
      getStarted: 'Get Started',
      contactUs: 'Contact Us'
    },
    homepage: {
      hero: {
        title: 'Your AI for Life\'s Journey, with friends!',
        subtitle: 'Create custom AI solutions and collaborate with your favorite AI models in a multiplayer environment.',
        companyTitle: 'Modernize your business in the Age of AI',
        companySubtitle: 'Enterprise-grade AI solutions for your organization'
      },
      features: {
        title: 'Features',
        multiplayer: {
          title: 'Multiplayer',
          consumer: 'Invite more of your human buddies into a chat with your favorite AIs.',
          company: 'Enable multi-stakeholder collaboration with shared AI workspaces for cross-functional teams.'
        },
        aiFamily: {
          title: 'AI Family',
          consumer: 'Choose from ChatGPT, Gemini, Claude, Llama, and many more!',
          company: 'Access enterprise-grade models from leading providers with unified governance and security controls.'
        },
        voiceInOut: {
          title: 'Voice In/Out',
          consumer: 'Fancy AI Voices from Google to have your answers read to you in a natural-sounding voice. Use your mic to chat text in.',
          company: 'Enterprise voice transcription and dictation with accessibility compliance and multi-language support.'
        }
      }
    },
    footer: {
      copyright: '© 2023 Divinci AI. All rights reserved.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      contact: 'Contact'
    }
  },
  es: {
    navigation: {
      features: 'Características',
      team: 'Equipo',
      blog: 'Blog',
      contact: 'Contacto',
      about: 'Sobre Nosotros'
    },
    buttons: {
      signUp: 'Registrarse',
      learnMore: 'Más Información',
      getStarted: 'Comenzar',
      contactUs: 'Contáctenos'
    },
    homepage: {
      hero: {
        title: '¡Tu IA para el viaje de la vida, con amigos!',
        subtitle: 'Crea soluciones de IA personalizadas y colabora con tus modelos de IA favoritos en un entorno multijugador.',
        companyTitle: 'Moderniza tu negocio en la Era de la IA',
        companySubtitle: 'Soluciones de IA de nivel empresarial para tu organización'
      },
      features: {
        title: 'Características',
        multiplayer: {
          title: 'Multijugador',
          consumer: 'Invita a más de tus amigos humanos a un chat con tus IAs favoritas.',
          company: 'Habilita la colaboración entre múltiples partes interesadas con espacios de trabajo de IA compartidos para equipos multifuncionales.'
        },
        aiFamily: {
          title: 'Familia de IA',
          consumer: '¡Elige entre ChatGPT, Gemini, Claude, Llama y muchos más!',
          company: 'Accede a modelos de nivel empresarial de proveedores líderes con controles unificados de gobernanza y seguridad.'
        },
        voiceInOut: {
          title: 'Entrada/Salida de Voz',
          consumer: 'Voces de IA elegantes de Google para que tus respuestas se lean en una voz de sonido natural. Usa tu micrófono para chatear con texto.',
          company: 'Transcripción de voz empresarial y dictado con cumplimiento de accesibilidad y soporte multilingüe.'
        }
      }
    },
    footer: {
      copyright: '© 2023 Divinci AI. Todos los derechos reservados.',
      privacyPolicy: 'Política de Privacidad',
      termsOfService: 'Términos de Servicio',
      contact: 'Contacto'
    }
  },
  fr: {
    navigation: {
      features: 'Fonctionnalités',
      team: 'Équipe',
      blog: 'Blog',
      contact: 'Contact',
      about: 'À Propos'
    },
    buttons: {
      signUp: 'S\'inscrire',
      learnMore: 'En Savoir Plus',
      getStarted: 'Commencer',
      contactUs: 'Contactez-nous'
    },
    homepage: {
      hero: {
        title: 'Votre IA pour le voyage de la vie, avec des amis !',
        subtitle: 'Créez des solutions d\'IA personnalisées et collaborez avec vos modèles d\'IA préférés dans un environnement multijoueur.',
        companyTitle: 'Modernisez votre entreprise à l\'ère de l\'IA',
        companySubtitle: 'Solutions d\'IA de niveau entreprise pour votre organisation'
      },
      features: {
        title: 'Fonctionnalités',
        multiplayer: {
          title: 'Multijoueur',
          consumer: 'Invitez plus de vos amis humains dans une conversation avec vos IA préférées.',
          company: 'Permettez la collaboration multi-parties prenantes avec des espaces de travail IA partagés pour les équipes interfonctionnelles.'
        },
        aiFamily: {
          title: 'Famille d\'IA',
          consumer: 'Choisissez parmi ChatGPT, Gemini, Claude, Llama, et bien d\'autres !',
          company: 'Accédez à des modèles de niveau entreprise des principaux fournisseurs avec des contrôles unifiés de gouvernance et de sécurité.'
        },
        voiceInOut: {
          title: 'Entrée/Sortie Vocale',
          consumer: 'Des voix IA sophistiquées de Google pour que vos réponses soient lues avec une voix naturelle. Utilisez votre micro pour discuter par texte.',
          company: 'Transcription vocale d\'entreprise et dictée avec conformité d\'accessibilité et support multilingue.'
        }
      }
    },
    footer: {
      copyright: '© 2023 Divinci AI. Tous droits réservés.',
      privacyPolicy: 'Politique de Confidentialité',
      termsOfService: 'Conditions d\'Utilisation',
      contact: 'Contact'
    }
  },
  ar: {
    navigation: {
      features: 'الميزات',
      team: 'الفريق',
      blog: 'المدونة',
      contact: 'اتصل بنا',
      about: 'من نحن'
    },
    buttons: {
      signUp: 'التسجيل',
      learnMore: 'معرفة المزيد',
      getStarted: 'ابدأ الآن',
      contactUs: 'اتصل بنا'
    },
    homepage: {
      hero: {
        title: 'ذكاؤك الاصطناعي لرحلة الحياة، مع الأصدقاء!',
        subtitle: 'أنشئ حلول الذكاء الاصطناعي المخصصة وتعاون مع نماذج الذكاء الاصطناعي المفضلة لديك في بيئة متعددة اللاعبين.',
        companyTitle: 'حدّث عملك في عصر الذكاء الاصطناعي',
        companySubtitle: 'حلول الذكاء الاصطناعي على مستوى المؤسسات لمنظمتك'
      },
      features: {
        title: 'الميزات',
        multiplayer: {
          title: 'متعدد اللاعبين',
          consumer: 'ادعُ المزيد من أصدقائك البشريين إلى محادثة مع الذكاء الاصطناعي المفضل لديك.',
          company: 'تمكين التعاون متعدد أصحاب المصلحة مع مساحات عمل الذكاء الاصطناعي المشتركة للفرق متعددة الوظائف.'
        },
        aiFamily: {
          title: 'عائلة الذكاء الاصطناعي',
          consumer: 'اختر من بين ChatGPT وGemini وClaude وLlama والكثير غيرها!',
          company: 'الوصول إلى نماذج على مستوى المؤسسات من مزودي الخدمات الرائدين مع ضوابط موحدة للحوكمة والأمان.'
        },
        voiceInOut: {
          title: 'إدخال/إخراج الصوت',
          consumer: 'أصوات ذكاء اصطناعي رائعة من Google لقراءة إجاباتك بصوت طبيعي. استخدم الميكروفون للدردشة النصية.',
          company: 'نسخ الصوت على مستوى المؤسسات والإملاء مع الامتثال لمعايير إمكانية الوصول ودعم متعدد اللغات.'
        }
      }
    },
    footer: {
      copyright: '© 2023 Divinci AI. جميع الحقوق محفوظة.',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfService: 'شروط الخدمة',
      contact: 'اتصل بنا'
    }
  }
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    availableLanguages,
    translations
  };
} else {
  // For browser use
  window.i18nConfig = {
    availableLanguages,
    translations
  };
}
