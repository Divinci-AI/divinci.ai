#!/usr/bin/env node

/**
 * Translate Privacy Policy Script
 * 
 * This script translates the privacy policy content from English to Spanish, French, and Arabic
 * while preserving the HTML structure and formatting.
 */

const fs = require('fs');
const path = require('path');

// Translation mappings for privacy policy content
const translations = {
    'es': {
        'Privacy Policy': 'Política de Privacidad',
        'Last Updated: October 31, 2024': 'Última Actualización: 31 de octubre de 2024',
        'Important:': 'Importante:',
        'Please review our updated Privacy Policy carefully.': 'Por favor, revise nuestra Política de Privacidad actualizada cuidadosamente.',
        '1. Introduction': '1. Introducción',
        '2. Data Collection and Use': '2. Recopilación y Uso de Datos',
        '3. Data Security': '3. Seguridad de Datos',
        '4. User Rights': '4. Derechos del Usuario',
        '5. AI and User-Generated Content': '5. IA y Contenido Generado por el Usuario',
        '6. Data Retention and Deletion': '6. Retención y Eliminación de Datos',
        '7. Sharing of Data': '7. Compartir Datos',
        '8. Cookies and Tracking': '8. Cookies y Seguimiento',
        '9. Updates to Privacy Policy': '9. Actualizaciones de la Política de Privacidad',
        '10. Contact Information': '10. Información de Contacto',
        'Personal Information:': 'Información Personal:',
        'Usage Data:': 'Datos de Uso:',
        'Device Information:': 'Información del Dispositivo:',
        'Access:': 'Acceso:',
        'Correction:': 'Corrección:',
        'Deletion:': 'Eliminación:',
        'Opt-out:': 'Exclusión:',
        'Service Improvement:': 'Mejora del Servicio:',
        'Legal Compliance:': 'Cumplimiento Legal:',
        'Business Transactions:': 'Transacciones Comerciales:'
    },
    'fr': {
        'Privacy Policy': 'Politique de Confidentialité',
        'Last Updated: October 31, 2024': 'Dernière Mise à Jour: 31 octobre 2024',
        'Important:': 'Important:',
        'Please review our updated Privacy Policy carefully.': 'Veuillez examiner attentivement notre Politique de Confidentialité mise à jour.',
        '1. Introduction': '1. Introduction',
        '2. Data Collection and Use': '2. Collecte et Utilisation des Données',
        '3. Data Security': '3. Sécurité des Données',
        '4. User Rights': '4. Droits des Utilisateurs',
        '5. AI and User-Generated Content': '5. IA et Contenu Généré par l\'Utilisateur',
        '6. Data Retention and Deletion': '6. Conservation et Suppression des Données',
        '7. Sharing of Data': '7. Partage des Données',
        '8. Cookies and Tracking': '8. Cookies et Suivi',
        '9. Updates to Privacy Policy': '9. Mises à Jour de la Politique de Confidentialité',
        '10. Contact Information': '10. Informations de Contact',
        'Personal Information:': 'Informations Personnelles:',
        'Usage Data:': 'Données d\'Utilisation:',
        'Device Information:': 'Informations sur l\'Appareil:',
        'Access:': 'Accès:',
        'Correction:': 'Correction:',
        'Deletion:': 'Suppression:',
        'Opt-out:': 'Désabonnement:',
        'Service Improvement:': 'Amélioration du Service:',
        'Legal Compliance:': 'Conformité Légale:',
        'Business Transactions:': 'Transactions Commerciales:'
    },
    'ar': {
        'Privacy Policy': 'سياسة الخصوصية',
        'Last Updated: October 31, 2024': 'آخر تحديث: 31 أكتوبر 2024',
        'Important:': 'مهم:',
        'Please review our updated Privacy Policy carefully.': 'يرجى مراجعة سياسة الخصوصية المحدثة بعناية.',
        '1. Introduction': '1. مقدمة',
        '2. Data Collection and Use': '2. جمع البيانات واستخدامها',
        '3. Data Security': '3. أمان البيانات',
        '4. User Rights': '4. حقوق المستخدم',
        '5. AI and User-Generated Content': '5. الذكاء الاصطناعي والمحتوى المُنشأ من المستخدم',
        '6. Data Retention and Deletion': '6. الاحتفاظ بالبيانات وحذفها',
        '7. Sharing of Data': '7. مشاركة البيانات',
        '8. Cookies and Tracking': '8. ملفات تعريف الارتباط والتتبع',
        '9. Updates to Privacy Policy': '9. تحديثات سياسة الخصوصية',
        '10. Contact Information': '10. معلومات الاتصال',
        'Personal Information:': 'المعلومات الشخصية:',
        'Usage Data:': 'بيانات الاستخدام:',
        'Device Information:': 'معلومات الجهاز:',
        'Access:': 'الوصول:',
        'Correction:': 'التصحيح:',
        'Deletion:': 'الحذف:',
        'Opt-out:': 'إلغاء الاشتراك:',
        'Service Improvement:': 'تحسين الخدمة:',
        'Legal Compliance:': 'الامتثال القانوني:',
        'Business Transactions:': 'المعاملات التجارية:'
    }
};

