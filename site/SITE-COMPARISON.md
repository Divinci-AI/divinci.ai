# Site Comparison Testing

This document explains how to use the automated site comparison tools to verify content parity between the original static site and the new Zola site.

## Overview

The site comparison test suite performs page-by-page content analysis to ensure that the new Zola site maintains content parity with the original static site while allowing for styling and branding differences.

## Prerequisites

1. **Both sites must be running simultaneously:**
   - Original static site: `http://127.0.0.1:1025`
   - New Zola site: `http://127.0.0.1:1027`

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running Comparison Tests

### Quick Comparison
```bash
npm run test:compare
```

### Detailed HTML Report
```bash
npm run test:compare:report
```
This generates a visual HTML report in `comparison-report/` directory.

### Debug Mode
```bash
npx playwright test tests-new/e2e/site-comparison.test.js --debug
```

## What Gets Compared

### ✅ Content Elements Analyzed
- **Headings**: H1-H6 structure and text content
- **Navigation**: Menu items and link text (excluding logos)
- **Paragraphs**: Main content text and length
- **Lists**: Bullet points and numbered lists
- **Buttons/CTAs**: Button text and call-to-action elements
- **Meta Information**: Page titles and descriptions

### 🚫 Elements Ignored (Styling/Branding)
- CSS styles and font families
- Color schemes and backgrounds
- Images and videos (except alt text)
- Animations and interactive elements
- Logo images and branding assets
- Layout and positioning

## Page Mappings

The test compares these page pairs:

| Original Static Site | New Zola Site |
|---------------------|---------------|
| `/` | `/` |
| `/autorag.html` | `/autorag/` |
| `/quality-assurance.html` | `/quality-assurance/` |
| `/release-management.html` | `/release-management/` |
| `/terms-of-service.html` | `/terms-of-service/` |
| `/privacy-policy.html` | `/privacy-policy/` |
| `/es/` | `/es/` |
| `/es/autorag.html` | `/es/autorag/` |
| `/fr/` | `/fr/` |
| `/fr/autorag.html` | `/fr/autorag/` |
| `/ar/` | `/ar/` |
| `/ar/autorag.html` | `/ar/autorag/` |

## Understanding Results

### Console Output
```
🔍 Comparing: / → /
✅ / - Content matches

🔍 Comparing: /autorag.html → /autorag/
⚠️  Issues found for /autorag.html:
   - Missing headings: key benefits, implementation
   - Content differences detected in 2 paragraphs
```

### Summary Report
```
📊 COMPARISON SUMMARY
==================================================
✅ Pages matching: 8
⚠️  Pages with issues: 4
❌ Pages with errors: 0
📄 Total pages compared: 12
```

### Detailed JSON Report
A comprehensive `site-comparison-report.json` file is generated with:
- Page-by-page analysis
- Missing/extra content identification
- Structural differences
- Detailed metadata comparison

## Common Issues and Solutions

### Missing Content
- **Headings**: Check if heading hierarchy matches
- **Paragraphs**: Look for content that didn't migrate
- **Navigation**: Verify menu items are present

### Content Differences
- **Text Changes**: Verify if intentional (rebranding) or missing content
- **Structure**: Check if content was reorganized vs. missing

### False Positives
- **Minor Text Differences**: Typography changes may appear as content differences
- **Reordered Content**: Same content in different order may be flagged

## Workflow for Content Migration

1. **Run Initial Comparison**
   ```bash
   npm run test:compare
   ```

2. **Review Issues**
   - Check `site-comparison-report.json` for details
   - Prioritize missing critical content

3. **Fix Content Issues**
   - Update Zola templates/content
   - Ensure heading structure matches
   - Verify navigation completeness

4. **Re-run Comparison**
   ```bash
   npm run test:compare
   ```

5. **Iterate Until Clean**
   - Aim for 0 errors and minimal warnings
   - Document intentional differences

## Customizing the Comparison

### Adding New Pages
Edit `PAGE_MAPPINGS` in `tests-new/e2e/site-comparison.test.js`:
```javascript
const PAGE_MAPPINGS = {
  '/new-page.html': '/new-page/',
  // ... existing mappings
};
```

### Ignoring Specific Content
Add selectors to `IGNORE_SELECTORS`:
```javascript
const IGNORE_SELECTORS = [
  '.custom-animation',
  '#specific-element-to-ignore',
  // ... existing selectors
];
```

### Adjusting Sensitivity
Modify comparison thresholds in the test:
```javascript
// Allow more paragraph differences
if (Math.abs(originalParagraphs - newParagraphs) > 5) {
  // Flag as issue
}
```

## Best Practices

1. **Run Regularly**: Execute comparison tests after each content change
2. **Document Differences**: Note intentional changes vs. migration gaps
3. **Prioritize Core Pages**: Focus on main user-facing pages first
4. **Check Multiple Languages**: Ensure multilingual content migrates properly
5. **Verify Accessibility**: Run accessibility tests alongside content comparison

## Troubleshooting

### Sites Not Running
```bash
# Check if ports are in use
lsof -i :1025
lsof -i :1027

# Start sites on correct ports
# Original: serve on 1025
# Zola: zola serve --port 1027
```

### Test Failures
- Verify both sites are accessible
- Check for JavaScript errors in browser console
- Ensure pages load completely before comparison

### False Negatives
- Content might be dynamically loaded
- Check for timing issues in page load
- Verify selector accuracy for content extraction

## Integration with CI/CD

Add to your workflow:
```yaml
- name: Run Site Comparison
  run: |
    npm run test:compare
    
- name: Upload Comparison Report
  uses: actions/upload-artifact@v3
  with:
    name: site-comparison-report
    path: site-comparison-report.json
```

## Contributing

When adding new pages or modifying content:
1. Update `PAGE_MAPPINGS` with new routes
2. Run comparison tests before merging
3. Document any intentional content differences
4. Ensure accessibility compliance

For questions or issues with the comparison tests, see the test file comments or create an issue in the repository.