# Divinci AI Color System

This document outlines the standardized color system for the Divinci AI website, based on the style guide and current Zola homepage design.

## Color Variables Location
- **Main file**: `/static/css/variables.css`
- **Usage**: Import in all templates via `base.html` and `base-optimized.html`

## Core Color Palette

### Primary Colors (from style guide)
```css
--color-accent-primary: #7ba8d1;        /* Light blue - Accent Primary */
--color-accent-primary-hover: #a8c5a0;  /* Light green - Hover state */
--color-accent-secondary: #6590b8;      /* Medium blue - Secondary accent */
--color-accent-tertiary: #90b08a;       /* Medium green - Tertiary accent */
```

### Neutral Colors
```css
--color-neutral-primary: #2d3c34;       /* Dark green-gray - Primary text */
--color-neutral-secondary: #7e8d95;     /* Medium gray - Secondary text */
--color-neutral-tertiary: #666;         /* Medium gray - Tertiary text */
--color-neutral-inverse: #2d5a4f;       /* Dark forest green - Inverse/dark mode */
```

### Background Colors
```css
--color-bg-primary: #f8f4f0;            /* Main tan background (from homepage) */
--color-bg-secondary: #f5f8f6;          /* Light neutral background */
--color-bg-tertiary: #e8f2f5;           /* Light blue-gray background */
--color-bg-accent: #cfdcff;             /* Light blue accent background */
--color-bg-warm: #f7f7f7;               /* Warm light gray */
```

## Usage Examples

### Button Styles
```css
.btn-primary {
  background: var(--color-btn-primary);     /* Dark forest green */
  color: var(--color-text-inverse);         /* White text */
}

.btn-primary:hover {
  background: var(--color-btn-primary-hover); /* Darker forest green */
}
```

### Text Colors
```css
.text-primary { color: var(--color-text-primary); }     /* Dark green-gray */
.text-secondary { color: var(--color-text-secondary); } /* Medium gray */
.text-accent { color: var(--color-text-accent); }       /* Blue accent */
```

### Gradients
```css
.gradient-primary { background: var(--gradient-primary); }     /* Forest green to blue */
.gradient-secondary { background: var(--gradient-secondary); } /* Blue to green */
```

## Opacity Variations

For consistent transparency effects:
```css
--color-accent-primary-10: rgba(123, 168, 209, 0.1);  /* 10% opacity */
--color-accent-primary-20: rgba(123, 168, 209, 0.2);  /* 20% opacity */
--color-accent-primary-30: rgba(123, 168, 209, 0.3);  /* 30% opacity */
```

## Migration Guide

### Replacing Old Colors
- `#16214c` (old blue) → `var(--color-neutral-inverse)` or `var(--color-btn-primary)`
- `#5ce2e7` (old cyan) → `var(--color-accent-primary)`
- `#f8f4f0` (tan background) → `var(--color-bg-primary)`

### Best Practices
1. **Always use variables** instead of hard-coded hex values
2. **Use semantic names** like `--color-text-primary` rather than `--color-blue`
3. **Test in both light and dark modes** (dark mode overrides are included)
4. **Maintain contrast ratios** for accessibility

## Files Updated
- ✅ `/static/css/variables.css` - Main variables file
- ✅ `/templates/base.html` - Added variables import
- ✅ `/templates/base-optimized.html` - Added variables import
- ✅ `/content/pricing.md` - Updated to use variables

## Next Steps
- Update remaining pages to use the new variable system
- Consider adding more semantic color tokens as needed
- Update any remaining hard-coded colors in other CSS files