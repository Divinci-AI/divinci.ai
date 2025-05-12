// Memoize trigonometric calculations for performance
const cosCache = {};
const sinCache = {};

function getCos(angle) {
  if (cosCache[angle] === undefined) {
    cosCache[angle] = Math.cos((Math.PI * angle) / 180);
  }
  return cosCache[angle];
}

function getSin(angle) {
  if (sinCache[angle] === undefined) {
    sinCache[angle] = Math.sin((Math.PI * angle) / 180);
  }
  return sinCache[angle];
}

// Throttle flower generation for better performance
let flowerGenerationTimeout = null;

function generateFlowerOfLife() {
  // Debounce to prevent multiple calls during rapid resize
  if (flowerGenerationTimeout) {
    clearTimeout(flowerGenerationTimeout);
  }
  
  flowerGenerationTimeout = setTimeout(() => {
    const heroSection = document.querySelector(".hero");
    const svgElement = document.querySelector(".flower-of-life");

    if (heroSection && svgElement) {
      const heroWidth = heroSection.offsetWidth;
      const centralCircleRadius = heroWidth * 0.08; // Central circle radius as 8% of hero width
      const circleDistance = centralCircleRadius * 2; // Distance for the first ring of circles
      const outerCircleRadius = centralCircleRadius * 1.5; // Larger radius for outer circles
      const outerCircleDistance =
        circleDistance + centralCircleRadius + outerCircleRadius; // Distance for the outer ring

      // Use document fragment to batch DOM operations
      const fragment = document.createDocumentFragment();
      
      // Pre-calculate central coordinates to avoid repeated calculations
      const centerX = heroWidth / 2;
      const centerY = heroSection.offsetHeight / 2;

      // Central Circle
      createCircle(
        fragment,
        centerX,
        centerY,
        centralCircleRadius,
      );

      // Generate first ring of surrounding circles
      const angles = [0, 60, 120, 180, 240, 300]; // Angles for hexagonal pattern
      
      // Generate all circles at once using pre-calculated values
      for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        // Use cached trig values
        const cos = getCos(angle);
        const sin = getSin(angle);
        
        // First ring
        const cx1 = centerX + circleDistance * cos;
        const cy1 = centerY + circleDistance * sin;
        createCircle(fragment, cx1, cy1, centralCircleRadius);
        
        // Outer ring
        const cx2 = centerX + outerCircleDistance * cos;
        const cy2 = centerY + outerCircleDistance * sin;
        createCircle(fragment, cx2, cy2, outerCircleRadius);
      }

      // Clear previous SVG content and add the new elements in one batch
      svgElement.innerHTML = "";
      svgElement.appendChild(fragment);
    }
    
    flowerGenerationTimeout = null;
  }, 100); // 100ms delay to ensure smooth performance
}

function createCircle(svgElement, cx, cy, r) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("stroke", "rgb(0, 0, 67)");
  circle.setAttribute("stroke-width", "2");
  circle.setAttribute("fill", "none");
  svgElement.appendChild(circle);
}

