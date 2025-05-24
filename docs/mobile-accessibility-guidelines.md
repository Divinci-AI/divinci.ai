# Mobile Accessibility Guidelines

## Overview

This document provides guidelines for ensuring that the Divinci AI website is accessible on mobile devices. These guidelines are based on WCAG 2.1 AA requirements and best practices for mobile accessibility.

## Touch Target Size

Touch targets should be large enough to be easily tapped with a finger, without accidentally tapping adjacent elements.

### Requirements

- Touch targets should be at least 44x44 pixels in size
- Interactive elements should have adequate spacing between them (at least 8 pixels)

### Implementation

```css
/* Make all interactive elements at least 44x44px */
a,
button,
[role="button"],
input:not([type="hidden"]),
select,
textarea,
[tabindex]:not([tabindex="-1"]) {
  min-height: 44px;
  min-width: 44px;
  padding: 10px;
}

/* Increase spacing between interactive elements */
a + a,
button + button,
[role="button"] + [role="button"] {
  margin-left: 8px;
  margin-right: 8px;
}
```

## Text Size and Readability

Text should be large enough to be readable on small screens without zooming.

### Requirements

- Base font size should be at least 16px
- Line height should be at least 1.5 for body text
- Form inputs should use at least 16px font size to prevent iOS zoom

### Implementation

```css
body {
  font-size: 16px;
  line-height: 1.5;
}

p, li, label, input, select, textarea {
  font-size: 16px !important; /* Prevent iOS zoom on focus */
  line-height: 1.5;
}
```

## Responsive Design

The website should adapt to different screen sizes and orientations.

### Requirements

- Content should fit within the viewport without horizontal scrolling
- The website should work in both portrait and landscape orientations
- No content should be lost when the screen size changes

### Implementation

- Use responsive design techniques (fluid layouts, flexible images, media queries)
- Test the website in different orientations
- Ensure that all content is accessible in all viewport sizes

## Pinch-to-Zoom

Users should be able to zoom in on the page to see content more clearly.

### Requirements

- The viewport meta tag should not disable zooming
- Text should remain readable when zoomed to 200%

### Implementation

```html
<!-- Correct: Allows zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Incorrect: Disables zooming -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

## Mobile Screen Readers

The website should be compatible with mobile screen readers like VoiceOver (iOS) and TalkBack (Android).

### Requirements

- All interactive elements should have accessible names
- Headings should be used to structure the page
- ARIA attributes should be used appropriately
- Form controls should have associated labels

### Implementation

- Test with VoiceOver on iOS and TalkBack on Android
- Ensure that all interactive elements can be accessed and operated using the screen reader
- Use proper semantic HTML elements
- Add ARIA attributes where necessary

## Mobile Keyboard

The website should be usable with an on-screen keyboard.

### Requirements

- Form fields should be properly labeled
- Error messages should be associated with form fields
- The keyboard type should be appropriate for the input type

### Implementation

```html
<!-- Use appropriate input types -->
<input type="tel" id="phone" name="phone">
<input type="email" id="email" name="email">
<input type="url" id="website" name="website">
<input type="number" id="age" name="age">
```

## Mobile Gestures

The website should not rely solely on complex gestures that may be difficult for some users.

### Requirements

- Complex gestures should have simpler alternatives
- The website should not rely on multi-touch gestures
- Swiping gestures should have button alternatives

### Implementation

- Provide button alternatives for swipe gestures
- Ensure that all functionality can be accessed without complex gestures
- Test with different input methods

## Testing Mobile Accessibility

### Automated Testing

Use automated testing tools to identify potential accessibility issues:

```typescript
// Example of mobile accessibility testing with Playwright
test('Mobile accessibility test', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Navigate to the page
  await page.goto('https://example.com');
  
  // Check for touch target sizes
  const interactiveElements = await page.locator('a, button, [role="button"]').all();
  
  for (const element of interactiveElements) {
    const boundingBox = await element.boundingBox();
    
    if (boundingBox) {
      const { width, height } = boundingBox;
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    }
  }
});
```

### Manual Testing

Manual testing is essential for mobile accessibility:

1. Test with different mobile devices (iOS and Android)
2. Test with mobile screen readers (VoiceOver and TalkBack)
3. Test with different orientations (portrait and landscape)
4. Test with different input methods (touch, keyboard, stylus)
5. Test with different zoom levels

## Common Mobile Accessibility Issues

### 1. Small Touch Targets

**Issue**: Touch targets are too small or too close together, making them difficult to tap accurately.

**Solution**: Increase the size of touch targets to at least 44x44 pixels and ensure adequate spacing between them.

### 2. Fixed Font Sizes

**Issue**: Font sizes are specified in pixels and cannot be resized by the user.

**Solution**: Use relative font sizes (em, rem) and ensure that text can be resized up to 200% without loss of content or functionality.

### 3. Disabled Zooming

**Issue**: The viewport meta tag disables zooming, preventing users from enlarging content.

**Solution**: Remove `maximum-scale` and `user-scalable=no` from the viewport meta tag.

### 4. Horizontal Scrolling

**Issue**: Content extends beyond the viewport, requiring horizontal scrolling.

**Solution**: Use responsive design techniques to ensure that content fits within the viewport.

### 5. Keyboard Traps

**Issue**: The keyboard focus gets trapped in a component, preventing users from navigating away.

**Solution**: Ensure that keyboard focus can move in and out of all components.

### 6. Missing Alternative Input Methods

**Issue**: The website relies solely on touch gestures without providing alternatives.

**Solution**: Provide alternative input methods for all functionality.

## Resources

- [WCAG 2.1 Mobile Accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)
- [BBC Mobile Accessibility Guidelines](https://www.bbc.co.uk/accessibility/forproducts/guides/mobile/)
- [WebAIM: Mobile Accessibility](https://webaim.org/articles/mobile/)
- [Nielsen Norman Group: Mobile Usability](https://www.nngroup.com/articles/mobile-usability/)
- [Deque University: Mobile Accessibility](https://dequeuniversity.com/checklists/mobile)
