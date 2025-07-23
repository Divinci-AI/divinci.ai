# Static Site to Zola Migration Tracker

## Overview
This document tracks the migration of all pages from the static site to the new Zola-based site, including conversion to new branding and color scheme.

## Migration Status

### Core Product Pages
- [x] **RAG (Retrieval-Augmented Generation)**
  - Source: `/features/data-management/autorag.html`
  - Target: `/content/en/autorag.md` (+ translations)
  - Status: Completed
  - Notes: Created as AutoRAG page with comprehensive RAG capabilities

- [x] **Quality Assurance**
  - Source: `/features/quality-assurance/llm-quality-assurance.html`
  - Target: `/content/en/quality-assurance.md` (+ translations)
  - Status: Completed
  - Notes: LLM Quality Assurance with enterprise features

- [x] **Release Management**
  - Source: `/features/development-tools/release-cycle-management.html`
  - Target: `/content/en/release-management.md` (+ translations)
  - Status: Completed
  - Notes: AI Release Management with deployment automation

### Legal Pages
- [x] **Terms of Service**
  - Source: `/terms-of-service.html`
  - Target: `/content/en/terms-of-service.md` (+ translations)
  - Status: Completed
  - Notes: Updated with new branding and current date

- [x] **Privacy Policy**
  - Source: `/privacy-policy.html`
  - Target: `/content/en/privacy-policy.md` (+ translations)
  - Status: Completed
  - Notes: GDPR compliant with comprehensive privacy terms

- [ ] **Cookie Policy**
  - Source: `/cookies.html`
  - Target: `/content/en/cookies.md` (+ translations)
  - Status: Not started
  - Notes: If exists

- [ ] **AI Safety & Ethics**
  - Source: `/ai-safety.html`
  - Target: `/content/en/ai-safety.md` (+ translations)
  - Status: Not started
  - Notes: Important for enterprise AI trust

### Company Pages
- [ ] **About Us**
  - Source: `/about.html`
  - Target: `/content/en/about.md` (+ translations)
  - Status: Not started
  - Notes: Company history, mission, values

- [ ] **Careers**
  - Source: `/careers.html`
  - Target: `/content/en/careers.md` (+ translations)
  - Status: Not started
  - Notes: Job openings, company culture

- [ ] **Contact**
  - Source: `/contact.html`
  - Target: `/content/en/contact.md` (+ translations)
  - Status: Not started
  - Notes: Contact form, office locations

- [ ] **Press**
  - Source: `/press.html`
  - Target: `/content/en/press.md` (+ translations)
  - Status: Not started
  - Notes: Press releases, media kit

### Product/Resource Pages
- [ ] **Pricing**
  - Source: `/pricing.html`
  - Target: `/content/en/pricing.md` (+ translations)
  - Status: Not started
  - Notes: Pricing tiers, enterprise options

- [ ] **Documentation**
  - Source: `/docs.html`
  - Target: `/content/en/docs.md` (+ translations)
  - Status: Not started
  - Notes: Link to docs portal

- [ ] **Blog**
  - Source: `/blog.html`
  - Target: `/content/en/blog/_index.md`
  - Status: Not started
  - Notes: Blog listing page

- [ ] **Tutorials**
  - Source: `/tutorials.html`
  - Target: `/content/en/tutorials.md` (+ translations)
  - Status: Not started
  - Notes: Learning resources

- [ ] **API**
  - Source: `/api.html`
  - Target: `/content/en/api.md` (+ translations)
  - Status: Not started
  - Notes: API documentation overview

- [ ] **Roadmap**
  - Source: `/roadmap.html`
  - Target: `/content/en/roadmap.md` (+ translations)
  - Status: Not started
  - Notes: Product roadmap

- [ ] **Changelog**
  - Source: `/changelog.html`
  - Target: `/content/en/changelog.md` (+ translations)
  - Status: Not started
  - Notes: Release notes

### Additional Pages
- [ ] **Security**
  - Source: `/security.html`
  - Target: `/content/en/security.md` (+ translations)
  - Status: Not started
  - Notes: Security practices, certifications

- [ ] **Sitemap**
  - Source: `/sitemap.html`
  - Target: Generated automatically by Zola
  - Status: N/A
  - Notes: Zola generates this

- [ ] **Accessibility**
  - Source: `/accessibility.html`
  - Target: `/content/en/accessibility.md` (+ translations)
  - Status: Not started
  - Notes: Accessibility statement

## Color Scheme Conversion

### Old Static Site Colors
- Primary: [TO BE IDENTIFIED]
- Secondary: [TO BE IDENTIFIED]
- Text: [TO BE IDENTIFIED]
- Background: [TO BE IDENTIFIED]

### New Zola Site Colors
Based on current CSS, the new branding uses:
- Primary Purple: `#6B46C1` (buttons, links)
- Dark Purple: `#553C9A` (hover states)
- Text Dark: `#1A202C`
- Text Light: `#718096`
- Background: `#FFFFFF`
- Section Background: `#F7FAFC`

### CSS Classes to Update
When migrating content, replace:
- Old button classes → `.primary-button`, `.secondary-button`
- Old heading styles → Follow Zola template heading styles
- Old color utilities → Use new color variables

## Migration Process

### For Each Page:
1. **Locate source page** in static site
2. **Extract content** (text, images, structure)
3. **Create Zola content file** in appropriate directory
4. **Convert HTML to Markdown** maintaining structure
5. **Update styling** to match new branding:
   - Replace color references
   - Update button classes
   - Ensure responsive design
6. **Create translations** for all 13 languages
7. **Add to navigation** if needed
8. **Test thoroughly**

### Template Structure
Each page should follow this structure:

```markdown
+++
title = "Page Title"
description = "Page description for SEO"
template = "page.html"
[extra]
lang = "en"
+++

# Page Heading

Page content in Markdown...
```

## Priority Order
1. Legal pages (Terms, Privacy) - Required for compliance
2. Core product pages (RAG, QA, Release Management) - Key features
3. Company pages (About, Contact) - User trust
4. Resource pages (Docs, API, Pricing) - User needs
5. Additional pages - Nice to have

## Notes
- All pages must be responsive
- All pages must support all 13 languages
- Maintain SEO metadata from original pages
- Ensure all internal links are updated
- Test all forms and interactive elements
- Verify accessibility standards are met

## Next Steps
1. First, identify which pages exist in the static site
2. Analyze the current color scheme and branding
3. Create page templates if needed
4. Start with high-priority pages
5. Test each migration thoroughly