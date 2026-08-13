/**
 * ============================================
 * FOOTER.JS – Simple & Secure Footer
 * ============================================
 * This script builds your website footer and injects it
 * at the bottom of every page.
 * 
 * DEPENDENCIES:
 * - Requires utils.js to be loaded BEFORE this file.
 * - Requires style.css to be loaded for styling.
 * - Requires FontAwesome (CDN) in your HTML.
 * 
 * HOW TO CUSTOMIZE:
 * Edit the CONFIG object below – change your name,
 * enable/disable social links, or update your profile URLs.
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION – Edit this section only!
    // ============================================
    const CONFIG = {
        // Your full name (for the copyright)
        yourName: 'Dr. Your Name Here',
        
        // Social media links (set the URL to '' to hide that icon)
        socialLinks: [
            { 
                icon: 'fa-brands fa-linkedin-in', 
                url: 'https://www.linkedin.com/in/your-profile',
                label: 'LinkedIn'
            },
            { 
                icon: 'fa-brands fa-x-twitter', 
                url: 'https://twitter.com/your-handle',
                label: 'Twitter / X'
            },
            { 
                icon: 'fa-brands fa-github', 
                url: 'https://github.com/your-username',
                label: 'GitHub'
            },
            { 
                icon: 'fa-brands fa-google-scholar', 
                url: 'https://scholar.google.com/citations?user=YOUR_ID',
                label: 'Google Scholar'
            }
        ],
        
        // Optional extra text (e.g., "Built with ❤️ on GitHub Pages")
        // Leave as '' to show nothing.
        extraCredit: 'Built with ❤️ on GitHub Pages'
    };
    // ============================================
    // END OF CONFIGURATION – Do not edit below here
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {

        // --- 1. Create footer container ---
        const footer = document.createElement('footer');
        footer.style.cssText = `
            background-color: var(--white-color, #ffffff);
            padding: 2rem 1.5rem;
            margin-top: 4rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            text-align: center;
            font-size: 0.95rem;
            color: var(--dark-color, #222831);
        `;

        // --- 2. Inner container (respects the 1200px max-width) ---
        const container = document.createElement('div');
        container.className = 'container';

        // --- 3. Copyright text (auto-updates the year) ---
        const currentYear = new Date().getFullYear();
        const safeName = window.escapeHTML ? window.escapeHTML(CONFIG.yourName) : CONFIG.yourName;
        const copyright = document.createElement('p');
        copyright.textContent = `© ${currentYear} ${safeName}. All rights reserved.`;
        copyright.style.marginBottom = '0.8rem';

        // --- 4. Social media icons row ---
        const socialContainer = document.createElement('div');
        socialContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 1.2rem;
            flex-wrap: wrap;
            margin-bottom: 0.8rem;
        `;

        CONFIG.socialLinks.forEach(function(item) {
            // Skip if URL is empty (user wants to hide this icon)
            if (!item.url) return;
            
            const a = document.createElement('a');
            a.href = item.url;
            a.setAttribute('aria-label', item.label);
            a.target = '_blank';
            a.rel = 'noopener noreferrer'; // Security for external links
            a.style.cssText = `
                color: var(--dark-color, #222831);
                font-size: 1.3rem;
                transition: color 0.2s ease;
                text-decoration: none;
            `;
            // Hover effect via CSS (we'll add a class)
            a.className = 'footer-social-link';
            
            const i = document.createElement('i');
            i.className = item.icon;
            a.appendChild(i);
            socialContainer.appendChild(a);
        });

        // --- 5. Extra credit text (optional) ---
        let extraElement = null;
        if (CONFIG.extraCredit) {
            extraElement = document.createElement('p');
            extraElement.textContent = CONFIG.extraCredit;
            extraElement.style.cssText = `
                font-size: 0.85rem;
                opacity: 0.6;
                margin-top: 0.5rem;
            `;
        }

        // --- 6. Assemble the footer ---
        container.appendChild(copyright);
        if (socialContainer.children.length > 0) {
            container.appendChild(socialContainer);
        }
        if (extraElement) {
            container.appendChild(extraElement);
        }
        footer.appendChild(container);

        // --- 7. Append footer to the body ---
        document.body.appendChild(footer);

        // --- 8. Inject a small style for the social link hover (to keep it centralized) ---
        // This ensures the hover color uses your accent color without touching the CSS file.
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .footer-social-link:hover {
                color: var(--accent-color, #00ADB5) !important;
            }
        `;
        document.head.appendChild(styleTag);

        console.log('✅ Footer injected successfully.');
    });
})();
