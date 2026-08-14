/**
 * ============================================
 * NAVBAR.JS – Structure & Logic Only
 * ===========================================
 * All styling is controlled via style.css
 */

(function() {
    'use strict';

    const CONFIG = {
        yourName: 'Dr. Sameh Eltaybani',
        photoPath: 'img/profile.webp',
        photoAlt: 'Profile photo of Dr. Sameh Eltaybani',
        navLinks: [
            { label: 'Home', link: 'index.html', icon: 'fa-solid fa-house' },
            { label: 'Research', link: 'research.html', icon: 'fa-solid fa-flask' },
            { label: 'Publications', link: 'publications.html', icon: 'fa-solid fa-file-lines' },
            { label: 'Data Analysis', link: 'data-analysis.html', icon: 'fa-solid fa-chart-bar' },
            { label: 'Teaching', link: 'teaching.html', icon: 'fa-solid fa-chalkboard-user' },
            { label: 'Blog', link: 'blog.html', icon: 'fa-solid fa-pen-to-square' }
        ],
        rightIcons: [
            { 
                iconClass: 'fa-regular fa-envelope', 
                link: 'mailto:your.email@university.edu',
                ariaLabel: 'Contact me via email'
            },
            { 
                iconClass: 'fa-solid fa-magnifying-glass', 
                link: 'search.html',
                ariaLabel: 'Search the website'
            }
        ]
    };

    document.addEventListener('DOMContentLoaded', function() {

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        const wrapper = document.createElement('div');
        wrapper.className = 'navbar-wrapper';
        
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.setAttribute('role', 'navigation');
        navbar.setAttribute('aria-label', 'Main navigation');

        // --- LEFT: Photo + Name ---
        const brand = document.createElement('a');
        brand.className = 'navbar-brand';
        brand.href = 'index.html';
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
            
            if (item.link === currentPage) {
                a.classList.add('active');
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

        // --- DROPDOWN (mobile) ---
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
            a.appendChild(icon);
            
            const text = document.createTextNode(' ' + item.label);
            a.appendChild(text);
            
            if (item.link === currentPage) {
                a.classList.add('active');
            }
            
            li.appendChild(a);
            dropdown.appendChild(li);
        });

        // --- RIGHT: Icons ---
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'navbar-icons';

        CONFIG.rightIcons.forEach(function(icon) {
            const a = document.createElement('a');
            a.href = icon.link;
            a.setAttribute('aria-label', icon.ariaLabel);
            
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
