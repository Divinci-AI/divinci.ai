# HTML Includes Integration Guide

This document provides instructions for implementing reusable HTML components (header and footer) across the Divinci.ai website using the `include-html.js` script.

## Current Status

The website currently has an issue with the HTML includes implementation, causing pages to turn white shortly after loading. A temporary fix (restoring static header/footer) has been implemented while debugging continues.

## Implementation Plan

### 1. Include Script

Each page that needs to use header/footer includes should include the script:

```html
<!-- Script to include HTML components -->
<script src="/js/include-html.js" defer></script>
```

### 2. Header Include

Replace the static navbar with:

```html
<!-- Include the header -->
<div data-include="/includes/header.html"></div>
```

### 3. Footer Include

Replace the static footer with:

```html
<!-- Include the footer -->
<div data-include="/includes/footer.html"></div>
```

### 4. Path Handling

The `include-html.js` script handles path resolution based on the current page location:

- For root pages: Uses the path as is
- For feature pages: Prepends `../../` to the path
- For absolute paths (starting with `/`): Removes the leading slash

## Debugging Information

A debug version of the include script has been created at `debug-include.js` with enhanced logging. When debugging include issues:

1. Temporarily replace the standard script with the debug version:
   ```html
   <script src="/debug-include.js"></script>
   ```

2. Open the browser console (F12) to see detailed logs about include processing.

3. Check for these common issues:
   - Network errors loading the include files
   - Path resolution problems
   - Script execution errors in included content

## Known Issues and Solutions

### White Screen Issue

**Problem**: Pages turn white shortly after loading when using includes.

**Temporary Fix**: 
1. Use static header/footer in the HTML instead of includes
2. Comment out the include script or replace with debugged version
3. Add console logs to identify the cause

**Potential Causes**:
- Conflicting JavaScript in included content
- Path resolution issues
- Infinite loops in component initialization
- DOM manipulation conflicts

### Path Resolution

The script needs to handle different directory structures:
- Root pages (index.html)
- Feature pages (/features/*/feature.html)
- About/legal pages

The current implementation adjusts paths based on the URL pattern but may need refinement.

## Implementation Steps for Pages

### For Root Pages (index.html, about.html, etc.)
```html
<div data-include="includes/header.html"></div>
<div data-include="includes/footer.html"></div>
```

### For Feature Pages (in subdirectories)
```html
<div data-include="/includes/header.html"></div>
<div data-include="/includes/footer.html"></div>
```

Note the leading slash for feature pages to ensure correct path resolution.

## Implementation Checklist

1. ✅ Create and test include-html.js script
2. ✅ Create header component in includes/header.html
3. ✅ Create footer component in includes/footer.html
4. ✅ Implement includes in index.html (template)
5. ✅ Implement includes in feature-page-template.html
6. ⬜ Fix white screen issue (in progress)
7. ⬜ Roll out to remaining pages

## Testing Process

Before implementing across all pages:

1. Test with a single page (index.html)
2. Verify it works in all browsers
3. Test in the features subdirectory
4. Monitor for performance issues

## Fallback Plan

If issues persist:
1. Maintain the static components on each page
2. Use server-side includes if available (PHP/SSI)
3. Consider a build process to generate pages with includes resolved