# Divinci AI Style Guide

> The art of engineering, the engineering of art.

This document defines the visual identity for divinci.ai. Every page, component, and interaction should feel like it belongs to the same family — warm, crafted, and intentional.

---

## Brand Personality

**Elegant. Inventive. Trustworthy.**

Inspired by Leonardo da Vinci's fusion of art and engineering. The brand communicates that building AI can be both beautiful and rigorous. Every visual choice should feel crafted, not generated.

## Emotional Goals

| Goal | What it means |
|------|--------------|
| **Confidence & Trust** | Enterprise buyers should feel this is mature, reliable, and production-ready |
| **Wonder & Delight** | The Da Vinci art direction should inspire visitors with the artistry of the product |
| **Excitement & Ambition** | Visitors should feel motivated to build something great with the platform |

## Reference Sites

- **anthropic.com** — Warm cream palette, serif display headings, restrained scroll animations, academic gravitas. The gold standard for warm, substance-first SaaS design.
- **zed.dev** — Clean spacing, restrained color use, sophisticated navigation, developer respect. Shows how minimalism can still feel premium.

## Anti-References (What We Are NOT)

- **Generic AI/SaaS** — No gradient blobs, no stock photos, no cookie-cutter hero sections
- **Overly corporate** — No sterile layouts, no enterprise blandness
- **Dark/moody tech** — No black backgrounds, no neon accents, no hacker aesthetics

---

## Color System

All colors are defined as CSS custom properties in `site/static/css/variables.css`. Always reference variables, never hardcode hex values.

### Backgrounds (Dominant)

These are the primary canvas colors. Cream is the default; parchment is for accent sections and cards.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#f8f4f0` | Main page background (warm cream) |
| `--color-bg-accent` | `#e8ddc7` | Cards, accent sections (warm parchment) |
| `--color-bg-secondary` | `#f5f8f6` | Light neutral sections |
| `--color-bg-warm` | `#f7f7f7` | Warm light gray |
| `--color-surface-light` | `#ffffff` | White surfaces, card backgrounds |
| `--color-surface-warm` | `#fafafa` | Warm white surfaces |

### Gradients

| Token | Value | Usage |
|-------|-------|-------|
| `--gradient-warm` | `linear-gradient(135deg, #f5f0e6, #e8ddc7)` | Primary warm gradient for sections |
| `--gradient-cool` | `linear-gradient(135deg, #ede8de, #e0d5bf)` | Cooler parchment gradient |

### Text & Primary UI (Forest Green Family)

Forest green is the primary text and UI color. It grounds the warm palette with seriousness and readability.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-neutral-primary` | `#2d3c34` | Body text, primary content |
| `--color-neutral-inverse` | `#2d5a4f` | Buttons, strong UI accents |
| `--color-neutral-dark` | `#1e3a2b` | Footer, dark sections |
| `--color-accent-tertiary` | `#3d6b4f` | Tertiary accent elements |
| `--color-neutral-secondary` | `#7e8d95` | Secondary text, captions |
| `--color-neutral-tertiary` | `#666` | Tertiary/muted text |

### Warm Accents (Gold/Brown)

Gold and brown provide warmth and Renaissance character. Use for borders, decorative accents, and hover states.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent-primary` | `#b8a080` | Warm gold accents |
| `--color-accent-primary-hover` | `#a6946b` | Gold hover state |
| `--color-accent-secondary` | `#8b7659` | Warm brown secondary |
| `--color-border-dark` | `#d4c4a0` | Gold borders |
| `--color-border-accent` | `rgba(184, 160, 128, 0.2)` | Subtle warm borders |

### Blue Highlight (Use Sparingly)

Blue is a HIGHLIGHT accent only. It appears in CTA buttons, subtle link highlights, and focus indicators. It should never be used as a section or page background.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-highlight-blue` | `#cfdcff` | CTA highlights, focus rings |
| `--color-highlight-blue-hover` | `#b8c9f0` | Blue hover state |

### Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-status-success` | `#4CAF50` | Success states |
| `--color-status-warning` | `#ffc107` | Warning states |
| `--color-status-error` | `#dc3545` | Error states |

### Deprecated Colors (DO NOT USE)

These legacy colors are being migrated out. If you encounter them in templates, replace them with the appropriate token from above.

| Value | Was used for | Replace with |
|-------|-------------|-------------|
| `#16214c` | Old primary blue backgrounds | `--color-neutral-dark` or `--gradient-warm` |
| `#254284` | Old blue gradient endpoint | `--color-neutral-inverse` or remove |
| `#0e1633` | Old darkest blue | `--color-neutral-dark` |
| `#5ce2e7` | Old cyan accents | `--color-highlight-blue` or `--color-accent-tertiary` |

