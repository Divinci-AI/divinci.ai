# SVG Design Style Guide for Feature Visualizations

## Overview

This style guide establishes consistent visual standards for SVG diagrams and illustrations on Divinci.ai feature pages. Adherence to these guidelines ensures visual harmony, brand consistency, and accessibility across all feature visualizations.

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Divinci Blue | #2E5BFF | rgb(46, 91, 255) | Primary elements, focal points |
| Divinci Teal | #00D8D8 | rgb(0, 216, 216) | Secondary elements, accents |
| Divinci Purple | #8C54FF | rgb(140, 84, 255) | Highlights, tertiary elements |

### Secondary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Light Gray | #F5F7FA | rgb(245, 247, 250) | Backgrounds, containers |
| Medium Gray | #B0B7C3 | rgb(176, 183, 195) | Non-essential elements |
| Dark Gray | #485262 | rgb(72, 82, 98) | Text, borders |

### Accent Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Success Green | #00D27A | rgb(0, 210, 122) | Positive indicators, completion |
| Warning Amber | #FFAB2D | rgb(255, 171, 45) | Cautionary elements |
| Error Red | #FF5C5C | rgb(255, 92, 92) | Error states, critical information |

## Typography

### Fonts

Use the following CSS variables in SVG text elements:

```css
--font-primary: 'Inter', sans-serif;
--font-monospace: 'IBM Plex Mono', monospace;
```

### Text Sizes

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Diagram Title | 20px | 600 | Main diagram titles |
| Section Label | 16px | 500 | Component groups, sections |
| Component Label | 14px | 400 | Individual element labels |
| Technical Detail | 12px | 400 | Specifications, small details |

## Visual Elements

### Line Styles

| Type | Stroke Width | Style | Color | Usage |
|------|-------------|-------|-------|-------|
| Primary Connection | 2px | Solid | Divinci Blue | Main flow paths, primary connections |
| Secondary Connection | 1.5px | Solid | Divinci Teal | Supporting paths, secondary connections |
| Tertiary Connection | 1px | Dashed (4,2) | Medium Gray | Optional paths, alternative flows |
| Highlight Connection | 2.5px | Solid | Divinci Purple | Emphasized connections, focus areas |

### Shapes

| Shape | Usage | Style |
|-------|-------|-------|
| Circle | Endpoints, nodes | 2px stroke, filled with Light Gray |
| Rectangle | Components, modules | 1.5px stroke, rounded corners (4px radius) |
| Hexagon | Data elements | 1.5px stroke, filled with Light Gray |
| Diamond | Decision points | 1.5px stroke, filled with Light Gray |

### Icons

- Use a consistent icon style across all diagrams
- Maintain 24×24px icon viewBox for predictable sizing
- Use stroke-based icons with 2px stroke width where possible
- Maintain adequate negative space around icons (minimum 4px padding)

## Animation Guidelines

### General Principles

- Use subtle animations that enhance understanding
- Ensure all animations can be disabled via prefers-reduced-motion
- Keep animations under 500ms duration
- Use simple easing functions (ease-in-out preferred)

### Animation Types

| Type | Use Case | CSS/SMIL Example |
|------|----------|------------------|
| Path Animation | Flow visualization | `<animate attributeName="stroke-dashoffset" from="1000" to="0" dur="2s" repeatCount="indefinite"/>` |
| Fade Transition | Showing/hiding elements | `opacity: 0; transition: opacity 0.3s ease-in-out;` |
| Pulse | Drawing attention | `@keyframes pulse { 0% {transform: scale(1);} 50% {transform: scale(1.05);} 100% {transform: scale(1);} }` |
| Rotation | Loading, processing | `@keyframes rotate { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }` |

## Accessibility Requirements

### Color Contrast

- Maintain minimum 4.5:1 contrast ratio for all text elements
- Ensure all information conveyed by color is also available through text or shape
- Test all color combinations against WCAG AA standards

### Text Clarity

- Use the `aria-label` attribute for complex diagrams
- Ensure all text has adequate size and weight for readability
- Avoid placing text over complex backgrounds

### Interactive Elements

- Provide keyboard focus indicators (2px Divinci Blue outline)
- Ensure all interactive elements have minimum 44×44px touch target
- Use appropriate ARIA roles for interactive diagram components

## File Optimization

