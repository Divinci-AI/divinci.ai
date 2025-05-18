#!/usr/bin/env node

/**
 * Asset Optimization Script for Divinci AI
 * 
 * This script optimizes images and minifies CSS/JS files to improve page speed.
 * It uses LightningCSS to properly handle modern CSS features including nesting.
 * 
 * Usage:
 * node optimize-assets.js [--images-only] [--css-js-only] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const imagesOnly = args.includes('--images-only');
const cssJsOnly = args.includes('--css-js-only');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  cssExtensions: ['.css'],
  jsExtensions: ['.js'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'optimized'],
  excludeFiles: ['min.js', 'min.css', '.min.js', '.min.css'],
  imageOutputDir: 'optimized/images',
  cssOutputDir: 'optimized/css',
  jsOutputDir: 'optimized/js'
};

/**
 * Check if required tools and packages are installed
 */
function checkRequiredTools() {
  try {
    // Check for image optimization tools
    if (!imagesOnly && !cssJsOnly) {
      try {
        execSync('which imagemin', { stdio: 'ignore' });
      } catch (error) {
        console.error('❌ imagemin is not installed. Please install it with: npm install -g imagemin-cli');
        process.exit(1);
      }
    }

    // Check for CSS/JS minification tools and packages
    if (!imagesOnly) {
      try {
        execSync('which uglifyjs', { stdio: 'ignore' });
      } catch (error) {
        console.error('❌ UglifyJS is not installed. Please install it with: npm install -g uglify-js');
        process.exit(1);
      }

      // Check for LightningCSS packages
      try {
        require.resolve('lightningcss');
        require.resolve('browserslist');
      } catch (error) {
        console.error('❌ Required packages are not installed. Please install them with:');
        console.error('   npm install lightningcss browserslist --save-dev');
        process.exit(1);
      }
    }

    console.log('✅ All required tools and packages are installed.');
  } catch (error) {
    console.error('❌ Error checking required tools:', error.message);
    process.exit(1);
  }
}

/**
 * Create output directories if they don't exist
 */
function createOutputDirs() {
  const dirs = [];
  
  if (!cssJsOnly) {
    dirs.push(path.join(config.rootDir, config.imageOutputDir));
  }
  
  if (!imagesOnly) {
    dirs.push(path.join(config.rootDir, config.cssOutputDir));
    dirs.push(path.join(config.rootDir, config.jsOutputDir));
  }
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      if (isDryRun) {
        console.log(`🔍 Would create directory: ${dir}`);
      } else {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }
  }
}

/**
 * Find all files with specific extensions
 * @param {string} dir - Directory to search
 * @param {Array<string>} extensions - File extensions to find
 * @returns {Promise<Array<string>>} - Array of file paths
 */
