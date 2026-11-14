/**
 * ============================================
 * TOC.JS – Table of Contents Generator + Scroll Spy
 * ============================================
 * This script scans the article content for <h2> and <h3> tags,
 * builds a nested TOC with +/- toggle, and implements scroll spy.
 * 
 * FEATURES:
 *   - Auto-generates TOC from <h2> and <h3> tags
 *   - + / - toggle for expanding/collapsing sub-headings
 *   - Scroll Spy: highlights active section as user scrolls
 *   - Mobile TOC toggle with overlay
 * 
 * NOTE: Prev/next navigation and recommended articles are handled
 *       in blog-article.js (blog-specific, not TOC-related).
 * ============================================
 */

(function() {
    'use strict';

    const CONFIG = {
        tocContainer: '#toc-list',
        mobileTocContainer: '#mobile-toc-list',
        contentSelector: '#page-content',
        headingSelector: 'h2, h3',
        excludeClass: 'no-toc',
        scrollOffset: 160
    };

    let tocItems = [];
    let tocList = null;
    let mobileTocList = null;
    let mobileTOCInitialized = false;

    // ============================================
    // THROTTLE HELPER (for scroll spy performance)
    // ============================================
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    }

    // ============================================
    // BUILD TOC
    // ============================================
    function buildTOC() {
        const contentEl = document.querySelector(CONFIG.contentSelector);
        if (!contentEl) {
            console.warn('TOC: Content element not found.');
            return;
        }

        tocList = document.querySelector(CONFIG.tocContainer);
        mobileTocList = document.querySelector(CONFIG.mobileTocContainer);
        if (!tocList) {
            console.warn('TOC: Container not found.');
            return;
        }

        const headings = contentEl.querySelectorAll(CONFIG.headingSelector);
        if (headings.length === 0) {
            tocList.innerHTML = '<li style="opacity:0.4;font-size:0.85rem;">No headings found.</li>';
            return;
        }

        const tree = [];
        let currentH2 = null;

        headings.forEach(function(heading) {
            if (heading.classList.contains(CONFIG.excludeClass)) return;

            const tag = heading.tagName.toLowerCase();
            const id = heading.id || '';
            const text = heading.textContent.trim();

            if (!id) {
                const slug = text.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                heading.id = slug;
            }

            if (tag === 'h2') {
                const item = { id: heading.id, text: text, level: 2, children: [] };
                tree.push(item);
                currentH2 = item;
            } else if (tag === 'h3' && currentH2) {
                currentH2.children.push({ id: heading.id, text: text, level: 3 });
            } else if (tag === 'h3' && !currentH2) {
                const item = { id: heading.id, text: text, level: 2, children: [] };
                tree.push(item);
                currentH2 = item;
            }
        });

        tocItems = tree;
        renderTOC(tocList, tree, false);
        if (mobileTocList) renderTOC(mobileTocList, tree, true);
        initScrollSpy();
        initMobileTOC();

        console.log('✅ TOC generated with ' + tree.length + ' headings.');
    }

    
    // ============================================
    // RENDER TOC
    // ============================================

    
    function renderTOC(container, tree, isMobile) {
        if (!container) return;
        const ul = document.createElement('ul');
        ul.className = 'toc-list';

        tree.forEach(function(item) {
            const li = document.createElement('li');
            li.className = 'toc-h2';

            const a = document.createElement('a');
            a.href = '#' + item.id;
            a.textContent = item.text;
            a.dataset.target = item.id;

            if (item.children && item.children.length > 0) {
            const toggle = document.createElement('button');
            toggle.className = 'toc-toggle';
            toggle.textContent = '+';
            toggle.setAttribute('aria-label', 'Toggle sub-headings for ' + item.text);
            toggle.dataset.expanded = 'false';
            toggle.dataset.parent = item.id;
            a.prepend(toggle);
        
            const subUl = document.createElement('ul');
            subUl.className = 'toc-sub-list';
            subUl.id = 'toc-sub-' + item.id;
        
            item.children.forEach(function(child) {
                const subLi = document.createElement('li');
                subLi.className = 'toc-h3';
                const subA = document.createElement('a');
                subA.href = '#' + child.id;
                subA.textContent = child.text;
                subA.dataset.target = child.id;
                subLi.appendChild(subA);
                subUl.appendChild(subLi);
            });
        
            li.appendChild(a);
            li.appendChild(subUl);
        
            // ===== THIS IS THE IMPORTANT PART =====
            // The toggle button is the ONLY element that handles expanding/collapsing
            // NO click handler on the <a> tag
            toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
        
            toggleSubHeadings(item.id, toggle);
        
            console.log('Toggle clicked for:', item.id);
        });
        
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = 'toc-toggle-placeholder';
            a.prepend(placeholder);
                
            li.appendChild(a);
        }





            

            ul.appendChild(li);
        });

        container.innerHTML = '';
        container.appendChild(ul);
    }

    // ============================================
    // TOGGLE SUB-HEADINGS
    // ============================================
  
