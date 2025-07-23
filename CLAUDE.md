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