# Divinci.ai File Cleanup Guide

This document outlines the process for cleaning up the Divinci.ai website project by removing unnecessary files while keeping only those essential for the site to function properly.

## Project Structure

The project follows a simple structure with:

- HTML files for pages and components
- CSS files for styling
- JavaScript files for interactivity
- Image assets
- Optimized/minified versions of assets in the `/optimized` directory

## Files to Keep

### HTML Core Files
- `index.html` - Main homepage
- `about-us.html` - About Us page
- All other main navigation pages (careers, contact, pricing, etc.)
- HTML components in the `/includes` directory

### JavaScript Files
- Core JavaScript files in the `/js` directory
- Animation scripts (`divinci-animation.js`, etc.)
- Functionality scripts (`view-toggle.js`, `language-switcher.js`, etc.)
- Both original and optimized/minified versions

### CSS Files
- Main stylesheets (`styles.css`, `features-orbit.css`, etc.)
- Component styles in `/includes` and `/assets/css`
- Both original and optimized/minified versions

### Image Files
- All files in the `/images` directory
- Favicons and touch icons
- Optimized versions in `/optimized/images`

### Configuration and Build Files
- `package.json` and `package-lock.json`
- `robots.txt` and sitemap files
- Scripts in the `/scripts` directory

### Multilingual Support
- All files in the `/locales` directory

## Cleanup Process

A cleanup script is provided to automate the removal of unnecessary files:

```bash
# Run in dry-run mode first (no files are actually deleted)
node scripts/cleanup-files.js --dry-run

# Once you've verified the list of files to be removed, run the actual cleanup
node scripts/cleanup-files.js
```

The cleanup script:
1. Keeps all files specified in the essential files list
2. Preserves the directory structure for important directories
3. Removes any other files not directly needed
4. Cleans up empty directories after removing files

## Asset Optimization

The project uses an asset optimization process to minify CSS and JavaScript files and optimize images:

```bash
# Run the asset optimization
node scripts/optimize-assets.js
```

This creates minified and optimized versions in the `/optimized` directory, which are referenced by the HTML files.

## Manually Removing Files

If you prefer to manually clean up files, focus on removing:

1. Duplicate or outdated variations of pages/components
2. Unused test files and examples
3. Deprecated features or assets
4. Development-only files not needed in production

Always ensure you maintain both the original source files and their optimized versions that are referenced in the HTML.

## Important Notes

- The site uses a component-based approach with HTML includes loaded via `data-include` attributes
- Modern CSS with native nesting is used throughout the project
- File references in HTML often point to the optimized/minified versions in `/optimized`
- Translation files are essential for multilingual support

This file cleanup approach ensures the site remains fully functional while eliminating unnecessary files from the repository.