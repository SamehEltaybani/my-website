/**
 * ============================================
 * NAVBAR.JS – Floating Glassmorphism Pill Navbar
 * ============================================
 */

(function() {
    'use strict';

    const CONFIG = {
        yourName: 'Dr. Sameh Eltaybani',
        photoPath: '/my-website/img/profile.webp',
        photoAlt: 'Profile photo of Dr. Sameh Eltaybani',
        navLinks: [
            { label: 'Home', link: '/my-website/index.html', icon: 'fa-solid fa-house' },
            { label: 'Research', link: '/my-website/research.html', icon: 'fa-solid fa-flask' },
            { label: 'Publications', link: '/my-website/publications.html', icon: 'fa-solid fa-file-lines' },
            { label: 'Data Analysis', link: '/my-website/data-analysis.html', icon: 'fa-solid fa-chart-bar' },
            { label: 'Teaching', link: '/my-website/teaching.html', icon: 'fa-solid fa-chalkboard-user' },
            { label: 'Blog', link: '/my-website/blog.html', icon: 'fa-solid fa-pen-to-square' }
        ],
        rightIcons: [
            { 
                iconClass: 'fa-regular fa-envelope', 
                link: '/my-website/contact.html',
                ariaLabel: 'Contact me',
                title: 'Contact me'
            },
            { 
                iconClass: 'fa-solid fa-magnifying-glass', 
                link: '#',
                ariaLabel: 'Search the website',
                title: 'Search the website'
            }
        ]
    };

    document.addEventListener('DOMContentLoaded', function() {

        // ===== GET CURRENT PAGE FILENAME =====
        const currentPath = window.location.pathname;
        let currentPage = currentPath.split('/').pop() || 'index.html';
        // Remove any query parameters
        currentPage = currentPage.split('?')[0];

        // If the page is the root (e.g., /my-website/), treat as index.html
        if (currentPage === '') {
            currentPage = 'index.html';
        }

        console.log('Current page:', currentPage); // Debug log

        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.setAttribute('role', 'navigation');
        navbar.setAttribute('aria-label', 'Main navigation');

        // --- LEFT: Photo + Name ---
        const brand = document.createElement('a');
        brand.className = 'navbar-brand';
        brand.href = '/my-website/index.html';
        brand.setAttribute('aria-label', 'Go to homepage');

        const img = document.createElement('img');
        img.src = CONFIG.photoPath;
        img.alt = CONFIG.photoAlt;
        img.loading = 'lazy';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = window.escapeHTML ? window.escapeHTML(CONFIG.yourName) : CONFIG.yourName;

        brand.appendChild(img);
        brand.appendChild(nameSpan);

        // --- MIDDLE: Navigation tabs ---
        const navList = document.createElement('ul');
        navList.className = 'navbar-links';

        CONFIG.navLinks.forEach(function(item) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.link;
            a.textContent = item.label;

            // ===== ACTIVE STATE CHECK =====
            // Get the filename from the link
            const linkPath = item.link.split('/').pop() || 'index.html';
            const cleanLink = linkPath.split('?')[0];

            if (cleanLink === currentPage) {
                a.classList.add('active');
                console.log('Active tab:', item.label); // Debug log
            }

            li.appendChild(a);
            navList.appendChild(li);
        });

        // --- HAMBURGER ---
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        hamburger.setAttribute('aria-expanded', 'false');
        
        const span1 = document.createElement('span');
        const span2 = document.createElement('span');
        const span3 = document.createElement('span');
        hamburger.appendChild(span1);
        hamburger.appendChild(span2);
        hamburger.appendChild(span3);

        // --- DROPDOWN (mobile) with icons ---
        const dropdown = document.createElement('ul');
        dropdown.className = 'navbar-dropdown';
        dropdown.setAttribute('role', 'menu');

        CONFIG.navLinks.forEach(function(item) {
            const li = document.createElement('li');
            li.setAttribute('role', 'none');
            const a = document.createElement('a');
            a.href = item.link;
            a.setAttribute('role', 'menuitem');

            const icon = document.createElement('i');
            icon.className = item.icon;
            icon.style.cssText = 'margin-right: 0.6rem; width: 1.2rem; text-align: center; color: var(--accent-color);';
            a.appendChild(icon);

            const text = document.createTextNode(' ' + item.label);
            a.appendChild(text);

            // ===== ACTIVE STATE CHECK (mobile) =====
            const linkPath = item.link.split('/').pop() || 'index.html';
            const cleanLink = linkPath.split('?')[0];

            if (cleanLink === currentPage) {
                a.classList.add('active');
                a.querySelector('i').style.color = 'var(--white-color)';
            }

            li.appendChild(a);
            dropdown.appendChild(li);
        });

        // --- RIGHT: Icons in Circles ---
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'navbar-icons';

        CONFIG.rightIcons.forEach(function(icon) {
            const a = document.createElement('a');
            a.href = icon.link;
            a.setAttribute('aria-label', icon.ariaLabel);
            if (icon.title) {
                a.setAttribute('title', icon.title);
            }

            const i = document.createElement('i');
            i.className = icon.iconClass;
            a.appendChild(i);
            iconsContainer.appendChild(a);
        });

        // --- Assemble ---
        navbar.appendChild(brand);
        navbar.appendChild(navList);
        navbar.appendChild(hamburger);
        navbar.appendChild(dropdown);
        navbar.appendChild(iconsContainer);

        // --- WRAP THE NAVBAR IN A WRAPPER (for sticky positioning) ---
            const wrapper = document.createElement('div');
            wrapper.className = 'navbar-wrapper';
            wrapper.appendChild(navbar);
            
            const body = document.body;
            if (body.firstChild) {
                body.insertBefore(wrapper, body.firstChild);
            } else {
                body.appendChild(wrapper);
            }

        // --- Hamburger toggle logic ---
        hamburger.addEventListener('click', function(event) {
            event.stopPropagation();
            const isOpen = dropdown.classList.contains('show');
            if (isOpen) {
                dropdown.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            } else {
                dropdown.classList.add('show');
                hamburger.setAttribute('aria-expanded', 'true');
            }
        });

        document.addEventListener('click', function(event) {
            const isClickInside = navbar.contains(event.target);
            if (!isClickInside && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        dropdown.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                dropdown.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        console.log('✅ Navbar injected successfully.');
    });
})();