document.addEventListener("DOMContentLoaded", () => {
  // Configure each group with different orbit keyframes and slightly different durations
  const groups = [
    { selector: ".geometry-group", orbitKeyframes: "orbit", duration: 15 },
    { selector: ".geometry-group-outer1", orbitKeyframes: "orbit3", duration: 20 },
    { selector: ".geometry-group-outer2", orbitKeyframes: "orbit4", duration: 25 },
  ];

  // Cache DOM queries and create circle groups in a single pass
  const circleGroups = {};
  
  groups.forEach((item) => {
    const group = document.querySelector(item.selector);
    if (!group) return;

    // Make group visible immediately
    group.style.opacity = 1;
    
    // Cache circles and apply styles in a single pass
    const circles = group.querySelectorAll(".circle");
    
    // Store circles for later use
    circleGroups[item.selector] = Array.from(circles);
    
    // Apply animations with reduced reflow
    if (circles.length > 0) {
      // Create a document fragment for batch DOM operations
      const fragment = document.createDocumentFragment();
      const tempContainer = document.createElement('div');
      tempContainer.style.display = 'none';
      
      // Apply styles to all circles at once using CSS classes instead of inline styles
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        ${item.selector} .circle {
          opacity: 1;
          animation: ${item.orbitKeyframes} ${item.duration}s linear infinite;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  });

  let activeBubbles = [];

  // Enhanced marketing-style feature messages for the chat bubbles
  const featureMessages = [
    "🚀 Staged model releases for safe deployments",
    "🧪 A/B test model behavior with confidence",
    "⚖️ Advanced bias detection & mitigation",
    "📊 Enterprise-grade monitoring & logging",
    "🔄 Custom RLHF pipelines for your needs",
    "🛡️ Powerful guardrails & content filters",
    "📝 Seamless model versioning & rollbacks",
    "✅ Automated evaluations for quality",
    "👥 Human feedback loop integration",
    "🔍 Expert red teaming for your models",
    "🔒 Advanced jailbreak prevention",
    "⚔️ Custom safety filters for your brand",
    "🤖 Auto-RAG for smarter responses",
    "⚡ Enterprise RAG APIs with scale",
    "🧠 Fine-Tuning APIs for domain expertise",
    "🌐 Access 100+ LLMs to build atop!",
    "📋 Transparent AI safety reporting",
    "💰 Cost-efficient inference options",
    "🖼️ Multi-modal model support",
    "📝 Customizable prompt templates"
  ];

  // Reactions/responses for the other circles
  const reactionMessages = [
    "Love that! 😍",
    "Perfecto 🤌",
    "Wow! 🤩",
    "Game changer! 🚀",
    "That's genius! 💡",
    "Need this! ✅",
    "So cool! ❄️",
    "Amazing! ⭐",
    "This is the way 🧙‍♂️",
    "Chef's kiss 👨‍🍳",
    "Brilliant! ✨",
    "Next level! 🔥",
    "Facts! 💯",
    "Based ✌️",
    "Take my money! 💸",
    "Mind blown! 🤯",
    "Life changing 🙌",
    "Finally! 🎯",
    "I'm all in! 🎲",
    "Super excited! ⚡",
    "Can't wait! ⏱️",
    "Exactly what we need! 📈",
    "Yes please! 🙏",
    "100% needed 👌",
    "Let's go! 🏁"
  ];

  // Track the current message indices
  let currentFeatureIndex = 0;
  let currentReactionIndex = 0;
  let secondReactionIndex = 12; // Start second reactions at a different point for variety
  let lastFeatureGroupIndex = -1; // Track the last group that showed a feature message

  // Remove template caching as we'll create fresh elements each time

  // Initialize animation-related variables
  let chatBubbleAnimationFrame = null;
  let chatBubbleInterval = 12000; // 12 seconds between sequences
  let chatBubbleTimer = null;
  
  // Cache group keys for faster access and log for debugging
  const groupKeys = Object.keys(circleGroups);
  console.log('Circle groups found:', groupKeys.length);
  
  // Debug each group to see its contents
  groupKeys.forEach(key => {
    console.log(`Group ${key} has ${circleGroups[key]?.length || 0} circles`);
  });
  
  function showChatBubbles() {
    console.log('Showing chat bubbles at', new Date().toISOString());
    
    // Clear any existing bubbles first
    document.querySelectorAll('.chat-bubble').forEach(bubble => {
      bubble.remove();
    });
    activeBubbles = [];

    // Randomly select which group shows the feature message (always different from the last one)
    let featureGroupIndex;
    do {
      featureGroupIndex = Math.floor(Math.random() * groupKeys.length);
    } while (featureGroupIndex === lastFeatureGroupIndex && groupKeys.length > 1);
    
    // Update the last group tracker
    lastFeatureGroupIndex = featureGroupIndex;

    // Create a filtered array of other indices only once
    const otherGroupIndices = [];
    for (let i = 0; i < groupKeys.length; i++) {
      if (i !== featureGroupIndex) {
        otherGroupIndices.push(i);
      }
    }

    // Create all bubbles with guaranteed visibility

    // Step 1: Show only the feature message first
    const showFeature = () => {
      const groupSelector = groupKeys[featureGroupIndex];
      const groupCircles = circleGroups[groupSelector];

      if (groupCircles && groupCircles.length > 0) {
        // Select a random circle from this group
        const randomCircleIndex = Math.floor(Math.random() * groupCircles.length);
        const selectedCircle = groupCircles[randomCircleIndex];
        
        // Create a new element instead of cloning
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble feature-bubble';

        // Show feature message slogan
        chatBubble.textContent = featureMessages[currentFeatureIndex];

        // Force styles that ensure visibility
        Object.assign(chatBubble.style, {
          display: 'flex',              // Explicitly set display
          opacity: '1',                 // Ensure it's fully visible
          zIndex: '9999',               // Very high z-index
          visibility: 'visible',        // Belt and suspenders
          position: 'absolute',         // Keep absolute positioning
          pointerEvents: 'none',        // Don't capture mouse events
          top: '-67px',                 // Moved up by 7px from -60px to -67px
          left: '50%',                  // Center horizontally
          transform: 'translateX(-50%)',// Center alignment
          backgroundColor: 'white',     // Ensure background is visible
          padding: '8px 16px',          // Ensure padding
          borderRadius: '22px / 18px',  // Oval shape
          boxShadow: '0 3px 8px rgba(0,0,0,0.15)', // Visible shadow
          border: '1px solid rgba(0,0,0,0.1)',      // Visible border
          minWidth: '200px',            // Ensure width
          color: 'black',               // Text color
          fontWeight: '500',            // Text weight
          fontSize: '0.8em',            // Text size
          whiteSpace: 'nowrap'          // No text wrapping
        });

        // Increment feature index for next time
        currentFeatureIndex = (currentFeatureIndex + 1) % featureMessages.length;

        // Add to the parent circle
        // Add a speech bubble pointer element
        const pointer = document.createElement('div');
        pointer.style.content = "''";
        pointer.style.position = 'absolute';
        pointer.style.bottom = '-6px';
        pointer.style.left = '50%';
        pointer.style.marginLeft = '-6px';
        pointer.style.width = '12px';
        pointer.style.height = '12px';
        pointer.style.background = 'white';
        pointer.style.transform = 'rotate(45deg)';
        pointer.style.border = '1px solid rgba(0,0,0,0.1)';
        pointer.style.borderLeft = 'none';
        pointer.style.borderTop = 'none';
        pointer.style.zIndex = '0';
        
        chatBubble.appendChild(pointer);
        
        // Add animation
        chatBubble.style.animation = 'popIn 0.5s ease forwards';
        
        // Insert at the top of the circle to be absolutely sure it's on top
        selectedCircle.insertBefore(chatBubble, selectedCircle.firstChild);
        
        // Log for debugging
        console.log(`Feature bubble added to ${selectedCircle.className}. DOM children:`, selectedCircle.children.length);
        
        // Keep track of active bubbles
        activeBubbles.push(chatBubble);
      }

      // Step 2: Show first response after a short delay
      setTimeout(() => showFirstResponse(otherGroupIndices[0]), 1500); // 1.5 second delay for first response
    };

    // Step 2: Show the first response
    const showFirstResponse = (groupIndex) => {
      const groupSelector = groupKeys[groupIndex];
      const groupCircles = circleGroups[groupSelector];

      if (groupCircles && groupCircles.length > 0) {
        // Select a random circle from this group
        const randomCircleIndex = Math.floor(Math.random() * groupCircles.length);
        const selectedCircle = groupCircles[randomCircleIndex];

        // Create a new element instead of cloning
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble reaction-bubble';

        // Show a reaction message
        chatBubble.textContent = reactionMessages[currentReactionIndex];

        // Force styles that ensure visibility
        Object.assign(chatBubble.style, {
          display: 'flex',              // Explicitly set display
          opacity: '1',                 // Ensure it's fully visible
          zIndex: '9999',               // Very high z-index
          visibility: 'visible',        // Belt and suspenders
          position: 'absolute',         // Keep absolute positioning
          pointerEvents: 'none',        // Don't capture mouse events
          top: '-67px',                 // Moved up by 7px from -60px to -67px
          left: '50%',                  // Center horizontally
          transform: 'translateX(-50%)',// Center alignment
          backgroundColor: 'rgba(0, 0, 67, 0.8)',     // Ensure background is visible
          padding: '6px 14px',         // Ensure padding
          borderRadius: '20px / 16px',  // Oval shape
          boxShadow: '0 3px 8px rgba(0,0,0,0.25)', // Visible shadow
          border: '1px solid rgba(0,0,0,0.2)',      // Visible border
          minWidth: '100px',            // Ensure width
          color: 'white',               // Text color
          fontWeight: '500',            // Text weight
          fontSize: '0.7em',            // Text size
          whiteSpace: 'nowrap'          // No text wrapping
        });

        // Increment reaction index for next time, wrapping around when we reach the end
        currentReactionIndex = (currentReactionIndex + 1) % reactionMessages.length;

        // Add a speech bubble pointer element
        const pointer = document.createElement('div');
        pointer.style.content = "''";
        pointer.style.position = 'absolute';
        pointer.style.bottom = '-6px';
        pointer.style.left = '50%';
        pointer.style.marginLeft = '-6px';
        pointer.style.width = '12px';
        pointer.style.height = '12px';
        pointer.style.background = 'rgba(0, 0, 67, 0.8)';
        pointer.style.transform = 'rotate(45deg)';
        pointer.style.border = '1px solid rgba(0,0,0,0.2)';
        pointer.style.borderLeft = 'none';
        pointer.style.borderTop = 'none';
        pointer.style.zIndex = '0';
        
        chatBubble.appendChild(pointer);
        
        // Add animation
        chatBubble.style.animation = 'popIn 0.5s ease forwards';
        
        // Insert at the top of the circle to be absolutely sure it's on top
        selectedCircle.insertBefore(chatBubble, selectedCircle.firstChild);
        activeBubbles.push(chatBubble);
      }

      // Step 3: Show second response after another delay
      setTimeout(() => showSecondResponse(otherGroupIndices[1]), 1000); // 1 second delay after first response
    };

    // Step 3: Show the second response
    const showSecondResponse = (groupIndex) => {
      const groupSelector = groupKeys[groupIndex];
      const groupCircles = circleGroups[groupSelector];

      if (groupCircles && groupCircles.length > 0) {
        // Select a random circle from this group
        const randomCircleIndex = Math.floor(Math.random() * groupCircles.length);
        const selectedCircle = groupCircles[randomCircleIndex];
        
        // Create a new element instead of cloning
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble reaction-bubble';

        // Always show a reaction message, using a different index than the first reaction
        chatBubble.textContent = reactionMessages[secondReactionIndex];

        // Force styles that ensure visibility
        Object.assign(chatBubble.style, {
          display: 'flex',              // Explicitly set display
          opacity: '1',                 // Ensure it's fully visible
          zIndex: '9999',               // Very high z-index
          visibility: 'visible',        // Belt and suspenders
          position: 'absolute',         // Keep absolute positioning
          pointerEvents: 'none',        // Don't capture mouse events
          top: '-67px',                 // Moved up by 7px from -60px to -67px
          left: '50%',                  // Center horizontally
          transform: 'translateX(-50%)',// Center alignment
          backgroundColor: 'rgba(0, 0, 67, 0.8)',     // Ensure background is visible
          padding: '6px 14px',         // Ensure padding
          borderRadius: '20px / 16px',  // Oval shape
          boxShadow: '0 3px 8px rgba(0,0,0,0.25)', // Visible shadow
          border: '1px solid rgba(0,0,0,0.2)',      // Visible border
          minWidth: '100px',            // Ensure width
          color: 'white',               // Text color
          fontWeight: '500',            // Text weight
          fontSize: '0.7em',            // Text size
          whiteSpace: 'nowrap'          // No text wrapping
        });

        // Increment the second reaction index for next time, wrapping around when we reach the end
        secondReactionIndex = (secondReactionIndex + 1) % reactionMessages.length;

        // Add a speech bubble pointer element
        const pointer = document.createElement('div');
        pointer.style.content = "''";
        pointer.style.position = 'absolute';
        pointer.style.bottom = '-6px';
        pointer.style.left = '50%';
        pointer.style.marginLeft = '-6px';
        pointer.style.width = '12px';
        pointer.style.height = '12px';
        pointer.style.background = 'rgba(0, 0, 67, 0.8)';
        pointer.style.transform = 'rotate(45deg)';
        pointer.style.border = '1px solid rgba(0,0,0,0.2)';
        pointer.style.borderLeft = 'none';
        pointer.style.borderTop = 'none';
        pointer.style.zIndex = '0';
        
        chatBubble.appendChild(pointer);
        
        // Add animation
        chatBubble.style.animation = 'popIn 0.5s ease forwards';
        
        // Insert at the top of the circle to be absolutely sure it's on top
        selectedCircle.insertBefore(chatBubble, selectedCircle.firstChild);
        activeBubbles.push(chatBubble);
      }
    };

    // Start the sequence
    showFeature();

    // Use a longer duration to ensure bubbles are visible
    const timeoutDuration = 10000; // Increased to 10 seconds for better visibility
    setTimeout(() => {
      // Remove all bubbles at once
      activeBubbles.forEach(bubble => {
        if (bubble && bubble.parentNode) {
          bubble.parentNode.removeChild(bubble);
        }
      });
      // Clear the array
      activeBubbles = [];
    }, timeoutDuration);
  }

  // Use a simpler interval-based approach for reliability
  function startChatBubblesInterval() {
    // Show bubbles immediately
    showChatBubbles();
    
    // Set up interval for continued displays
    return setInterval(() => {
      if (document.visibilityState === 'visible') {
        showChatBubbles();
      }
    }, chatBubbleInterval);
  }
  
  // Clear the animation frame approach
  if (chatBubbleAnimationFrame) {
    cancelAnimationFrame(chatBubbleAnimationFrame);
    chatBubbleAnimationFrame = null;
  }
  
  // Add a very simple direct approach that doesn't rely on complex logic
  
  // Create bubbles directly in the hero section
  setTimeout(() => {
    console.log('Creating direct bubbles in the hero...');
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
      console.log('Found hero section:', heroSection);
      
      // Create a feature bubble
      const featureBubble = document.createElement('div');
      featureBubble.id = 'direct-feature-bubble';
      featureBubble.textContent = featureMessages[0]; // Use the first feature message
      featureBubble.className = 'chat-bubble feature-bubble direct-bubble';
      
      // Style it directly
      Object.assign(featureBubble.style, {
        position: 'absolute',
        top: '25%',
        left: '30%',
        transform: 'none',
        zIndex: '10000',
        backgroundColor: 'white',
        color: 'black',
        padding: '10px 20px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        border: '1px solid rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      });
      
      // Create a reaction bubble
      const reactionBubble = document.createElement('div');
      reactionBubble.id = 'direct-reaction-bubble';
      reactionBubble.textContent = reactionMessages[0]; // Use the first reaction message
      reactionBubble.className = 'chat-bubble reaction-bubble direct-bubble';
      
      // Style it directly
      Object.assign(reactionBubble.style, {
        position: 'absolute',
        top: '40%',
        left: '70%',
        transform: 'none',
        zIndex: '10000',
        backgroundColor: 'rgba(0, 0, 67, 0.8)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        border: '1px solid rgba(0,0,0,0.2)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      });
      
      // Add to the DOM directly in the hero section
      heroSection.appendChild(featureBubble);
      heroSection.appendChild(reactionBubble);
      
      console.log('Direct bubbles created and added to hero section');
    } else {
      console.error('Could not find hero section for direct bubbles');
    }
    
    // Start normal bubbles after test
    chatBubbleTimer = startChatBubblesInterval();
  }, 1000); // Start after 1 second
  
  // Handle visibility change to pause animations when tab is inactive
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Resume interval when tab becomes visible again
      if (!chatBubbleTimer) {
        chatBubbleTimer = startChatBubblesInterval();
      }
    } else {
      // Pause interval when tab is hidden
      if (chatBubbleTimer) {
        clearInterval(chatBubbleTimer);
        chatBubbleTimer = null;
      }
    }
  });
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (chatBubbleTimer) {
      clearInterval(chatBubbleTimer);
    }
  }, { passive: true });
});

