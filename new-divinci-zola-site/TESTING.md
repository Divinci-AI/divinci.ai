# Divinci AI Zola Site - Comprehensive Testing Guide

This document describes the comprehensive end-to-end test suite for the Divinci AI Zola website.

## Test Suite Overview

The test suite consists of 6 main test files that provide comprehensive coverage of all critical user journeys:

### 1. Site Navigation Tests (`comprehensive-site-navigation.spec.js`)
- **Purpose**: Tests navigation between all main pages and verifies content
- **Coverage**:
  - Main pages (Home, About, Careers, Contact, Press, Pricing, etc.)
  - Feature pages (AutoRAG, Quality Assurance, Release Management)
  - Legal pages (Terms, Privacy, Accessibility, Security)
  - Header and footer navigation links
  - Internal page navigation
  - 404 error handling
  - Consistent header/footer across pages

### 2. Form Functionality Tests (`form-functionality.spec.js`)
- **Purpose**: Tests all forms on the site including contact, career applications, and signup forms
- **Coverage**:
  - Homepage signup/newsletter forms
  - Contact form validation and submission
  - Career application forms
  - Form accessibility features
  - Form security features (CSRF, honeypots)
  - HTML5 validation
  - Error messaging

### 3. Responsive Design Tests (`responsive-mobile.spec.js`)
- **Purpose**: Tests mobile responsiveness, touch interactions, and mobile-specific functionality
- **Coverage**:
  - Mobile viewport layout (375x667px)
  - Tablet viewport layout (768x1024px)
  - Desktop viewport layout (1920x1080px)
  - Touch interactions and tap responsiveness
  - Mobile navigation menus
  - Form usability on mobile
  - Content consistency across viewports
  - Horizontal scrolling prevention
  - Mobile-specific features (tel: links, mailto: links)

### 4. Interactive Elements Tests (`interactive-animations.spec.js`)
- **Purpose**: Tests sacred geometry animations, interactive elements, and visual components
- **Coverage**:
  - Video elements and controls
  - Panel hover video switching
  - SVG and sacred geometry elements
  - Da Vinci-style illustrations
  - Dropdown and menu interactions
  - Button and link interactions
  - Scroll-triggered animations
  - Animation performance monitoring

### 5. Performance Tests (`performance-assets.spec.js`)
- **Purpose**: Tests page load performance, asset optimization, and loading efficiency
- **Coverage**:
  - Core Web Vitals (FCP, LCP, CLS, TTFB)
  - Cross-page performance comparison
  - Image loading and optimization
  - Video loading and optimization
  - CSS and JavaScript loading
  - HTTP caching headers
  - Content compression
  - Resource loading waterfall
  - Critical resource prioritization

### 6. Visual Regression Tests (`visual-regression.spec.js`)
- **Purpose**: Tests visual consistency and takes screenshots for regression testing
- **Coverage**:
  - Homepage sections (hero, features, enterprise, team, footer)
  - Full page screenshots
  - Component screenshots (header, navigation, panels)
  - Mobile visual tests
  - Cross-browser visual consistency
  - Form visual tests
  - Error state visual tests (404 pages)

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure Zola is installed
zola --version
```

### Individual Test Suites

```bash
# Navigation tests
npm run test:navigation

# Form functionality tests
npm run test:forms

# Responsive design tests
npm run test:responsive

# Interactive elements tests
npm run test:interactions

# Performance tests
npm run test:performance

# Visual regression tests
npm run test:visual:new
```

### Comprehensive Test Runs

```bash
# Run all new comprehensive tests
npm run test:comprehensive

# Run full test suite (E2E + Visual)
npm run test:full-suite

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed
```

### Visual Testing

```bash
# Run visual tests
npm run test:visual

# Update visual snapshots
npm run test:visual:update

# Run new visual regression tests
npm run test:visual:new
```

### Test Reports

```bash
# View test report
npm run test:report

