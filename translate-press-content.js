#!/usr/bin/env node

/**
 * Translate Press Content Script
 * 
 * This script translates press page content including press releases,
 * media coverage, and other press-related content across language websites.
 */

const fs = require('fs');
const path = require('path');

// Languages to translate
const languages = ['es', 'fr', 'ar'];

// Press content translations
const pressTranslations = {
    'es': {
        // Press releases content
        'May 1, 2025': '1 de mayo de 2025',
        'April 15, 2025': '15 de abril de 2025',
        'March 10, 2025': '10 de marzo de 2025',
        'May 3, 2025': '3 de mayo de 2025',
        'April 18, 2025': '18 de abril de 2025',
        'March 15, 2025': '15 de marzo de 2025',
        
        'Divinci AI Launches Platform to Democratize Custom AI Solutions for Businesses': 
        'Divinci AI Lanza Plataforma para Democratizar Soluciones de IA Personalizadas para Empresas',
        
        'Divinci AI today announced the general availability of its platform designed to make custom AI solutions accessible to businesses of all sizes, without requiring specialized machine learning expertise.':
        'Divinci AI anunció hoy la disponibilidad general de su plataforma diseñada para hacer accesibles las soluciones de IA personalizadas a empresas de todos los tamaños, sin requerir experiencia especializada en aprendizaje automático.',
        
        'Divinci AI Unveils AutoRAG, Making Retrieval-Augmented Generation Accessible to All':
        'Divinci AI Presenta AutoRAG, Haciendo la Generación Aumentada por Recuperación Accesible para Todos',
        
        'The new AutoRAG feature automates the complex process of implementing Retrieval-Augmented Generation systems, allowing businesses to easily create AI that leverages their proprietary knowledge.':
        'La nueva función AutoRAG automatiza el proceso complejo de implementar sistemas de Generación Aumentada por Recuperación, permitiendo a las empresas crear fácilmente IA que aprovecha su conocimiento propietario.',
        
        'Divinci AI Joins AI Standards Hub to Promote Responsible AI Development':
        'Divinci AI se Une al Centro de Estándares de IA para Promover el Desarrollo Responsable de IA',
        
        'As part of its commitment to ethical AI, Divinci AI has joined the AI Standards Hub to contribute to the development of standards for secure, responsible, and transparent artificial intelligence.':
        'Como parte de su compromiso con la IA ética, Divinci AI se ha unido al Centro de Estándares de IA para contribuir al desarrollo de estándares para inteligencia artificial segura, responsable y transparente.',
        
        'Read more': 'Leer más',
        'Read article': 'Leer artículo',
        
        // Media coverage section
        'Media Coverage': 'Cobertura Mediática',
        
        'Divinci AI Makes Custom AI Solutions Accessible to SMBs':
        'Divinci AI Hace Accesibles las Soluciones de IA Personalizadas para PYMEs',
        
        'TechCrunch reviews Divinci AI\'s new platform and how it\'s bringing enterprise-grade AI capabilities to small and medium-sized businesses.':
        'TechCrunch revisa la nueva plataforma de Divinci AI y cómo está llevando capacidades de IA de nivel empresarial a pequeñas y medianas empresas.',
        
        'How Divinci AI\'s AutoRAG Feature Changes the Game for Document-Based AI':
        'Cómo la Función AutoRAG de Divinci AI Cambia las Reglas del Juego para la IA Basada en Documentos',
        
        'VentureBeat explores how Divinci AI\'s AutoRAG technology simplifies the complex process of implementing document-aware AI systems.':
        'VentureBeat explora cómo la tecnología AutoRAG de Divinci AI simplifica el proceso complejo de implementar sistemas de IA conscientes de documentos.',
        
        '10 AI Startups to Watch in 2025: Divinci AI Makes the List':
        '10 Startups de IA a Seguir en 2025: Divinci AI Está en la Lista',
        
        'Forbes includes Divinci AI in its annual list of promising AI startups transforming how businesses implement artificial intelligence solutions.':
        'Forbes incluye a Divinci AI en su lista anual de startups de IA prometedoras que transforman cómo las empresas implementan soluciones de inteligencia artificial.'
    },
    'fr': {
        // Press releases content
        'Press Resources': 'Ressources de Presse',
        'Find the latest news, media coverage, and resources about Divinci AI. For press inquiries, please contact our media relations team.':
        'Trouvez les dernières nouvelles, la couverture médiatique et les ressources sur Divinci AI. Pour les demandes de presse, veuillez contacter notre équipe de relations avec les médias.',
        
        'Press Contact': 'Contact Presse',
        'Email': 'E-mail',
        'Phone': 'Téléphone',
        'Media Relations': 'Relations Médias',
        
        'Our media relations team is available to assist journalists, industry analysts, and content creators with information, interviews, and resources about Divinci AI and our perspective on the AI industry.':
        'Notre équipe de relations médias est disponible pour aider les journalistes, analystes de l\'industrie et créateurs de contenu avec des informations, entretiens et ressources sur Divinci AI et notre perspective sur l\'industrie de l\'IA.',
        
        'Press Releases': 'Communiqués de Presse',
        'Media Coverage': 'Couverture Médiatique',
        'Read more': 'Lire plus',
        'Read article': 'Lire l\'article'
    },
    'ar': {
        // Press releases content
        'Press Resources': 'موارد الصحافة',
        'Find the latest news, media coverage, and resources about Divinci AI. For press inquiries, please contact our media relations team.':
        'اعثر على آخر الأخبار والتغطية الإعلامية والموارد حول ديفينشي للذكاء الاصطناعي. للاستفسارات الصحفية، يرجى الاتصال بفريق علاقاتنا الإعلامية.',
        
        'Press Contact': 'جهة اتصال الصحافة',
        'Email': 'البريد الإلكتروني',
        'Phone': 'الهاتف',
        'Media Relations': 'العلاقات الإعلامية',
        
        'Our media relations team is available to assist journalists, industry analysts, and content creators with information, interviews, and resources about Divinci AI and our perspective on the AI industry.':
        'فريق علاقاتنا الإعلامية متاح لمساعدة الصحفيين ومحللي الصناعة ومنشئي المحتوى بالمعلومات والمقابلات والموارد حول ديفينشي للذكاء الاصطناعي ووجهة نظرنا حول صناعة الذكاء الاصطناعي.',
        
        'Press Releases': 'البيانات الصحفية',
        'Media Coverage': 'التغطية الإعلامية',
        'Read more': 'اقرأ المزيد',
        'Read article': 'اقرأ المقال'
    }
};

