#!/usr/bin/env node

/**
 * Translate Header Navigation Script
 * 
 * This script translates header navigation content (taglines, menu items, buttons) 
 * across all language-specific websites while preserving HTML structure.
 */

const fs = require('fs');
const path = require('path');

// Languages to translate
const languages = ['fr', 'es', 'ar'];

// Files that need header navigation translation in each language directory
const filesToFix = [
    'contact.html',
    'about-us.html',
    'careers.html', 
    'press.html',
    'terms-of-service.html',
    'privacy-policy.html',
    'ai-safety-ethics.html',
    'accessibility.html',
    'support.html',
    'cookies.html',
    'roadmap.html',
    'changelog.html',
    'internships.html',
    'pricing.html'
];

// Header navigation translations
const headerTranslations = {
    'es': {
        'Create your own custom AI': 'Crea tu propia IA personalizada',
        'Features': 'Características',
        'Team': 'Equipo',
        'Sign Up': 'Registrarse',
        'Pricing': 'Precios',
        'About': 'Acerca de',
        'Contact': 'Contacto',
        'Blog': 'Blog',
        'Documentation': 'Documentación',
        'Support': 'Soporte',
        'Login': 'Iniciar Sesión',
        'Get Started': 'Comenzar',
        'Try Now': 'Probar Ahora',
        'Learn More': 'Saber Más'
    },
    'fr': {
        'Create your own custom AI': 'Créez votre propre IA personnalisée',
        'Features': 'Fonctionnalités',
        'Team': 'Équipe',
        'Sign Up': 'S\'inscrire',
        'Pricing': 'Tarification',
        'About': 'À Propos',
        'Contact': 'Contact',
        'Blog': 'Blog',
        'Documentation': 'Documentation',
        'Support': 'Support',
        'Login': 'Se Connecter',
        'Get Started': 'Commencer',
        'Try Now': 'Essayer Maintenant',
        'Learn More': 'En Savoir Plus'
    },
    'ar': {
        'Create your own custom AI': 'أنشئ ذكاءك الاصطناعي المخصص',
        'Features': 'الميزات',
        'Team': 'الفريق',
        'Sign Up': 'التسجيل',
        'Pricing': 'التسعير',
        'About': 'حول',
        'Contact': 'اتصل بنا',
        'Blog': 'المدونة',
        'Documentation': 'التوثيق',
        'Support': 'الدعم',
        'Login': 'تسجيل الدخول',
        'Get Started': 'ابدأ الآن',
        'Try Now': 'جرب الآن',
        'Learn More': 'اعرف المزيد'
    }
};

function translateHeaderNavigation(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Apply header navigation translations
        const langTranslations = headerTranslations[lang];
        if (langTranslations) {
            for (const [english, translated] of Object.entries(langTranslations)) {
                // Different regex patterns for different contexts
                
                // 1. For tagline in nav-title (mobile-hide span)
                const taglineRegex = new RegExp(`(class="mobile-hide">\\s*&nbsp;-\\s*)(${escapeRegExp(english)})(\\s*</span>)`, 'g');
                
                // 2. For navigation menu links
                const navLinkRegex = new RegExp(`(href="[^"]*">\\s*)(${escapeRegExp(english)})(\\s*</a>)`, 'g');
                
                // 3. For button text inside spans
                const buttonRegex = new RegExp(`(class="signup-button">\\s*)(${escapeRegExp(english)})(\\s*</span>)`, 'g');
                
                // 4. For general link text
                const linkTextRegex = new RegExp(`(>\\s*)(${escapeRegExp(english)})(\\s*<)`, 'g');
                
                if (content.includes(english)) {
                    // Apply different patterns
                    const originalContent = content;
                    
                    content = content.replace(taglineRegex, `$1${translated}$3`);
                    content = content.replace(navLinkRegex, `$1${translated}$3`);
                    content = content.replace(buttonRegex, `$1${translated}$3`);
                    content = content.replace(linkTextRegex, `$1${translated}$3`);
                    
                    if (content !== originalContent) {
                        modified = true;
                        console.log(`  ✅ Translated "${english}" to "${translated}" in ${fileName}`);
                    }
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated header navigation for ${filePath}`);
        } else {
            console.log(`ℹ️  No header navigation updates needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error translating header navigation in ${filePath}:`, error.message);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
    console.log('🌍 Starting header navigation translations...\n');

    languages.forEach(lang => {
        console.log(`\n📝 Translating ${lang.toUpperCase()} header navigation:`);
        
        filesToFix.forEach(file => {
            translateHeaderNavigation(lang, file);
        });
    });

    console.log('\n✨ Header navigation translations complete!');
    console.log('\n📋 Summary of header navigation translations:');
    console.log('  ✅ Translated brand taglines');
    console.log('  ✅ Translated navigation menu items');
    console.log('  ✅ Translated button text');
    console.log('  ✅ Translated call-to-action links');
    console.log('  ✅ Preserved HTML structure and functionality');
}

if (require.main === module) {
    main();
}

module.exports = { translateHeaderNavigation, headerTranslations };
