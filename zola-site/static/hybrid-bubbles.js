// Hybrid approach - fixed position bubbles that sync with emoji movement
document.addEventListener('DOMContentLoaded', function() {
  console.log('Hybrid bubbles script loaded');
  
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
    "Brilliant! ✨"
  ];
  
  let currentFeatureIndex = 0;
  let currentReactionIndex = 0;
  
  // Keep track of active bubbles and their matching circles
  const activeBubbles = [];
  
  // Predefined circle selectors to simulate attachment
  const circleSelectors = [
    '.geometry-group .circle00',
    '.geometry-group .circle02',
    '.geometry-group .circle04',
    '.geometry-group-outer1 .circle20',
    '.geometry-group-outer1 .circle22',
    '.geometry-group-outer1 .circle24',
    '.geometry-group-outer2 .circle26',
    '.geometry-group-outer2 .circle28',
    '.geometry-group-outer2 .circle30'
  ];
  
  // Skip AI logo circles
  const aiLogoSelectors = [
    '.geometry-group .circle01',
    '.geometry-group .circle03',
    '.geometry-group-outer1 .circle21',
    '.geometry-group-outer1 .circle23',
    '.geometry-group-outer2 .circle27'
  ];
  
  // Create a bubble positioned to appear above a specific circle
  function createBubble(circleSelector, isFeature) {
    const circle = document.querySelector(circleSelector);
    if (!circle) {
      console.log(`Circle not found: ${circleSelector}`);
      return null;
    }
    
    // Create the bubble
    const bubble = document.createElement('div');
    const bubbleId = `bubble-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Set content
    bubble.textContent = isFeature 
      ? featureMessages[currentFeatureIndex++ % featureMessages.length]
      : reactionMessages[currentReactionIndex++ % reactionMessages.length];
    
    bubble.id = bubbleId;
    document.body.appendChild(bubble);
    
    // Apply styles directly to the element for maximum reliability
    bubble.style.cssText = `
      position: absolute !important;
      z-index: 100000 !important;
      padding: ${isFeature ? '10px 20px' : '8px 16px'} !important;
      background-color: ${isFeature ? 'white' : 'rgba(0, 0, 67, 0.9)'} !important;
      color: ${isFeature ? 'black' : 'white'} !important;
      border-radius: 20px !important;
      box-shadow: 0 0 20px ${isFeature ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,100,0.5)'} !important;
      border: 2px solid ${isFeature ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,100,0.2)'} !important;
      font-size: ${isFeature ? '18px' : '16px'} !important;
      font-weight: bold !important;
      font-family: 'Montserrat', sans-serif !important;
      white-space: nowrap !important;
      pointer-events: none !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      max-width: 80% !important;
      text-align: center !important;
      transform: translateX(-50%) !important;
    `;
    
    // Add a pointer/stem (separate element for reliability)
    const pointer = document.createElement('div');
    pointer.id = `pointer-${bubbleId}`;
    
    pointer.style.cssText = `
      content: '' !important;
      position: absolute !important;
      bottom: -8px !important;
      left: 50% !important;
      margin-left: -8px !important;
      width: 16px !important;
      height: 16px !important;
      background: ${isFeature ? 'white' : 'rgba(0, 0, 67, 0.9)'} !important;
      transform: rotate(45deg) !important;
      border: 2px solid ${isFeature ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,100,0.2)'} !important;
      border-top: none !important;
      border-left: none !important;
      z-index: -1 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;
    
    bubble.appendChild(pointer);
    
    // Store bubble and its associated circle
    activeBubbles.push({
      bubble: bubble,
      circle: circle,
      circleSelector: circleSelector
    });
    
    // Initial position update
    updateBubblePosition(bubble, circle);
    
    return bubble;
  }
  
  // Update a bubble's position to match its circle's current position
  function updateBubblePosition(bubble, circle) {
    if (!bubble || !circle) return;
    
    const rect = circle.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top - 20; // Position higher above the circle (moved up 5px from -15)
    
    // Update bubble position to match circle
    bubble.style.left = `${centerX}px`;
    bubble.style.top = `${topY}px`;
  }
  
  // Animation frame ID for position updates
  let positionUpdateFrameId = null;
  
  // Update all bubble positions to follow their circles
  function updateAllBubblePositions() {
    // Cancel any existing animation frame
    if (positionUpdateFrameId) {
      cancelAnimationFrame(positionUpdateFrameId);
    }
    
    // Update all bubble positions
    activeBubbles.forEach(item => {
      updateBubblePosition(item.bubble, item.circle);
    });
    
    // Continue updating positions even if no bubbles are currently active
    // This ensures the animation loop is always running when bubbles appear
    positionUpdateFrameId = requestAnimationFrame(updateAllBubblePositions);
  }
  
  // Show a set of bubbles
  function showBubbles() {
    console.log('Showing hybrid bubbles');
    
    // Clear any existing bubbles
    clearBubbles();
    
    // Randomly choose circles to attach bubbles to
    // Make sure to exclude AI logo circles
    const shuffledSelectors = [...circleSelectors].sort(() => Math.random() - 0.5);
    
    // Create feature bubble on first selected circle
    const featureBubble = createBubble(shuffledSelectors[0], true);
    
    // Start updating positions immediately for the first bubble
    requestAnimationFrame(updateAllBubblePositions);
    
    // Create reaction bubbles with delays
    setTimeout(() => {
      createBubble(shuffledSelectors[1], false);
      // No need to start updateAllBubblePositions again - it's already running
      
      setTimeout(() => {
        createBubble(shuffledSelectors[2], false);
        // No need to start updateAllBubblePositions again - it's already running
      }, 1000);
    }, 1500);
    
    // Clear bubbles after display time
    setTimeout(clearBubbles, 6000);
  }
  
  // Clear all bubbles
  function clearBubbles() {
    while (activeBubbles.length > 0) {
      const item = activeBubbles.pop();
      if (item.bubble && item.bubble.parentNode) {
        item.bubble.parentNode.removeChild(item.bubble);
      }
    }
  }
  
  // Start showing bubbles on a regular interval
  let bubbleInterval = null;
  
  function startBubbles() {
    // Show first set immediately
    showBubbles();
    
    // Set up interval for subsequent sets
    bubbleInterval = setInterval(showBubbles, 9000);
    
    // Handle page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!bubbleInterval) {
          clearBubbles();
          showBubbles();
          bubbleInterval = setInterval(showBubbles, 9000);
        }
      } else {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
        clearBubbles();
      }
    });
  }
  
  // Start displaying bubbles after a short delay
  setTimeout(startBubbles, 1500);
  
  // Start the position update loop immediately
  updateAllBubblePositions();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(bubbleInterval);
    if (positionUpdateFrameId) {
      cancelAnimationFrame(positionUpdateFrameId);
    }
    clearBubbles();
  });
});
