# Consumer/Company Toggle Copywriting Plan

## Overview

The Divinci.ai website needs to support two distinct audiences:
1. **Consumers** - Individual users looking for personal AI solutions
2. **Companies** - Enterprise customers seeking business AI solutions

To address both audiences without creating separate websites, we'll implement a toggle system that switches copywriting content between consumer-focused and company-focused messaging throughout the site.

## Goals

1. Create a seamless toggle experience that changes content across the entire website
2. Maintain consistent design while changing only the text content
3. Ensure all key sections have appropriate messaging for both audiences
4. Make the toggle state persistent across page navigation
5. Ensure the toggle is accessible and works on all devices

## Technical Approach

### Toggle Mechanism

1. Use a single toggle switch in the header that's visible on all pages
2. Store the toggle state in localStorage to persist across page navigation
3. Use CSS classes to control visibility of different content versions
4. Implement JavaScript to handle the toggle state changes and content visibility

### Content Structure

For each piece of content that needs to be toggled:
1. Create two versions of the content (consumer and company)
2. Wrap each version in a div with the appropriate class:
   - `consumer-view-content` for consumer-focused content
   - `company-view-content` for company-focused content
3. Use CSS to control visibility based on the toggle state

### Implementation Phases

#### Phase 1: Core Toggle Functionality (COMPLETED)
- Implement the toggle switch in the header
- Create the JavaScript to handle toggle state changes
- Set up the CSS classes for content visibility
- Test the basic toggle functionality

#### Phase 2: Homepage Content (IN PROGRESS)
- Update the feature descriptions on the homepage (COMPLETED)
- Add toggle support for the hero section
  - Add a main tagline/heading to the hero section
  - Create consumer and company versions of the tagline
  - Ensure smooth transition between versions
- Add toggle support for the team section
  - Determine if team descriptions need different versions
  - If needed, create alternate descriptions for company view
- Add toggle support for the social good section
  - Create company-focused version of the social good content
  - Emphasize business impact and corporate social responsibility
- Test the homepage toggle functionality

#### Phase 3: Feature Pages
- Update content on all feature pages
  - Quality Assurance page
  - Release Management page
  - AutoRAG page
  - Other feature pages
- Ensure consistent messaging across pages
- Test navigation between pages with toggle state persistence

#### Phase 4: Additional Pages
- Update team, about, and other secondary pages
- Ensure consistent messaging across all site content
- Test the entire site with both toggle states

## Content Guidelines

### Consumer Content
- Use friendly, conversational language
- Focus on personal benefits and ease of use
- Highlight features relevant to individual users
- Use examples related to personal productivity and creativity

### Company Content
- Use professional, business-oriented language
- Focus on ROI, efficiency, and scalability
- Highlight enterprise features like security, compliance, and integration
- Use examples related to business processes and team collaboration

## Testing Strategy

1. **Functional Testing**
   - Verify toggle works on all pages
   - Confirm toggle state persists across navigation
   - Test on different browsers and devices

2. **Content Review**
   - Ensure all content has both consumer and company versions
   - Check for consistency in messaging across pages
   - Verify appropriate tone and language for each audience

3. **Performance Testing**
   - Ensure toggle switching is smooth and responsive
   - Check for any layout shifts when toggling
   - Verify page load times aren't significantly affected

4. **Accessibility Testing**
   - Ensure toggle is keyboard accessible
   - Verify screen reader compatibility
   - Test with various accessibility tools

## Maintenance Considerations

1. **Adding New Content**
   - All new content must have both consumer and company versions
   - Documentation for developers on how to implement toggle-compatible content

2. **Content Updates**
   - Process for updating both versions when content changes
   - Regular review to ensure messaging remains aligned with brand strategy

3. **Performance Monitoring**
   - Track toggle usage to understand audience preferences
   - Monitor for any performance issues related to the toggle functionality

## Next Steps

1. **Phase 2: Homepage Content**
   - Update the feature descriptions on the homepage (COMPLETED)
   - Add toggle support for the hero section (COMPLETED)
   - Add toggle support for the social good section (COMPLETED)
   - Add toggle support for the team section
     - Determine if team descriptions need different versions
     - If needed, create alternate descriptions for company view
   - Test the homepage toggle functionality

2. **Phase 3: Feature Pages**
   - Identify key feature pages that need toggle support
   - Start with the Quality Assurance page
   - Create consumer and company versions of the content
   - Implement toggle classes
   - Test toggle functionality
