/**
 * ============================================
 * FOOTER.JS – Structure & Logic Only
 * ============================================
 * All styling is controlled via style.css
 */

(function() {
    'use strict';

    const CONFIG = {
        yourName: 'Dr. Sameh Eltaybani',
        socialLinks: [
            { icon: 'fa-brands fa-youtube', url: 'https://www.youtube.com/your-channel', label: 'YouTube' },
            { icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/your-profile', label: 'Facebook' },
            { icon: 'fa-brands fa-linkedin-in', url: 'https://www.linkedin.com/in/your-profile', label: 'LinkedIn' },
            { icon: 'fa-brands fa-x-twitter', url: 'https://twitter.com/your-handle', label: 'Twitter' }
        ]
    };

    document.addEventListener('DOMContentLoaded', function() {

        const footer = document.createElement('footer');
        footer.className = 'site-footer';

        const container = document.createElement('div');
        container.className = 'container';

        // --- COLUMN 1: Copyright + Social Icons ---
        const col1 = document.createElement('div');
        col1.className = 'footer-col footer-col-1';
        
        const currentYear = new Date().getFullYear();
        const safeName = window.escapeHTML ? window.escapeHTML(CONFIG.yourName) : CONFIG.yourName;
        const copyright = document.createElement('p');
        copyright.className = 'footer-copyright';
        copyright.textContent = `© ${currentYear} ${safeName}. All rights reserved.`;

        const socialContainer = document.createElement('div');
        socialContainer.className = 'footer-social';

        CONFIG.socialLinks.forEach(function(item) {
            if (!item.url) return;
            const a = document.createElement('a');
            a.href = item.url;
            a.setAttribute('aria-label', item.label);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'footer-social-link';
            const i = document.createElement('i');
            i.className = item.icon;
            a.appendChild(i);
            socialContainer.appendChild(a);
        });

        col1.appendChild(copyright);
        col1.appendChild(socialContainer);

        // --- COLUMN 2: Sitemap ---
        const col2 = document.createElement('div');
        col2.className = 'footer-col footer-col-2';
        
        const sitemapTitle = document.createElement('h4');
        sitemapTitle.className = 'footer-heading';
        sitemapTitle.textContent = 'Sitemap';
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
        sitemapList.className = 'footer-sitemap';

        navLinks.forEach(function(item) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.link;
            a.textContent = item.label;
            li.appendChild(a);
            sitemapList.appendChild(li);
        });

        col2.appendChild(sitemapList);

        // --- COLUMN 3: Legal & Disclaimer ---
        const col3 = document.createElement('div');
        col3.className = 'footer-col footer-col-3';
        
        const legalTitle = document.createElement('h4');
        legalTitle.className = 'footer-heading';
        legalTitle.textContent = 'Legal & Disclaimer';
        col3.appendChild(legalTitle);

        const legalText = document.createElement('p');
        legalText.className = 'footer-legal-text';
        legalText.textContent = 'This website provides information for educational and research purposes only. It does not constitute medical advice.';
        col3.appendChild(legalText);

        const readMore = document.createElement('a');
        readMore.href = 'legal.html';
        readMore.className = 'footer-read-more';
        readMore.textContent = 'Read more';
        
        const arrow = document.createElement('i');
        arrow.className = 'fa-solid fa-arrow-right';
        readMore.appendChild(arrow);
        col3.appendChild(readMore);

        // --- Assemble ---
        container.appendChild(col1);
        container.appendChild(col2);
        container.appendChild(col3);
        footer.appendChild(container);
        document.body.appendChild(footer);

        console.log('✅ Footer injected successfully.');
    });
})();
