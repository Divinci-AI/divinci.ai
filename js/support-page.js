/**
 * Divinci AI Support Page JavaScript
 * Handles interactive elements and functionality for the support experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all dropdowns
    initializeDropdowns();
    
    // FAQ Accordion functionality
    initializeFaqAccordion();
    
    // Smooth scrolling for anchor links
    initializeSmoothScrolling();
    
    // Form validation and submission
    initializeFormHandling();
    
    // Support chatbot widget toggle
    initializeChatbot();
    
    // Initialize sticky sidebar
    initializeStickyNav();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize tabs if present
    initializeTabs();
});

/**
 * Initialize dropdown functionality
 */
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    if (dropdowns) {
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (trigger && menu) {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown.classList.toggle('is-active');
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdown.classList.remove('is-active');
                    }
                });
            }
        });
    }
}

/**
 * Initialize FAQ accordion functionality
 */
function initializeFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    if (faqQuestions) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                // Toggle active class on question
                question.classList.toggle('is-active');
                
                // Toggle active class on answer
                const answer = question.nextElementSibling;
                if (answer && answer.classList.contains('faq-answer')) {
                    answer.classList.toggle('is-active');
                }
            });
        });
    }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)');
    
    if (anchorLinks) {
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                // Skip if it's just "#" or empty
                if (targetId === '#' || !targetId) return;
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    // Calculate header height for offset
                    const headerHeight = document.querySelector('header') ? 
                        document.querySelector('header').offsetHeight : 0;
                    
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Set focus to the target for accessibility
                    targetElement.setAttribute('tabindex', '-1');
                    targetElement.focus();
                    
                    // Update URL hash
                    history.pushState(null, null, targetId);
                    
                    // Mark sidebar link as active
                    updateActiveSidebarLink(targetId);
                }
            });
        });
    }
}

/**
 * Initialize form validation and submission handling
 */
function initializeFormHandling() {
    const supportForm = document.getElementById('support-form');
    const fileCheckbox = document.getElementById('attachment-check');
    const fileField = document.getElementById('attachment-field');
    
    // Show/hide file attachment field
    if (fileCheckbox && fileField) {
        fileCheckbox.addEventListener('change', function() {
            if (this.checked) {
                fileField.classList.remove('is-hidden');
            } else {
                fileField.classList.add('is-hidden');
            }
        });
    }
    
    // Form submission
    if (supportForm) {
        supportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (validateSupportForm(this)) {
                // Show loading state
                const submitButton = this.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.classList.add('is-loading');
                }
                
                // Simulate form submission (replace with actual AJAX in production)
                setTimeout(() => {
                    // Hide the form
                    this.classList.add('is-hidden');
                    
                    // Show success message
                    const successMessage = document.getElementById('form-success');
                    if (successMessage) {
                        successMessage.classList.remove('is-hidden');
                    }
                    
                    // Reset form for future use
                    this.reset();
                    if (submitButton) {
                        submitButton.classList.remove('is-loading');
                    }
                }, 1500);
            }
        });
    }
}

/**
 * Validate the support form
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateSupportForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    // Remove existing error messages
    const existingMessages = form.querySelectorAll('.help.is-danger');
    existingMessages.forEach(msg => msg.remove());
    
    // Reset field styling
    const formFields = form.querySelectorAll('.input, .textarea, .select select');
    formFields.forEach(field => {
        field.classList.remove('is-danger');
    });
    
    // Check required fields
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-danger');
            
            // Add error message
            const helpText = document.createElement('p');
            helpText.classList.add('help', 'is-danger');
            helpText.textContent = 'This field is required';
            
            // Find the parent control div
            const controlDiv = field.closest('.control');
            if (controlDiv) {
                controlDiv.appendChild(helpText);
            }
        }
    });
    
    // Validate email format if present
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
            isValid = false;
            emailField.classList.add('is-danger');
            
            // Add error message
            const helpText = document.createElement('p');
            helpText.classList.add('help', 'is-danger');
            helpText.textContent = 'Please enter a valid email address';
            
            // Find the parent control div
            const controlDiv = emailField.closest('.control');
            if (controlDiv) {
                controlDiv.appendChild(helpText);
            }
        }
    }
    
    return isValid;
}

/**
 * Initialize chatbot functionality
 */
