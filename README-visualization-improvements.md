# Visualization Improvements

This PR updates the feature pages to make the intricate diagrams and visualizations more prominent.

## Changes Made

1. **Full-width visualization layout**:
   - Created a new full-width container for overview visualizations that spans the entire screen width
   - Increased the maximum width of visualizations to 1200-1400px
   - Added proper centering and padding for the visualization elements

2. **Enhanced SVG visualizations**:
   - Increased the SVG viewBox size from 300x200 to 800x400/500 for more detail
   - Made text elements larger and more readable
   - Adjusted font sizes to be more proportional
   - Added additional decorative elements to enhance the diagrams
   - Thickened lines and improved animations

3. **Content flow improvements**:
   - Restructured the overview section with centered text followed by the visualization
   - Updated tab content structure to showcase visualizations more prominently
   - Added proper spacing between elements

4. **Responsive design improvements**:
   - Ensured visualizations work well on mobile devices
   - Added specific styles for mobile view to maintain readability
   - Adjusted layout for smaller screens

5. **Documentation**:
   - Created a guidance document at `/docs/feature-page-visualization-guide.md` to help with consistent implementation across all feature pages

## Files Affected

- `/feature-page.css`: Updated the layout and styling for feature pages
- `/features/quality-assurance/llm-quality-assurance.html`: Updated to use the new layout
- `/features/data-management/autorag.html`: Updated to use the new layout and adjusted SVGs
- `/images/autorag-document-processing-adjusted.svg`: New adjusted SVG
- `/images/autorag-vector-embedding-adjusted.svg`: New adjusted SVG
- `/images/autorag-retrieval-optimization-adjusted.svg`: New adjusted SVG
- `/docs/feature-page-visualization-guide.md`: New documentation

## How to Test

1. Visit the `/features/quality-assurance/llm-quality-assurance.html` page and check:
   - The overview visualization spans the full width
   - The tab content visualizations are larger and more readable

2. Visit the `/features/data-management/autorag.html` page and check:
   - The overview diagram spans the full width
   - The tab content visualizations (document processing, vector embedding, retrieval optimization) are larger and more readable
   - Text sizes are proportional and readable

3. Test on both desktop and mobile to ensure responsive behavior