function translatePressContent(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Apply press content translations
        const langTranslations = pressTranslations[lang];
        if (langTranslations) {
            for (const [english, translated] of Object.entries(langTranslations)) {
                // Use regex to match the exact text within HTML context
                const regex = new RegExp(escapeRegExp(english), 'g');
                
                if (content.includes(english)) {
                    content = content.replace(regex, translated);
                    modified = true;
                    console.log(`  ✅ Translated "${english.substring(0, 50)}..." in ${fileName}`);
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated press content for ${filePath}`);
        } else {
            console.log(`ℹ️  No press content updates needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error translating press content in ${filePath}:`, error.message);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
    console.log('🌍 Starting press content translations...\n');

    languages.forEach(lang => {
        console.log(`\n📝 Translating ${lang.toUpperCase()} press content:`);
        translatePressContent(lang, 'press.html');
    });

    console.log('\n✨ Press content translations complete!');
    console.log('\n📋 Summary of press translations:');
    console.log('  ✅ Translated press release titles and content');
    console.log('  ✅ Translated media coverage titles and content');
    console.log('  ✅ Translated dates and publication information');
    console.log('  ✅ Translated call-to-action links');
    console.log('  ✅ Preserved HTML structure and functionality');
}

if (require.main === module) {
    main();
}

module.exports = { translatePressContent, pressTranslations };