// Full paragraph translations for Spanish
const spanishParagraphs = {
    'Divinci AI, Inc. ("Company," "we," "us," or "our") values your privacy. This Privacy Policy outlines how we collect, use, and protect your personal data when you use our web, mobile, and SMS services (the "Services").':
    'Divinci AI, Inc. ("Compañía," "nosotros," "nos," o "nuestro") valora su privacidad. Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos sus datos personales cuando utiliza nuestros servicios web, móviles y SMS (los "Servicios").',
    
    'By using our Services, you consent to the collection and use of information as described in this Privacy Policy. If you do not agree with this policy, please refrain from using our Services.':
    'Al usar nuestros Servicios, usted consiente a la recopilación y uso de información como se describe en esta Política de Privacidad. Si no está de acuerdo con esta política, por favor absténgase de usar nuestros Servicios.',
    
    'Divinci AI collects data to enhance the user experience, improve AI model performance, and ensure responsible AI usage. We prioritize data transparency, ethical data use, and user trust. The types of data we collect include:':
    'Divinci AI recopila datos para mejorar la experiencia del usuario, mejorar el rendimiento del modelo de IA y garantizar el uso responsable de la IA. Priorizamos la transparencia de datos, el uso ético de datos y la confianza del usuario. Los tipos de datos que recopilamos incluyen:',
    
    'We use this information to:':
    'Usamos esta información para:',
    
    'We implement robust security measures to protect your data from unauthorized access or misuse. Security practices include encryption, access controls, and regular audits. Despite our best efforts, no system can guarantee complete security. In case of any security breaches, we will notify affected users as required by applicable laws.':
    'Implementamos medidas de seguridad robustas para proteger sus datos del acceso no autorizado o mal uso. Las prácticas de seguridad incluyen cifrado, controles de acceso y auditorías regulares. A pesar de nuestros mejores esfuerzos, ningún sistema puede garantizar seguridad completa. En caso de cualquier violación de seguridad, notificaremos a los usuarios afectados según lo requieran las leyes aplicables.',
    
    'Divinci AI respects your rights to your personal data. You may:':
    'Divinci AI respeta sus derechos sobre sus datos personales. Usted puede:',
    
    'For questions or requests regarding this Privacy Policy, please contact us at':
    'Para preguntas o solicitudes sobre esta Política de Privacidad, por favor contáctenos en'
};

function translatePrivacyPolicy(lang) {
    const filePath = path.join(lang, 'privacy-policy.html');
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Apply translations for headers and key terms
        const langTranslations = translations[lang];
        if (langTranslations) {
            for (const [english, translated] of Object.entries(langTranslations)) {
                const regex = new RegExp(escapeRegExp(english), 'g');
                if (content.includes(english)) {
                    content = content.replace(regex, translated);
                    modified = true;
                }
            }
        }

        // Apply Spanish paragraph translations
        if (lang === 'es') {
            for (const [english, spanish] of Object.entries(spanishParagraphs)) {
                if (content.includes(english)) {
                    content = content.replace(english, spanish);
                    modified = true;
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Translated privacy policy for ${lang.toUpperCase()}`);
        } else {
            console.log(`ℹ️  No translations applied for ${lang}`);
        }

    } catch (error) {
        console.error(`❌ Error translating ${filePath}:`, error.message);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
    console.log('🌍 Starting privacy policy translations...\n');

    const languages = ['es', 'fr', 'ar'];
    
    languages.forEach(lang => {
        console.log(`\n📝 Translating ${lang.toUpperCase()} privacy policy:`);
        translatePrivacyPolicy(lang);
    });

    console.log('\n✨ Privacy policy translations complete!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Translated headers and section titles');
    console.log('  ✅ Translated key terms and labels');
    console.log('  ✅ Applied paragraph translations for Spanish');
    console.log('  ✅ Preserved HTML structure and formatting');
}

if (require.main === module) {
    main();
}

module.exports = { translatePrivacyPolicy, translations };