function initializeChatbot() {
    const chatbotButton = document.querySelector('.chatbot-button');
    const chatbotWidget = document.querySelector('.support-chatbot-widget');
    const chatbotClose = document.querySelector('.chatbot-close');
    const chatbotInput = document.querySelector('.chatbot-input input');
    const chatbotSend = document.querySelector('.chatbot-input button');
    const chatbotBody = document.querySelector('.chatbot-body');
    
    // Toggle chatbot widget
    if (chatbotButton && chatbotWidget) {
        chatbotButton.addEventListener('click', () => {
            chatbotWidget.classList.toggle('is-active');
            
            // Focus on input when opened
            if (chatbotWidget.classList.contains('is-active') && chatbotInput) {
                chatbotInput.focus();
            }
        });
    }
    
    // Close chatbot widget
    if (chatbotClose) {
        chatbotClose.addEventListener('click', () => {
            if (chatbotWidget) {
                chatbotWidget.classList.remove('is-active');
            }
        });
    }
    
    // Send message functionality
    if (chatbotSend && chatbotInput && chatbotBody) {
        // Send on button click
        chatbotSend.addEventListener('click', () => {
            sendChatbotMessage();
        });
        
        // Send on Enter key
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatbotMessage();
            }
        });
    }
    
    /**
     * Send a message to the chatbot
     */
    function sendChatbotMessage() {
        const message = chatbotInput.value.trim();
        
        if (message) {
            // Add user message to chat
            addChatbotMessage(message, 'user');
            
            // Clear input
            chatbotInput.value = '';
            
            // Show typing indicator
            addChatbotTypingIndicator();
            
            // Simulate bot response (replace with actual API call in production)
            setTimeout(() => {
                // Remove typing indicator
                const typingIndicator = chatbotBody.querySelector('.typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                }
                
                // Generate bot response based on user message
                let botResponse = "Thank you for your message. A support agent will assist you shortly. In the meantime, you might find answers in our FAQs section.";
                
                // Simple keyword matching for demo purposes
                if (message.toLowerCase().includes('account')) {
                    botResponse = "For account-related issues, please check the Account & Billing section or contact our support team at support@divinci.app.";
                } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('problem')) {
                    botResponse = "I'm sorry you're experiencing issues. Please provide more details or check our Technical Support section for common troubleshooting steps.";
                } else if (message.toLowerCase().includes('pricing') || message.toLowerCase().includes('cost')) {
                    botResponse = "Information about our pricing plans is available in the Account & Billing section. For custom enterprise pricing, please contact our sales team.";
                }
                
                // Add bot response to chat
                addChatbotMessage(botResponse, 'bot');
                
                // Scroll to bottom
                chatbotBody.scrollTop = chatbotBody.scrollHeight;
            }, 1500);
        }
    }
    
    /**
     * Add a message to the chatbot body
     * @param {string} message - The message text
     * @param {string} sender - The sender ('user' or 'bot')
     */
    function addChatbotMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        messageElement.innerHTML = `
            <div class="message-body">
                ${message}
            </div>
            <div class="message-time">
                ${getCurrentTime()}
            </div>
        `;
        
        chatbotBody.appendChild(messageElement);
        
        // Scroll to bottom
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }
    
    /**
     * Add typing indicator to chatbot
     */
    function addChatbotTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('typing-indicator');
        typingElement.innerHTML = '<span></span><span></span><span></span>';
        
        chatbotBody.appendChild(typingElement);
        
        // Scroll to bottom
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }
    
    /**
     * Get current time formatted for chat messages
     * @returns {string} - Formatted time string (HH:MM)
     */
    function getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }
}

/**
 * Initialize sticky navigation
 */
function initializeStickyNav() {
    const supportSidebar = document.querySelector('.support-sidebar');
    
    if (supportSidebar) {
        // Get initial offset of sidebar
        const sidebarOffset = supportSidebar.offsetTop;
        
        // Update on scroll
        window.addEventListener('scroll', () => {
            if (window.innerWidth >= 769) { // Only apply on non-mobile screens
                if (window.pageYOffset > sidebarOffset) {
                    supportSidebar.classList.add('is-sticky');
                } else {
                    supportSidebar.classList.remove('is-sticky');
                }
            }
        });
        
        // Update active link on scroll
        window.addEventListener('scroll', debounce(() => {
            updateActiveSidebarLinkOnScroll();
        }, 100));
    }
}