function toggleSubHeadings(parentId, toggleButton) {

    const li = toggleButton.closest('.toc-h2');
    if (!li) return;

    const subList = li.querySelector('.toc-sub-list');
    if (!subList) return;

    const isOpen = subList.classList.contains('open');

    if (isOpen) {
        subList.classList.remove('open');
    } else {
        subList.classList.add('open');
    }

    toggleButton.textContent = isOpen ? '+' : '−';
    toggleButton.dataset.expanded = isOpen ? 'false' : 'true';
}    

    // ============================================
    // SCROLL SPY (Fixed: now works on all devices)
    // ============================================
    
    function initScrollSpy() {

    const tocLinks =
        document.querySelectorAll('.toc-list a[data-target]');

    const headingMap = {};

    tocItems.forEach(function(item) {

        headingMap[item.id] = {
            parent: null
        };

        item.children.forEach(function(child) {

            headingMap[child.id] = {
                parent: item.id
            };

        });

    });

    const headings =
        Object.keys(headingMap)
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!headings.length) return;

    const updateActiveHeading = throttle(function() {

        const scrollPos =
            window.scrollY + CONFIG.scrollOffset;

        let activeId = null;

        headings.forEach(function(heading) {

            const top =
                heading.getBoundingClientRect().top +
                window.scrollY;

            if (top <= scrollPos) {
                activeId = heading.id;
            }

        });

        tocLinks.forEach(function(link) {
            link.classList.remove('active');
        });

        if (!activeId) return;

       const activeLinks =
            document.querySelectorAll(
                '.toc-list a[data-target="' + activeId + '"]'
            );
        
        activeLinks.forEach(function(link) {
            link.classList.add('active');
        });

                const parentId =
            headingMap[activeId].parent;

        if (parentId) {

            const parentLinks =
                document.querySelectorAll(
                    '.toc-list a[data-target="' + parentId + '"]'
                );

            const firstParentLink = parentLinks[0];



        

            const parentLi =
                firstParentLink ?
                firstParentLink.closest('.toc-h2') :
                null;
            
            const subList =
                parentLi ?
                parentLi.querySelector('.toc-sub-list') :
                null;
            
            const toggleBtn =
                parentLi ?
                parentLi.querySelector('.toc-toggle') :
                null;

            if (subList) {
                subList.classList.add('open');
            }

            if (toggleBtn) {
                toggleBtn.textContent = '−';
                toggleBtn.dataset.expanded = 'true';
            }

        }

    }, 100);

    updateActiveHeading();

    window.addEventListener('scroll', updateActiveHeading);
    window.addEventListener('resize', updateActiveHeading);
    window.addEventListener('load', updateActiveHeading);
}

    // ============================================
    // MOBILE TOC TOGGLE
    // ============================================
    
    function initMobileTOC() {

    if (mobileTOCInitialized) return;
    mobileTOCInitialized = true;
        
        const toggleBtn = document.getElementById('mobile-toc-toggle');
        const overlay = document.getElementById('mobile-toc-overlay');
        const panel = document.getElementById('mobile-toc-panel');
        const closeBtn = document.getElementById('mobile-toc-close');

        if (!toggleBtn || !overlay || !panel) return;

        overlay.classList.remove('active');
        panel.classList.remove('open');
        document.body.style.overflow = '';

        function openMobileTOC() {
            overlay.classList.add('active');
            panel.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeMobileTOC() {
            overlay.classList.remove('active');
            panel.classList.remove('open');
            document.body.style.overflow = '';
        }

        toggleBtn.addEventListener('click', openMobileTOC);
        closeBtn.addEventListener('click', closeMobileTOC);
        overlay.addEventListener('click', closeMobileTOC);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && panel.classList.contains('open')) {
                closeMobileTOC();
            }
        });

        if (panel) {
            panel.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeMobileTOC);
            });
        }

        window.addEventListener('pageshow', function() {
        overlay.classList.remove('active');
        panel.classList.remove('open');
        document.body.style.overflow = '';
    });       
    }

    // ============================================
    // PUBLIC API
    // ============================================
    window.TOC = {
        build: buildTOC
    };


    // ============================================
// AUTO-INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    buildTOC();
});

})();
