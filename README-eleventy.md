# Eleventy Migration Guide

This document explains how the Divinci.ai website has been migrated to use Eleventy (11ty) as a static site generator to improve component reuse and maintainability.

## Path Resolution Issues and Solutions

When migrating from a flat HTML structure to Eleventy, we encountered issues with how Eleventy generates nested directories for pages, causing problems with resource paths.

### Issues Identified

1. Eleventy creates nested output directories (e.g., `/pages/debug/index.html` for `/pages/debug.njk`)
2. This changes how relative paths work for resources like CSS, JS, and images
3. Resources that load correctly in the original site may fail to load in the generated site

### Solutions

1. **Use absolute paths for all resources**
   - Always use paths starting with `/` for all assets (e.g., `/styles.css` instead of `styles.css`)
   
2. **Implement custom output paths**
   - Use Eleventy's `permalink` front matter to control exact output paths:
   ```yaml
   ---
   permalink: /feature-name.html  # instead of default nested structure
   ---
   ```

3. **Add base tag to HTML head**
   - Include a `<base href="/">` tag in the document head to force all relative URLs to resolve from site root

4. **Enhanced passthrough file copying**
   - Ensure all assets are copied to the correct locations in the output directory
   - See the updated `.eleventy.js` configuration
   
5. **Testing resource loading**
   - Use the debug page at `/debug.html` to test if resources are loading correctly

## Project Structure

```
divinci.ai/
├── _eleventy/             # Eleventy source files
│   ├── _data/             # Site-wide data (site.json)
│   ├── _includes/         # Reusable components (header.njk, footer.njk)
│   ├── _layouts/          # Page layouts (base.njk, feature.njk)
│   ├── _11ty/             # 11ty configuration and filters
│   └── pages/             # Content pages in Nunjucks format
│       └── features/      # Feature pages
│           └── ...
├── _site/                 # Generated output (don't edit these files)
├── assets/                # Shared assets 
├── images/                # Image files
├── js/                    # JavaScript files
├── .eleventy.js           # Eleventy configuration
└── package.json           # NPM configuration with build scripts
```

## Key Components

### Layouts

- **base.njk**: Main layout with common head, header, footer
- **feature.njk**: Specialized layout for feature pages with standardized sections

### Includes

- **header.njk**: Site-wide navigation header
- **footer.njk**: Site-wide footer with navigation links

## Development Workflow

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Development Commands

- **Start development server:**
  ```
  npm run dev
  ```
  This will start a local server at http://localhost:8080

- **Build for production:**
  ```
  npm run build
  ```
  This generates static files in the `_site` directory

### Adding New Pages

1. Create a new `.njk` file in the `_eleventy/pages/` directory
2. Add the appropriate front matter:
   ```
   ---
   layout: base.njk
   title: Page Title
   description: Page description
   permalink: /page-url/
   ---
   ```
3. Add your page content using Nunjucks syntax

### Adding New Feature Pages

Create a new file in `_eleventy/pages/features/category/feature-name.njk` with this front matter:

```
---
layout: feature.njk
title: Feature Name
tagline: A brief tagline about the feature
description: SEO description 
permalink: /features/category/feature-name/index.html
primaryCta:
  url: /request-demo/
  text: Request Demo
secondaryCta:
  url: "#feature-details"
  text: Learn More
---
```

## Converting Existing Pages

To convert an existing HTML page to Eleventy:

1. Create a new `.njk` file in the appropriate location in `_eleventy/pages/`
2. Add appropriate front matter with layout and metadata
3. Copy the page content from the original HTML
4. Replace the header and footer with layout inheritance
5. Update any URLs to use relative paths from the site root

## Deployment

The site is built as static files in the `_site` directory, which can be deployed to any static hosting service:

1. Run `npm run build` to generate production files
2. Deploy the contents of `_site` to your web host

## Best Practices

- Always use layouts for consistent page structure
- Keep reusable components in the `_includes` directory
- Use front matter to define page metadata
- Place page-specific styles in a `{% block styles %}` section
- Place page-specific scripts in a `{% block scripts %}` section

## Resources

- [Eleventy Documentation](https://www.11ty.dev/docs/)
- [Nunjucks Templating](https://mozilla.github.io/nunjucks/templating.html)