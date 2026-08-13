/**
 * ============================================
 * NAVBAR.JS – Floating Glassmorphism Pill Navbar
 * ============================================
 * This script builds your main navigation bar and injects it
 * at the top of every page. It also handles the hamburger
 * menu toggle for mobile devices.
 * 
 * DEPENDENCIES:
 * - Requires utils.js to be loaded BEFORE this file.
 * - Requires style.css to be loaded for styling.
 * - Requires FontAwesome (CDN) and Google Fonts (Inter) in your HTML.
 * 
 * HOW TO CUSTOMIZE:
 * Look for the CONFIG object below. Change your name,
 * the navigation tab labels, the photo path, or icon links
 * right here – no need to touch the rest of the code.
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION – Edit this section only!
    // ============================================
    const CONFIG = {
        // Your full name (as displayed in the navbar)
        yourName: 'Dr. Your Name Here',
        
        // Path to your profile photo (inside the img/ folder)
        photoPath: 'img/profile.webp',
        
        // Alternative text for your photo (for accessibility)
        photoAlt: 'Profile photo of Dr. Your Name',
        
        // Navigation tabs: label (what visitors see) and link (the HTML file)
        navLinks: [
            { label: 'Home', link: 'index.html' },
            { label: 'Research', link: 'research.html' },
            { label: 'Publications', link: 'publications.html' },
            { label: 'Data Analysis', link: 'data-analysis.html' },
            { label: 'Teaching', link: 'teaching.html' },
            { label: 'Blog', link: 'blog.html' }
        ],
        
        // Right-side icons (FontAwesome classes and their destinations)
        // Contact: points to a mailto: email address – change the email below.
        // Search: points to your dedicated search.html page.
        rightIcons: [
            { 
                iconClass: 'fa-solid fa-envelope', 
                link: 'mailto:your.email@university.edu',
                ariaLabel: 'Contact me via email',
                external: false // Set to true if it opens a new tab
            },
            { 
                iconClass: 'fa-solid fa-magnifying-glass', 
                link: 'search.html',
                ariaLabel: 'Search the website',
                external: false
            }
        ]
    };
    // ============================================
    // END OF CONFIGURATION – Do not edit below here
    // ============================================

    // Wait for the HTML document to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {

        // --- 1. Create the navbar container ---
        const navbar = document.createElement('nav');
        navbar.className = 'navbar';
        navbar.setAttribute('role', 'navigation');
        navbar.setAttribute('aria-label', 'Main navigation');

        // --- 2. Build LEFT side: Photo + Name ---
        const brand = document.createElement('a');
        brand.className = 'navbar-brand';
        brand.href = 'index.html';
        brand.setAttribute('aria-label', 'Go to homepage');

        // Profile photo
        const img = document.createElement('img');
        img.src = CONFIG.photoPath;
        img.alt = CONFIG.photoAlt;
        img.loading = 'lazy'; // Improves page load speed

        // Your name (sanitized for security)
        const nameSpan = document.createElement('span');
        nameSpan.textContent = window.escapeHTML ? window.escapeHTML(CONFIG.yourName) : CONFIG.yourName;

        brand.appendChild(img);
        brand.appendChild(nameSpan);

        // --- 3. Build MIDDLE: Navigation tabs (hidden on mobile) ---
        const navList = document.createElement('ul');
        navList.className = 'navbar-links';

        CONFIG.navLinks.forEach(function(item) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.link;
            a.textContent = window.escapeHTML ? window.escapeHTML(item.label) : item.label;
            li.appendChild(a);
            navList.appendChild(li);
        });

        // --- 4. Build MOBILE HAMBURGER BUTTON ---
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = '<span></span><span></span><span></span>';

        // --- 5. Build MOBILE DROPDOWN MENU (hidden by default) ---
        const dropdown = document.createElement('ul');
        dropdown.className = 'navbar-dropdown';
        dropdown.setAttribute('role', 'menu');

        CONFIG.navLinks.forEach(function(item) {
            const li = document.createElement('li');
            li.setAttribute('role', 'none');
            const a = document.createElement('a');
            a.href = item.link;
            a.textContent = window.escapeHTML ? window.escapeHTML(item.label) : item.label;
            a.setAttribute('role', 'menuitem');
            li.appendChild(a);
            dropdown.appendChild(li);
        });

        // --- 6. Build RIGHT side: Icons (Contact & Search) ---
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'navbar-icons';

        CONFIG.rightIcons.forEach(function(icon) {
            const a = document.createElement('a');
            a.href = icon.link;
            a.setAttribute('aria-label', icon.ariaLabel);
            
            // Security: If external link, add noopener noreferrer
            if (icon.external) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            
            // Create FontAwesome icon element
            const i = document.createElement('i');
            i.className = icon.iconClass;
            a.appendChild(i);
            iconsContainer.appendChild(a);
        });

        // --- 7. Assemble the navbar ---
        navbar.appendChild(brand);
        navbar.appendChild(navList);
        navbar.appendChild(hamburger);
        navbar.appendChild(dropdown);
        navbar.appendChild(iconsContainer);

        // --- 8. Insert the navbar at the very top of the page (inside <body>) ---
        // If the body already has content, insert as first child.
        const body = document.body;
        if (body.firstChild) {
            body.insertBefore(navbar, body.firstChild);
        } else {
            body.appendChild(navbar);
        }

        // --- 9. HAMBURGER TOGGLE LOGIC ---
        hamburger.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevents the click from closing immediately
            
            const isOpen = dropdown.classList.contains('show');
            if (isOpen) {
                dropdown.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            } else {
                dropdown.classList.add('show');
                hamburger.setAttribute('aria-expanded', 'true');
            }
        });

        // --- 10. Close dropdown when clicking outside (better UX) ---
        document.addEventListener('click', function(event) {
            const isClickInside = navbar.contains(event.target);
            if (!isClickInside && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        // --- 11. Close dropdown when a link inside it is clicked (optional) ---
        dropdown.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                dropdown.classList.remove('show');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        console.log('✅ Navbar injected successfully.');
    });
})();
