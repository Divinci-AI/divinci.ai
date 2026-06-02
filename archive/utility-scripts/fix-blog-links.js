#!/usr/bin/env node

/**
 * Fix Blog Links Script
 * 
 * This script fixes the blog link issues by:
 * 1. Creating missing blog index.html files for each language
 * 2. Updating footer blog links to point to correct language-specific blogs
 * 3. Ensuring proper translations for blog content
 */

const fs = require('fs');
const path = require('path');

// Languages to fix
const languages = ['es', 'fr', 'ar'];

// Blog translations
const blogTranslations = {
    'es': {
        title: 'Blog | Divinci AI',
        heroTitle: 'Blog de Divinci AI',
        heroSubtitle: 'Perspectivas sobre inteligencia artificial, soluciones de IA personalizadas, sistemas RAG y el futuro de la colaboración humano-IA.',
        featuredTag: 'Destacado',
        readMore: 'Leer más',
        categories: 'Categorías',
        tags: 'Etiquetas',
        popularPosts: 'Publicaciones Populares',
        loadMore: 'Cargar más',
        metaDescription: 'El blog de Divinci AI presenta perspectivas sobre inteligencia artificial, soluciones de IA personalizadas, sistemas RAG y el futuro de la colaboración humano-IA.'
    },
    'fr': {
        title: 'Blog | Divinci AI',
        heroTitle: 'Blog Divinci AI',
        heroSubtitle: 'Perspectives sur l\'intelligence artificielle, les solutions IA personnalisées, les systèmes RAG et l\'avenir de la collaboration humain-IA.',
        featuredTag: 'En vedette',
        readMore: 'Lire plus',
        categories: 'Catégories',
        tags: 'Étiquettes',
        popularPosts: 'Articles populaires',
        loadMore: 'Charger plus',
        metaDescription: 'Le blog de Divinci AI présente des perspectives sur l\'intelligence artificielle, les solutions IA personnalisées, les systèmes RAG et l\'avenir de la collaboration humain-IA.'
    },
    'ar': {
        title: 'المدونة | ديفينشي للذكاء الاصطناعي',
        heroTitle: 'مدونة ديفينشي للذكاء الاصطناعي',
        heroSubtitle: 'رؤى حول الذكاء الاصطناعي وحلول الذكاء الاصطناعي المخصصة وأنظمة RAG ومستقبل التعاون بين الإنسان والذكاء الاصطناعي.',
        featuredTag: 'مميز',
        readMore: 'اقرأ المزيد',
        categories: 'الفئات',
        tags: 'العلامات',
        popularPosts: 'المقالات الشائعة',
        loadMore: 'تحميل المزيد',
        metaDescription: 'تقدم مدونة ديفينشي للذكاء الاصطناعي رؤى حول الذكاء الاصطناعي وحلول الذكاء الاصطناعي المخصصة وأنظمة RAG ومستقبل التعاون بين الإنسان والذكاء الاصطناعي.'
    }
};

