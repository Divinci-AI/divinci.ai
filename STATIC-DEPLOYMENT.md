# Static Site Deployment Guide

This guide explains how to deploy the Divinci AI website as a static site to platforms like Cloudflare Pages, Netlify, or GitHub Pages.

## 🎯 Overview

The website has been optimized for static hosting with the following improvements:

1. **Fixed Language Switcher** - Now works correctly with `file://` protocol and static hosting
2. **Inlined Includes** - All HTML includes are inlined to avoid CORS issues
3. **Comprehensive Testing** - E2E tests verify functionality across all languages

## 🚀 Quick Start

### 1. Prepare for Static Deployment

```bash
# Inline all includes to make the site truly static
npm run prepare-static
```

This command will:
- Fix any `EOL < /dev/null` issues in HTML files
- Process all HTML files (`index.html`, `fr/index.html`, `es/index.html`, `ar/index.html`)
- Inline the content from `data-include` attributes
- Remove references to `include-html.js` since includes are now inlined

### 2. Test Locally

```bash
# Test the language switcher functionality
npm run test tests-new/language-switcher-static.test.js

# Test that includes are properly inlined
npm run test tests-new/includes-inlined.test.js
```

### 3. Deploy to Cloudflare Pages

1. **Connect your repository** to Cloudflare Pages
2. **Set build settings**:
   - Build command: `npm run prepare-static`
   - Build output directory: `/` (root directory)
   - Root directory: `/` (or leave empty)

3. **Deploy** - Cloudflare Pages will automatically build and deploy your site

## 🔧 How It Works

### Language Switcher Fix

The language switcher now properly handles static sites by:

- **Detecting static environments** - Identifies `file://` protocol and hosted static sites
- **Extracting relative paths** - Converts full file paths to relative paths for language detection
- **Constructing proper URLs** - Builds correct navigation URLs for both local testing and hosted sites

### Include Inlining

The `inline-includes.js` script:

- **Finds all `data-include` attributes** in HTML files
- **Reads the include files** from the `includes/` directory
- **Replaces the include divs** with the actual content
- **Removes include-html.js references** since they're no longer needed

## 📁 File Structure

```
divinci.ai/
├── index.html              # English homepage (includes inlined)
├── fr/index.html           # French homepage (includes inlined)
├── es/index.html           # Spanish homepage (includes inlined)
├── ar/index.html           # Arabic homepage (includes inlined)
├── includes/               # Source include files
│   ├── meta-tags.html      # SEO meta tags
│   ├── structured-data.html # JSON-LD structured data
│   └── footer.html         # Site footer
├── js/
│   └── language-switcher.js # Fixed language switching logic
├── inline-includes.js      # Script to inline includes
└── tests-new/
    ├── language-switcher-static.test.js # Language switcher tests
    └── includes-inlined.test.js         # Include inlining tests
```

## 🧪 Testing

### Language Switcher Tests

```bash
npm run test tests-new/language-switcher-static.test.js
```

Tests verify:
- ✅ Static site environment detection
- ✅ Language dropdown functionality
- ✅ Navigation between languages (EN ↔ FR ↔ ES ↔ AR)
- ✅ URL generation for static sites
- ✅ RTL language support

### Include Inlining Tests

```bash
npm run test tests-new/includes-inlined.test.js
```

Tests verify:
- ✅ No CORS errors from include loading
- ✅ Footer content properly inlined
- ✅ Meta tags properly inlined
- ✅ Structured data properly inlined

## 🔄 Development Workflow

### Making Changes to Includes

1. **Edit the source files** in the `includes/` directory
2. **Run the preparation script** to update all HTML files:
   ```bash
   npm run prepare-static
   ```
   Or run individual scripts:
   ```bash
   npm run fix-eol        # Fix EOL issues
   npm run inline-includes # Inline includes
   ```
3. **Test the changes**:
   ```bash
   npm run test tests-new/
   ```
4. **Commit and deploy**

### Adding New Languages

1. **Create the language directory** (e.g., `de/` for German)
2. **Copy and translate** the `index.html` file
3. **Update the inline script** to include the new file in `filesToProcess`
4. **Run the inline script** to process includes
5. **Update language switcher** to include the new language option

## 🌐 Deployment Platforms

### Cloudflare Pages ⭐ (Recommended)

- **Build command**: `npm run prepare-static`
- **Output directory**: `/`
- **Automatic deployments** on git push
- **Global CDN** with excellent performance
- **Custom domains** and SSL included

### Netlify

- **Build command**: `npm run prepare-static`
- **Publish directory**: `/`
- **Branch deploys** and preview deployments
- **Form handling** and serverless functions available

### GitHub Pages

- **Build with GitHub Actions**:
  ```yaml
  - name: Prepare static site
    run: npm run prepare-static
  ```
- **Deploy from root directory**
- **Custom domains** supported

### Vercel

- **Build command**: `npm run prepare-static`
- **Output directory**: `/`
- **Automatic deployments** and preview URLs

## 🐛 Troubleshooting

### Language Switcher Not Working

1. **Check console for errors** in browser dev tools
2. **Verify JavaScript is enabled**
3. **Test with the E2E tests**:
   ```bash
   npm run test tests-new/language-switcher-static.test.js
   ```

### Include Content Missing

1. **Run the inline script**:
   ```bash
   npm run inline-includes
   ```
2. **Check that include files exist** in the `includes/` directory
3. **Verify with tests**:
   ```bash
   npm run test tests-new/includes-inlined.test.js
   ```

### CORS Errors

If you see CORS errors, it means the includes haven't been properly inlined:
1. **Run the inline script** again
2. **Check that `include-html.js` references are removed**
3. **Verify no `data-include` attributes remain** in the HTML

## 📈 Performance

The static site optimizations provide:

- **Faster loading** - No dynamic include loading
- **Better SEO** - All content is immediately available
- **Improved reliability** - No dependency on JavaScript for core content
- **Global CDN compatibility** - Works perfectly with edge caching

## 🎉 Success!

Your Divinci AI website is now ready for static deployment! The language switcher works perfectly, includes are inlined, and the site is optimized for global CDN delivery.

For questions or issues, check the test results or create an issue in the repository.
