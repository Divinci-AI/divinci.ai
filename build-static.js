#!/usr/bin/env node

/**
 * Build Script for Static HTML Generation
 * Converts dynamic includes to static content for Cloudflare Pages compatibility
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INCLUDES_DIR = 'includes';
const OUTPUT_DIR = 'static-build';

// Page-specific metadata
const PAGE_METADATA = {
    'index.html': {
        title: 'Divinci™ Multiplayer AI Chat',
        description: 'Divinci AI is your AI for life\'s journey, with friends! Create custom AI solutions and collaborate with your favorite AI models in a multiplayer environment.',
        image: 'divinci-default-social.png',
        url: '/index.html',
        type: 'website',
        keywords: 'divinci ai, multiplayer ai, ai chat, custom ai, chatgpt, claude, gemini, ai collaboration'
    },
    'about-us.html': {
        title: 'About Us - Divinci AI',
        description: 'Learn about Divinci AI\'s mission, vision, team, and the story behind our innovative AI platform.',
        image: 'about-us-social.png',
        url: '/about-us.html',
        type: 'website',
        keywords: 'divinci ai, about divinci, ai team, ai founders'
    },
    'contact.html': {
        title: 'Contact Us - Divinci AI',
        description: 'Get in touch with the Divinci AI team. We\'d love to hear from you!',
        image: 'contact-social.png',
        url: '/contact.html',
        type: 'website',
        keywords: 'divinci ai, contact, support, get in touch'
    },
    'accessibility.html': {
        title: 'Accessibility - Divinci AI',
        description: 'Learn about Divinci AI\'s commitment to accessibility and inclusive design.',
        image: 'accessibility-social.png',
        url: '/accessibility.html',
        type: 'website',
        keywords: 'divinci ai, accessibility, inclusive design, web accessibility'
    },
    'press.html': {
        title: 'Press & Media - Divinci AI',
        description: 'Latest news, press releases, and media coverage about Divinci AI.',
        image: 'press-social.png',
        url: '/press.html',
        type: 'website',
        keywords: 'divinci ai, press, media, news, press releases'
    },
    'changelog.html': {
        title: 'Changelog - Divinci AI',
        description: 'Stay updated with the latest features, improvements, and bug fixes in Divinci AI.',
        image: 'changelog-social.png',
        url: '/changelog.html',
        type: 'website',
        keywords: 'divinci ai, changelog, updates, new features, improvements'
    },
    'privacy-policy.html': {
        title: 'Privacy Policy - Divinci AI',
        description: 'Learn how Divinci AI protects your privacy and handles your data.',
        image: 'privacy-social.png',
        url: '/privacy-policy.html',
        type: 'website',
        keywords: 'divinci ai, privacy policy, data protection, privacy'
    },
    'terms-of-service.html': {
        title: 'Terms of Service - Divinci AI',
        description: 'Terms and conditions for using Divinci AI services.',
        image: 'terms-social.png',
        url: '/terms-of-service.html',
        type: 'website',
        keywords: 'divinci ai, terms of service, legal, conditions'
    },
    'careers.html': {
        title: 'Careers - Divinci AI',
        description: 'Join the Divinci AI team and help shape the future of human-AI collaboration.',
        image: 'careers-social.png',
        url: '/careers.html',
        type: 'website',
        keywords: 'divinci ai, careers, jobs, hiring, work with us'
    },
    'support.html': {
        title: 'Support - Divinci AI',
        description: 'Get help and support for Divinci AI products and services.',
        image: 'support-social.png',
        url: '/support.html',
        type: 'website',
        keywords: 'divinci ai, support, help, customer service'
    },
    'roadmap.html': {
        title: 'Product Roadmap - Divinci AI',
        description: 'Discover what\'s coming next in Divinci AI\'s product development.',
        image: 'roadmap-social.png',
        url: '/roadmap.html',
        type: 'website',
        keywords: 'divinci ai, roadmap, future features, product development'
    },
    'ai-safety-ethics.html': {
        title: 'AI Safety & Ethics - Divinci AI',
        description: 'Our commitment to responsible AI development and ethical practices.',
        image: 'ai-safety-social.png',
        url: '/ai-safety-ethics.html',
        type: 'website',
        keywords: 'divinci ai, ai safety, ethics, responsible ai'
    },
    'cookies.html': {
        title: 'Cookie Policy - Divinci AI',
        description: 'Information about how Divinci AI uses cookies and similar technologies.',
        image: 'cookies-social.png',
        url: '/cookies.html',
        type: 'website',
        keywords: 'divinci ai, cookies, cookie policy, tracking'
    },
    'internships.html': {
        title: 'Internships - Divinci AI',
        description: 'Internship opportunities at Divinci AI for students and recent graduates.',
        image: 'internships-social.png',
        url: '/internships.html',
        type: 'website',
        keywords: 'divinci ai, internships, students, opportunities'
    }
};

/**
 * Read file content safely
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
        return '';
    }
}

/**
 * Process template variables in content
 */