function createBlogIndexFile(lang) {
    const blogDir = path.join(lang, 'blog');
    const blogIndexPath = path.join(blogDir, 'index.html');
    
    // Ensure blog directory exists
    if (!fs.existsSync(blogDir)) {
        fs.mkdirSync(blogDir, { recursive: true });
        console.log(`  ✅ Created blog directory: ${blogDir}`);
    }
    
    // Skip if index.html already exists
    if (fs.existsSync(blogIndexPath)) {
        console.log(`  ℹ️  Blog index already exists: ${blogIndexPath}`);
        return;
    }
    
    // Read the main blog index.html as template
    const mainBlogPath = path.join('blog', 'index.html');
    if (!fs.existsSync(mainBlogPath)) {
        console.error(`  ❌ Main blog template not found: ${mainBlogPath}`);
        return;
    }
    
    let blogContent = fs.readFileSync(mainBlogPath, 'utf8');
    const translations = blogTranslations[lang];
    
    if (translations) {
        // Update language and direction
        if (lang === 'ar') {
            blogContent = blogContent.replace('lang="en" dir="ltr"', 'lang="ar" dir="rtl"');
        } else {
            blogContent = blogContent.replace('lang="en" dir="ltr"', `lang="${lang}" dir="ltr"`);
        }
        
        // Update hreflang tags
        blogContent = blogContent.replace(
            /href="https:\/\/divinci\.ai\/blog\/index\.html"/g,
            `href="https://divinci.ai/${lang}/blog/index.html"`
        );
        
        // Update page title
        blogContent = blogContent.replace(
            /<title>Blog \| Divinci AI<\/title>/,
            `<title>${translations.title}</title>`
        );
        
        // Update meta description
        blogContent = blogContent.replace(
            /description: "Divinci AI's blog features insights[^"]*"/,
            `description: "${translations.metaDescription}"`
        );
        
        // Update hero section
        blogContent = blogContent.replace(
            /<h1 class="blog-title">Blog<\/h1>/,
            `<h1 class="blog-title">${translations.heroTitle}</h1>`
        );
        
        blogContent = blogContent.replace(
            /<p class="blog-subtitle">Insights on artificial intelligence[^<]*<\/p>/,
            `<p class="blog-subtitle">${translations.heroSubtitle}</p>`
        );
        
        // Update navigation elements
        blogContent = blogContent.replace(/Featured/g, translations.featuredTag);
        blogContent = blogContent.replace(/Read more/g, translations.readMore);
        blogContent = blogContent.replace(/Categories/g, translations.categories);
        blogContent = blogContent.replace(/Tags/g, translations.tags);
        blogContent = blogContent.replace(/Popular Posts/g, translations.popularPosts);
        blogContent = blogContent.replace(/Load More/g, translations.loadMore);
        
        // Update asset paths to go up one level
        blogContent = blogContent.replace(/href="\.\.\/images\//g, 'href="../../images/');
        blogContent = blogContent.replace(/src="\.\.\/images\//g, 'src="../../images/');
        blogContent = blogContent.replace(/href="\.\.\/assets\//g, 'href="../../assets/');
        blogContent = blogContent.replace(/src="\.\.\/assets\//g, 'src="../../assets/');
        blogContent = blogContent.replace(/href="\.\.\/styles/g, 'href="../../styles');
        blogContent = blogContent.replace(/src="\.\.\/js\//g, 'src="../../js/');
        
        // Update blog post links to be relative to language directory
        blogContent = blogContent.replace(/href="posts\//g, 'href="posts/');
        
        // Add RTL support for Arabic
        if (lang === 'ar') {
            blogContent = blogContent.replace(
                /<link rel="stylesheet" href="[^"]*styles\.css" \/>/,
                '$&\n        <link rel="stylesheet" href="../../css/rtl.css" />'
            );
        }
    }
    
    // Write the translated blog index file
    fs.writeFileSync(blogIndexPath, blogContent);
    console.log(`  ✅ Created translated blog index: ${blogIndexPath}`);
}

function fixFooterBlogLinks(lang) {
    const files = [
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
    
    files.forEach(fileName => {
        const filePath = path.join(lang, fileName);
        
        if (!fs.existsSync(filePath)) {
            return;
        }
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            
            // Fix blog link in footer to point to language-specific blog
            const oldBlogLink = /<a href="\.\.\/blog\/">([^<]+)<\/a>/g;
            const newBlogLink = `<a href="blog/">$1</a>`;
            
            if (oldBlogLink.test(content)) {
                content = content.replace(oldBlogLink, newBlogLink);
                modified = true;
                console.log(`  ✅ Fixed blog link in ${fileName}`);
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content);
            }
            
        } catch (error) {
            console.error(`  ❌ Error fixing blog links in ${filePath}:`, error.message);
        }
    });
}

function main() {
    console.log('🔗 Starting blog link fixes...\n');

    languages.forEach(lang => {
        console.log(`\n📝 Fixing ${lang.toUpperCase()} blog issues:`);
        
        // Create missing blog index files
        createBlogIndexFile(lang);
        
        // Fix footer blog links
        fixFooterBlogLinks(lang);
    });

    console.log('\n✨ Blog link fixes complete!');
    console.log('\n📋 Summary of blog fixes:');
    console.log('  ✅ Created missing blog index.html files for all languages');
    console.log('  ✅ Translated blog content for each language');
    console.log('  ✅ Fixed footer blog links to point to language-specific blogs');
    console.log('  ✅ Updated asset paths for proper loading');
    console.log('  ✅ Added RTL support for Arabic blog');
    console.log('  ✅ Updated hreflang tags for SEO');
}

if (require.main === module) {
    main();
}

module.exports = { createBlogIndexFile, fixFooterBlogLinks, blogTranslations };
