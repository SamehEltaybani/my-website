/**
 * ============================================
 * BLOG.JS – Load, Render, Filter, Sort
 This is for the list of blog articles (blog.html), not each blog article
 * ============================================
  */

(function() {
    'use strict';

    let allPosts = [];
    let filteredPosts = [];
    let loadedCount = 0;
    const pageSize = 10;

    // Filter state: only categories
    let filters = {
        category: {}
    };
    let sortOrder = 'newest';
    let isFiltered = false;
    let singleId = null;

    let container, controlsBar, statusEl, infoEl, filterBtn, sortBtn, resetBtn;
    let filterDropdown, sortDropdown, badgeEl, bannerEl, filterOverlay;

    // ----- Helpers -----
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function truncateSummary(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function createCardHTML(post) {
        let html = '';

        // Title (linked to blogfile)
        if (post.blogfile) {
            html += '<div class="blog-title"><a href="' + window.escapeHTML(post.blogfile) + '">' + window.escapeHTML(post.title) + '</a></div>';
        } else if (post.title) {
            html += '<div class="blog-title">' + window.escapeHTML(post.title) + '</div>';
        }

        // Short Title (optional)
        if (post.shortTitle) {
            html += '<div class="blog-short-title">' + window.escapeHTML(post.shortTitle) + '</div>';
        }

        // Date + Reading Time
        let metaHtml = '<div class="blog-meta">';
        if (post.date) {
            metaHtml += '<span class="blog-date"><i class="fa-regular fa-calendar"></i> ' + formatDate(post.date) + '</span>';
        }
        if (post.readingTime) {
            metaHtml += '<span class="blog-reading-time"><i class="fa-regular fa-clock"></i> ' + window.escapeHTML(post.readingTime) + '</span>';
        }
        metaHtml += '</div>';
        html += metaHtml;

        // Categories (tags)
        if (post.categories && post.categories.length > 0) {
            let tagsHtml = '<div class="blog-tags">';
            post.categories.forEach(function(cat) {
                tagsHtml += '<span class="blog-tag">' + window.escapeHTML(cat) + '</span>';
            });
            tagsHtml += '</div>';
            html += tagsHtml;
        }

        // Read More + Share (on the same line)
if (post.blogfile) {
    html += '<div class="blog-card-footer">';
    html += '<button class="blog-share-btn" data-url="' + window.location.origin + '/my-website/' + post.blogfile + '" data-title="' + window.escapeHTML(post.title) + '" aria-label="Share this article"><i class="fa-regular fa-share-from-square"></i></button>';
    html += '<a href="' + window.escapeHTML(post.blogfile) + '" class="blog-read-more-link">Read more <i class="fa-solid fa-arrow-right"></i></a>';
    html += '</div>';
}

        return html;
    }

    function allSelectedInCategory(category) {
        const keys = Object.keys(filters[category]);
        if (keys.length === 0) return false;
        return keys.every(function(key) { return filters[category][key] === true; });
    }

    function countSelectedValues() {
        let count = 0;
        Object.values(filters.category).forEach(function(value) {
            if (value === true) count++;
        });
        return count;
    }

    function applyFiltersAndSort() {
        if (singleId) {
            const singlePost = allPosts.find(function(p) { return p.id === singleId; });
            filteredPosts = singlePost ? [singlePost] : [];
            return;
        }

        let result = allPosts.slice();
        let filterCount = 0;

        // Category filter
        const selectedCategories = Object.keys(filters.category).filter(function(key) {
            return filters.category[key] === true;
        });
        if (selectedCategories.length > 0 && !allSelectedInCategory('category')) {
            filterCount++;
            result = result.filter(function(post) {
                if (!post.categories || post.categories.length === 0) return false;
                return post.categories.some(function(cat) {
                    return selectedCategories.includes(cat);
                });
            });
        }

        isFiltered = filterCount > 0;

        // Sort by date
        if (sortOrder === 'newest') {
            result.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
        } else {
            result.sort(function(a, b) {
                return new Date(a.date) - new Date(b.date);
            });
        }

        filteredPosts = result;
    }

    // ----- Render -----
    function render() {
        if (!container) container = document.getElementById('blog-list');

        if (singleId) {
            if (controlsBar) controlsBar.style.display = 'none';
            if (bannerEl) bannerEl.classList.add('show');
            container.innerHTML = '';
            if (filteredPosts.length > 0) {
                const card = document.createElement('div');
                card.className = 'blog-card';
                card.innerHTML = createCardHTML(filteredPosts[0]);
                container.appendChild(card);
            } else {
                container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">Blog article not found.</p>';
            }
            updateStatus();
            return;
        }

        if (controlsBar) controlsBar.style.display = 'flex';
        if (bannerEl) bannerEl.classList.remove('show');

        if (loadedCount === 0 || loadedCount > filteredPosts.length) {
            loadedCount = Math.min(pageSize, filteredPosts.length);
        }

        container.innerHTML = '';

        if (filteredPosts.length === 0) {
            container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">No blog articles match the selected filters.</p>';
            updateStatus();
            return;
        }

        for (let i = 0; i < loadedCount; i++) {
            if (i > 0 && i % pageSize === 0) {
                const pageNum = Math.floor(i / pageSize) + 1;
                const abovePage = pageNum - 1;
                const belowPage = pageNum;
                const sep = document.createElement('div');
                sep.className = 'blog-separator';
                sep.innerHTML = `
                    <span class="separator-label separator-above">Page ${abovePage} ▲</span>
                    <span class="separator-line"></span>
                    <span class="separator-label separator-below">Page ${belowPage} ▼</span>
                `;
                container.appendChild(sep);
            }
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.innerHTML = createCardHTML(filteredPosts[i]);
            container.appendChild(card);
        }

        if (loadedCount < filteredPosts.length) {
            const currentPage = Math.ceil(loadedCount / pageSize);
            const nextPage = currentPage + 1;
            const sep = document.createElement('div');
            sep.className = 'blog-separator';
            sep.innerHTML = `
                <span class="separator-label separator-above">Page ${currentPage} ▲</span>
                <span class="separator-line"></span>
                <span class="separator-label separator-below">Page ${nextPage} ▼</span>
            `;
            container.appendChild(sep);
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'text-align: center; margin: var(--space-md) 0;';
            const seeMoreBtn = document.createElement('button');
            seeMoreBtn.className = 'see-more-btn';
            seeMoreBtn.innerHTML = 'See more <i class="fa-solid fa-arrow-down"></i>';
            seeMoreBtn.addEventListener('click', function() {
                loadedCount = Math.min(loadedCount + pageSize, filteredPosts.length);
                render();
            });
            wrapper.appendChild(seeMoreBtn);
            container.appendChild(wrapper);
        }

        updateStatus();
        updateButtons();
        updateBadge();
    }

    // ----- UI Updates -----
    function updateStatus() {
        if (!statusEl) return;
        const total = filteredPosts.length;
        const shown = Math.min(loadedCount, total);
        const totalPages = Math.ceil(total / pageSize);
        const loadedPages = Math.ceil(shown / pageSize);

        if (singleId) {
            statusEl.innerHTML = 'Showing <span class="status-highlight">1</span> of <span class="status-highlight">1</span> blog article';
            if (infoEl) infoEl.style.display = 'none';
            return;
        }

        const articleWord = total === 1 ? 'blog article' : 'blog articles';
        const pageWord = totalPages === 1 ? 'page' : 'pages';
        let text = 'Showing <span class="status-highlight">' + shown + '</span> of <span class="status-highlight">' + total + '</span> ' + articleWord;
        if (totalPages > 0) {
            text += ' (<span class="status-highlight">' + loadedPages + '</span>/<span class="status-highlight">' + totalPages + '</span> ' + pageWord + ')';
        }
        statusEl.innerHTML = text;

        if (isFiltered && shown < allPosts.length) {
            if (infoEl) {
                infoEl.style.display = 'inline';
                infoEl.title = 'This list is currently filtered. Click Reset to remove all filters and see the full list.';
            }
        } else {
            if (infoEl) infoEl.style.display = 'none';
        }
    }

    function updateButtons() {
        if (!filterBtn || !sortBtn || !resetBtn) return;
        filterBtn.classList.toggle('active', isFiltered);
        sortBtn.classList.toggle('active', sortOrder !== 'newest');
        resetBtn.classList.toggle('reset-active', isFiltered || sortOrder !== 'newest');
    }

    function updateBadge() {
        if (!badgeEl) return;
        const count = countSelectedValues();
        if (count > 0) {
            badgeEl.textContent = count;
            badgeEl.classList.add('show');
        } else {
            badgeEl.classList.remove('show');
        }
    }

    // ----- Build Filter Dropdown (Category only) -----
    function buildFilterDropdown() {
        if (!filterDropdown) return;

        // Get unique categories from all posts
        const categorySet = new Set();
        allPosts.forEach(function(post) {
            if (post.categories && post.categories.length > 0) {
                post.categories.forEach(function(cat) {
                    categorySet.add(cat);
                });
            }
        });
        const categories = Array.from(categorySet).sort();

        if (Object.keys(filters.category).length === 0) {
            categories.forEach(function(c) { filters.category[c] = false; });
        }

        let html = '';
        html += '<div class="filter-dropdown-header">';
        html += '<span style="font-weight: 600; font-size: 0.9rem; color: var(--dark-color);">Filter by Category</span>';
        html += '<button class="close-dropdown" id="filter-close-btn" aria-label="Close filter menu"><i class="fa-solid fa-xmark"></i></button>';
        html += '</div>';

        // Category section (scrollable)
        html += '<div class="filter-dropdown-section">';
        html += '<div class="filter-dropdown-scroll">';
        categories.forEach(function(cat) {
            const checked = filters.category[cat] ? 'checked' : '';
            html += '<div class="filter-dropdown-item">';
            html += '<input type="checkbox" data-section="category" value="' + window.escapeHTML(cat) + '" ' + checked + '>';
            html += '<label>' + window.escapeHTML(cat) + '</label>';
            html += '</div>';
        });
        html += '</div></div>';

        // Actions
        html += '<div class="filter-dropdown-actions">';
        html += '<button class="filter-clear" id="filter-clear-all">Clear All</button>';
        html += '<button class="filter-apply" id="filter-apply">Apply</button>';
        html += '</div>';

        filterDropdown.innerHTML = html;

        // Events
        filterDropdown.querySelector('#filter-close-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            closeFilterDropdown();
        });

        filterDropdown.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
            cb.addEventListener('change', function() {
                const section = this.dataset.section;
                const value = this.value;
                filters[section][value] = this.checked;
            });
        });

        filterDropdown.querySelector('#filter-clear-all').addEventListener('click', function() {
            const checkboxes = filterDropdown.querySelectorAll('input[data-section="category"]');
            checkboxes.forEach(function(cb) {
                cb.checked = false;
                filters.category[cb.value] = false;
            });
        });

        filterDropdown.querySelector('#filter-apply').addEventListener('click', function() {
            applyFiltersAndSort();
            loadedCount = Math.min(pageSize, filteredPosts.length);
            render();
            closeFilterDropdown();
        });
    }

    function buildSortDropdown() {
        if (!sortDropdown) return;
        sortDropdown.innerHTML = '';
        const options = [
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' }
        ];
        options.forEach(function(opt) {
            const div = document.createElement('div');
            div.className = 'sort-dropdown-item';
            if (sortOrder === opt.value) {
                div.classList.add('active');
            }
            div.innerHTML = opt.label + '<span class="check-mark"><i class="fa-solid fa-check"></i></span>';
            div.addEventListener('click', function() {
                sortOrder = opt.value;
                applyFiltersAndSort();
                loadedCount = Math.min(pageSize, filteredPosts.length);
                render();
                closeSortDropdown();
            });
            sortDropdown.appendChild(div);
        });
    }

    // ----- Open/Close functions -----
    function openFilterDropdown() {
        if (filterDropdown.classList.contains('open')) return;
        closeSortDropdown();

        const rect = filterBtn.getBoundingClientRect();

        filterDropdown.style.position = 'fixed';
        filterDropdown.style.top = (rect.bottom + 8) + 'px';
        filterDropdown.style.right = (window.innerWidth - rect.right) + 'px';
        filterDropdown.style.left = 'auto';
        filterDropdown.style.bottom = 'auto';

        filterDropdown.classList.add('open');

        if (!filterOverlay) {
            filterOverlay = document.createElement('div');
            filterOverlay.className = 'filter-overlay';
            filterOverlay.addEventListener('click', function(e) {
                if (e.target === filterOverlay) {
                    closeFilterDropdown();
                }
            });
            document.body.appendChild(filterOverlay);
        }
        filterOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        buildFilterDropdown();
    }

    function closeFilterDropdown() {
        filterDropdown.classList.remove('open');
        if (filterOverlay) {
            filterOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    function closeSortDropdown() {
        sortDropdown.classList.remove('open');
    }

    // ----- Setup controls -----
    function setupControls() {
        controlsBar = document.getElementById('blog-controls');
        statusEl = document.getElementById('controls-status');
        infoEl = document.getElementById('status-info-icon');
        filterBtn = document.getElementById('filter-btn');
        sortBtn = document.getElementById('sort-btn');
        resetBtn = document.getElementById('reset-btn');
        filterDropdown = document.getElementById('filter-dropdown-container');
        sortDropdown = document.getElementById('sort-dropdown');
        badgeEl = document.getElementById('filter-badge');
        bannerEl = document.getElementById('blog-banner');

        if (!controlsBar) return;

        // Filter button
        filterBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (filterDropdown.classList.contains('open')) {
                closeFilterDropdown();
            } else {
                openFilterDropdown();
            }
        });

        // Sort button
        sortBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sortDropdown.classList.contains('open')) {
                closeSortDropdown();
            } else {
                closeFilterDropdown();
                sortDropdown.classList.add('open');
                buildSortDropdown();
            }
        });

        // Reset button
        resetBtn.addEventListener('click', function() {
            Object.keys(filters.category).forEach(function(key) {
                filters.category[key] = false;
            });
            sortOrder = 'newest';
            isFiltered = false;
            applyFiltersAndSort();
            loadedCount = Math.min(pageSize, filteredPosts.length);
            render();
            closeFilterDropdown();
            closeSortDropdown();
        });

        // Info icon
        if (infoEl) {
            infoEl.addEventListener('click', function() {
                alert('This list is currently filtered. Click Reset to remove all filters and see the full list.');
            });
        }

        // Banner
        const bannerBtn = document.getElementById('banner-reset-btn');
        if (bannerBtn) {
            bannerBtn.addEventListener('click', function() {
                window.location.href = '/my-website/blog.html';
            });
        }

        // Click outside to close sort dropdown
        document.addEventListener('click', function(e) {
            const target = e.target;
            const isSortClick = sortDropdown.contains(target) || sortBtn.contains(target);
            if (!isSortClick && sortDropdown.classList.contains('open')) {
                closeSortDropdown();
            }
        });
    }

    // ----- Load data -----
 
    async function loadPosts() {
        container = document.getElementById('blog-list');
        try {
            const response = await fetch('/my-website/json/blog.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            allPosts = await response.json();

            if (!allPosts || allPosts.length === 0) {
                container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">No blog articles found.</p>';
                return;
            }

            singleId = getUrlParam('id');


                 // ===== new feature: READ URL PARAMETER FOR CATEGORY FILTER =====
                             const categoryParam = getUrlParam('category');
                             if (categoryParam) {
                                 const decodedCategory = decodeURIComponent(categoryParam);
                                 // We'll store it temporarily; the category filter will be applied after building the options
                                 window._pendingCategoryFilter = decodedCategory;
                             }
             // ===== end of new feature: READ URL PARAMETER FOR CATEGORY FILTER =====
  
         

            // Build category filter options
            const categorySet = new Set();
            allPosts.forEach(function(post) {
                if (post.categories && post.categories.length > 0) {
                    post.categories.forEach(function(cat) {
                        categorySet.add(cat);
                    });
                }
            });
        
        const categories = Array.from(categorySet).sort();
        categories.forEach(function(c) { if (!filters.category[c]) filters.category[c] = false; });

        // Apply category filter from URL if present
        if (window._pendingCategoryFilter && filters.category[window._pendingCategoryFilter] !== undefined) {
            filters.category[window._pendingCategoryFilter] = true;
            window._pendingCategoryFilter = null; // Clean up
        }

            setupControls();

            applyFiltersAndSort();
            loadedCount = Math.min(pageSize, filteredPosts.length);
            render();

        } catch (error) {
            container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">Unable to load blog articles at this time. Please try again later.</p>';
            console.error('Error loading blog articles:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', loadPosts);
     // ============================================
    // SHARE BUTTON (Copy Link to Clipboard)
    // ============================================
    document.querySelectorAll('.blog-share-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.dataset.url;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function() {
                    showToast('Link copied to clipboard!');
                }).catch(function() {
                    fallbackCopy(url);
                });
            } else {
                fallbackCopy(url);
            }
        });
    });

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

    function showToast(message) {
        // Use existing toast or create a simple one
        let toast = document.getElementById('blog-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'blog-toast';
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:30px;font-size:0.9rem;z-index:9999;opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function() {
            toast.style.opacity = '0';
        }, 2500);
    }
 
})();
