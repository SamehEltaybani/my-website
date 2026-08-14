/**
 * ============================================
 * BACK-TO-TOP BUTTON
 * ============================================
 * Shows a fixed button when the user scrolls down,
 * clicking it smoothly scrolls to the top.
 */

(function() {
    'use strict';

    // Create the button element
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    document.body.appendChild(btn);

    // Show/hide button based on scroll position
    let scrollThreshold = 300; // pixels from top

    function toggleButton() {
        if (window.scrollY > scrollThreshold) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    }

    // Listen for scroll events
    window.addEventListener('scroll', toggleButton);

    // Check initial state
    toggleButton();

    // Scroll to top on click
    btn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    console.log('✅ Back-to-top button injected.');
})();