function processTemplateVariables(content, metadata) {
    const defaults = {
        title: 'Divinci AI',
        description: 'Divinci AI is building the future of human-AI collaboration.',
        image: 'divinci-default-social.png',
        url: '/',
        type: 'website',
        keywords: 'divinci ai, ai platform, custom ai solutions'
    };

    const data = { ...defaults, ...metadata };

    return content
        .replace(/\{\{page_title\}\}/g, data.title)
        .replace(/\{\{page_description\}\}/g, data.description)
        .replace(/\{\{og_image\}\}/g, data.image)
        .replace(/\{\{page_url\}\}/g, data.url)
        .replace(/\{\{og_type\}\}/g, data.type)
        .replace(/\{\{page_keywords\}\}/g, data.keywords);
}

/**
 * Process includes in HTML content
 */
function processIncludes(htmlContent, basePath = '') {
    const includeRegex = /<div[^>]*data-include="([^"]+)"[^>]*><\/div>/g;

    return htmlContent.replace(includeRegex, (match, includePath) => {
        console.log(`Processing include: ${includePath}`);

        // Resolve include path relative to base path
        const fullIncludePath = path.join(basePath, includePath);
        const includeContent = readFile(fullIncludePath);

        if (!includeContent) {
            console.warn(`Warning: Include file not found: ${fullIncludePath}`);
            return `<!-- Include not found: ${includePath} -->`;
        }

        return includeContent;
    });
}

/**
 * Remove dynamic scripts that are no longer needed
 */
function removeDynamicScripts(htmlContent) {
    // Remove debug-include script
    htmlContent = htmlContent.replace(
        /<script[^>]*src="[^"]*debug-include[^"]*"[^>]*><\/script>/g,
        ''
    );

    // Remove structured-data script
    htmlContent = htmlContent.replace(
        /<script[^>]*src="[^"]*structured-data[^"]*"[^>]*><\/script>/g,
        ''
    );

    // Remove meta tag setting scripts
    htmlContent = htmlContent.replace(
        /<!-- Initialize page-specific meta tags and structured data -->[\s\S]*?<\/script>/g,
        ''
    );

    return htmlContent;
}

/**
 * Process a single HTML file
 */
