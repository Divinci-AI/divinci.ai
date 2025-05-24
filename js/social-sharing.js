/**
 * Social Sharing Functionality for Divinci.ai
 * 
 * This script provides functionality for social media sharing buttons
 * and handles the dynamic creation of sharing links.
 * 
 * The sharing components will only be displayed on blog posts and 
 * explicitly allowed pages (with data-force-share="true").
 */

// Social sharing configuration
const socialConfig = {
    platforms: {
        twitter: {
            name: 'Twitter',
            shareUrl: 'https://twitter.com/intent/tweet?url={{url}}&text={{text}}&via=DivinciAI',
            icon: '<i class="fab fa-x-twitter"></i>'
        },
        linkedin: {
            name: 'LinkedIn',
            shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url={{url}}',
            icon: '<i class="fab fa-linkedin-in"></i>'
        },
        facebook: {
            name: 'Facebook',
            shareUrl: 'https://www.facebook.com/sharer/sharer.php?u={{url}}',
            icon: '<i class="fab fa-facebook-f"></i>'
        },
        email: {
            name: 'Email',
            shareUrl: 'mailto:?subject={{title}}&body={{text}}%0A%0A{{url}}',
            icon: '<i class="fas fa-envelope"></i>'
        }
    },
    
    // Default share text
    defaultTitle: 'Check out Divinci AI',
    defaultText: 'I found this interesting page on Divinci AI, the platform for building custom AI solutions.'
};

/**
 * Check if the current page is a blog post
 * @returns {boolean} true if the current page is a blog post
 */
function isBlogPost() {
    // Check if URL contains /blog/posts/ or the page has a blog post indicator
    return window.location.pathname.includes('/blog/posts/') || 
           document.querySelector('meta[name="content-type"][content="blog-post"]') !== null;
}

/**
 * Initialize social sharing buttons
 * @param {string} selector - CSS selector for container elements
 */
function initSocialSharing(selector = '.social-share-container') {
    const containers = document.querySelectorAll(selector);
    const pageIsBlogPost = isBlogPost();
    
    containers.forEach(container => {
        // Check if this is a blog post or has a force-share attribute
        const forceShare = container.getAttribute('data-force-share') === 'true';
        
        // Only display social sharing on blog posts or containers with force-share
        if (!pageIsBlogPost && !forceShare) {
            container.style.display = 'none';
            return;
        }
        
        // Get sharing data from container attributes or use defaults
        const url = container.getAttribute('data-share-url') || window.location.href;
        const title = container.getAttribute('data-share-title') || document.title || socialConfig.defaultTitle;
        const text = container.getAttribute('data-share-text') || socialConfig.defaultText;
        
        // Get platforms to include (default to all if not specified)
        const platformsAttr = container.getAttribute('data-platforms');
        const platforms = platformsAttr ? platformsAttr.split(',') : Object.keys(socialConfig.platforms);
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create heading if specified
        const heading = container.getAttribute('data-heading');
        if (heading) {
            const headingEl = document.createElement('h3');
            headingEl.className = 'social-share-heading';
            headingEl.textContent = heading;
            container.appendChild(headingEl);
        }
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'social-share-buttons';
        container.appendChild(buttonsContainer);
        
        // Add share buttons for each platform
        platforms.forEach(platform => {
            const platformConfig = socialConfig.platforms[platform.trim()];
            if (!platformConfig) return;
            
            // Create button
            const button = document.createElement('a');
            button.className = `social-share-button social-share-${platform.trim()}`;
            button.setAttribute('aria-label', `Share on ${platformConfig.name}`);
            button.innerHTML = platformConfig.icon;
            
            // Create share URL
            let shareUrl = platformConfig.shareUrl
                .replace('{{url}}', encodeURIComponent(url))
                .replace('{{title}}', encodeURIComponent(title))
                .replace('{{text}}', encodeURIComponent(text));
            
            // Set button attributes
            button.href = shareUrl;
            
            // Open in new window for external platforms
            if (platform !== 'email') {
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
                
                // Add click handler for popup window
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.open(this.href, 'share-dialog', 'width=626,height=436');
                    return false;
                });
            }
            
            // Add button to container
            buttonsContainer.appendChild(button);
        });
        
        // Add copy link button if specified
        if (container.getAttribute('data-include-copy') === 'true') {
            const copyButton = document.createElement('button');
            copyButton.className = 'social-share-button social-share-copy';
            copyButton.setAttribute('aria-label', 'Copy link');
            copyButton.innerHTML = '<i class="fas fa-link"></i>';
            
            copyButton.addEventListener('click', function() {
                navigator.clipboard.writeText(url).then(() => {
                    // Show success message
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.classList.add('copied');
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.classList.remove('copied');
                    }, 2000);
                });
            });
            
            buttonsContainer.appendChild(copyButton);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initSocialSharing();
});

// Export for use in other scripts
window.DivinciSocial = {
    init: initSocialSharing
};
