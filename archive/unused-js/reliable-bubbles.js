// Ultra-reliable chat bubble implementation
document.addEventListener('DOMContentLoaded', function() {
  console.log('Reliable bubbles script loaded');
  
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
  
  // Keep track of active bubbles
  const activeBubbles = [];
  
  // Fixed positions for bubbles to ensure visibility
  const bubblePositions = [
    { top: '20%', left: '30%' },  // Feature bubble position
    { top: '30%', left: '65%' },  // First reaction bubble
    { top: '45%', left: '45%' }   // Second reaction bubble
  ];
  
  // Create a bubble with robust styling to ensure visibility
  function createBubble(isFeature, position) {
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
      position: fixed !important;
      top: ${position.top} !important;
      left: ${position.left} !important;
      transform: none !important;
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
    activeBubbles.push(bubble);
    
    return bubble;
  }
  
  // Show a set of bubbles
  function showBubbles() {
    console.log('Showing reliable bubbles');
    
    // Clear any existing bubbles
    clearBubbles();
    
    // Create feature bubble
    const featureBubble = createBubble(true, bubblePositions[0]);
    
    // Create reaction bubbles with delays
    setTimeout(() => {
      createBubble(false, bubblePositions[1]);
      
      setTimeout(() => {
        createBubble(false, bubblePositions[2]);
      }, 1000);
    }, 1500);
    
    // Clear bubbles after display time
    setTimeout(clearBubbles, 6000);
  }
  
  // Clear all bubbles
  function clearBubbles() {
    while (activeBubbles.length > 0) {
      const bubble = activeBubbles.pop();
      if (bubble && bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
    }
    console.log('Cleared all bubbles');
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
          clearBubbles(); // Clear any lingering bubbles
          showBubbles();  // Show immediately upon becoming visible
          bubbleInterval = setInterval(showBubbles, 9000);
        }
      } else {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
        clearBubbles(); // Clean up when page is hidden
      }
    });
  }
  
  // Start displaying bubbles after a short delay
  setTimeout(startBubbles, 1500);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(bubbleInterval);
    clearBubbles();
  });
});