**Known files still using legacy colors**: `templates/roadmap.html`, `templates/api.html`, `templates/feature.html`

---

## Typography

### Font Families

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Display / Headings** | Fraunces | 400-700 | Page titles, section headings, hero text |
| **Body / UI** | Source Sans 3 | 400-600 | Body text, navigation, buttons, form labels |
| **Logo** | Fraunces | serif | The "Divinci" wordmark in the header |

### Type Scale

Responsive sizing using CSS `clamp()` for fluid scaling:

| Token | Value | Usage |
|-------|-------|-------|
| `--text-h1` | `clamp(2.5rem, 4vw, 3.5rem)` | Page titles, hero headlines |
| `--text-h2` | `clamp(2rem, 3vw, 2.75rem)` | Section headings |
| `--text-h3` | `clamp(1.25rem, 2vw, 1.5rem)` | Subsection headings |
| `--text-body` | `1rem` | Body text |
| `--text-small` | `0.875rem` | Captions, meta text |
| `--text-xs` | `0.75rem` | Fine print, badges |

### Typography Rules

- Headings use Fraunces serif for the Renaissance character
- Body uses Source Sans 3 for clean readability
- Line height: `1.5` for body, tighter for headings
- Max content width: `1400px` for readable line lengths
- Never use all-caps for long text. Small-caps sparingly for labels (e.g., "AI FOR GOOD")

---

## Spacing

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `0.25rem` (4px) | Tight gaps, icon padding |
| `--space-sm` | `0.5rem` (8px) | Small gaps, inline spacing |
| `--space-md` | `1rem` (16px) | Standard element spacing |
| `--space-lg` | `2rem` (32px) | Section internal padding |
| `--space-xl` | `4rem` (64px) | Large section gaps |
| `--space-2xl` | `6rem` (96px) | Major section separation |
| `--section-spacing` | `clamp(4rem, 6vw, 6rem)` | Responsive section padding |

### Layout

- Container max-width: `1400px`
- Container padding: `2rem` (desktop), `1rem` (mobile at 768px)
- Generous whitespace between sections — let the content breathe

---

## Elevation & Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-small` | `0 2px 4px rgba(0,0,0,0.1)` | Buttons, small cards |
| `--shadow-medium` | `0 4px 12px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `--shadow-large` | `0 10px 30px rgba(0,0,0,0.08)` | Modals, hero cards |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-small` | `6px` | Buttons, inputs, small cards |
| `--radius-medium` | `8px` | Standard cards |
| `--radius-large` | `12px` | Feature cards, hero elements |
| `--radius-full` | `50%` | Avatars, circular elements |

---

## Motion & Animation

### Transition Speeds

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `0.2s ease-out` | Hover states, toggles |
| `--transition-medium` | `0.3s ease-out` | Card interactions, reveals |
| `--transition-slow` | `0.4s ease-out` | Page transitions, large elements |

### Easing Curves

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Standard exit motion |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Dramatic reveals, scroll animations |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Symmetric transitions |

### Animation Principles

- **Purposeful**: Every animation should communicate something (state change, hierarchy, connection)
- **Restrained**: Prefer subtle fades and transforms over dramatic effects
- **Accessible**: Always respect `prefers-reduced-motion` — provide static fallbacks
- **Performance**: Use `transform` and `opacity` for GPU-accelerated animations. Avoid animating layout properties.

---

## Visual Identity Elements

### Da Vinci Illustrations

AI-generated artwork in Renaissance drawing style (pencil, ink, mechanical diagrams). These are the signature visual element of the brand.

- **Usage**: Hero sections, contact backgrounds, feature introductions
- **Style**: Warm sepia/cream tones, technical drawing linework, human-machine themes
- **Generation**: Use Gemini CLI image generation or similar tools
- **Placement**: Full-bleed or contained within rounded frames

### Sacred Geometry Line Art

Subtle background patterns using circles, golden ratio constructions, and geometric figures.

- **Usage**: Card watermarks, section backgrounds, decorative accents
- **Opacity**: Keep very subtle (5-15% opacity against backgrounds)
- **Colors**: Use `--color-border-light` or `--color-accent-primary` at low opacity
- **Do not**: Make these patterns compete with content

### Animated SVGs

Technical diagrams that explain product features through visual flow.

- **Existing**: QA pipeline diagram, Release Cycle diagram, feature orbits
- **Style**: Clean lines, color-coded stages, geometric shapes
- **Animation**: Triggered on scroll using GSAP or CSS. Stages appear sequentially.
- **Colors**: Use the accent palette — forest green, warm gold, light blue for differentiation