// Optimize event listeners by using a single resize handler with RAF
let resizeAnimationFrame = null;

// Combined function to handle all resize-related updates
function handleResize() {
  // Cancel any existing animation frame to avoid multiple calls
  if (resizeAnimationFrame) {
    cancelAnimationFrame(resizeAnimationFrame);
  }
  
  // Use requestAnimationFrame to ensure smooth performance
  resizeAnimationFrame = requestAnimationFrame(() => {
    // These operations will be batched in the next animation frame
    generateFlowerOfLife();
    createConnectionLines();
    resizeAnimationFrame = null;
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function() {
  // Initial render
  generateFlowerOfLife();
  createConnectionLines();
  generateSacredFlowerOfLife();
  
  // Set up the combined resize handler
  window.addEventListener("resize", handleResize, { passive: true });
});

// Throttle connection line creation for better performance
let connectionLinesTimeout = null;

// Function to create connection lines between feature elements
function createConnectionLines() {
  // Debounce to prevent excessive calculations during resize
  if (connectionLinesTimeout) {
    clearTimeout(connectionLinesTimeout);
  }
  
  connectionLinesTimeout = setTimeout(() => {
    const features = document.querySelectorAll('.features-section .feature');
    if (features.length < 3) return;

    // Clear existing lines
    const linesContainer = document.getElementById('connectionLines');
    if (!linesContainer) return;

    // Use document fragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    
    // Pre-calculate section rect for relative coordinates
    const featuresSection = document.querySelector('.features-section');
    if (!featuresSection) return;
    const sectionRect = featuresSection.getBoundingClientRect();

    // Find the center expertAi feature
    const expertAiFeature = document.getElementById('expertAi');
    const expertAiRect = expertAiFeature ? expertAiFeature.getBoundingClientRect() : null;
    
    // Pre-calculate center coordinates if expertAi is present
    let expertAiCenterX, expertAiCenterY;
    if (expertAiRect) {
      expertAiCenterX = expertAiRect.left + expertAiRect.width/2 - sectionRect.left;
      expertAiCenterY = expertAiRect.top + expertAiRect.height/2 - sectionRect.top;
    }

    // Create a connection from each feature to several others and to the center
    // Store the feature centers to avoid recalculating getBoundingClientRect
    const featureCenters = [];
    
    // First pass: calculate all feature centers (reduces layout thrashing)
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      if (feature.id === 'expertAi') {
        featureCenters.push(null); // Skip center feature
        continue;
      }

      const featureRect = feature.getBoundingClientRect();
      featureCenters.push({
        x: featureRect.left + featureRect.width/2 - sectionRect.left,
        y: featureRect.top + featureRect.height/2 - sectionRect.top,
        id: feature.id
      });
    }
    
    // Second pass: create all connection lines
    for (let i = 0; i < featureCenters.length; i++) {
      const featureCenter = featureCenters[i];
      if (!featureCenter) continue; // Skip center feature
      
      // Connect to the next 1-2 features in sequence (circular)
      for (let j = 1; j <= 2; j++) {
        let targetIndex = (i + j) % featureCenters.length;
        
        // Skip expertAi when connecting sequentially
        if (!featureCenters[targetIndex] || features[targetIndex].id === 'expertAi') {
          targetIndex = (targetIndex + 1) % featureCenters.length;
        }
        
        const targetCenter = featureCenters[targetIndex];
        if (!targetCenter) continue;
        
        // Create the connection line efficiently
        createConnectionLine(
          featureCenter.x, featureCenter.y,
          targetCenter.x, targetCenter.y,
          fragment
        );
      }
      
      // Connect each feature to the center expertAi feature
      if (expertAiCenterX !== undefined) {
        createConnectionLine(
          featureCenter.x, featureCenter.y,
          expertAiCenterX, expertAiCenterY,
          fragment
        );
      }
    }
    
    // Add all lines to DOM in a single batch operation
    linesContainer.innerHTML = '';
    linesContainer.appendChild(fragment);
    
    connectionLinesTimeout = null;
  }, 150); // Add a slight delay for debouncing
}

// Helper function to create a single connection line
function createConnectionLine(x1, y1, x2, y2, container) {
  // Calculate distance and angle
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  // Create the line element
  const line = document.createElement('div');
  line.className = 'sacred-connection-line';
  
  // Position and rotate the line (apply all styles at once)
  Object.assign(line.style, {
    width: `${length}px`,
    left: `${x1}px`,
    top: `${y1}px`,
    transform: `rotate(${angle}deg)`,
    animation: `pulse-line 3s ease-in-out infinite ${Math.random() * 2}s`
  });
  
  container.appendChild(line);
}

// Throttle sacred flower generation for better performance
let sacredFlowerTimeout = null;

// Generate flower of life pattern for the sacred geometry overlay
function generateSacredFlowerOfLife() {
  // Debounce to prevent multiple calls during rapid resize
  if (sacredFlowerTimeout) {
    clearTimeout(sacredFlowerTimeout);
  }
  
  sacredFlowerTimeout = setTimeout(() => {
    const flowerContainer = document.getElementById('flowerOfLife');
    if (!flowerContainer) return;

    // Use document fragment to batch DOM operations
    const fragment = document.createDocumentFragment();

    // Create circle template (reuse instead of creating multiple times)
    const createPetal = (x, y) => {
      const circle = document.createElement('div');
      circle.className = 'flower-petal';
      // Apply all styles at once for better performance
      Object.assign(circle.style, {
        width: '100px',
        height: '100px',
        left: `calc(50% - 50px + ${x}px)`,
        top: `calc(50% - 50px + ${y}px)`
      });
      return circle;
    };

    // Create center circle
    fragment.appendChild(createPetal(0, 0));

    // Create first ring of circles - use cached trig functions
    const radius = 50; // Half the width of each circle
    const distance = 87; // Distance from center to center of adjacent circles

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      // Use the cached trig functions
      const x = getCos(angle * 180 / Math.PI) * distance;
      const y = getSin(angle * 180 / Math.PI) * distance;
      fragment.appendChild(createPetal(x, y));
    }

    // Create second ring of circles
    const outerDistance = distance * 2 * getCos(30); // 30 degrees = Math.PI/6 radians

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      // Use the cached trig functions
      const x = getCos(angle * 180 / Math.PI) * outerDistance;
      const y = getSin(angle * 180 / Math.PI) * outerDistance;
      fragment.appendChild(createPetal(x, y));
    }

    // Batch update the DOM
    flowerContainer.innerHTML = '';
    flowerContainer.appendChild(fragment);
    
    sacredFlowerTimeout = null;
  }, 100);
}