### Export Settings

- Remove unnecessary metadata
- Use compressed coordinate precision (decimal places: 1-2)
- Set appropriate viewBox dimensions
- Use CSS for styling where possible instead of inline attributes

### Code Structure

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" aria-labelledby="title desc">
  <title id="title">Diagram Title</title> 
  <desc id="desc">Brief description of the diagram</desc>
  
  <!-- Definitions for reusable elements -->
  <defs>
    <style>
      /* CSS variables and styles */
    </style>
    <!-- Gradients, patterns, etc. -->
  </defs>
  
  <!-- Background elements -->
  
  <!-- Content groups -->
  <g class="nodes">
    <!-- Node elements -->
  </g>
  
  <g class="connections">
    <!-- Connection paths -->
  </g>
  
  <!-- Text elements -->
  <g class="labels">
    <!-- Text labels -->
  </g>
</svg>
```

## Diagram-Specific Guidelines

### AutoRAG Diagrams

- Use flow direction from left to right
- Highlight knowledge base connections in Divinci Teal
- Use hexagons for data/document elements
- Show data transformation with gradient-filled paths

### Release Cycle Management Diagrams

- Use circular structures for cycle visualization
- Highlight current phase in workflow with Divinci Purple
- Use consistent icons for different development stages
- Ensure clear demarcation between phases

### LLM QA Pipeline Diagrams

- Structure as top-to-bottom workflow
- Use diamonds for validation/decision points
- Highlight test/validation components in Warning Amber
- Use Success Green for passed validation paths

## Implementation Examples

### Basic Node Connection

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">
  <!-- Connection line with animation -->
  <path d="M50,50 L250,50" stroke="#2E5BFF" stroke-width="2" fill="none">
    <animate attributeName="stroke-dashoffset" from="300" to="0" dur="1.5s" repeatCount="1"/>
  </path>
  
  <!-- Starting node -->
  <circle cx="50" cy="50" r="15" stroke="#2E5BFF" stroke-width="2" fill="#F5F7FA"/>
  
  <!-- Ending node -->
  <circle cx="250" cy="50" r="15" stroke="#00D8D8" stroke-width="2" fill="#F5F7FA"/>
  
  <!-- Labels -->
  <text x="50" y="80" text-anchor="middle" font-family="Inter, sans-serif" font-size="14">Start</text>
  <text x="250" y="80" text-anchor="middle" font-family="Inter, sans-serif" font-size="14">End</text>
</svg>
```

### Component Container

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">
  <!-- Container -->
  <rect x="10" y="10" width="180" height="120" rx="4" ry="4" 
        stroke="#485262" stroke-width="1.5" fill="#F5F7FA"/>
  
  <!-- Title -->
  <text x="20" y="30" font-family="Inter, sans-serif" font-size="16" font-weight="500">Component Title</text>
  
  <!-- Content -->
  <circle cx="50" cy="70" r="10" fill="#2E5BFF"/>
  <circle cx="100" cy="70" r="10" fill="#00D8D8"/>
  <circle cx="150" cy="70" r="10" fill="#8C54FF"/>
  
  <!-- Labels -->
  <text x="50" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="12">Item 1</text>
  <text x="100" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="12">Item 2</text>
  <text x="150" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="12">Item 3</text>
</svg>
```

## Version Control and Asset Management

- Store master SVG files in the `/assets/svg/source/` directory
- Use semantic naming: `feature-purpose-type.svg` (e.g., `autorag-flow-diagram.svg`)
- Include version comment at the top of SVG files: `<!-- v1.0 - 2023-05-01 -->`
- Document significant changes in version history section of this style guide

## Review Checklist

Before finalizing any SVG diagram, verify:

- [ ] Colors match the defined palette
- [ ] Typography follows standards
- [ ] Visual elements use consistent styling
- [ ] Animations are subtle and enhancing
- [ ] SVG is accessible with proper labeling
- [ ] File is optimized for web delivery
- [ ] Diagram accurately represents the feature/process
- [ ] Layout is responsive or has mobile alternative
- [ ] Code is properly formatted and documented

## Conclusion

This style guide ensures that all SVG visualizations on Divinci.ai present a unified, professional appearance while effectively communicating complex technical concepts. All team members should adhere to these guidelines when creating or modifying feature visualizations.