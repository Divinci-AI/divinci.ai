# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- Local dev server: Start with `npx serve` or any simple HTTP server
- Animation testing: Open `divinci-animation.html` in browser
- For testing SVG: View individual SVG files directly in browser
- Validate HTML: Use W3C Validator (https://validator.w3.org/)

## Code Style Guidelines
- HTML: Use 4 spaces for indentation, lowercase tags, double quotes for attributes
- CSS: 
  - Use consistent class naming, 4-space indentation
  - Modern CSS nesting is used for organization
  - Keep related styles grouped by components
- JavaScript: 
  - Use camelCase for variables and functions
  - ES6+ syntax preferred
  - Use semicolons at the end of statements
  - Consistent error handling with try/catch blocks
  - Keep animation code modularized in separate files
- SVG: Maintain clean IDs for elements, especially for animation targets
- GSAP: Follow GSAP's best practices for animation timelines and sequencing

## Animation Considerations
- Maintain transform-origin properties for natural movement
- Test animations across different browsers
- Consider performance implications for complex animations