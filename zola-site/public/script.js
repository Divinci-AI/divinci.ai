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
  // Generate the flower of life
  generateFlowerOfLife();

  // Regenerate on window resize
  window.addEventListener('resize', generateFlowerOfLife);

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

  // Start the chat bubbles
  chatBubbleTimer = startChatBubblesInterval();

  // Add keyframes for orbit animations
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
    }
    @keyframes orbit2 {
      0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
    }
    @keyframes orbit3 {
      0% { transform: rotate(0deg) translateX(200px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(200px) rotate(-360deg); }
    }
    @keyframes orbit4 {
      0% { transform: rotate(0deg) translateX(250px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(250px) rotate(-360deg); }
    }
    @keyframes popIn {
      0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
      100% { transform: translateX(-50%) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
});
