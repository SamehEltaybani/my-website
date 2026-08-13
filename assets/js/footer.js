/**
 * ============================================
 * FOOTER.JS – Simple & Secure Footer
 * ============================================
 */

(function() {
    'use strict';

    const CONFIG = {
        yourName: 'Dr. Your Name Here',
        socialLinks: [
            { icon: 'fa-brands fa-youtube', url: 'https://www.youtube.com/your-channel', label: 'YouTube' },
            { icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/your-profile', label: 'Facebook' },
            { icon: 'fa-brands fa-linkedin-in', url: 'https://www.linkedin.com/in/your-profile', label: 'LinkedIn' },
            { icon: 'fa-brands fa-x-twitter', url: 'https://twitter.com/your-handle', label: 'Twitter' }
        ]
    };

    document.addEventListener('DOMContentLoaded', function() {

        const footer = document.createElement('footer');
        footer.style.cssText = `
            background-color: var(--white-color, #ffffff);
            padding: 2.5rem 1.5rem 3rem 1.5rem;
            margin-top: 4rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            color: var(--dark-color, #222831);
        `;

        const container = document.createElement('div');
        container.className = 'container';
        container.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 1fr 1.5fr;
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        `;

        // --- COLUMN 1: Copyright + Social Icons ---
        const col1 = document.createElement('div');
        
        const currentYear = new Date().getFullYear();
        const safeName = window.escapeHTML ? window.escapeHTML(CONFIG.yourName) : CONFIG.yourName;
        const copyright = document.createElement('p');
        copyright.textContent = `© ${currentYear} ${safeName}. All rights reserved.`;
        copyright.style.cssText = `margin-bottom: 0.8rem; font-size: 0.95rem;`;

        const socialContainer = document.createElement('div');
        socialContainer.style.cssText = `
    display: flex;
    gap: 1.2rem;
    flex-wrap: wrap;
    justify-content: center;
`;

        CONFIG.socialLinks.forEach(function(item) {
            if (!item.url) return;
            const a = document.createElement('a');
            a.href = item.url;
            a.setAttribute('aria-label', item.label);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.cssText = `
                color: var(--dark-color, #222831);
                font-size: 1.3rem;
                transition: color 0.2s ease;
                text-decoration: none;
            `;
            a.className = 'footer-social-link';
            const i = document.createElement('i');
            i.className = item.icon;
            a.appendChild(i);
            socialContainer.appendChild(a);
        });

        col1.appendChild(copyright);
        col1.appendChild(socialContainer);

        // --- COLUMN 2: Sitemap (Nav tabs) ---
        const col2 = document.createElement('div');
        const sitemapTitle = document.createElement('h4');
        sitemapTitle.textContent = 'Sitemap';
        sitemapTitle.style.cssText = `
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.8rem;
            color: var(--dark-color, #222831);
        `;
        col2.appendChild(sitemapTitle);

        const navLinks = [
            { label: 'Home', link: 'index.html' },
            { label: 'Research', link: 'research.html' },
            { label: 'Publications', link: 'publications.html' },
            { label: 'Data Analysis', link: 'data-analysis.html' },
            { label: 'Teaching', link: 'teaching.html' },
            { label: 'Blog', link: 'blog.html' }
        ];

        const sitemapList = document.createElement('ul');
        sitemapList.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        `;

        navLinks.forEach(function(item) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.link;
            a.textContent = item.label;
            a.style.cssText = `
                color: var(--dark-color, #222831);
                text-decoration: none;
                font-size: 0.9rem;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            `;
            a.onmouseover = function() { this.style.opacity = '1'; };
            a.onmouseout = function() { this.style.opacity = '0.7'; };
            li.appendChild(a);
            sitemapList.appendChild(li);
        });

        col2.appendChild(sitemapList);

        // --- COLUMN 3: Legal & Disclaimer ---
        const col3 = document.createElement('div');
        const legalTitle = document.createElement('h4');
        legalTitle.textContent = 'Legal & Disclaimer';
        legalTitle.style.cssText = `
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.5rem;
            color: var(--dark-color, #222831);
        `;
        col3.appendChild(legalTitle);

        const legalText = document.createElement('p');
        legalText.textContent = 'This website provides information for educational and research purposes only. It does not constitute medical advice.';
        legalText.style.cssText = `
            font-size: 0.9rem;
            opacity: 0.7;
            line-height: 1.5;
            margin-bottom: 0.5rem;
        `;
        col3.appendChild(legalText);

        const readMore = document.createElement('a');
        readMore.href = 'legal.html';
        readMore.textContent = 'Read more';
        readMore.style.cssText = `
            color: var(--accent-color, #00ADB5);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: gap 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
        `;
        const arrow = document.createElement('i');
        arrow.className = 'fa-solid fa-arrow-right';
        arrow.style.cssText = 'font-size: 0.8rem; transition: transform 0.2s ease;';
        readMore.appendChild(arrow);
        
        readMore.onmouseover = function() { this.style.gap = '0.6rem'; arrow.style.transform = 'translateX(3px)'; };
        readMore.onmouseout = function() { this.style.gap = '0.3rem'; arrow.style.transform = 'translateX(0)'; };
        
        col3.appendChild(readMore);

        // --- Assemble ---
        container.appendChild(col1);
        container.appendChild(col2);
        container.appendChild(col3);
        footer.appendChild(container);

        document.body.appendChild(footer);

        // Hover style for social icons
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .footer-social-link:hover {
                color: var(--accent-color, #00ADB5) !important;
            }
        `;
        document.head.appendChild(styleTag);

        // --- Responsive: Stack columns on mobile ---
        const responsiveStyle = document.createElement('style');
        responsiveStyle.textContent = `
            @media (max-width: 768px) {
                .container {
                    grid-template-columns: 1fr !important;
                    gap: 1.5rem !important;
                    text-align: center;
                }
                .footer-social-link {
                    font-size: 1.5rem !important;
                }
                .sitemap-list {
                    align-items: center !important;
                }
            }
        `;
        document.head.appendChild(responsiveStyle);

        console.log('✅ Footer injected successfully.');
    });
})();