# Debug tests
npm run test:debug
```

## Browser Coverage

Tests run across multiple browsers and devices:

### Desktop Testing
- **Chrome**: 1920x1080 viewport
- **Firefox**: 1920x1080 viewport  
- **Safari**: 1920x1080 viewport

### Mobile Testing
- **Chrome Mobile**: Pixel 5 device simulation
- **Safari Mobile**: iPhone 12 device simulation

### Visual Testing
- **Desktop**: Chrome 1920x1080
- **Mobile**: iPhone 12 375x667
- **Tablet**: iPad Pro 1024x1366

## Test Configuration

The test suite is configured in `playwright.config.js` with:

- **Base URL**: `http://127.0.0.1:1027` (Zola dev server)
- **Timeouts**: 10s action timeout, 30s navigation timeout
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Visual Thresholds**: 0.3 threshold, 1000 max diff pixels

## Test Data and Expectations

### Expected Pages
The tests verify the existence and functionality of:

**Main Pages**:
- `/` (Homepage)
- `/about/`
- `/careers/`
- `/contact/`
- `/press/`
- `/pricing/`
- `/roadmap/`
- `/docs/`
- `/blog/`
- `/api/`

**Feature Pages**:
- `/autorag/`
- `/quality-assurance/`
- `/release-management/`

**Legal Pages**:
- `/terms-of-service/`
- `/privacy-policy/`
- `/accessibility/`
- `/security/`

**Multilingual Support**:
- English (`/`)
- Spanish (`/es/`)
- French (`/fr/`)
- Arabic (`/ar/`)

### Performance Benchmarks

**Core Web Vitals Targets**:
- **First Contentful Paint (FCP)**: < 1.8s (Good), < 3.0s (Needs Improvement)
- **Largest Contentful Paint (LCP)**: < 2.5s (Good), < 4.0s (Needs Improvement)
- **Cumulative Layout Shift (CLS)**: < 0.1 (Good), < 0.25 (Needs Improvement)
- **Time to First Byte (TTFB)**: < 800ms

**Asset Size Targets**:
- **CSS**: < 100KB total
- **JavaScript**: < 500KB total
- **Images**: < 5MB total page weight

## Continuous Integration

The test suite is designed to run in CI environments with:

- **Parallel Execution**: Tests run in parallel where safe
- **Retry Logic**: 2 retries on failure in CI
- **Artifact Collection**: Screenshots, videos, and traces on failure
- **HTML Reports**: Generated in `test-results/` directory

## Adding New Tests

When adding new features to the site, ensure you:

1. **Update Navigation Tests**: Add new pages to the expected pages list
2. **Add Form Tests**: Test any new form functionality
3. **Update Responsive Tests**: Verify mobile compatibility
4. **Add Interaction Tests**: Test any new interactive elements
5. **Update Performance Tests**: Monitor impact on load times
6. **Add Visual Tests**: Capture screenshots for visual regression

## Debugging Failed Tests

### View Test Reports
```bash
npm run test:report
```

### Debug Specific Tests
```bash
npm run test:debug -- --grep "test name"
```

### Update Visual Snapshots
```bash
npm run test:visual:update
```

### Run Tests in Headed Mode
```bash
npm run test:headed
```

## Test Maintenance

### Regular Tasks
- **Update Visual Snapshots**: When UI changes are intentional
- **Review Performance Metrics**: Monitor for regressions
- **Update Expected Content**: When page content changes
- **Verify Cross-Browser Compatibility**: Check test results across browsers

### Monthly Reviews
- **Analyze Test Results**: Look for patterns in failures
- **Update Test Data**: Refresh expected content and pages
- **Performance Benchmarks**: Review and adjust targets as needed
- **Browser Updates**: Ensure compatibility with latest browsers

This comprehensive test suite ensures the Divinci AI Zola website maintains high quality, performance, and user experience across all devices and browsers.