# Feature Page Visualization Guide

This guide explains how to structure visualizations in feature pages to ensure they're properly displayed with the new, more prominent layout.

## Overview Visualization Structure

For the main overview visualization section, use the following structure:

```html
<!-- Feature Overview Section -->
<section id="feature-overview" class="feature-overview section-padding" aria-labelledby="overview-heading">
    <div class="container">
        <h2 id="overview-heading" class="section-heading">What is [Feature Name]?</h2>
        <div class="overview-content">
            <div class="overview-text">
                <p>First paragraph explaining the feature...</p>
                <p>Second paragraph with more details...</p>
                <p>Third paragraph about benefits and use cases...</p>
            </div>
        </div>
    </div>
    
    <!-- Full-width visualization section -->
    <div class="full-width-visualization">
        <div class="overview-visualization">
            <img src="../../images/feature-diagram.svg" alt="Feature Visualization" class="responsive-svg" width="100%" height="auto">
        </div>
    </div>
</section>
```

## Tab Content Visualization Structure

For visualizations within tab contents:

```html
<div id="tab-content" role="tabpanel" aria-labelledby="tab-trigger" class="tab-content">
    <h3>Tab Title</h3>
    <p>Description of this feature aspect...</p>

    <!-- Capability Visualization (SVG recommended) -->
    <div class="capability-visualization">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400">
            <!-- SVG content here -->
        </svg>
    </div>

    <ul class="feature-list">
        <li><strong>Feature Point 1</strong>: Description...</li>
        <li><strong>Feature Point 2</strong>: Description...</li>
        <!-- More list items -->
    </ul>
</div>
```

## SVG Best Practices

When creating or updating SVGs for feature visualizations:

1. Use a viewBox of "0 0 800 400" for wide visualizations
2. Use larger font sizes (18-28px) for text elements
3. Use thicker strokes (2-3px) for lines and shapes
4. Include animations to make diagrams more engaging
5. Use color consistently across all feature pages

## Responsive Considerations

The CSS has been updated to handle responsive behavior:

- On mobile, visualizations will be full-width
- Text will align left on mobile for better readability
- SVGs will scale appropriately

## Implementation Steps

When updating a feature page:

1. Move the visualization out of the standard container into a full-width container
2. Ensure the overview text is centered and has a maximum width
3. Scale up SVG components where needed
4. Test on mobile to ensure proper display

These changes will ensure that the intricate visualizations receive the prominence they deserve across all feature pages.