// Call this function on page load
document.addEventListener('DOMContentLoaded', generateSacredFlowerOfLife);

// Content variations for client/company views
const viewContent = {
  // Header content
  header: {
    customer: "Create your own custom AI",
    company: "Custom AI management for businesses"
  },
  // Feature descriptions
  features: {
    multiplayer: {
      customer: {
        title: "Multiplayer",
        description: "Invite more of your human buddies into a chat with your favorite AIs."
      },
      company: {
        title: "Team Collaboration",
        description: "Connect your entire team with AI assistants in shared workspaces."
      }
    },
    aiFamily: {
      customer: {
        title: "AI Family",
        description: "Choose from ChatGPT, Gemini, Claude, Llama, and many more!"
      },
      company: {
        title: "Multiple Model Support",
        description: "Integrate various AI models to find the perfect solution for your business needs."
      }
    },
    voiceInOut: {
      customer: {
        title: "Voice In/Out",
        description: "Fancy AI Voices from Google to have your answers read to you in a natural-sounding voice. Use your mic to chat text in."
      },
      company: {
        title: "Voice Integration",
        description: "Implement voice interfaces for your AI solutions with high-quality text-to-speech and speech-to-text capabilities."
      }
    },
    imagesGraphs: {
      customer: {
        title: "Images, Diagrams, Graphs, Charts",
        description: "Divinci™ knows when you're asking to generate an image, chart or diagram."
      },
      company: {
        title: "Visual Content Generation",
        description: "Enhance data communication with AI-generated visualizations - perfect for reports, presentations, and client deliverables."
      }
    },
    textMessaging: {
      customer: {
        title: "Text Messaging",
        description: "Text Divinci™ while you're out on the go, hands-free with \"Hey Siri/Google, text Divinci\"."
      },
      company: {
        title: "Mobile Integration",
        description: "Seamless mobile access lets your team interact with AI systems via SMS and voice assistants anytime, anywhere."
      }
    },
    sharePrivate: {
      customer: {
        title: "Sharable/Private Chats",
        description: "Share Chats with friends to join in. Make a chat publicly readable or make a chat completely private."
      },
      company: {
        title: "Access Control System",
        description: "Granular permissions and sharing options ensure proper information access while maintaining security compliance."
      }
    },
    rag: {
      customer: {
        title: "<a href=\"/features/data-management/autorag.html\">Personal Retrieval Augmentation</a>",
        description: "Upload files to your chat to make a custom AI that learns those files and prioritizes them in answering."
      },
      company: {
        title: "<a href=\"/features/data-management/autorag.html\">Enterprise Knowledge Integration</a>",
        description: "Connect your organization's documents and data to create custom AI solutions that leverage your proprietary knowledge."
      }
    },
    expertAi: {
      customer: {
        title: "<a href=\"https://galvani.ai/\" target=\"_blank\">Expert AIs</a><br />(coming soon)",
        description: "Expert AIs trained by teams of industry veterans."
      },
      company: {
        title: "<a href=\"https://galvani.ai/\" target=\"_blank\">Specialized AI Solutions</a><br />(coming soon)",
        description: "Domain-specific AI models tailored for vertical industries with expert knowledge bases."
      }
    }
  }
};

