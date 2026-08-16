/**
 * ============================================
 * BLOG-ARTICLE.JS – Shared logic for all blog articles
 * ============================================
 * This script handles:
 * - Reading time calculation
 * - Populating article header from articleData
 * - Share, QR, Copyright tooltips
 * - Toast notifications
 * - GLightbox initialization
 * - Calls TOC navigation and recommended articles
 * 
 * DEPENDENCIES: utils.js, toc.js (loaded before)
 * 
 * USAGE: After defining articleData in the HTML, include this script.
 * ============================================
 */

(function() {
    'use strict';

    // Ensure articleData is defined
    if (typeof articleData === 'undefined') {
        console.warn('articleData is not defined. Please define it before loading this script.');
        return;
    }

    // ============================================
    // 1. READING TIME CALCULATION
    // ============================================
    function calculateReadingTime() {
        const content = document.getElementById('blog-content');
        if (!content) return '1 min read';

        const text = content.textContent || '';
        const wordCount = text.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return minutes + ' min read';
    }

    // ============================================
    // 2. POPULATE ARTICLE HEADER
    // ============================================
    function populateHeader() {
        // Title
        const titleEl = document.getElementById('article-title');
        if (titleEl && articleData.title) {
            titleEl.textContent = articleData.title;
            document.title = 'Dr. Sameh Eltaybani - ' + articleData.title;
        }

        // Short Title
        const shortTitleEl = document.getElementById('article-short-title');
        if (shortTitleEl && articleData.shortTitle) {
            shortTitleEl.textContent = articleData.shortTitle;
        }

        // Date
        const dateSpan = document.querySelector('#article-date span');
        if (dateSpan && articleData.date) {
            const date = new Date(articleData.date);
            if (!isNaN(date)) {
                dateSpan.textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }

        // Categories
        const catContainer = document.getElementById('article-categories');
        if (catContainer && articleData.categories && articleData.categories.length > 0) {
            catContainer.innerHTML = '';
            articleData.categories.forEach(function(cat) {
                const tag = document.createElement('span');
                tag.className = 'category-tag';
                tag.textContent = cat;
                catContainer.appendChild(tag);
            });
        }

        // Reading Time
        const readingTimeSpan = document.querySelector('#article-reading-time span');
        if (readingTimeSpan) {
            readingTimeSpan.textContent = calculateReadingTime();
        }
    }

    // ============================================
    // 3. TOAST NOTIFICATIONS
    // ============================================
    let toastTimeout = null;

    function showToast(message) {
        const toast = document.getElementById('toast-message');
        const textEl = document.getElementById('toast-text');
        if (!toast || !textEl) return;

        textEl.textContent = message;
        toast.style.display = 'block';
        toast.style.opacity = '0';
        setTimeout(function() {
            toast.style.opacity = '1';
        }, 50);

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() {
                toast.style.display = 'none';
            }, 300);
        }, 3000);
    }

    // ============================================
    // 4. TOOLTIP MANAGEMENT
    // ============================================
    let activeTooltip = null;

    function openTooltip(tooltipId) {
        if (activeTooltip) {
            document.getElementById(activeTooltip).style.display = 'none';
        }
        const tooltip = document.getElementById(tooltipId);
        if (tooltip) {
            tooltip.style.display = 'block';
            activeTooltip = tooltipId;
        }
    }

    function closeTooltip(tooltipId) {
        const tooltip = document.getElementById(tooltipId);
        if (tooltip) {
            tooltip.style.display = 'none';
            if (activeTooltip === tooltipId) {
                activeTooltip = null;
            }
        }
    }

    // ============================================
    // 5. SETUP TOOLTIP TRIGGERS
    // ============================================
    function setupTooltips() {
        // Share buttons
        document.querySelectorAll('#share-btn, #share-btn-bottom').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openTooltip('share-tooltip');
            });
        });

        // QR buttons (QR code pre-generated on page load)
        document.querySelectorAll('#qr-btn, #qr-btn-bottom').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openTooltip('qr-tooltip');
            });
        });

        // Copyright buttons
        document.querySelectorAll('#copyright-btn, #copyright-btn-bottom').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openTooltip('copyright-tooltip');
            });
        });

        // Close buttons inside tooltips
        document.querySelectorAll('.tooltip-close').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const tooltipId = this.dataset.tooltip;
                if (tooltipId) {
                    closeTooltip(tooltipId + '-tooltip');
                }
            });
        });

        // Click outside to close
        document.addEventListener('click', function(e) {
            if (activeTooltip) {
                const tooltip = document.getElementById(activeTooltip);
                if (tooltip && !tooltip.contains(e.target) && !e.target.closest('.blog-action-btn')) {
                    closeTooltip(activeTooltip);
                }
            }
        });
    }

    // ============================================
    // 6. SHARE FUNCTIONALITY
    // ============================================
    function setupShare() {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(articleData.title || '');

        document.querySelectorAll('[data-share]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const platform = this.dataset.share;
                let shareUrl = '';

                switch (platform) {
                    case 'facebook':
                        shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
                        break;
                    case 'twitter':
                        shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
                        break;
                    case 'linkedin':
                        shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
                        break;
                    case 'telegram':
                        shareUrl = 'https://t.me/share/url?url=' + url + '&text=' + title;
                        break;
                    case 'whatsapp':
                        shareUrl = 'https://api.whatsapp.com/send?text=' + title + '%20' + url;
                        break;
                    case 'email':
                        shareUrl = 'mailto:?subject=' + title + '&body=' + url;
                        break;
                    case 'line':
                        shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + url;
                        break;
                    case 'copy':
                        // Copy link
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(window.location.href).then(function() {
                                showToast('Link copied to clipboard!');
                            }).catch(function() {
                                fallbackCopy(window.location.href);
                            });
                        } else {
                            fallbackCopy(window.location.href);
                        }
                        return;
                    default:
                        return;
                }

                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Link copied to clipboard!');
        } catch (e) {
            alert('Unable to copy link. Please copy it manually.');
        }
        document.body.removeChild(textarea);
    }

    // ============================================
    // 7. GLIGHTBOX INIT
    // ============================================
    function initGlightbox() {
        if (typeof GLightbox !== 'undefined') {
            GLightbox({
                selector: '.glightbox',
                touchNavigation: true,
                loop: false,
                autoplayVideos: false
            });
        }
    }

    // ============================================
    // 8. LOAD ARTICLES DATA FOR NAV & RECOMMENDED
    // ============================================
    function loadArticlesAndSetupNav() {
        fetch('/my-website/json/blog.json')
            .then(function(response) {
                if (!response.ok) throw new Error('Failed to load blog.json');
                return response.json();
            })
            .then(function(allArticles) {
                // Setup navigation (previous/next) – requires toc.js
                if (typeof window.TOC !== 'undefined' && window.TOC.setupNav) {
                    window.TOC.setupNav(articleData.id, allArticles);
                } else {
                    console.warn('TOC.setupNav not available. Ensure toc.js is loaded.');
                }

                // Setup recommended articles
                if (typeof window.TOC !== 'undefined' && window.TOC.setupRecommended) {
                    window.TOC.setupRecommended(articleData.id, allArticles, 6);
                } else {
                    console.warn('TOC.setupRecommended not available. Ensure toc.js is loaded.');
                }
            })
            .catch(function(error) {
                console.error('Error loading blog.json for nav:', error);
            });
    }

            function preGenerateQR() {
                const qrImg = document.getElementById('qr-code-image');
                if (qrImg) {
                    const url = window.location.href;
                    qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
                }
            }
    
    // ============================================
    // 9. INIT
    // ============================================
    function init() {
    populateHeader();
    setupTooltips();
    setupShare();
    initGlightbox();
    loadArticlesAndSetupNav();
    preGenerateQR(); 
    console.log('✅ Blog article ready.');
}

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
