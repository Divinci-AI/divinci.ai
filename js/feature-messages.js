/**
 * Feature Messages Script
 * Adds interactive messages to feature elements with appropriate emojis
 * Completely disabled on mobile devices for better performance
 */

// Check if we're already in mobile view (set by features-orbit.js)
// Force mobile view detection to run again to ensure it's accurate
window.isMobileView = window.innerWidth < 768;
console.log("Mobile view detection (from feature-messages): " +
            (window.isMobileView ? "MOBILE" : "DESKTOP") +
            " - Width: " + window.innerWidth + "px");

// Add a resize listener to update mobile detection
window.addEventListener('resize', function() {
    window.isMobileView = window.innerWidth < 768;
    console.log("Mobile view updated on resize: " +
                (window.isMobileView ? "MOBILE" : "DESKTOP") +
                " - Width: " + window.innerWidth + "px");
});

// Initialize differently on mobile vs desktop
document.addEventListener('DOMContentLoaded', function() {
    // Log mobile detection status
    if (window.isMobileView) {
        console.log('Feature messages initializing in mobile-compatible mode');
    }
        // Define messages for each feature with fitting emojis
    const featureMessages = {
        // Main product features
        'multiplayer': {
            message: "👥 Invite friends to join your AI chats!",
            reaction: "🎭 Multiple perspectives enhance the conversation"
        },
        'aiFamily': {
            message: "🧠 Choose from top AI models in one place!",
            reaction: "🔄 Mix different AI strengths for better answers"
        },
        'voiceInOut': {
            message: "🎙️ Speak naturally with your AI assistants!",
            reaction: "🗣️ Hear responses in natural-sounding voices"
        },
        'imagesGraphs': {
            message: "📊 Generate data visualizations on demand!",
            reaction: "📈 Transform complex data into clear visuals"
        },
        'sharePrivate': {
            message: "🔒 Control who sees your conversations!",
            reaction: "🔐 Public or private, you decide"
        },
        'textMessaging': {
            message: "📱 Text Divinci from your phone anytime!",
            reaction: "⚡ Quick answers wherever you go"
        },

        // Data management features
        'rag': {
            message: "📚 Upload files to create custom AI!",
            reaction: "🧩 Your data becomes your AI's knowledge"
        },
        'autoRag': {
            message: "🤖 Automatic Retrieval Augmented Generation!",
            reaction: "💡 Enhanced answers with your private knowledge base"
        },
        'dataManagement': {
            message: "🗃️ Organize and analyze your data effortlessly!",
            reaction: "🔍 Access insights faster with smart data management"
        },

        // Quality assurance features
        'quality-assurance': {
            message: "✨ Reliable, accurate AI responses!",
            reaction: "🛡️ Enterprise-grade quality you can trust"
        },
        'llmQa': {
            message: "🧪 Test LLM outputs systematically!",
            reaction: "✅ Ensure AI responses meet your standards"
        },
        'evaluationMetrics': {
            message: "📏 Measure AI performance with precision!",
            reaction: "📊 Data-driven improvements for your AI systems"
        },

        // Developer tools
        'release-management': {
            message: "🚀 Streamlined AI deployment tools!",
            reaction: "⚙️ Professional DevOps for AI"
        },
        'devTools': {
            message: "🛠️ Powerful tools for AI developers!",
            reaction: "👨‍💻 Build and iterate faster than ever"
        },
        'apiIntegration': {
            message: "🔌 Connect with your favorite tools!",
            reaction: "🔗 Seamless workflow integration"
        },

        // Expertise and specialized features
        'expertAi': {
            message: "🧠 Access domain-specific expertise!",
            reaction: "🎓 Trained by industry veterans"
        },
        'secureWorkspace': {
            message: "🔐 Enterprise-grade security for your AI workflows!",
            reaction: "🛡️ Your data stays private and protected"
        },

        // Orbital elements for feature pages
        'orbital-1': {
            message: "💡 Innovative AI solutions!",
            reaction: "✨ Transform how you work with AI"
        },
        'orbital-2': {
            message: "🚀 Accelerate your AI projects!",
            reaction: "⏱️ Go from concept to production faster"
        },
        'orbital-3': {
            message: "🔍 Discover new AI capabilities!",
            reaction: "🔮 Unlock the full potential of artificial intelligence"
        },
        'orbital-4': {
            message: "📈 Scale your AI operations!",
            reaction: "🌱 From prototype to enterprise deployment"
        },
        'orbital-5': {
            message: "🔗 Connect your AI ecosystem!",
            reaction: "🌐 Unified experience across all AI tools"
        },

        // Additional features
        'customization': {
            message: "🎨 Customize AI to match your brand!",
            reaction: "🔧 Fine-tune every aspect of your AI experience"
        },
        'analytics': {
            message: "📊 Deep insights into AI performance!",
            reaction: "📉 Track usage patterns and optimize results"
        },
        'multimodal': {
            message: "🖼️ Work with text, images, and audio!",
            reaction: "🎬 Create rich, multi-format interactions"
        },
        'enterprise': {
            message: "🏢 Enterprise-ready AI solutions!",
            reaction: "🔑 Scalable, secure, and compliant"
        },
        'collaboration': {
            message: "👥 Collaborative AI workspaces!",
            reaction: "🤝 Teams achieve more with shared AI resources"
        }
    };

    // Add a global message container for better styling and positioning
    createGlobalMessageContainer();

    // Initialize orbital elements with emojis - if we're on a feature page and not on mobile
    if (document.querySelector('.orbital-element') && !window.isMobileView) {
        setupOrbitalElements();
    }

    // Create and append chat bubbles to features (only on desktop)
    if (!window.isMobileView) {
        for (const featureId in featureMessages) {
            const feature = document.getElementById(featureId);
            if (feature) {
                setupFeatureMessages(feature, featureMessages[featureId]);
            }
        }
    }

    /**
     * Create a global container for feature messages
     */
    function createGlobalMessageContainer() {
        // Check if the container already exists
        let container = document.getElementById('global-message-container');
        if (container) return;

        // Create the container
        container = document.createElement('div');
        container.id = 'global-message-container';

        // Style the container
        container.style.position = 'fixed';
        container.style.zIndex = '1000';
        container.style.pointerEvents = 'none';
        container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        container.style.opacity = '0';
        container.style.padding = '10px 15px';
        container.style.borderRadius = '8px';
        container.style.backgroundColor = 'rgba(20, 30, 70, 0.85)';
        container.style.backdropFilter = 'blur(4px)';
        container.style.border = '1px solid rgba(92, 226, 231, 0.3)';
        container.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2), 0 0 10px rgba(92, 226, 231, 0.2)';
        container.style.color = 'white';
        container.style.fontFamily = 'Inter, sans-serif';
        container.style.fontSize = '14px';
        container.style.maxWidth = '250px';
        container.style.textAlign = 'center';
        container.style.transformOrigin = 'center bottom';

        // Add to the document
        document.body.appendChild(container);
    }

    /**
     * Setup orbital elements with emojis
     */
    function setupOrbitalElements() {
        // Get all orbital elements
        const orbitalElements = document.querySelectorAll('.orbital-element');

        orbitalElements.forEach((element, index) => {
            // Get the element ID or generate one based on index
            const id = element.id || `orbital-${index + 1}`;
            const messageData = featureMessages[id];

            if (messageData) {
                // Find the content element to replace with emoji
                const contentElement = element.querySelector('.orbital-content') || element.querySelector('span');

                if (contentElement) {
                    // Replace the content (likely a number) with the emoji
                    contentElement.innerHTML = messageData.message.split(' ')[0]; // Just the emoji part
                    contentElement.style.fontSize = '24px'; // Make emoji larger
                }

                // Make the element interactive
                element.style.pointerEvents = 'auto';
                element.style.cursor = 'pointer';

                // Setup message interactions
                setupFeatureMessages(element, messageData);
            }
        });
    }

    // Setup feature message interactions
    function setupFeatureMessages(feature, messages) {
        // Add hover event
        feature.addEventListener('mouseenter', function(e) {
            showGlobalMessage(e, messages.message, 'feature-message');
        });

        // Add mouseleave event
        feature.addEventListener('mouseleave', function() {
            hideGlobalMessage();
        });

        // Add click event for reaction message
        feature.addEventListener('click', function(e) {
            // Only prevent default if it's not already a clickable element
            if (e.target.nodeName !== 'A' && e.target.nodeName !== 'BUTTON') {
                e.preventDefault();
            }

            showGlobalMessage(e, messages.reaction, 'reaction-message', 3000);

            // If feature has a link, navigate after a delay
            const link = feature.querySelector('a');
            if (link && e.target !== link) {
                setTimeout(() => {
                    window.location.href = link.href;
                }, 1000);
            }
        });
    }

    /**
     * Show a message in the global container
     * @param {Event} event - The event that triggered the message
     * @param {string} text - The message text
     * @param {string} className - CSS class for styling
     * @param {number} autoHideDelay - Optional delay to auto-hide (0 = no auto-hide)
     */
    function showGlobalMessage(event, text, className, autoHideDelay = 0) {
        const container = document.getElementById('global-message-container');
        if (!container) return;

        // Clear any existing timeout
        if (window.messageHideTimeout) {
            clearTimeout(window.messageHideTimeout);
            window.messageHideTimeout = null;
        }

        // Update content
        container.textContent = text;
        container.className = className || '';

        // Position based on trigger element
        const targetRect = event.currentTarget.getBoundingClientRect();

        // Position above the element with a small gap
        container.style.left = `${targetRect.left + targetRect.width/2}px`;
        container.style.top = `${targetRect.top - 10}px`;
        container.style.transform = 'translate(-50%, -100%)';

        // Show with animation
        container.style.opacity = '1';

        // Set auto-hide if needed
        if (autoHideDelay > 0) {
            window.messageHideTimeout = setTimeout(hideGlobalMessage, autoHideDelay);
        }
    }

    /**
     * Hide the global message container
     */
    function hideGlobalMessage() {
        const container = document.getElementById('global-message-container');
        if (container) {
            container.style.opacity = '0';
        }

        // Clear any existing timeout
        if (window.messageHideTimeout) {
            clearTimeout(window.messageHideTimeout);
            window.messageHideTimeout = null;
        }
    }

    // Legacy function for backward compatibility
    function showMessage(feature, text, className) {
        // Remove any existing chat bubbles
        const bubbles = document.querySelectorAll('.chat-bubble');
        bubbles.forEach(bubble => bubble.remove());

        // Create new chat bubble
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + className;
        bubble.textContent = text;

        // Add to the feature
        feature.appendChild(bubble);

        // Style the bubble
        bubble.style.position = 'absolute';
        bubble.style.top = '-47px'; // Moved up by 7px from -40px to -47px
        bubble.style.left = '50%';
        bubble.style.transform = 'translateX(-50%)';
        bubble.style.padding = '8px 12px';
        bubble.style.borderRadius = '8px';
        bubble.style.backgroundColor = 'rgba(20, 30, 70, 0.9)';
        bubble.style.color = 'white';
        bubble.style.fontSize = '14px';
        bubble.style.zIndex = '100';
        bubble.style.whiteSpace = 'nowrap';
        bubble.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';

        // Auto-remove after a delay
        if (className === 'reaction-bubble') {
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
            }, 3000);
        }
    }
    });