### Photography

- **Team photos**: Circular frames with warm-toned borders (gold or forest green)
- **No stock photos**: Every image should be genuine or custom-illustrated
- **Treatment**: Warm color grading that matches the cream palette

---

## Component Patterns

### Buttons

| Type | Background | Text | Border | Usage |
|------|-----------|------|--------|-------|
| **Primary** | `--color-neutral-inverse` | White | None | Main CTAs ("Request demo") |
| **Secondary** | Transparent | `--color-neutral-primary` | `--color-border-medium` | Secondary actions ("Explore platform") |
| **Accent** | `--color-highlight-blue` | `--color-neutral-primary` | None | Highlights, special CTAs |

### Cards

- Background: `--color-surface-light` or `--color-bg-accent`
- Border: `1px solid --color-border-light` or subtle shadow
- Border radius: `--radius-medium` to `--radius-large`
- Sacred geometry watermark at low opacity for visual interest
- Hover: Subtle lift with `--shadow-medium`

### Section Backgrounds

| Section Type | Background | When to use |
|-------------|-----------|-------------|
| Default | `--color-bg-primary` (cream) | Most sections |
| Accent | `--gradient-warm` (parchment gradient) | Feature highlights, alternating sections |
| Dark | `--color-neutral-dark` (forest green) | Footer, contact CTA, max 1-2 per page |
| Illustration | Da Vinci artwork overlay with dark scrim | Contact section, special callouts |

**Rule**: Never use legacy blue (`#16214c`) as a section background. Dark sections use forest green (`#1e3a2b`) instead.

### Navigation

- Clean horizontal nav with Fraunces logo
- Dropdown menus for Features and Support
- "Request demo" CTA button in primary style
- Language switcher with flag icons
- Sticky header on scroll with subtle backdrop blur

---

## Page Structure

Every page should follow this general structure:

1. **Header** — Consistent global navigation
2. **Hero** — Strong visual opening with Da Vinci illustration or animated SVG, headline in Fraunces, supporting text in Source Sans 3
3. **Content sections** — Alternating cream/parchment backgrounds, generous spacing
4. **CTA section** — "Start your AI journey" or similar with email capture
5. **Contact section** — Dark forest green with Da Vinci illustration overlay
6. **Footer** — Comprehensive link grid on dark background

### Hero Section Requirements

Every page MUST have a hero section. The homepage sets the standard:
- Full-width, visually impactful
- Da Vinci illustration or product-relevant animated SVG
- Large Fraunces heading
- Supporting body text in Source Sans 3
- 1-2 CTA buttons

---

## Design Principles

1. **Warm over cold** — Default to cream, gold, and green. Blue is a highlight, never a background. If a section feels cold or corporate, it's wrong.

2. **Crafted over generated** — Every visual should feel intentionally designed, like a Da Vinci notebook page. Avoid anything that looks like generic AI output.

3. **Substance over flash** — Content clarity comes first. Animations and effects serve understanding, not decoration.

4. **Consistent over novel** — Every page should feel like it belongs to the same site. The homepage sets the standard.

5. **Accessible over exclusive** — WCAG AA minimum. Respect `prefers-reduced-motion`. Ensure text contrast on warm backgrounds. Light mode only.

---

## Accessibility Requirements

- **Contrast**: WCAG AA (4.5:1 for body text, 3:1 for large text) against warm backgrounds
- **Focus indicators**: `2px solid --color-highlight-blue` with `2px` offset
- **Motion**: All animations wrapped in `@media (prefers-reduced-motion: no-preference)`
- **Semantics**: Proper heading hierarchy (h1 > h2 > h3), landmark regions, ARIA labels
- **Images**: Alt text for all meaningful images. Decorative sacred geometry marked `aria-hidden="true"`
- **Keyboard**: All interactive elements reachable and operable via keyboard
- **RTL**: Full right-to-left support for Arabic (`dir="rtl"`)

---

## File Locations

| What | Where |
|------|-------|
| CSS Variables | `site/static/css/variables.css` |
| Main Stylesheet | `site/static/css/style.css` |
| Mobile Overrides | `site/static/css/mobile-fixes.css` |
| Optimized CSS | `site/static/css/optimized.css` |
| Page Templates | `site/templates/` |
| Content (Markdown) | `site/content/` |
| Static Assets | `site/static/` |
| Images | `site/static/images/` |
| JavaScript | `site/static/js/main.js` |
| Translations | `site/data/translations/` |
