#!/usr/bin/env node

/**
 * Translate Footer Content Script
 * 
 * This script translates footer content (taglines, copyright, links) 
 * across all language-specific websites while preserving HTML structure.
 */

const fs = require('fs');
const path = require('path');

// Languages to translate
const languages = ['fr', 'es', 'ar'];

// Files that need footer translation in each language directory
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

// Footer content translations
const footerTranslations = {
    'es': {
        'Empowering human-AI collaboration': 'Potenciando la colaboración humano-IA',
        'All rights reserved': 'Todos los derechos reservados',
        'Features': 'Características',
        'Pricing': 'Precios',
        'Roadmap': 'Hoja de Ruta',
        'Changelog': 'Registro de Cambios',
        'Documentation': 'Documentación',
        'Blog': 'Blog',
        'Tutorials': 'Tutoriales',
        'API': 'API',
        'About Us': 'Acerca de Nosotros',
        'Careers': 'Carreras',
        'Contact': 'Contacto',
        'Press': 'Prensa',
        'Terms of Service': 'Términos de Servicio',
        'Privacy Policy': 'Política de Privacidad',
        'AI Safety & Ethics': 'Seguridad y Ética de IA',
        'Security': 'Seguridad',
        'Sitemap': 'Mapa del Sitio',
        'Accessibility': 'Accesibilidad',
        'Cookie Policy': 'Política de Cookies'
    },
    'fr': {
        'Empowering human-AI collaboration': 'Renforcer la collaboration humain-IA',
        'All rights reserved': 'Tous droits réservés',
        'Features': 'Fonctionnalités',
        'Pricing': 'Tarification',
        'Roadmap': 'Feuille de Route',
        'Changelog': 'Journal des Modifications',
        'Documentation': 'Documentation',
        'Blog': 'Blog',
        'Tutorials': 'Tutoriels',
        'API': 'API',
        'About Us': 'À Propos',
        'Careers': 'Carrières',
        'Contact': 'Contact',
        'Press': 'Presse',
        'Terms of Service': 'Conditions de Service',
        'Privacy Policy': 'Politique de Confidentialité',
        'AI Safety & Ethics': 'Sécurité et Éthique de l\'IA',
        'Security': 'Sécurité',
        'Sitemap': 'Plan du Site',
        'Accessibility': 'Accessibilité',
        'Cookie Policy': 'Politique des Cookies'
    },
    'ar': {
        'Empowering human-AI collaboration': 'تمكين التعاون بين الإنسان والذكاء الاصطناعي',
        'All rights reserved': 'جميع الحقوق محفوظة',
        'Features': 'الميزات',
        'Pricing': 'التسعير',
        'Roadmap': 'خارطة الطريق',
        'Changelog': 'سجل التغييرات',
        'Documentation': 'التوثيق',
        'Blog': 'المدونة',
        'Tutorials': 'الدروس',
        'API': 'واجهة برمجة التطبيقات',
        'About Us': 'من نحن',
        'Careers': 'الوظائف',
        'Contact': 'اتصل بنا',
        'Press': 'الصحافة',
        'Terms of Service': 'شروط الخدمة',
        'Privacy Policy': 'سياسة الخصوصية',
        'AI Safety & Ethics': 'أمان وأخلاقيات الذكاء الاصطناعي',
        'Security': 'الأمان',
        'Sitemap': 'خريطة الموقع',
        'Accessibility': 'إمكانية الوصول',
        'Cookie Policy': 'سياسة ملفات تعريف الارتباط'
    }
};

function translateFooterContent(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Apply footer translations
        const langTranslations = footerTranslations[lang];
        if (langTranslations) {
            for (const [english, translated] of Object.entries(langTranslations)) {
                // Use regex to match the exact text within HTML context
                const regex = new RegExp(`(>\\s*)(${escapeRegExp(english)})(\\s*<)`, 'g');
                const linkRegex = new RegExp(`(>\\s*)(${escapeRegExp(english)})(\\s*</a>)`, 'g');
                const taglineRegex = new RegExp(`(class="footer-tagline">\\s*)(${escapeRegExp(english)})(\\s*</p>)`, 'g');
                const copyrightRegex = new RegExp(`(&copy;\\s*\\d{4}-\\d{4}\\s*Divinci AI\\.\\s*)(${escapeRegExp(english)})`, 'g');
                
                if (content.includes(english)) {
                    // Replace in different contexts
                    content = content.replace(regex, `$1${translated}$3`);
                    content = content.replace(linkRegex, `$1${translated}$3`);
                    content = content.replace(taglineRegex, `$1${translated}$3`);
                    content = content.replace(copyrightRegex, `$1${translated}`);
                    modified = true;
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Translated footer content for ${filePath}`);
        } else {
            console.log(`ℹ️  No footer translations needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error translating footer in ${filePath}:`, error.message);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
    console.log('🌍 Starting footer content translations...\n');

    languages.forEach(lang => {
        console.log(`\n📝 Translating ${lang.toUpperCase()} footer content:`);
        
        filesToFix.forEach(file => {
            translateFooterContent(lang, file);
        });
    });

    console.log('\n✨ Footer content translations complete!');
    console.log('\n📋 Summary of footer translations:');
    console.log('  ✅ Translated footer taglines');
    console.log('  ✅ Translated navigation link text');
    console.log('  ✅ Translated copyright notices');
    console.log('  ✅ Translated footer section links');
    console.log('  ✅ Preserved HTML structure and functionality');
}

if (require.main === module) {
    main();
}

module.exports = { translateFooterContent, footerTranslations };
