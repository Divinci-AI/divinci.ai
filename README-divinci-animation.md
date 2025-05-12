# Divinci Robot Animation

This project implements a parallax animation where files, video, and audio elements flow into the Divinci robot logo, with the robot responding by raising its hands and tilting its antennas.

## Overview

The animation shows the Divinci robot receiving and processing different types of media:
- File icons flow in from the left
- Video elements flow in from the top
- Audio elements flow in from the right

As the media elements approach, Divinci responds by:
1. Tilting its antennas outward
2. Raising its arms to receive the incoming media
3. Processing the media (indicated by a pulsing heart and particle effects)
4. Returning to its neutral position

## Files

- `divinci-animation.html` - Main HTML file containing the animation structure
- `divinci-animation.css` - CSS styles for the animation
- `divinci-animation.js` - JavaScript code that controls the animation
- `images/divinci_logo_animated.svg` - SVG file with separated parts for animation
- `docs/divinci-animation-plan.md` - Detailed animation plan
- `docs/divinci-animation-implementation.md` - Implementation steps and tasks

## How to Use

1. Open `divinci-animation.html` in a web browser
2. Click the "Play Animation" button to start the animation
3. Watch as the media elements flow into Divinci and the robot responds

## Customization

### Changing Media Elements

You can customize the media elements by modifying the HTML structure in `divinci-animation.html`:

```html
<div class="media-elements">
    <div class="files-container">
        <div class="media-element file" data-start-x="-300" data-start-y="0">
            <span class="emoji">📄</span>
        </div>
        <!-- Add more file elements here -->
    </div>
    <!-- Similar structure for video and audio elements -->
</div>
```

Each media element is displayed as an emoji inside a circular bubble background, consistent with Divinci's circle branding throughout the website.

### Adjusting Animation Timing

You can adjust the timing of the animation by modifying the timeline in `divinci-animation.js`:

```javascript
// Example: Change when the arms raise
timeline.to(leftArm, {
    rotate: -45,
    duration: 1.5,
    ease: "back.out(1.7)"
}, 1.2); // Change this value to adjust when the animation starts
```

### Styling

You can customize the appearance by modifying `divinci-animation.css`:

- Change colors of the circular bubble backgrounds
- Adjust glow effects and gradients
- Modify particle appearances
- Change the size of the circular bubbles (default is 50px diameter)

## Technical Details

The animation uses:
- SVG with separated elements for animation
- GSAP (GreenSock Animation Platform) for advanced animations
- CSS for styling and basic animations
- JavaScript for controlling the animation sequence
- Circular design elements for consistent branding

## Browser Compatibility

This animation works best in modern browsers that support:
- SVG animations
- CSS transforms and transitions
- JavaScript ES6 features

## Credits

- Divinci robot logo design
- GSAP animation library (https://greensock.com/gsap/)
- Emoji icons for media elements
