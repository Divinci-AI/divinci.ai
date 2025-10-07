/**
 * News Carousel functionality
 * Handles navigation, autoplay, and responsive behavior
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousel);
    } else {
        initCarousel();
    }

    function initCarousel() {
        const carousel = document.querySelector('.news-carousel');
        if (!carousel) return;

        const track = carousel.querySelector('.news-carousel-track');
        const cards = Array.from(carousel.querySelectorAll('.news-card'));
        const prevButton = carousel.querySelector('.carousel-control.prev');
        const nextButton = carousel.querySelector('.carousel-control.next');
        const indicators = Array.from(carousel.querySelectorAll('.indicator'));

        let currentIndex = 0;
        let autoplayInterval = null;
        const autoplayDelay = 7000; // 7 seconds

        // Initialize first card as active
        if (cards.length > 0) {
            cards[0].classList.add('active');
        }

        // Show specific slide
        function showSlide(index) {
            // Ensure index is within bounds
            if (index < 0) {
                index = cards.length - 1;
            } else if (index >= cards.length) {
                index = 0;
            }

            currentIndex = index;

            // Update cards
            cards.forEach((card, i) => {
                if (i === currentIndex) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });

            // Update indicators
            indicators.forEach((indicator, i) => {
                if (i === currentIndex) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });

            // Transform track
            const translateX = -currentIndex * 100;
            track.style.transform = `translateX(${translateX}%)`;
        }

        // Navigation handlers
        function nextSlide() {
            showSlide(currentIndex + 1);
            resetAutoplay();
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
            resetAutoplay();
        }

        // Autoplay functionality
        function startAutoplay() {
            if (cards.length <= 1) return;

            autoplayInterval = setInterval(() => {
                nextSlide();
            }, autoplayDelay);
        }

        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }

        function resetAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        // Event listeners
        if (prevButton) {
            prevButton.addEventListener('click', prevSlide);
        }

        if (nextButton) {
            nextButton.addEventListener('click', nextSlide);
        }

        // Indicator click handlers
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showSlide(index);
                resetAutoplay();
            });
        });

        // Keyboard navigation
        carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        });

        // Pause autoplay on hover
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

        // Pause autoplay when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next slide
                    nextSlide();
                } else {
                    // Swipe right - previous slide
                    prevSlide();
                }
            } else {
                // No significant swipe, resume autoplay
                startAutoplay();
            }
        }

        // Hide controls if only one card
        if (cards.length <= 1) {
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            carousel.querySelector('.carousel-indicators').style.display = 'none';
        } else {
            // Start autoplay
            startAutoplay();
        }

        // Accessibility: Make carousel focusable
        carousel.setAttribute('tabindex', '0');
        carousel.setAttribute('aria-label', 'News carousel');
        carousel.setAttribute('role', 'region');
    }
})();
