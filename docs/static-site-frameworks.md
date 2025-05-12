# Static Site Framework Recommendations for Divinci.ai

## Current Challenges
- Manual HTML includes causing white screen issues
- Inconsistent header/footer maintenance across pages
- JavaScript-based includes requiring complex path resolution
- No build step for optimizations

## Recommended Static Site Frameworks

### 1. Eleventy (11ty)
**Complexity: Low | Learning Curve: Gentle | Build Speed: Fast**

#### Why it's a good fit:
- Simple migration path from static HTML
- Templating with Nunjucks (similar to HTML)
- Zero client-side JavaScript by default
- Built-in support for includes and layouts
- High performance, small build output
- Supports multiple template languages

#### Migration approach:
1. Move existing HTML into templates
2. Create layout files for shared components (header, footer)
3. Use includes for dynamic content
4. Minimal configuration needed

**Example structure:**
```
_includes/
  header.njk
  footer.njk
_layouts/
  base.njk
  feature-page.njk
pages/
  index.njk
  features/
    feature1.njk
assets/ (static files)
```

### 2. Astro
**Complexity: Medium | Learning Curve: Moderate | Build Speed: Fast**

#### Why it's a good fit:
- "Islands" architecture - keeps existing JavaScript intact
- HTML-first approach
- Zero client-side JavaScript by default (optional)
- Component-based development
- Built-in image optimization
- Excellent performance metrics

#### Migration approach:
1. Convert HTML pages to Astro components
2. Create shared components for header and footer
3. Keep existing JavaScript functionality
4. Build static output

**Example structure:**
```
src/
  components/
    Header.astro
    Footer.astro
  layouts/
    BaseLayout.astro
    FeatureLayout.astro
  pages/
    index.astro
    features/
      feature1.astro
public/ (static files)
```

### 3. Next.js (Static Export)
**Complexity: Higher | Learning Curve: Steeper | Build Speed: Fast**

#### Why it's a good fit:
- React-based but can export fully static sites
- Good if future interactivity needs increase
- Great developer experience
- Excellent performance optimization
- Comprehensive ecosystem

#### Migration approach:
1. Convert HTML to React components
2. Create shared components for header and footer
3. Use static generation for all pages
4. Export as static site

**Example structure:**
```
components/
  Header.jsx
  Footer.jsx
layouts/
  BaseLayout.jsx
  FeatureLayout.jsx
pages/
  index.jsx
  features/
    feature1.jsx
public/ (static files)
```

## Implementation Recommendations

### Immediate Solution (1-2 days)
**Eleventy** provides the fastest path to implementation:

1. Install Eleventy: `npm install -g @11ty/eleventy`
2. Create minimal configuration (eleventy.config.js)
3. Move existing HTML into templates
4. Create includes for header and footer
5. Configure build process

### Sample Eleventy Implementation

```html
<!-- _includes/header.njk -->
<nav class="navbar">
    <div class="nav-logo">
        <img src="/images/divinci_logo_inverted.svg" alt="Divinci Heart Robot logo" />
    </div>
    <div class="nav-title">
        <span class="brand-name">Divinci ™</span><span class="mobile-hide">&nbsp;- Create your own custom AI</span>
    </div>
    <!-- Toggle switch for customer/company view -->
    <div class="view-toggle-container mobile-hide">
        <span class="view-label customer-view active">Client</span>
        <label class="switch">
            <input type="checkbox" id="viewToggle">
            <span class="slider round"></span>
        </label>
        <span class="view-label company-view">Company</span>
    </div>
    <div class="nav-menu">
        <a href="/#features">Features</a>
        <a href="/#team">Team</a>
        <button class="signup-button"><a href="/#signup">Sign Up</a></button>
    </div>
</nav>
```

```html
<!-- _layouts/base.njk -->
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }} | Divinci™</title>
    <!-- Common head content -->
    <link rel="stylesheet" href="/styles.css" />
    <!-- Additional head content -->
    {% block head %}{% endblock %}
</head>
<body>
    <!-- Include header -->
    {% include "header.njk" %}
    
    <!-- Page content -->
    {% block content %}{% endblock %}
    
    <!-- Include footer -->
    {% include "footer.njk" %}
    
    <!-- Common scripts -->
    <script src="/script.js"></script>
    <!-- Additional scripts -->
    {% block scripts %}{% endblock %}
</body>
</html>
```

```html
<!-- index.njk -->
---
layout: base.njk
title: Multiplayer AI Chat
---

{% block content %}
<div class="hero">
    <!-- Hero content -->
</div>
<!-- Rest of page content -->
{% endblock %}
```

## Benefits of Migration

1. **Consistency**: Guaranteed identical header/footer across all pages
2. **Maintainability**: Single source of truth for shared components
3. **Performance**: Better optimization of assets and HTML
4. **Developer Experience**: Cleaner codebase, easier changes
5. **Future-proofing**: Easier to add features or make site-wide changes
6. **SEO improvements**: Better control over metadata and structure

## Timeline Estimate

- **Framework selection and setup**: 1 day
- **Template creation**: 1-2 days
- **Page migration**: 2-3 days (depending on number of pages)
- **Testing and refinement**: 1-2 days
- **Deployment**: 1 day

**Total time**: ~1 week for complete migration

## Deployment Options

1. **Netlify**: Simple GitHub integration, automatic builds
2. **Vercel**: Great for Next.js, excellent edge performance
3. **GitHub Pages**: Free, works well with build scripts
4. **AWS S3 + CloudFront**: High-performance enterprise option

## Next Steps

1. Select a framework based on team familiarity and future needs
2. Create a proof-of-concept with one page
3. Build shared components
4. Migrate high-priority pages
5. Set up build and deployment process
6. Complete migration of remaining pages