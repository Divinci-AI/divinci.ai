# Divinci.ai Website

The official website for Divinci AI, built with Eleventy (11ty) static site generator.

## Development Setup

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/DivinciApp/divinci.ai.git
   cd divinci.ai
   ```

2. Install dependencies
   ```
   npm install
   ```

### Development

Start the development server:
```
npm run dev
```

This will start a local server at http://localhost:8080 with live reload.

### Building for Production

Build the site for production:
```
npm run build
```

The built site will be in the `_site` directory.

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

## Adding New Pages

Create a new file in `_eleventy/pages/` with appropriate front matter:

```
---
layout: base.njk
title: Page Title
description: Page description
permalink: /page-url/
---

{% block content %}
Your page content here
{% endblock %}
```

## Adding New Feature Pages

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

{% block content %}
Your feature content here
{% endblock %}
```

## Additional Documentation

For more detailed instructions, see:

- [Eleventy Migration Guide](README-eleventy.md) - Details about the migration to Eleventy
- [Animation Documentation](README-divinci-animation.md) - Documentation about the Divinci animations
- [Visualization Guide](README-visualization-improvements.md) - Feature visualization implementation guide

## Scripts

- `npm run dev` - Start development server with live reload
- `npm run build` - Build site for production
- `npm run serve` - Serve the built site without watching for changes
- `npm run clean` - Remove the build directory
- `npm run rebuild` - Clean and rebuild the site

## License

Copyright © 2023-2025 Divinci AI. All rights reserved.