/**
 * Update the active sidebar link when scrolling
 */
function updateActiveSidebarLinkOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.pageYOffset + 100; // Adding offset for header
    
    // Find the section currently in view
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (scrollPosition >= section.offsetTop) {
            const id = '#' + section.getAttribute('id');
            updateActiveSidebarLink(id);
            break;
        }
    }
}

/**
 * Update the active sidebar link
 * @param {string} targetId - The ID of the target section
 */
function updateActiveSidebarLink(targetId) {
    const sidebarLinks = document.querySelectorAll('.support-sidebar .menu-list a');
    
    if (sidebarLinks) {
        sidebarLinks.forEach(link => {
            link.classList.remove('is-active');
            
            if (link.getAttribute('href') === targetId) {
                link.classList.add('is-active');
            }
        });
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.querySelector('.support-search input');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (searchTerm.length >= 2) {
                // Perform search (replace with actual search logic in production)
                highlightSearchResults(searchTerm);
            } else {
                // Clear highlights
                clearSearchHighlights();
            }
        }, 300));
    }
}

/**
 * Highlight search results in the page content
 * @param {string} searchTerm - The search term
 */
function highlightSearchResults(searchTerm) {
    // Clear previous highlights
    clearSearchHighlights();
    
    // Search in headings and paragraphs
    const contentElements = document.querySelectorAll('.support-content h2, .support-content h3, .support-content p, .support-content li');
    
    let matchFound = false;
    
    contentElements.forEach(element => {
        const text = element.textContent;
        if (text.toLowerCase().includes(searchTerm)) {
            matchFound = true;
            
            // Mark the containing section
            const section = element.closest('section');
            if (section) {
                section.classList.add('search-match');
            }
            
            // Replace text with highlighted version
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            element.innerHTML = text.replace(regex, '<mark>$1</mark>');
        }
    });
    
    // Show no results message if needed
    const noResultsMessage = document.getElementById('no-search-results');
    if (noResultsMessage) {
        if (matchFound) {
            noResultsMessage.classList.add('is-hidden');
        } else {
            noResultsMessage.classList.remove('is-hidden');
        }
    }
    
    // Auto-scroll to first result
    const firstMatch = document.querySelector('.search-match');
    if (firstMatch) {
        const headerHeight = document.querySelector('header') ? 
            document.querySelector('header').offsetHeight : 0;
        
        window.scrollTo({
            top: firstMatch.offsetTop - headerHeight - 20,
            behavior: 'smooth'
        });
    }
}

/**
 * Clear search highlights
 */
function clearSearchHighlights() {
    // Remove section highlights
    const highlightedSections = document.querySelectorAll('.search-match');
    highlightedSections.forEach(section => {
        section.classList.remove('search-match');
    });
    
    // Remove text highlights
    const contentElements = document.querySelectorAll('.support-content h2, .support-content h3, .support-content p, .support-content li');
    contentElements.forEach(element => {
        element.innerHTML = element.textContent;
    });
    
    // Hide no results message
    const noResultsMessage = document.getElementById('no-search-results');
    if (noResultsMessage) {
        noResultsMessage.classList.add('is-hidden');
    }
}

/**
 * Initialize tabs functionality
 */
function initializeTabs() {
    const tabsContainers = document.querySelectorAll('.tabs');
    
    if (tabsContainers) {
        tabsContainers.forEach(tabsContainer => {
            const tabs = tabsContainer.querySelectorAll('li');
            const tabContents = document.querySelectorAll('.tab-content');
            
            if (tabs && tabContents) {
                tabs.forEach((tab, index) => {
                    tab.addEventListener('click', () => {
                        // Update active tab
                        tabs.forEach(t => t.classList.remove('is-active'));
                        tab.classList.add('is-active');
                        
                        // Update active content
                        tabContents.forEach(content => content.classList.add('is-hidden'));
                        if (tabContents[index]) {
                            tabContents[index].classList.remove('is-hidden');
                        }
                    });
                });
            }
        });
    }
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}