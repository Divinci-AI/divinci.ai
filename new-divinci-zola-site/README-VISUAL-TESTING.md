# Enhanced Visual Testing Suite

This document describes the comprehensive visual testing infrastructure for the New Divinci Zola Site.

## Overview

Our visual testing suite has been significantly expanded to provide robust visual regression testing across:
- **Multiple devices** (desktop, mobile, tablet)
- **Cross-browser compatibility** (Chrome, Firefox, Safari)
- **Multilingual support** (13 languages including RTL)
- **Performance conditions** (slow networks, image loading, etc.)
- **Accessibility states** (high contrast, reduced motion, focus states)

## Test Categories

### Quick Visual Tests
```bash
npm run test:visual
```
Fast visual regression tests covering core sections on desktop and mobile Chrome only.
**Time**: ~5 minutes

### Comprehensive Visual Tests
```bash
npm run test:visual:comprehensive
```
Full visual testing across all devices, languages, and responsive breakpoints.
**Time**: ~20 minutes

### Cross-Browser Visual Tests
```bash
npm run test:visual:cross-browser
```
Visual consistency testing across Chrome, Firefox, and Safari on desktop.
**Time**: ~10 minutes

### Mobile Visual Tests
```bash
npm run test:visual:mobile
```
Mobile-specific visual tests across different devices (iPhone, Pixel, iPad).
**Time**: ~15 minutes

### Performance Visual Tests
```bash
npm run test:visual:performance
```
Visual tests under various performance conditions (slow networks, broken images, etc.).
**Time**: ~15 minutes

### Multilingual Visual Tests
```bash
npm run test:visual:multilingual
```
Visual consistency tests across all supported languages including RTL layout.
**Time**: ~10 minutes

### Accessibility Visual Tests
```bash
npm run test:visual:accessibility
```
Visual tests for accessibility features (high contrast, reduced motion, focus states).
**Time**: ~5 minutes

### Responsive Visual Tests
```bash
npm run test:visual:responsive
```
Tests visual consistency across all responsive breakpoints.
**Time**: ~10 minutes

### All Visual Tests
```bash
npm run test:visual:all
```
Complete visual testing suite - all categories combined.
**Time**: ~40 minutes

## Test Files

### Core Visual Tests
- `new-divinci-visual.spec.js` - Basic visual regression tests
- `visual-regression.spec.js` - Enhanced visual regression testing

### Comprehensive Tests
- `comprehensive-visual-testing.spec.js` - All-device, multilingual, responsive testing
- `comprehensive-mobile-visual.spec.js` - Mobile-specific comprehensive tests

### Performance Tests
- `visual-performance-testing.spec.js` - Visual tests under performance conditions

## Devices and Viewports

### Desktop
- **1920x1080** - Large desktop
- **1366x768** - Laptop
- **1024x768** - Tablet landscape

### Mobile
- **393x851** - Pixel 5
- **390x844** - iPhone 12/13
- **375x667** - iPhone SE
- **320x568** - Small mobile

### Tablet
- **1024x1366** - iPad Pro portrait
- **1366x1024** - iPad Pro landscape

## Languages Tested

Visual tests cover these languages with priority on:
1. **English** (en)
2. **Spanish** (es) 
3. **French** (fr)
4. **Arabic** (ar) - includes RTL layout testing
5. **Chinese** (zh)
6. **Japanese** (ja)

## Visual Test Configuration

### Playwright Config
- **Threshold**: 0.2 (20% difference tolerance)
- **Max Diff Pixels**: 1500
- **Animations**: Disabled for consistency
- **Mode**: RGB color comparison

### Screenshot Settings
- **Full Page**: Available for homepage tests
- **Element Screenshots**: For specific sections
- **Animation Handling**: All animations disabled
- **Video Handling**: Hidden during visual tests

## Running Tests

### Basic Usage
```bash
# Quick visual check
npm run test:visual

# Update snapshots after changes
npm run test:visual:update

# Run with specific options
node scripts/visual-test-runner.js visual-comprehensive --headed --workers=2
```

### Advanced Usage
```bash
# List all categories
node scripts/visual-test-runner.js --list-categories

# Run with custom reporter
node scripts/visual-test-runner.js visual-cross-browser --reporter=json

# Debug mode
node scripts/visual-test-runner.js visual-quick --debug
```

## Visual Test Runner Script

The `scripts/visual-test-runner.js` provides organized test execution with:
- **Category-based testing** - Run specific test types
- **Flexible options** - headed, debug, workers, reporters
- **Progress tracking** - Time estimates and completion status
- **Prerequisite checking** - Validates environment before running

## Results and Reports

### HTML Reports
Visual test results are saved in `test-results/index.html` with:
- Screenshot comparisons
- Diff highlighting
- Test timing and status
- Device/browser breakdown

### Screenshot Organization
Screenshots are organized by:
```
test-results/
├── <test-name>-<device>-<browser>/
│   ├── actual.png
│   ├── expected.png
│   └── diff.png
```

## Best Practices

### Before Committing
1. Run quick visual tests: `npm run test:visual`
2. Update snapshots if changes are intentional: `npm run test:visual:update`
3. Run cross-browser tests for major changes: `npm run test:visual:cross-browser`

### For Major Releases
1. Run comprehensive suite: `npm run test:visual:all`
2. Verify multilingual consistency: `npm run test:visual:multilingual`
3. Check mobile experience: `npm run test:visual:mobile`

### Debugging Visual Failures
1. Use headed mode: `--headed`
2. Run single test: specify exact test name
3. Check diff images in test results
4. Update snapshots if changes are intentional

## Continuous Integration

For CI environments:
```bash
# Quick check for PRs
npm run test:visual

# Full suite for main branch
npm run test:visual:comprehensive
```

## Performance Considerations

- **Parallel execution** - Tests run across multiple workers
- **Selective testing** - Choose appropriate test category
- **Resource management** - Videos/animations disabled during tests
- **Timeout handling** - Appropriate timeouts per test category

## Troubleshooting

### Common Issues
1. **Font loading differences** - Ensure web fonts are loaded consistently
2. **Animation timing** - All animations are disabled in test configuration
3. **Image loading** - Tests wait for `networkidle` state
4. **Cross-browser differences** - Different threshold tolerances may be needed

### Environment Setup
1. Ensure Playwright is installed: `npm install @playwright/test`
2. Install browser dependencies: `npx playwright install`
3. Verify test files exist in `tests/` directory
4. Check Zola server is configured correctly

This enhanced visual testing suite ensures consistent visual quality across all devices, browsers, and languages while maintaining efficient test execution for different development workflows.