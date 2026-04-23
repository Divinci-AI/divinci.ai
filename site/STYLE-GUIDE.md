# Divinci AI Style Guide

This document defines the official visual style guide for the Divinci AI website. All new content and changes must comply with these standards to ensure a consistent, professional brand experience.

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Background | `#f8f4f0` | `rgb(248, 244, 240)` | Page backgrounds, light sections |
| Primary Text | `#2d3c34` | `rgb(45, 60, 52)` | Body text, primary content |
| Heading Color | `#1e3a2b` | `rgb(30, 58, 43)` | Headings, important text |
| Secondary Text | `#7e8d95` | `rgb(126, 141, 149)` | Subtle text, descriptions |

### Button Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Button Text | `#5c4a3a` | `rgb(92, 74, 58)` | Text on buttons |
| Button Gradient Start | `#f5f0e6` | `rgb(245, 240, 230)` | Button background start |
| Button Gradient End | `#e8ddc7` | `rgb(232, 221, 199)` | Button background end |
| Button Border | `#d4c4a0` | `rgb(212, 196, 160)` | Button borders |

### Accent Colors (Use Sparingly)

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Light Accent | `#cfdcff` | `rgb(207, 220, 255)` | Special highlights only |

## Forbidden Colors

These colors should **NEVER** be used as they belong to the old color scheme:

| Forbidden Color | Hex Code | RGB | Replacement |
|-----------------|----------|-----|-------------|
| Old Primary Blue | `#16214c` | `rgb(22, 33, 76)` | Use `#1e3a2b` instead |
| Old Secondary Blue | `#254284` | `rgb(37, 66, 132)` | Use `#2d3c34` instead |
| Old Cyan Accent | `#5ce2e7` | `rgb(92, 226, 231)` | Use approved accent colors |

## Typography

### Font Families

| Element Type | Font Family | Usage |
|--------------|-------------|-------|
| Headings | `'Fraunces', serif` | All h1-h6, section titles |
| Body Text | `'Source Sans 3', sans-serif` | Paragraphs, descriptions, buttons |
| Fallbacks | `serif`, `sans-serif` | Generic fallbacks only |

### Font Usage Examples

```css
/* Headings */
h1, h2, h3, .section-heading, .hero-title {
    font-family: 'Fraunces', serif;
    color: #1e3a2b;
}

/* Body text */
p, div, span, button, .body-text {
    font-family: 'Source Sans 3', sans-serif;
    color: #2d3c34;
}
```

## CSS Best Practices

### Color Usage

```css
/* ✅ Correct */
.hero-section {
    background: linear-gradient(135deg, #2d3c34 0%, #1e3a2b 100%);
    color: white;
}

.content-text {
    color: #2d3c34;
}

.section-heading {
    color: #1e3a2b;
}

/* ❌ Incorrect */
.hero-section {
    background: linear-gradient(135deg, #16214c 0%, #254284 100%); /* Old colors */
}
```

### Button Styling

```css
/* ✅ Correct button styling */
.primary-button {
    font-family: 'Source Sans 3', sans-serif;
    background: linear-gradient(135deg, #f5f0e6 0%, #e8ddc7 100%);
    color: #5c4a3a;
    border: 1px solid #d4c4a0;
}

.primary-button:hover {
    background: linear-gradient(135deg, #ede8de 0%, #e0d5bf 100%);
    color: #4a3a2a;
}
```

## Validation Tools

### Automated Validation

We provide several tools to ensure style guide compliance:

#### 1. Static Analysis Script

```bash
# Run static validation on all files
npm run style:validate

# This checks for:
# - Forbidden color usage
# - Proper font family declarations
# - Style consistency patterns
```

#### 2. Browser-Based Tests

```bash
# Run Playwright tests for live style validation
npm run style:test

# This checks for:
# - Computed styles in the browser
# - Color consistency across pages
# - Font rendering validation
# - Accessibility compliance
```

#### 3. Complete Style Check

```bash
# Run both static and browser validation
npm run style:check
```

### Pre-commit Hooks

Style guide validation runs automatically:

- **Pre-commit**: Static validation (`npm run style:validate`)
- **Pre-push**: Full validation (`npm run style:check`)
- **CI/CD**: Complete validation on all pull requests

### GitHub Actions

Our CI/CD pipeline includes:

1. **Static Analysis**: Scans all content files for violations
2. **Browser Testing**: Validates computed styles in real browsers
3. **PR Comments**: Automatic feedback on style guide violations
4. **Changed Files Check**: Quick validation of only modified files

## Common Violations and Fixes

### 1. Using Old Blue Colors

❌ **Problem:**
```css
color: #16214c;
background: linear-gradient(135deg, #16214c, #254284);
```

✅ **Solution:**
```css
color: #1e3a2b;
background: linear-gradient(135deg, #1e3a2b, #2d3c34);
```

### 2. Missing Font Family

❌ **Problem:**
```css
h2 {
    font-size: 2rem;
    color: #1e3a2b;
    /* Missing font-family */
}
```

✅ **Solution:**
```css
h2 {
    font-family: 'Fraunces', serif;
    font-size: 2rem;
    color: #1e3a2b;
}
```

### 3. Inconsistent Button Styling

❌ **Problem:**
```css
.my-button {
    background: #16214c; /* Old color */
    color: white;
    /* Missing font family */
}
```

✅ **Solution:**
```css
.my-button {
    font-family: 'Source Sans 3', sans-serif;
    background: linear-gradient(135deg, #2d3c34, #1e3a2b);
    color: white;
}
```

## Development Workflow

### Before Making Changes

1. Review this style guide
2. Check existing similar components for patterns
3. Use approved colors and fonts only

### While Developing

1. Run `npm run style:validate` frequently
2. Test in multiple browsers if adding new styles
3. Validate color contrast for accessibility

### Before Committing

1. Run `npm run style:check` to validate everything
2. Fix any violations reported
3. Test your changes visually in the browser

### Code Review Checklist

- [ ] Uses only approved colors from the style guide
- [ ] Font families are properly declared
- [ ] No old blue colors (#16214c, #254284) are present
- [ ] Button styling follows the established patterns
- [ ] Color contrast meets accessibility standards
- [ ] Style guide validation passes

## Resources

### Color Palette Reference

You can copy these CSS custom properties for easy reference:

```css
:root {
  /* Primary Colors */
  --color-background: #f8f4f0;
  --color-text-primary: #2d3c34;
  --color-text-heading: #1e3a2b;
  --color-text-secondary: #7e8d95;
  
  /* Button Colors */
  --color-button-text: #5c4a3a;
  --color-button-bg-start: #f5f0e6;
  --color-button-bg-end: #e8ddc7;
  --color-button-border: #d4c4a0;
  
  /* Typography */
  --font-heading: 'Fraunces', serif;
  --font-body: 'Source Sans 3', sans-serif;
}
```

### Tools and Scripts

- `scripts/validate-style-guide.js` - Static analysis tool
- `tests/style-guide-validation.spec.js` - Browser-based tests
- `.github/workflows/style-guide-validation.yml` - CI/CD automation

### Getting Help

If you encounter style guide issues:

1. Check this documentation first
2. Run the validation tools for specific error messages
3. Look at existing, approved components for reference
4. Ask the team for guidance on edge cases

---

**Remember**: Consistency is key to a professional brand experience. When in doubt, use the validation tools and refer to existing approved components.