function processHtmlFile(inputPath, outputPath) {
    const htmlContent = readFile(inputPath);
    if (!htmlContent) {
        console.error(`❌ Error: Could not read input file: ${inputPath}`);
        return false;
    }

    // Get page metadata
    const fileName = path.basename(inputPath);
    let metadata = PAGE_METADATA[fileName] || {
        title: 'Divinci AI',
        description: 'Divinci AI is building the future of human-AI collaboration.',
        image: 'divinci-default-social.png',
        url: '/' + inputPath.replace(/^\.\//, '').replace(/\\/g, '/'),
        type: 'website',
        keywords: 'divinci ai, ai platform, custom ai solutions'
    };

    // Apply language-specific metadata
    metadata = getLanguageMetadata(inputPath, metadata);

    // Process the content
    let processedContent = htmlContent;

    // 1. Process includes
    const basePath = path.dirname(inputPath);
    processedContent = processIncludes(processedContent, basePath);

    // 2. Process template variables
    processedContent = processTemplateVariables(processedContent, metadata);

    // 3. Remove dynamic scripts
    processedContent = removeDynamicScripts(processedContent);

    // 4. Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5. Write processed content
    try {
        fs.writeFileSync(outputPath, processedContent);
        console.log(`  ✅ Success: ${fileName}`);
        return true;
    } catch (error) {
        console.error(`  ❌ Error writing file ${outputPath}: ${error.message}`);
        return false;
    }
}

/**
 * Get language-specific metadata
 */
function getLanguageMetadata(filePath, baseMetadata) {
    const langMap = {
        'es/': { lang: 'es', suffix: ' - Español' },
        'fr/': { lang: 'fr', suffix: ' - Français' },
        'ar/': { lang: 'ar', suffix: ' - العربية' }
    };

    for (const [langPath, langInfo] of Object.entries(langMap)) {
        if (filePath.includes(langPath)) {
            return {
                ...baseMetadata,
                title: baseMetadata.title + langInfo.suffix,
                url: '/' + filePath.replace(/\\/g, '/'),
                language: langInfo.lang
            };
        }
    }

    return baseMetadata;
}

/**
 * Find all HTML files with data-include
 */
function findHtmlFilesWithIncludes() {
    const { execSync } = require('child_process');
    try {
        const output = execSync('find . -name "*.html" -exec grep -l "data-include" {} \\;', { encoding: 'utf8' });
        return output.trim().split('\n').filter(file => file && !file.includes('test-static-loading.html'));
    } catch (error) {
        console.warn('Could not find files with grep, falling back to manual list');
        return [
            './index.html',
            './about-us.html',
            './contact.html',
            './accessibility.html',
            './press.html',
            './changelog.html',
            './privacy-policy.html',
            './terms-of-service.html',
            './careers.html',
            './support.html',
            './roadmap.html',
            './ai-safety-ethics.html',
            './cookies.html',
            './internships.html'
        ];
    }
}

/**
 * Process all HTML files with includes
 */
function buildAll() {
    console.log('🚀 Starting comprehensive static build process...');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Find all files with includes
    const filesToProcess = findHtmlFilesWithIncludes();
    console.log(`Found ${filesToProcess.length} files to process:`);
    filesToProcess.forEach(file => console.log(`  - ${file}`));

    let successCount = 0;
    let failCount = 0;

    // Process each file
    for (const inputFile of filesToProcess) {
        const cleanPath = inputFile.replace(/^\.\//, '');
        const outputFile = path.join(OUTPUT_DIR, cleanPath);

        console.log(`\n📄 Processing: ${cleanPath}`);

        if (processHtmlFile(inputFile, outputFile)) {
            successCount++;
        } else {
            failCount++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 BUILD SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${successCount} files`);
    console.log(`❌ Failed to process: ${failCount} files`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);

    if (failCount === 0) {
        console.log('\n🎉 All files processed successfully!');
        console.log('Your website is now ready for Cloudflare Pages deployment.');
    } else {
        console.log(`\n⚠️  ${failCount} files had issues. Check the logs above.`);
    }

    return failCount === 0;
}

/**
 * Main build function (single file)
 */
function build() {
    console.log('Starting static build process...');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Process index.html as example
    const success = processHtmlFile('index.html', path.join(OUTPUT_DIR, 'index.html'));

    if (success) {
        console.log('\n✓ Build completed successfully!');
        console.log(`Output directory: ${OUTPUT_DIR}`);
        console.log('\nTo process all files, run:');
        console.log('node build-static.js --all');
    } else {
        console.log('\n✗ Build failed!');
        process.exit(1);
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--all') || args.includes('-a')) {
        // Process all files
        buildAll();
    } else if (args.length === 2) {
        // Process specific file
        const [inputFile, outputFile] = args;
        processHtmlFile(inputFile, outputFile);
    } else if (args.length === 0) {
        // Run single file build (index.html)
        build();
    } else {
        console.log('Usage:');
        console.log('  node build-static.js                    # Build index.html only');
        console.log('  node build-static.js --all              # Build ALL files with includes');
        console.log('  node build-static.js <input> <output>   # Process specific file');
        console.log('');
        console.log('Examples:');
        console.log('  node build-static.js --all');
        console.log('  node build-static.js contact.html static-build/contact.html');
    }
}

module.exports = {
    processHtmlFile,
    processIncludes,
    processTemplateVariables,
    removeDynamicScripts
};