// Toggle view between customer and company focus
document.addEventListener('DOMContentLoaded', function() {
  const viewToggle = document.getElementById('viewToggle');
  const customerViewLabel = document.querySelector('.view-label.customer-view');
  const companyViewLabel = document.querySelector('.view-label.company-view');
  const navSubtitle = document.querySelector('.nav-title .mobile-hide');

  // Initialize with customer view
  document.body.classList.add('customer-view-active');

  if (viewToggle) {
    viewToggle.addEventListener('change', function() {
      if (this.checked) {
        // Company view is active
        document.body.classList.remove('customer-view-active');
        document.body.classList.add('company-view-active');
        customerViewLabel.classList.remove('active');
        companyViewLabel.classList.add('active');
        navSubtitle.innerHTML = '&nbsp; - ' + viewContent.header.company;
        updateFeatureContent('company');
      } else {
        // Customer view is active
        document.body.classList.remove('company-view-active');
        document.body.classList.add('customer-view-active');
        companyViewLabel.classList.remove('active');
        customerViewLabel.classList.add('active');
        navSubtitle.innerHTML = '&nbsp; - ' + viewContent.header.customer;
        updateFeatureContent('customer');
      }
    });
  }

  // Initial setup of content
  updateFeatureContent('customer');
});

// Function to update the feature content based on selected view
function updateFeatureContent(view) {
  // Update each feature's content
  for (const [featureId, content] of Object.entries(viewContent.features)) {
    const featureElement = document.getElementById(featureId);
    if (featureElement) {
      const titleElement = featureElement.querySelector('h3');
      const descriptionElement = featureElement.querySelector('p');

      if (titleElement) {
        titleElement.innerHTML = content[view].title;
      }

      if (descriptionElement) {
        descriptionElement.textContent = content[view].description;
      }
    }
  }
}
