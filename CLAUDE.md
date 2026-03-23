# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands

### Development
- Local dev server: `npx serve` (runs on http://localhost:3000)
- Alternative dev server: `npm run dev` (Eleventy server on http://localhost:8080)
- Zola site development: `cd zola-site && zola serve`

### Testing
- Run all tests: `npm test`
- E2E tests only: `npm run test:e2e`
- Visual tests: `npm run test:visual`
- Update visual test snapshots: `npm run test:update-snapshots`
- View test report: `npm run test:report`
- Core navigation tests: `npm run test:core`

### Build Process
- Standard build: `npm run build`
- Clean and rebuild: `npm run rebuild`
- Asset optimization: `npm run optimize` (all assets) or `npm run optimize:css` (CSS/JS only)
- Prepare static files: `npm run prepare-static`

### Deployment (Zola Site)
- Build: `cd new-divinci-zola-site && zola build`
- Deploy to dev: `wrangler deploy --env dev` (use `wrangler` directly, NOT `npx wrangler`)
- Deploy to staging: `wrangler deploy --env staging`
- Deploy to production: `wrangler deploy`
- Upload to R2: `wrangler r2 object put "divinci-static-assets/FILENAME" --file="PATH" --content-type="TYPE" --cache-control="public, max-age=31536000, immutable" --remote`
- R2 public URL: `https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/`

### Animation Testing
- Interactive testing: Open `divinci-animation.html` in browser
- SVG testing: View individual SVG files directly in browser
- HTML validation: Use W3C Validator (https://validator.w3.org/)

## Project Architecture

### Site Generation
The project uses two static site generators:
- **Eleventy (11ty)**: Primary site generator (configured in .eleventy.js)
- **Zola**: Alternative static site generator (configured in zola-site/config.toml)

### Key Directories
- `/zola-site`: Zola static site generator files
- `/assets`: Static assets (CSS, JS, images)
- `/js`: JavaScript modules and components
- `/scripts`: Build and utility scripts
- `/tests`: Test suite (E2E, visual, accessibility)

### Animation System
The site features interactive SVG animations using GSAP:
- Core animation files: `divinci-animation.{html,js,css}`
- Custom GSAP timelines for robot character animations
- Performance-optimized for mobile devices

### Internationalization
- Translation files in `locales/` (JSON format)
- Support for English, Spanish, French, and Arabic
- RTL support for Arabic
- UI components with multilingual support

## Code Style Guidelines
- HTML: Use 4 spaces for indentation, lowercase tags, double quotes for attributes
- CSS: 
  - Use consistent class naming, 4-space indentation
  - Modern CSS nesting is used for organization
  - Keep related styles grouped by components
- JavaScript: 
  - Use camelCase for variables and functions
  - ES6+ syntax preferred
  - Use semicolons at the end of statements
  - Consistent error handling with try/catch blocks
  - Keep animation code modularized in separate files
- SVG: Maintain clean IDs for elements, especially for animation targets
- GSAP: Follow GSAP's best practices for animation timelines and sequencing

## Animation Considerations
- Maintain transform-origin properties for natural movement
- Test animations across different browsers
- Consider performance implications for complex animations
- Mobile devices: Use simplified animations for better performance

## Asset Optimization
The project includes an asset optimization pipeline:
- CSS minification with LightningCSS
- JavaScript minification with UglifyJS
- Image optimization with imagemin
- SVG optimization with SVGO

## Testing Infrastructure
- Playwright for E2E and visual testing
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (Pixel, iPhone)
- Visual regression testing with custom test scripts

## Design Context

### Users
Enterprise AI teams, ML engineers, and business leaders evaluating platforms for managing custom LLM deployments. They arrive seeking confidence that this platform can handle release management, quality assurance, and RAG optimization at scale. Secondary audience: developers and data scientists exploring the consumer-facing multiplayer AI chat product.

### Brand Personality
**Elegant, Inventive, Trustworthy** — Inspired by Leonardo da Vinci's fusion of art and engineering. The brand communicates that building AI can be both beautiful and rigorous. Every visual choice should feel crafted, not generated.

### Emotional Goals
- **Confidence & Trust**: Enterprise buyers should feel this is mature, reliable, and production-ready
- **Wonder & Delight**: The Da Vinci art direction should inspire visitors with the artistry of the product
- **Excitement & Ambition**: Visitors should feel motivated to build something great with the platform

### Aesthetic Direction
- **Visual tone**: Renaissance warmth meets modern precision. Think Anthropic's warm cream palette and serif typography crossed with Zed's clean minimalism and refined interactions
- **References**: anthropic.com (warm neutrals, serif headings, scroll-triggered animations, academic gravitas), zed.dev (clean spacing, restrained color, sophisticated navigation, developer respect)
- **Anti-references**: Generic AI/SaaS (no gradient blobs, no stock photos, no cookie-cutter layouts), overly corporate (no sterile enterprise blandness), dark/moody tech (no black backgrounds or neon accents)
- **Theme**: Light mode only. Fixed Renaissance warm palette.

### Color System
All colors are defined as CSS custom properties in `new-divinci-zola-site/static/css/variables.css`.

**Backgrounds (dominant)**:
- `--color-bg-primary: #f8f4f0` (warm cream — the primary canvas)
- `--color-bg-accent: #e8ddc7` (parchment — cards and accent sections)
- `--gradient-warm: linear-gradient(135deg, #f5f0e6, #e8ddc7)` (warm parchment gradient)

**Text & Primary UI (forest green family)**:
- `--color-neutral-primary: #2d3c34` (dark green-gray — body text)
- `--color-neutral-inverse: #2d5a4f` (forest green — buttons, strong accents)
- `--color-neutral-dark: #1e3a2b` (darkest green — footer, dark sections)
- `--color-accent-tertiary: #3d6b4f` (forest green — tertiary accent)

**Warm accents (gold/brown)**:
- `--color-accent-primary: #b8a080` (warm gold)
- `--color-accent-secondary: #8b7659` (warm brown)
- `--color-border-dark: #d4c4a0` (gold border)

**Highlight accent (use sparingly)**:
- `--color-highlight-blue: #cfdcff` (light blue — CTAs, subtle highlights only)
- Deep golden blue is an ACCENT color, not a background color

**LEGACY COLORS — DO NOT USE**:
- `#16214c`, `#254284`, `#0e1633` (old deep blues) — being migrated out
- `#5ce2e7` (old cyan) — being migrated out
- These still appear in `roadmap.html`, `api.html`, `feature.html` templates and must be replaced

### Typography
- **Headings**: 'Fraunces', serif — elegant, Renaissance-inspired display font
- **Body**: 'Source Sans 3', sans-serif — clean, readable body text
- **Scale**: Responsive clamp-based sizing from `--text-xs` (0.75rem) to `--text-h1` (clamp 2.5-3.5rem)

### Visual Identity Elements
- **Da Vinci-style illustrations**: AI-generated artwork in Renaissance drawing style (pencil, ink, mechanical diagrams). Used for hero sections and contact backgrounds.
- **Sacred geometry line art**: Subtle background patterns using circles, golden ratio constructions, and geometric figures. Used as watermarks in cards and section backgrounds.
- **Animated SVGs**: Technical diagrams (QA pipeline, release cycle, feature orbits) that can be animated on scroll with GSAP or CSS.
- **Photography**: Team headshots with circular frames and warm-toned borders. No stock photos.

### Design Principles
1. **Warm over cold**: Default to cream, gold, and green. Blue is a highlight, never a background. If a section feels cold or corporate, it's wrong.
2. **Crafted over generated**: Every visual should feel intentionally designed, like a Da Vinci notebook page. Avoid anything that looks like generic AI output.
3. **Substance over flash**: Content clarity comes first. Animations and effects serve understanding, not decoration. Inspired by Anthropic's restraint.
4. **Consistent over novel**: Every page should feel like it belongs to the same site. The homepage sets the standard — match it everywhere.
5. **Accessible over exclusive**: WCAG AA minimum. Respect reduced-motion preferences. Ensure text contrast on warm backgrounds. Light mode only — the warm palette is the identity.