/**
 * ============================================
 * BLOG-ARTICLE.JS – Shared logic for all blog articles
 * ============================================
 * Fetches article data from blog.json based on the current page filename.
 * Populates: header, navigation, recommended articles, tooltips, QR, share.
 * NOTE: <title>, meta description, and OG tags are kept static in each
 *       article's HTML for SEO and social media crawlers.
 */

(function() {
    'use strict';

    let articleData = null;
    let allArticles = [];

    // ============================================
    // HELPERS
    // ============================================
    function getCurrentPagePath() {
        return window.location.pathname.replace('/my-website/', '').replace(/^\/+/, '');
    }

    function articleUrl(blogfile) {
        if (!blogfile) return '#';
        if (blogfile.startsWith('/')) return blogfile;
        if (blogfile.startsWith('my-website/')) return '/' + blogfile;
        return '/my-website/' + blogfile;
    }

    function calculateReadingTime() {
        const content = document.getElementById('page-content');
        if (!content) return '1 min read';
        const text = content.textContent || '';
        const wordCount = text.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return minutes + ' min read';
    }

    // ============================================
    // LOAD ARTICLE DATA FROM blog.json
    // ============================================
    function loadArticleData() {
        const currentPath = getCurrentPagePath();
        const currentFilename = currentPath.split('/').pop();

        return fetch('/my-website/json/blog.json')
            .then(function(response) {
                if (!response.ok) throw new Error('Failed to load blog.json');
                return response.json();
            })
            .then(function(data) {
                allArticles = data;
                articleData = data.find(function(item) {
                    const blogfile = (item.blogfile || '').replace(/^\/+/, '');
                    if (blogfile === currentPath) return true;
                    const blogFilename = blogfile.split('/').pop();
                    return blogFilename === currentFilename;
                });
                if (!articleData) {
                    console.warn('Article not found in blog.json for:', currentPath);
                }
                return articleData;
            });
    }

    // ============================================
    // POPULATE ARTICLE HEADER
    // ============================================
    function populateHeader() {
        if (!articleData) return;

        const titleEl = document.getElementById('article-title');
        if (titleEl && articleData.title) titleEl.textContent = articleData.title;

        const shortTitleEl = document.getElementById('article-short-title');
        if (shortTitleEl && articleData.shortTitle) shortTitleEl.textContent = articleData.shortTitle;

        const dateSpan = document.querySelector('#article-date span');
        if (dateSpan && articleData.date) {
            const date = new Date(articleData.date);
            if (!isNaN(date)) {
                dateSpan.textContent = date.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            }
        }

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

        const readingTimeSpan = document.querySelector('#article-reading-time span');
        if (readingTimeSpan) readingTimeSpan.textContent = calculateReadingTime();
    }

    // ============================================
    // TOOLTIPS
    // ============================================
    let activeTooltip = null;

    function openTooltip(tooltipId) {
        if (activeTooltip) {
            const prev = document.getElementById(activeTooltip);
            if (prev) prev.style.display = 'none';
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
            if (activeTooltip === tooltipId) activeTooltip = null;
        }
    }

    function setupTooltips() {
        document.querySelectorAll('#share-btn, #share-btn-bottom').forEach(function(btn) {
            btn.addEventListener('click', function(e) { e.stopPropagation(); openTooltip('share-tooltip'); });
        });
        document.querySelectorAll('#qr-btn, #qr-btn-bottom').forEach(function(btn) {
            btn.addEventListener('click', function(e) { e.stopPropagation(); openTooltip('qr-tooltip'); });
        });
        document.querySelectorAll('#copyright-btn, #copyright-btn-bottom').forEach(function(btn) {
            btn.addEventListener('click', function(e) { e.stopPropagation(); openTooltip('copyright-tooltip'); });
        });
        document.querySelectorAll('.tooltip-close').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const id = this.dataset.tooltip;
                if (id) closeTooltip(id + '-tooltip');
            });
        });
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
    // TOAST
    // ============================================
    let toastTimeout = null;

   function showToast(message) {
    const toast = document.getElementById('toast-message');
    const textEl = document.getElementById('toast-text');
    if (!toast || !textEl) return;

    // 1. Add the icon and message inside the text element
    textEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--accent-color);margin-right:10px;font-size:1.2rem;"></i><span>' + message + '</span>';

    // 2. Force the toast to be wider and use flexbox for perfect vertical alignment
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.justifyContent = 'center';
    toast.style.minWidth = '320px';
    
    // Ensure the text element also aligns properly
    textEl.style.display = 'flex';
    textEl.style.alignItems = 'center';

    // 3. Your original fade-in/out logic
    toast.style.opacity = '0';
    setTimeout(function() { toast.style.opacity = '1'; }, 50);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { toast.style.display = 'none'; }, 300);
    }, 3000);
}
    
    // ============================================
    // SHARE
    // ============================================
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); showToast('Link copied to clipboard!'); }
        catch (e) { alert('Unable to copy link.'); }
        document.body.removeChild(textarea);
    }

    function setupShare() {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent((articleData && articleData.title) || '');

        document.querySelectorAll('[data-share]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const platform = this.dataset.share;
                let shareUrl = '';
                switch (platform) {
                    case 'facebook': shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url; break;
                    case 'twitter': shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title; break;
                    case 'linkedin': shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url; break;
                    case 'telegram': shareUrl = 'https://t.me/share/url?url=' + url + '&text=' + title; break;
                    case 'whatsapp': shareUrl = 'https://api.whatsapp.com/send?text=' + title + '%20' + url; break;
                    case 'email': shareUrl = 'mailto:?subject=' + title + '&body=' + url; break;
                    case 'line': shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + url; break;
                    case 'copy':
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(window.location.href).then(function() {
                                showToast('Link copied to clipboard!');
                            }).catch(function() { fallbackCopy(window.location.href); });
                        } else { fallbackCopy(window.location.href); }
                        return;
                    default: return;
                }
                if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
            });
        });
    }

    // ============================================
    // GLIGHTBOX
    // ============================================
    function initGlightbox() {
        if (typeof GLightbox !== 'undefined') {
            GLightbox({ selector: '.glightbox', touchNavigation: true, loop: false, autoplayVideos: false });
        }
    }

    // ============================================
    // NAV & RECOMMENDED
    // ============================================
    function setupNav(articleId, articles) {
        if (!articles || articles.length === 0) return;

        // Sort by date descending (newest first)
        const sorted = articles.slice().sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        let currentIndex = -1;
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].id === articleId) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex === -1) return;

        // Previous = older (higher index, since sorted newest-first)
        // Next = newer (lower index)
        const prevIndex = currentIndex + 1;
        const nextIndex = currentIndex - 1;

        const prevBtns = document.querySelectorAll('#prev-article, #prev-article-bottom');
        const nextBtns = document.querySelectorAll('#next-article, #next-article-bottom');

        if (prevIndex < sorted.length) {
            const prevArticle = sorted[prevIndex];
            prevBtns.forEach(function(btn) {
                btn.href = articleUrl(prevArticle.blogfile);
                btn.style.display = 'inline-flex';
            });
        } else {
            prevBtns.forEach(function(btn) {
                btn.style.display = 'none';
            });
        }

        if (nextIndex >= 0) {
            const nextArticle = sorted[nextIndex];
            nextBtns.forEach(function(btn) {
                btn.href = articleUrl(nextArticle.blogfile);
                btn.style.display = 'inline-flex';
            });
        } else {
            nextBtns.forEach(function(btn) {
                btn.style.display = 'none';
            });
        }
    }

    function setupRecommended(articleId, articles, maxItems) {
        maxItems = maxItems || 6;
        if (!articles || articles.length === 0) return;

        let currentArticle = null;
        for (let i = 0; i < articles.length; i++) {
            if (articles[i].id === articleId) {
                currentArticle = articles[i];
                break;
            }
        }
        if (!currentArticle) return;

        const currentCategories = currentArticle.categories || [];
        const scored = articles.map(function(article) {
            if (article.id === articleId) return null;
            const categories = article.categories || [];
            let score = 0;
            currentCategories.forEach(function(cat) {
                if (categories.includes(cat)) score++;
            });
            return { article: article, score: score };
        }).filter(function(item) { return item !== null; });

        scored.sort(function(a, b) {
            if (a.score !== b.score) return b.score - a.score;
            return new Date(b.article.date) - new Date(a.article.date);
        });

        let recommendations = scored.slice(0, maxItems);

        if (recommendations.length < maxItems) {
            const existingIds = recommendations.map(function(item) { return item.article.id; });
            const allArticlesSorted = articles.slice().sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
            allArticlesSorted.forEach(function(article) {
                if (article.id === articleId) return;
                if (existingIds.includes(article.id)) return;
                if (recommendations.length >= maxItems) return;
                recommendations.push({
                    article: article,
                    score: 0
                });
            });
        }

        const grid = document.getElementById('recommended-grid');
        if (!grid) return;

        grid.innerHTML = '';
        recommendations.forEach(function(item) {
            const card = document.createElement('a');
            card.className = 'recommended-card';
            card.href = articleUrl(item.article.blogfile);

            const title = document.createElement('div');
            title.className = 'rec-title';
            title.textContent = item.article.title;

            const date = document.createElement('div');
            date.className = 'rec-date';
            const d = new Date(item.article.date);
            if (!isNaN(d)) {
                date.textContent = d.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
            }

            card.appendChild(title);
            card.appendChild(date);
            grid.appendChild(card);
        });
    }

    function setupNavAndRecommended() {
        if (!articleData || !allArticles.length) return;
        setupNav(articleData.id, allArticles);
        setupRecommended(articleData.id, allArticles, 9);
    }

    // ============================================
    // QR CODE
    // ============================================
    function preGenerateQR() {
        const qrImg = document.getElementById('qr-code-image');
        if (qrImg) {
            const url = window.location.href;
            qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
        }
    }

    // ============================================
    // INIT
    // ============================================
    function init() {
        loadArticleData()
            .then(function() {
                populateHeader();
                setupTooltips();
                setupShare();
                initGlightbox();
                setupNavAndRecommended();
                preGenerateQR();
                console.log('✅ Blog article ready.');
            })
            .catch(function(error) {
                console.error('Error initializing blog article:', error);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