async function findFiles(dir, extensions) {
  const files = [];
  
  async function scan(directory) {
    const entries = await readdir(directory);
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Skip excluded directories
        if (!config.excludeDirs.includes(entry)) {
          await scan(fullPath);
        }
      } else if (stats.isFile()) {
        // Check if file has one of the target extensions
        const ext = path.extname(entry).toLowerCase();
        if (extensions.includes(ext)) {
          // Skip already minified files
          if (!config.excludeFiles.some(exclude => entry.includes(exclude))) {
            files.push(fullPath);
          }
        }
      }
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Optimize images
 */
async function optimizeImages() {
  if (cssJsOnly) return;
  
  console.log('🔍 Finding images to optimize...');
  const imageFiles = await findFiles(config.rootDir, config.imageExtensions);
  console.log(`📷 Found ${imageFiles.length} images to optimize.`);
  
  for (const [index, file] of imageFiles.entries()) {
    const relativePath = path.relative(config.rootDir, file);
    const outputPath = path.join(config.rootDir, config.imageOutputDir, relativePath);
    const outputDir = path.dirname(outputPath);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      if (isDryRun) {
        console.log(`🔍 Would create directory: ${outputDir}`);
      } else {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    }
    
    // Optimize image
    console.log(`🔄 [${index + 1}/${imageFiles.length}] Optimizing: ${relativePath}`);
    
    if (isDryRun) {
      console.log(`🔍 Would optimize image: ${file} -> ${outputPath}`);
    } else {
      try {
        const ext = path.extname(file).toLowerCase();
        
        if (ext === '.svg') {
          // Optimize SVG
          execSync(`svgo "${file}" -o "${outputPath}"`, { stdio: 'ignore' });
        } else {
          // Optimize other image types
          execSync(`imagemin "${file}" --out-dir="${path.dirname(outputPath)}"`, { stdio: 'ignore' });
        }
        
        console.log(`✅ Optimized: ${relativePath}`);
      } catch (error) {
        console.error(`❌ Failed to optimize ${relativePath}: ${error.message}`);
      }
    }
  }
}

const lightningcss = require('lightningcss');
const browserslist = require('browserslist');

/**
 * Minify CSS files
 */
async function minifyCss() {
  if (imagesOnly) return;
  
  console.log('🔍 Finding CSS files to minify...');
  const cssFiles = await findFiles(config.rootDir, config.cssExtensions);
  console.log(`🎨 Found ${cssFiles.length} CSS files to minify.`);
  
  for (const [index, file] of cssFiles.entries()) {
    const relativePath = path.relative(config.rootDir, file);
    const outputPath = path.join(
      config.rootDir, 
      config.cssOutputDir, 
      relativePath.replace('.css', '.min.css')
    );
    const outputDir = path.dirname(outputPath);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      if (isDryRun) {
        console.log(`🔍 Would create directory: ${outputDir}`);
      } else {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    }
    
    // Minify CSS
    console.log(`🔄 [${index + 1}/${cssFiles.length}] Minifying: ${relativePath}`);
    
    if (isDryRun) {
      console.log(`🔍 Would minify CSS: ${file} -> ${outputPath}`);
    } else {
      try {
        // Read the CSS file
        const cssContent = fs.readFileSync(file, 'utf8');
        
        // Use LightningCSS JavaScript API for CSS minification
        // Configure with modern browser targets and nesting support
        const { code } = lightningcss.transform({
          filename: file,
          code: Buffer.from(cssContent),
          minify: true,
          sourceMap: false,
          drafts: {
            nesting: true
          },
          targets: lightningcss.browserslistToTargets(browserslist('>= 0.25%'))
        });
        
        // Write the minified CSS to the output file
        fs.writeFileSync(outputPath, code);
        console.log(`✅ Minified: ${relativePath}`);
      } catch (error) {
        console.error(`❌ Failed to minify ${relativePath}: ${error.message}`);
      }
    }
  }
}

/**
 * Minify JavaScript files
 */
async function minifyJs() {
  if (imagesOnly) return;
  
  console.log('🔍 Finding JavaScript files to minify...');
  const jsFiles = await findFiles(config.rootDir, config.jsExtensions);
  console.log(`📜 Found ${jsFiles.length} JavaScript files to minify.`);
  
  for (const [index, file] of jsFiles.entries()) {
    const relativePath = path.relative(config.rootDir, file);
    const outputPath = path.join(
      config.rootDir, 
      config.jsOutputDir, 
      relativePath.replace('.js', '.min.js')
    );
    const outputDir = path.dirname(outputPath);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      if (isDryRun) {
        console.log(`🔍 Would create directory: ${outputDir}`);
      } else {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    }
    
    // Minify JavaScript
    console.log(`🔄 [${index + 1}/${jsFiles.length}] Minifying: ${relativePath}`);
    
    if (isDryRun) {
      console.log(`🔍 Would minify JavaScript: ${file} -> ${outputPath}`);
    } else {
      try {
        execSync(`uglifyjs "${file}" -c -m -o "${outputPath}"`, { stdio: 'ignore' });
        console.log(`✅ Minified: ${relativePath}`);
      } catch (error) {
        console.error(`❌ Failed to minify ${relativePath}: ${error.message}`);
      }
    }
  }
}

/**
 * Generate a report of optimized files
 */
async function generateReport() {
  if (isDryRun) {
    console.log('🔍 Dry run completed. No files were actually optimized.');
    return;
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    images: [],
    css: [],
    js: []
  };
  
  // Get optimized images
  if (!cssJsOnly) {
    const imageDir = path.join(config.rootDir, config.imageOutputDir);
    if (fs.existsSync(imageDir)) {
      const getFiles = async (dir) => {
        const entries = await readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            return getFiles(fullPath);
          } else {
            const relativePath = path.relative(imageDir, fullPath);
            const originalPath = path.join(config.rootDir, relativePath);
            
            if (fs.existsSync(originalPath)) {
              const originalSize = (await stat(originalPath)).size;
              const optimizedSize = (await stat(fullPath)).size;
              const savings = originalSize - optimizedSize;
              const savingsPercent = (savings / originalSize * 100).toFixed(2);
              
              return {
                file: relativePath,
                originalSize,
                optimizedSize,
                savings,
                savingsPercent
              };
            }
            return null;
          }
        }));
        return files.flat().filter(Boolean);
      };
      
      report.images = await getFiles(imageDir);
    }
  }
  
  // Get minified CSS
  if (!imagesOnly) {
    const cssDir = path.join(config.rootDir, config.cssOutputDir);
    if (fs.existsSync(cssDir)) {
      const cssFiles = await findFiles(cssDir, ['.css']);
      for (const file of cssFiles) {
        const relativePath = path.relative(cssDir, file);
        const originalPath = path.join(
          config.rootDir, 
          relativePath.replace('.min.css', '.css')
        );
        
        if (fs.existsSync(originalPath)) {
          const originalSize = (await stat(originalPath)).size;
          const minifiedSize = (await stat(file)).size;
          const savings = originalSize - minifiedSize;
          const savingsPercent = (savings / originalSize * 100).toFixed(2);
          
          report.css.push({
            file: relativePath,
            originalSize,
            minifiedSize,
            savings,
            savingsPercent
          });
        }
      }
    }
    
    // Get minified JS
    const jsDir = path.join(config.rootDir, config.jsOutputDir);
    if (fs.existsSync(jsDir)) {
      const jsFiles = await findFiles(jsDir, ['.js']);
      for (const file of jsFiles) {
        const relativePath = path.relative(jsDir, file);
        const originalPath = path.join(
          config.rootDir, 
          relativePath.replace('.min.js', '.js')
        );
        
        if (fs.existsSync(originalPath)) {
          const originalSize = (await stat(originalPath)).size;
          const minifiedSize = (await stat(file)).size;
          const savings = originalSize - minifiedSize;
          const savingsPercent = (savings / originalSize * 100).toFixed(2);
          
          report.js.push({
            file: relativePath,
            originalSize,
            minifiedSize,
            savings,
            savingsPercent
          });
        }
      }
    }
  }
  
  // Write report to file
  const reportPath = path.join(config.rootDir, 'optimization-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Optimization report saved to: ${reportPath}`);
  
  // Print summary
  console.log('\n📊 Optimization Summary:');
  
  if (!cssJsOnly) {
    const totalImageSavings = report.images.reduce((sum, img) => sum + img.savings, 0);
    console.log(`📷 Images: ${report.images.length} optimized, saved ${formatBytes(totalImageSavings)}`);
  }
  
  if (!imagesOnly) {
    const totalCssSavings = report.css.reduce((sum, css) => sum + css.savings, 0);
    console.log(`🎨 CSS: ${report.css.length} minified, saved ${formatBytes(totalCssSavings)}`);
    
    const totalJsSavings = report.js.reduce((sum, js) => sum + js.savings, 0);
    console.log(`📜 JavaScript: ${report.js.length} minified, saved ${formatBytes(totalJsSavings)}`);
  }
  
  const totalSavings = 
    (!cssJsOnly ? report.images.reduce((sum, img) => sum + img.savings, 0) : 0) +
    (!imagesOnly ? report.css.reduce((sum, css) => sum + css.savings, 0) : 0) +
    (!imagesOnly ? report.js.reduce((sum, js) => sum + js.savings, 0) : 0);
  
  console.log(`💰 Total savings: ${formatBytes(totalSavings)}`);
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting asset optimization...');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE: No files will be modified');
  }
  
  // Check required tools
  checkRequiredTools();
  
  // Create output directories
  createOutputDirs();
  
  // Optimize images
  await optimizeImages();
  
  // Minify CSS
  await minifyCss();
  
  // Minify JavaScript
  await minifyJs();
  
  // Generate report
  await generateReport();
  
  console.log('🎉 Asset optimization completed!');
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
