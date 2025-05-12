# Device Performance Detection for Web Animations

This document outlines the implementation of device performance detection to ensure animations run smoothly across various devices, or gracefully fall back to static images on lower-powered devices.

## Overview

Not all devices can handle complex animations smoothly. To provide the best user experience, we've implemented a performance detection system that:

1. Detects device capabilities (CPU, memory, GPU, etc.)
2. Performs a quick benchmark test
3. Makes an intelligent decision about whether to show animations or static content
4. Adapts animation complexity based on device performance

## Implementation Files

- `device-performance.js` - The core performance detection utility
- `divinci-animation-with-detection.js` - Example integration with the Divinci animation
- `performance-demo.html` - Demo page showing the implementation

## How It Works

The performance detection system uses several techniques to determine if a device can handle animations:

### 1. Hardware Detection

- **CPU Cores**: Uses `navigator.hardwareConcurrency` to detect available CPU cores
- **Memory**: Uses `navigator.deviceMemory` (where available) to detect device memory
- **GPU Detection**: Uses WebGL renderer information to detect hardware acceleration

### 2. Browser Capabilities

- **Browser Age**: Detects if the browser is significantly outdated
- **Mobile Detection**: Identifies mobile devices that may have performance limitations
- **Feature Detection**: Checks for critical features required for smooth animation

### 3. Performance Benchmarking

- Runs a quick frame rate test to measure actual rendering performance
- Animates a simple element and measures frames per second (FPS)
- Sets thresholds for acceptable performance

### 4. Decision Making

The system uses a weighted scoring approach that considers:
- Major factors: CPU cores, hardware acceleration, and frame rate
- Minor factors: memory, browser age, mobile status

If multiple factors indicate potential performance issues, the system opts for static content.

## How to Use

### 1. Basic Integration

```html
<!-- Include the performance detection script -->
<script src="device-performance.js"></script>

<!-- Include your animation script that uses the detector -->
<script src="your-animation-script.js"></script>
```

### 2. In Your JavaScript

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // Check if device can handle animations
    const canAnimateSmoothly = await DevicePerformance.loadAppropriateResource({
        animationElement: '#animation-container',
        staticElement: '#static-image-container',
        onLowPerformance: (stats) => {
            console.log('Using static image due to performance constraints');
        },
        onHighPerformance: (stats) => {
            console.log('Device capable of running animation');
            initAnimation(); // Only initialize animation if device can handle it
        }
    });
});
```

### 3. HTML Structure

```html
<div class="media-container">
    <!-- Animation container, shown by default -->
    <div class="animation-container">
        <!-- Your animation content -->
        <object id="animation-svg" data="path/to/animation.svg"></object>
    </div>
    
    <!-- Static image fallback, hidden by default -->
    <div class="static-image-container" style="display: none;">
        <img src="path/to/static-image.png" alt="Static fallback">
    </div>
</div>
```

## API Reference

### DevicePerformance.configure(options)

Configures performance thresholds.

```javascript
DevicePerformance.configure({
    cpuCores: 2,                // Minimum CPU cores
    fpsThreshold: 25,           // Minimum acceptable FPS
    hardwareAccelerationRequired: true
});
```

### DevicePerformance.runPerformanceCheck()

Runs a comprehensive performance check and returns a Promise with the result.

```javascript
const isLowPerformance = await DevicePerformance.runPerformanceCheck();
```

### DevicePerformance.quickCheck()

Runs a faster, less comprehensive check for when speed is critical.

```javascript
const isLowPerformance = await DevicePerformance.quickCheck();
```

### DevicePerformance.getPerformanceStats()

Returns detailed statistics about the device.

```javascript
const stats = DevicePerformance.getPerformanceStats();
console.log(stats.cores, stats.fps, stats.isMobile);
```

### DevicePerformance.loadAppropriateResource(options)

Complete solution that checks performance and shows the appropriate content.

```javascript
await DevicePerformance.loadAppropriateResource({
    animationElement: '#animation-container',
    staticElement: '#static-image-container',
    forceAnimation: false, // Optional override
    onLowPerformance: (stats) => { /* callback */ },
    onHighPerformance: (stats) => { /* callback */ }
});
```

## Progressive Enhancement

For the best user experience, consider these practices:

1. **Default to Static**: Start with static content visible, then progressively enhance
2. **Incremental Complexity**: Add animation complexity only after baseline performance is confirmed
3. **User Preference**: Consider adding a setting for users to manually choose static/animated content
4. **Performance Analytics**: Track performance metrics to understand your user base

## Browser Support

The detection system works in all modern browsers. Some specific capabilities have varying support:

- `navigator.deviceMemory` - Chrome 63+, Opera 50+
- WebGL renderer info - Most modern browsers, may require permission
- `navigator.hardwareConcurrency` - Most modern browsers

For older browsers, the system uses fallbacks to make the best determination possible.

## Testing

To test how the system behaves on different devices:

1. Use Chrome DevTools' device emulation mode
2. Throttle CPU performance in DevTools
3. Test on real low-end devices when possible

## Demo

A demo is available at `performance-demo.html` that shows the performance detection in action, with controls for testing different scenarios.