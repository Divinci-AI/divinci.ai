#!/usr/bin/env node

/**
 * Generate Language-Specific Sitemaps
 * 
 * This script creates language-specific sitemaps for the website.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

const writeFile = promisify(fs.writeFile);

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  defaultLanguage: 'en',
  baseUrl: 'https://divinci.ai',
  rootDir: path.resolve(__dirname, '..')
};

/**
 * Generate a sitemap for a specific language
 * @param {string} langCode - Language code
 */
async function generateSitemap(langCode) {
  try {
    // Find all HTML files for the language
    const pattern = langCode === config.defaultLanguage
      ? '**/*.html'
      : `${langCode}/**/*.html`;
    
    const htmlFiles = glob.sync(pattern, {
      cwd: config.rootDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'zola-site/templates/**',
        'templates/**',
        'includes/**',
        '**/404.html'
      ]
    });
    
    console.log(`📂 Found ${htmlFiles.length} HTML files for ${langCode}`);
    
    // Generate sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
    
    for (const file of htmlFiles) {
      // Skip files that shouldn't be in the sitemap
      if (file.includes('404.html') || file.includes('error.html')) {
        continue;
      }
      
      // Get the URL path
      let urlPath = file;
      
      // Remove index.html from the end
      if (urlPath.endsWith('index.html')) {
        urlPath = urlPath.replace(/index\.html$/, '');
      }
      
      // Add the URL to the sitemap
      sitemap += '  <url>\n';
      sitemap += `    <loc>${config.baseUrl}/${urlPath}</loc>\n`;
      
      // Add alternate language links
      for (const lang of config.languages) {
        // Skip the current language
        if (lang.code === langCode) {
          continue;
        }
        
        // Generate the alternate URL
        let alternatePath = file;
        
        if (langCode === config.defaultLanguage) {
          // Current is default, alternate is non-default
          alternatePath = `${lang.code}/${file}`;
        } else if (lang.code === config.defaultLanguage) {
          // Current is non-default, alternate is default
          alternatePath = file.replace(`${langCode}/`, '');
        } else {
          // Both are non-default
          alternatePath = file.replace(`${langCode}/`, `${lang.code}/`);
        }
        
        // Remove index.html from the end
        if (alternatePath.endsWith('index.html')) {
          alternatePath = alternatePath.replace(/index\.html$/, '');
        }
        
        sitemap += `    <xhtml:link rel="alternate" hreflang="${lang.code}" href="${config.baseUrl}/${alternatePath}" />\n`;
      }
      
      // Add x-default link
      const xDefaultPath = langCode === config.defaultLanguage
        ? urlPath
        : file.replace(`${langCode}/`, '');
      
      sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${config.baseUrl}/${xDefaultPath}" />\n`;
      
      // Add lastmod (current date)
      const today = new Date().toISOString().split('T')[0];
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      
      // Add changefreq and priority
      sitemap += '    <changefreq>weekly</changefreq>\n';
      
      // Set priority based on the URL
      let priority = '0.5';
      
      if (urlPath === '' || urlPath === 'index.html') {
        priority = '1.0';
      } else if (urlPath.split('/').length <= 2) {
        priority = '0.8';
      } else if (urlPath.includes('blog/posts/')) {
        priority = '0.6';
      }
      
      sitemap += `    <priority>${priority}</priority>\n`;
      sitemap += '  </url>\n';
    }
    
    sitemap += '</urlset>';
    
    // Write the sitemap file
    const sitemapPath = langCode === config.defaultLanguage
      ? path.join(config.rootDir, 'sitemap.xml')
      : path.join(config.rootDir, `sitemap_${langCode}.xml`);
    
    await writeFile(sitemapPath, sitemap, 'utf8');
    console.log(`✅ Generated sitemap for ${langCode}: ${sitemapPath}`);
  } catch (error) {
    console.error(`❌ Error generating sitemap for ${langCode}:`, error.message);
  }
}

/**
 * Generate a sitemap index file
 */
async function generateSitemapIndex() {
  try {
    // Generate sitemap index XML
    let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add the main sitemap
    sitemapIndex += '  <sitemap>\n';
    sitemapIndex += `    <loc>${config.baseUrl}/sitemap.xml</loc>\n`;
    sitemapIndex += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    sitemapIndex += '  </sitemap>\n';
    
    // Add language-specific sitemaps
    for (const lang of config.languages) {
      if (lang.code === config.defaultLanguage) {
        continue;
      }
      
      sitemapIndex += '  <sitemap>\n';
      sitemapIndex += `    <loc>${config.baseUrl}/sitemap_${lang.code}.xml</loc>\n`;
      sitemapIndex += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemapIndex += '  </sitemap>\n';
    }
    
    sitemapIndex += '</sitemapindex>';
    
    // Write the sitemap index file
    const sitemapIndexPath = path.join(config.rootDir, 'sitemap_index.xml');
    await writeFile(sitemapIndexPath, sitemapIndex, 'utf8');
    console.log(`✅ Generated sitemap index: ${sitemapIndexPath}`);
  } catch (error) {
    console.error('❌ Error generating sitemap index:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Generating language-specific sitemaps...');
    
    // Generate sitemaps for each language
    for (const lang of config.languages) {
      await generateSitemap(lang.code);
    }
    
    // Generate sitemap index
    await generateSitemapIndex();
    
    console.log('🎉 Sitemaps generated successfully!');
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
