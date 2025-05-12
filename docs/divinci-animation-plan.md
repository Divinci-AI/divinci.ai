# Divinci Robot Animation Plan

This document outlines the plan for creating a parallax animation where files, video, and audio elements flow into the Divinci robot logo, with the robot responding by raising its hands and tilting its antennas.

## Animation Concept Overview

We'll create a parallax animation where:
1. Different media types (files, video, audio) flow in from different directions
2. The Divinci robot responds by raising its hands and tilting its antennas
3. The animation will be smooth, engaging, and visually represent Divinci processing multiple inputs

## Detailed Animation Sequence

### 1. Initial Setup

**SVG Preparation:**
- Create an animated version of `divinci_logo_inverted.svg` with movable parts
- Separate the robot's arms and antennas into distinct elements that can be animated independently
- Ensure all elements have proper transform origins for natural movement

**Scene Setup:**
- Position the Divinci robot in the center of the viewport
- Create a container for the parallax effect
- Set up scroll-based or time-based animation triggers

### 2. Animation Sequence

**Phase 1: Media Elements Approach (0-2 seconds)**
- File icons flow in from the left side of the screen
- Video elements flow in from the center top
- Audio waveforms flow in from the right side
- Each element follows a curved path toward Divinci
- Elements start small and grow as they approach
- Use emoji representations for each media type:
  - 📄 or 📁 for files
  - 🎬 or 📹 for video
  - 🎵 or 🔊 for audio

**Phase 2: Divinci Responds (1.5-3 seconds)**
- As media elements approach, Divinci begins to react:
  - Antennas gradually tilt outward to 45-degree angles
  - Arms slowly raise upward to receive the incoming media
  - Subtle "anticipation" animation where Divinci slightly crouches before raising arms

**Phase 3: Media Reception (2.5-4 seconds)**
- Media elements reach Divinci simultaneously
- Small "pulse" or "glow" effect at the point of contact
- Media elements shrink slightly as they're "absorbed"
- Divinci's heart area could pulse with light to indicate processing

**Phase 4: Processing State (4-6 seconds)**
- Divinci maintains raised arms and tilted antennas
- Subtle pulsing or glowing effect in the robot's body
- Small particles or data points could circulate within the robot silhouette
- Maintain this state for a moment to indicate processing

**Phase 5: Completion (6-8 seconds)**
- Divinci gradually returns to neutral position
- Arms lower smoothly
- Antennas return to vertical position
- Final "satisfied" pulse effect to indicate successful processing

## Technical Implementation Details

### SVG Animation Approach
- Use CSS animations for basic movements
- Use JavaScript to control timing and coordinate multiple elements
- Consider GSAP (GreenSock Animation Platform) for more complex animations
- Implement requestAnimationFrame for smooth performance

### Key Animation Components

1. **Arm Movement:**
   - Identify arm elements in SVG
   - Set transform-origin to shoulder area
   - Animate rotation and translation

2. **Antenna Movement:**
   - Identify antenna elements in SVG
   - Set transform-origin to base of antennas
   - Animate rotation to 45-degree angles

3. **Media Element Paths:**
   - Create curved Bezier paths for media elements
   - Animate elements along these paths
   - Coordinate timing so all elements arrive simultaneously

4. **Visual Effects:**
   - Add subtle glow/pulse effects using CSS filters or SVG filters
   - Implement particle effects for the "processing" state
   - Use opacity and scale transitions for smooth appearance/disappearance

### Parallax Implementation

**Scroll-Based Approach:**
- Divide the animation into scroll-triggered segments
- Use intersection observers to trigger animation phases
- Map scroll position to animation progress

**Time-Based Approach:**
- Trigger the full animation sequence on page load or user interaction
- Use setTimeout or requestAnimationFrame to control timing
- Allow replay option for users to see the animation again

### Audio Enhancement (Optional)
- Add subtle sound effects to enhance the animation:
  - Whoosh sounds as media elements fly in
  - Mechanical sounds as Divinci moves its arms and antennas
  - Processing/computing sounds during the absorption phase
  - Completion sound when animation finishes

## Code Structure

### HTML Structure
```html
<div class="animation-container">
  <!-- Media Elements -->
  <div class="media-elements">
    <div class="files-container">
      <!-- File emojis/icons -->
    </div>
    <div class="video-container">
      <!-- Video emojis/icons -->
    </div>
    <div class="audio-container">
      <!-- Audio emojis/icons -->
    </div>
  </div>
  
  <!-- Divinci Robot -->
  <div class="robot-container">
    <!-- Modified SVG with separate parts -->
  </div>
</div>
```

### CSS Animation Definitions
```css
@keyframes antennaMovement {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(45deg); }
}

@keyframes armRaise {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-45deg); }
}

@keyframes mediaApproach {
  0% { 
    transform: translate(var(--start-x), var(--start-y)) scale(0.5);
    opacity: 0;
  }
  100% { 
    transform: translate(var(--end-x), var(--end-y)) scale(1);
    opacity: 1;
  }
}

/* Element Styling */
.robot-container {
  position: relative;
  width: 400px;
  height: 400px;
  margin: 0 auto;
}

.media-element {
  position: absolute;
  font-size: 2rem;
  will-change: transform, opacity;
}
```

### JavaScript Animation Control
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Get references to elements
  const robot = document.querySelector('.robot-container');
  const leftArm = document.querySelector('#left-arm');
  const rightArm = document.querySelector('#right-arm');
  const leftAntenna = document.querySelector('#left-antenna');
  const rightAntenna = document.querySelector('#right-antenna');
  const mediaElements = document.querySelectorAll('.media-element');
  
  // Animation timeline setup
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.animation-container',
      start: 'top center',
      end: 'bottom center',
      scrub: true
    }
  });
  
  // Add animations to timeline
  timeline
    .from(mediaElements, {
      x: (i, el) => el.dataset.startX,
      y: (i, el) => el.dataset.startY,
      scale: 0.5,
      opacity: 0,
      duration: 2,
      ease: 'power2.out',
      stagger: 0.1
    })
    .to([leftAntenna, rightAntenna], {
      rotation: 45,
      transformOrigin: 'bottom center',
      duration: 1.5,
      ease: 'elastic.out(1, 0.5)'
    }, '-=1.5')
    .to([leftArm, rightArm], {
      rotation: -45,
      transformOrigin: 'top center',
      duration: 1.5,
      ease: 'back.out(1.7)'
    }, '-=1.2')
    // Additional animation steps...
});
```
