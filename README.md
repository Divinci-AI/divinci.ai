# Divinci.ai

A modern website for Divinci.ai featuring interactive elements, animations, multilingual support, and comprehensive testing. Static HTML website designed for Cloudflare Pages. 

## 🚀 Features

- **Interactive UI**: Animated SVG elements with GSAP
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Internationalization (i18n)**: Support for multiple languages (English, Spanish, French, Arabic)
- **Accessibility**: WCAG compliance with comprehensive testing
- **Robust Testing**: End-to-end, visual regression, and accessibility testing

## 📋 Project Structure

```
divinci.ai/
├── assets/           # Static assets (CSS, JS, images)
├── blog/             # Blog pages and content
├── docs/             # Documentation files
├── features/         # Feature pages
├── includes/         # Reusable HTML components
├── js/               # JavaScript files
├── locales/          # Translation files
├── scripts/          # Utility scripts
├── templates/        # Page templates
├── tests/            # Test suite (E2E, Visual, A11y)
└── zola-site/        # Static site generator setup
```

## 🛠️ Technologies

- **Frontend**: HTML5, CSS3 (with native nesting), JavaScript (ES6+)
- **Animation**: GSAP for SVG animations
- **i18n**: Custom JavaScript-based translation system
- **Testing**: Playwright for E2E and visual testing
- **Static Site Generation**: Eleventy (11ty)
- **Development**: Node.js
- **Asset Optimization**: LightningCSS, UglifyJS, imagemin

## 📦 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DivinciApp/divinci.ai.git
   cd divinci.ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   This will start the Eleventy server on http://localhost:8080

### Alternative Server

For simple static file serving:
```bash
npx serve
```
This will start a static file server on http://localhost:3000

## 🧪 Testing

The project includes comprehensive testing capabilities:

```bash
# Run all tests
npm test

# Run only E2E tests
npm run test:e2e

# Run only visual tests
npm run test:visual

# Update visual test snapshots
npm run test:update-snapshots

# View test report
npm run test:report
```

See the [tests/README.md](./tests/README.md) for detailed information about the testing infrastructure.

## 🌐 Internationalization

The site supports multiple languages through a custom i18n system:

- English (default)
- Spanish
- French
- Arabic (with RTL support)

Translation files are located in the `locales/` directory and follow a JSON structure.

## 🎨 Animation

The site features interactive SVG animations:

- Divinci robot character with various animations
- Feature visualization using orbital animations
- Interactive UI elements

Animation files are primarily located in the project root with filenames containing `divinci-*.html`.

## 🎨 CSS Structure

The project uses modern CSS with native nesting:

- Component-based organization
- CSS custom properties (variables) for theming
- Modern CSS nesting for better organization
- Media queries for responsive behavior

See [CSS-STRUCTURE.md](./CSS-STRUCTURE.md) for details about our CSS approach.

## 📱 Mobile Support

The site is fully responsive with specific optimizations for mobile devices:

- Simplified animations for performance
- Touch-friendly interface
- Mobile-specific component variants

## 🚀 Asset Optimization

The project includes a comprehensive asset optimization system that minifies CSS and JavaScript files and optimizes images for production.

### Asset Optimization Process

The asset optimization is handled by the `scripts/optimize-assets.js` script, which:

1. **Minifies CSS files** using LightningCSS:
   - Takes source CSS files and creates minified versions with `.min.css` extensions
   - Preserves directory structure in the `optimized/css/` directory
   - Supports modern CSS features including native nesting
   - Removes unnecessary whitespace, comments, and optimizes CSS rules

2. **Minifies JavaScript files** using UglifyJS:
   - Compresses and manglifies JS files, creating `.min.js` versions
   - Preserves directory structure in the `optimized/js/` directory
   - Performs code optimization while maintaining functionality

3. **Optimizes images** using imagemin:
   - Compresses JPEG, PNG, GIF, and WebP images without significant quality loss
   - Optimizes SVG files using SVGO
   - Preserves directory structure in the `optimized/images/` directory

4. **Generates an optimization report** showing:
   - Number of optimized files
   - Original and optimized file sizes
   - Total size savings across all asset types

### Running Asset Optimization

To optimize all assets:

```bash
node scripts/optimize-assets.js
```

To optimize only specific asset types:

```bash
# Optimize only CSS and JavaScript files
node scripts/optimize-assets.js --css-js-only

# Optimize only images
node scripts/optimize-assets.js --images-only
```

To run in dry-run mode (shows what would be optimized without modifying files):

```bash
node scripts/optimize-assets.js --dry-run
```

### Dependencies

The optimization script requires the following dependencies:

```bash
npm install --save-dev lightningcss browserslist uglify-js imagemin-cli svgo
```

### Output Structure

Optimized files are placed in the `optimized/` directory with the following structure:

```
optimized/
├── css/        # Minified CSS files (*.min.css)
├── js/         # Minified JavaScript files (*.min.js)
└── images/     # Optimized image files (preserved formats)
```

An optimization report is generated at `optimization-report.json` detailing the optimization results.

## 📄 Documentation

Additional documentation is available in the `docs/` directory:

- [URL Structure Plan](./docs/URL-structure-plan.md)
- [Animation Implementation](./docs/divinci-animation-implementation.md)
- [Animation Plan](./docs/divinci-animation-plan.md)
- [Mobile Accessibility Guidelines](./docs/mobile-accessibility-guidelines.md)
- [Multilingual Content Guide](./docs/multilingual-content-guide.md)

## 🧠 AI Features

Divinci.ai showcases several AI-focused features:

- AutoRAG (Retrieval Augmented Generation)
- LLM Quality Assurance
- Document Processing
- Vector Embeddings

## 👥 Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) before submitting pull requests.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE.txt](./LICENSE.txt) file for details.

## 📮 Contact

For any questions or support, please [open an issue](https://github.com/DivinciApp/divinci.ai/issues) or reach out through the [contact form](https://divinci.ai/contact).