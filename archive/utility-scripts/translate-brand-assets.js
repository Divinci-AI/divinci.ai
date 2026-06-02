#!/usr/bin/env node

/**
 * Translate Brand Assets Script
 * 
 * This script translates the remaining brand assets content
 * in the press pages across all language websites.
 */

const fs = require('fs');
const path = require('path');

// Languages to translate
const languages = ['es', 'fr', 'ar'];

// Brand assets translations
const brandAssetsTranslations = {
    'es': {
        'Inverted Logo': 'Logotipo Invertido',
        'Animated Logo': 'Logotipo Animado',
        'Product Screenshots': 'Capturas de Pantalla del Producto',
        'AutoRAG Dashboard': 'Panel de AutoRAG',
        'QA Pipeline': 'Pipeline de QA',
        'Release Cycle Manager': 'Gestor de Ciclo de Lanzamiento',
        'Team Photos': 'Fotos del Equipo',
        'Michael Mooring, CEO': 'Michael Mooring, CEO',
        'Samuel Tobia, CTO': 'Samuel Tobia, CTO',
        'Sierra Hooshiari, VP of Communications': 'Sierra Hooshiari, VP de Comunicaciones',
        'Complete Press Kit': 'Kit de Prensa Completo',
        'Download our complete press kit, which includes all logos, screenshots, team photos, product fact sheets, and company backgrounders in a single package.':
        'Descargue nuestro kit de prensa completo, que incluye todos los logotipos, capturas de pantalla, fotos del equipo, hojas informativas del producto y antecedentes de la empresa en un solo paquete.',
        'Download Press Kit (ZIP, 25MB)': 'Descargar Kit de Prensa (ZIP, 25MB)',
        'Download': 'Descargar'
    },
    'fr': {
        'Brand Assets': 'Ressources de Marque',
        'Download official Divinci AI logos, product screenshots, and founder photos for media use. All assets are provided in high resolution and are available in multiple formats.':
        'Téléchargez les logos officiels de Divinci AI, les captures d\'écran de produits et les photos des fondateurs pour usage médiatique. Toutes les ressources sont fournies en haute résolution et disponibles en plusieurs formats.',
        'Logos': 'Logos',
        'Primary Logo': 'Logo Principal',
        'Inverted Logo': 'Logo Inversé',
        'Animated Logo': 'Logo Animé',
        'Product Screenshots': 'Captures d\'Écran du Produit',
        'AutoRAG Dashboard': 'Tableau de Bord AutoRAG',
        'QA Pipeline': 'Pipeline QA',
        'Release Cycle Manager': 'Gestionnaire de Cycle de Version',
        'Team Photos': 'Photos de l\'Équipe',
        'Michael Mooring, CEO': 'Michael Mooring, PDG',
        'Samuel Tobia, CTO': 'Samuel Tobia, CTO',
        'Sierra Hooshiari, VP of Communications': 'Sierra Hooshiari, VP Communications',
        'Complete Press Kit': 'Kit de Presse Complet',
        'Download our complete press kit, which includes all logos, screenshots, team photos, product fact sheets, and company backgrounders in a single package.':
        'Téléchargez notre kit de presse complet, qui comprend tous les logos, captures d\'écran, photos d\'équipe, fiches produits et informations sur l\'entreprise dans un seul package.',
        'Download Press Kit (ZIP, 25MB)': 'Télécharger le Kit de Presse (ZIP, 25MB)',
        'Download': 'Télécharger'
    },
    'ar': {
        'Brand Assets': 'أصول العلامة التجارية',
        'Download official Divinci AI logos, product screenshots, and founder photos for media use. All assets are provided in high resolution and are available in multiple formats.':
        'قم بتنزيل شعارات ديفينشي للذكاء الاصطناعي الرسمية ولقطات شاشة المنتج وصور المؤسسين للاستخدام الإعلامي. جميع الأصول متوفرة بدقة عالية ومتاحة بتنسيقات متعددة.',
        'Logos': 'الشعارات',
        'Primary Logo': 'الشعار الأساسي',
        'Inverted Logo': 'الشعار المعكوس',
        'Animated Logo': 'الشعار المتحرك',
        'Product Screenshots': 'لقطات شاشة المنتج',
        'AutoRAG Dashboard': 'لوحة تحكم AutoRAG',
        'QA Pipeline': 'خط أنابيب ضمان الجودة',
        'Release Cycle Manager': 'مدير دورة الإصدار',
        'Team Photos': 'صور الفريق',
        'Michael Mooring, CEO': 'مايكل مورينغ، الرئيس التنفيذي',
        'Samuel Tobia, CTO': 'صموئيل توبيا، كبير مسؤولي التكنولوجيا',
        'Sierra Hooshiari, VP of Communications': 'سييرا هوشياري، نائب رئيس الاتصالات',
        'Complete Press Kit': 'مجموعة الصحافة الكاملة',
        'Download our complete press kit, which includes all logos, screenshots, team photos, product fact sheets, and company backgrounders in a single package.':
        'قم بتنزيل مجموعة الصحافة الكاملة، والتي تتضمن جميع الشعارات ولقطات الشاشة وصور الفريق وأوراق حقائق المنتج ومعلومات الشركة في حزمة واحدة.',
        'Download Press Kit (ZIP, 25MB)': 'تنزيل مجموعة الصحافة (ZIP، 25 ميجابايت)',
        'Download': 'تنزيل'
    }
};

function translateBrandAssets(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Apply brand assets translations
        const langTranslations = brandAssetsTranslations[lang];
        if (langTranslations) {
            for (const [english, translated] of Object.entries(langTranslations)) {
                // Use regex to match the exact text within HTML context
                const regex = new RegExp(escapeRegExp(english), 'g');
                
                if (content.includes(english)) {
                    content = content.replace(regex, translated);
                    modified = true;
                    console.log(`  ✅ Translated "${english.substring(0, 30)}..." in ${fileName}`);
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated brand assets for ${filePath}`);
        } else {
            console.log(`ℹ️  No brand assets updates needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error translating brand assets in ${filePath}:`, error.message);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
    console.log('🎨 Starting brand assets translations...\n');

    languages.forEach(lang => {
        console.log(`\n📝 Translating ${lang.toUpperCase()} brand assets:`);
        translateBrandAssets(lang, 'press.html');
    });

    console.log('\n✨ Brand assets translations complete!');
    console.log('\n📋 Summary of brand assets translations:');
    console.log('  ✅ Translated asset section headers');
    console.log('  ✅ Translated asset names and descriptions');
    console.log('  ✅ Translated team member titles');
    console.log('  ✅ Translated download buttons and links');
    console.log('  ✅ Translated press kit descriptions');
}

if (require.main === module) {
    main();
}

module.exports = { translateBrandAssets, brandAssetsTranslations };
