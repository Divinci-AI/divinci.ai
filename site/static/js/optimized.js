// Optimized JavaScript - Performance First
(function() {
    'use strict';
    
    // Performance optimized DOMContentLoaded
    const ready = (fn) => {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    };
    
    // Throttled scroll handler for performance
    const throttle = (func, delay) => {
        let timeoutId;
        let lastExecTime = 0;
        return function(...args) {
            const currentTime = Date.now();
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    };
    
    // Optimized intersection observer
    const createObserver = (callback, options = {}) => {
        return new IntersectionObserver(callback, {
            threshold: options.threshold || 0.1,
            rootMargin: options.rootMargin || '0px'
        });
    };
    
    // Main initialization
    ready(() => {
        // Performance-critical: Get elements once
        const elements = {
            heroVideo: document.getElementById('hero-video'),
            panels: document.querySelectorAll('.panel'),
            backgroundVideos: document.querySelectorAll('.background-video'),
            lazyImages: document.querySelectorAll('[loading="lazy"]'),
            journalPages: document.querySelectorAll('.journal-page')
        };
        
        // Optimized video handling
        if (elements.heroVideo) {
            const videoObserver = createObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        video.play().catch(() => {}); // Silent fail
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.25 });
            
            videoObserver.observe(elements.heroVideo);
        }
        
        // Optimized journal navigation
        let activeIndex = 0;
        let isAnimating = false;
        
        const updateJournal = (index) => {
            if (isAnimating || index === activeIndex) return;
            
            isAnimating = true;
            
            // Smoothly transition between pages without flickering
            elements.journalPages.forEach((page, i) => {
                if (i === index) {
                    // Show new active page
                    page.style.display = 'block';
                    page.style.opacity = '1';
                    page.classList.add('active');
                } else {
                    // Hide inactive pages
                    page.classList.remove('active');
                    page.style.opacity = '0';
                    // Delay hiding to allow transition
                    setTimeout(() => {
                        if (!page.classList.contains('active')) {
                            page.style.display = 'none';
                        }
                    }, 400); // Match CSS transition duration
                }
            });
            
            activeIndex = index;
            
            // Use requestAnimationFrame for smooth transitions
            setTimeout(() => {
                isAnimating = false;
            }, 400);
        };
        
        // Optimized keyboard navigation
        const handleKeyboard = throttle((e) => {
            if (e.key === 'ArrowLeft') {
                updateJournal(Math.max(0, activeIndex - 1));
            } else if (e.key === 'ArrowRight') {
                updateJournal(Math.min(elements.journalPages.length - 1, activeIndex + 1));
            }
        }, 150);
        
        document.addEventListener('keydown', handleKeyboard);
        
        // Optimized panel hover effects
        elements.panels.forEach((panel, index) => {
            let hoverTimeout;
            
            panel.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                updateJournal(index);
            });
            
            panel.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    updateJournal(0); // Return to default
                }, 300);
            });
        });
        
        // Lazy loading optimization
        if ('IntersectionObserver' in window) {
            const lazyObserver = createObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        lazyObserver.unobserve(img);
                    }
                });
            });
            
            elements.lazyImages.forEach(img => lazyObserver.observe(img));
        }
        
        // Performance monitoring (development only)
        if (window.location.hostname === 'localhost') {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 100) {
                        console.warn(`Slow operation: ${entry.name} took ${entry.duration}ms`);
                    }
                });
            });
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
    });
    
    // Service worker registration for caching (if available)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Silent fail - not critical
            });
        });
    }
})();