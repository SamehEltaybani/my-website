/**
 * ============================================
 * PUBLICATIONS.JS – Load, Render, Filter, Sort
 * ============================================
 * Handles:
 * - Loading publications from JSON
 * - Rendering with pagination ("See more")
 * - Filtering by year, authorship, journal
 * - Sorting by newest/oldest
 * - Single result view (from search)
 * - Status sentence updates
 */

(function() {
    'use strict';

    // ============================================
    // STATE
    // ============================================
    let allPublications = [];
    let filteredPublications = [];
    let loadedCount = 0;
    const pageSize = 10;

    // Filter state
    let filters = {
        year: {},
        authorship: {},
        journal: {}
    };
    let sortOrder = 'newest'; // 'newest' or 'oldest'
    let isFiltered = false;

    // Single result mode
    let singleId = null;

    // DOM refs (set after render)
    let container, controlsBar, statusEl, infoIcon, filterBtn, sortBtn, resetBtn;
    let filterDropdown, sortDropdown;
    let badgeEl;
    let bannerEl;

    // ============================================
    // HELPERS
    // ============================================
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function truncateSummary(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    function createCardHTML(pub) {
        let html = '';

        if (pub.title) {
            html += '<div class="publication-title">' + window.escapeHTML(pub.title) + '</div>';
        }

        let journalYear = '';
        if (pub.journal) {
            journalYear += window.escapeHTML(pub.journal);
        }
        if (pub.year) {
            if (journalYear) journalYear += ' ';
            journalYear += '(' + window.escapeHTML(pub.year) + ')';
        }
        if (journalYear) {
            html += '<div class="publication-journal">' + journalYear + '</div>';
        }

        if (pub.authorship) {
            let tagClass = 'authorship-tag';
            if (pub.authorship.toLowerCase().includes('first') || pub.authorship.toLowerCase().includes('corresponding')) {
                tagClass += ' authorship-first';
            } else if (pub.authorship.toLowerCase().includes('co-author')) {
                tagClass += ' authorship-co';
            } else {
                tagClass += ' authorship-other';
            }
            html += '<span class="' + tagClass + '">' + window.escapeHTML(pub.authorship) + '</span>';
        }

        let linksHtml = '<div class="publication-links">';
        let hasLink = false;

        if (pub.pubmedLink) {
            linksHtml += '<a href="' + window.escapeHTML(pub.pubmedLink) + '" target="_blank" rel="noopener noreferrer" class="publication-link pubmed-link"><i class="fa-solid fa-book"></i> PubMed</a>';
            hasLink = true;
        }
        if (pub.journalLink) {
            linksHtml += '<a href="' + window.escapeHTML(pub.journalLink) + '" target="_blank" rel="noopener noreferrer" class="publication-link journal-link"><i class="fa-solid fa-file-lines"></i> Journal</a>';
            hasLink = true;
        }
        if (pub.blogLink) {
            linksHtml += '<a href="' + window.escapeHTML(pub.blogLink) + '" class="publication-link blog-link"><i class="fa-solid fa-pen-to-square"></i> Blog</a>';
            hasLink = true;
        }
        linksHtml += '</div>';

        if (hasLink) {
            html += linksHtml;
        }

        if (pub.summary) {
            const truncated = truncateSummary(pub.summary, 200);
            html += '<div class="publication-summary">' + window.escapeHTML(truncated) + '</div>';
        }

        return html;
    }

    // ============================================
    // FILTER & SORT LOGIC
    // ============================================
    function applyFiltersAndSort() {
        if (singleId) {
            // Single result mode
            const singlePub = allPublications.find(function(p) {
                return p.id === singleId;
            });
            filteredPublications = singlePub ? [singlePub] : [];
            return;
        }

        let result = allPublications.slice();

        // --- Apply Filters ---
        const activeFilters = {};
        let filterCount = 0;

        // Year filter
        const selectedYears = Object.keys(filters.year).filter(function(key) {
            return filters.year[key] === true;
        });
        if (selectedYears.length > 0) {
            activeFilters.year = selectedYears;
            filterCount++;
            result = result.filter(function(p) {
                return selectedYears.includes(p.year);
            });
        }

        // Authorship filter
        const selectedAuthorship = Object.keys(filters.authorship).filter(function(key) {
            return filters.authorship[key] === true;
        });
        if (selectedAuthorship.length > 0) {
            activeFilters.authorship = selectedAuthorship;
            filterCount++;
            result = result.filter(function(p) {
                return selectedAuthorship.includes(p.authorship);
            });
        }

        // Journal filter
        const selectedJournals = Object.keys(filters.journal).filter(function(key) {
            return filters.journal[key] === true;
        });
        if (selectedJournals.length > 0) {
            activeFilters.journal = selectedJournals;
            filterCount++;
            result = result.filter(function(p) {
                return selectedJournals.includes(p.journal);
            });
        }

        isFiltered = filterCount > 0;

        // --- Apply Sort ---
        if (sortOrder === 'newest') {
            result.sort(function(a, b) {
                return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
            });
        } else {
            result.sort(function(a, b) {
                return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
            });
        }

        filteredPublications = result;
    }

    // ============================================
    // RENDER PUBLICATIONS
    // ============================================
    function render() {
        if (!container) {
            container = document.getElementById('publications-list');
        }

        if (singleId) {
            // Hide controls, show banner
            if (controlsBar) controlsBar.style.display = 'none';
            if (bannerEl) bannerEl.classList.add('show');
            // Render single card
            container.innerHTML = '';
            if (filteredPublications.length > 0) {
                const card = document.createElement('div');
                card.className = 'publication-card';
                card.innerHTML = createCardHTML(filteredPublications[0]);
                container.appendChild(card);
            } else {
                container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">Publication not found.</p>';
            }
            updateStatus();
            return;
        }

        // Normal mode: show controls
        if (controlsBar) controlsBar.style.display = 'flex';
        if (bannerEl) bannerEl.classList.remove('show');

        // Reset loaded count if filtered list changed
        if (loadedCount === 0 || loadedCount > filteredPublications.length) {
            loadedCount = Math.min(pageSize, filteredPublications.length);
        }

        container.innerHTML = '';

        if (filteredPublications.length === 0) {
            container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">No publications match the selected filters.</p>';
            updateStatus();
            return;
        }

        // Render loaded items
        for (let i = 0; i < loadedCount; i++) {
            if (i > 0 && i % pageSize === 0) {
                const pageNum = Math.floor(i / pageSize) + 1;
                const abovePage = pageNum - 1;
                const belowPage = pageNum;
                const sep = document.createElement('div');
                sep.className = 'publication-separator';
                sep.innerHTML = `
                    <span class="separator-label separator-above">Page ${abovePage} ▲</span>
                    <span class="separator-line"></span>
                    <span class="separator-label separator-below">Page ${belowPage} ▼</span>
                `;
                container.appendChild(sep);
            }

            const card = document.createElement('div');
            card.className = 'publication-card';
            card.innerHTML = createCardHTML(filteredPublications[i]);
            container.appendChild(card);
        }

        // Add bottom separator + "See More"
        if (loadedCount < filteredPublications.length) {
            const currentPage = Math.floor(loadedCount / pageSize) + 1;
            const nextPage = currentPage + 1;

            const sep = document.createElement('div');
            sep.className = 'publication-separator';
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
                loadedCount = Math.min(loadedCount + pageSize, filteredPublications.length);
                render();
            });
            
            wrapper.appendChild(seeMoreBtn);
            container.appendChild(wrapper);
        }

        updateStatus();
        updateButtons();
        updateBadge();
    }

    // ============================================
    // UPDATE STATUS SENTENCE
    // ============================================
    function updateStatus() {
        if (!statusEl) return;

        const total = filteredPublications.length;
        const shown = Math.min(loadedCount, total);
        const totalPages = Math.ceil(total / pageSize);
        const loadedPages = Math.ceil(shown / pageSize);

        let text = '';
        if (singleId) {
            text = 'Showing <span class="status-highlight">1</span> of <span class="status-highlight">1</span> publication';
            if (infoEl) infoEl.style.display = 'none';
        } else {
            const pubWord = total === 1 ? 'publication' : 'publications';
            const pageWord = totalPages === 1 ? 'page' : 'pages';
            text = 'Showing <span class="status-highlight">' + shown + '</span> of <span class="status-highlight">' + total + '</span> ' + pubWord;
            if (totalPages > 0) {
                text += ' (<span class="status-highlight">' + loadedPages + '</span>/<span class="status-highlight">' + totalPages + '</span> ' + pageWord + ')';
            }

            // Show info icon if filters are active
            if (isFiltered && shown < allPublications.length) {
                if (infoEl) {
                    infoEl.style.display = 'inline';
                    infoEl.title = 'This list is currently filtered. Click Reset to remove all filters and see the full list.';
                }
            } else {
                if (infoEl) infoEl.style.display = 'none';
            }
        }

        statusEl.innerHTML = text;
    }

    // ============================================
    // UPDATE BUTTON STATES
    // ============================================
    function updateButtons() {
        if (!filterBtn || !sortBtn || !resetBtn) return;

        // Filter button: active if any filter is applied
        const filterActive = isFiltered;
        filterBtn.classList.toggle('active', filterActive);

        // Sort button: active if not default (newest)
        const sortActive = sortOrder !== 'newest';
        sortBtn.classList.toggle('active', sortActive);

        // Reset button: active if filter OR sort is active
        const resetActive = filterActive || sortActive;
        resetBtn.classList.toggle('reset-active', resetActive);
    }

    // ============================================
    // UPDATE BADGE ON FILTER BUTTON
    // ============================================
    function updateBadge() {
        if (!badgeEl) return;
        let count = 0;
        if (filters.year && Object.values(filters.year).filter(Boolean).length > 0) count++;
        if (filters.authorship && Object.values(filters.authorship).filter(Boolean).length > 0) count++;
        if (filters.journal && Object.values(filters.journal).filter(Boolean).length > 0) count++;
        if (count > 0) {
            badgeEl.textContent = count;
            badgeEl.classList.add('show');
        } else {
            badgeEl.classList.remove('show');
        }
    }

    // ============================================
    // BUILD FILTER DROPDOWN
    // ============================================
    function buildFilterDropdown() {
        if (!filterDropdown) return;

        // Get unique values from data
        const years = [...new Set(allPublications.map(function(p) { return p.year; }).filter(Boolean))].sort();
        const authorshipValues = [...new Set(allPublications.map(function(p) { return p.authorship; }).filter(Boolean))];
        const journals = [...new Set(allPublications.map(function(p) { return p.journal; }).filter(Boolean))].sort();

        // Initialize filter state if empty
        if (Object.keys(filters.year).length === 0) {
            years.forEach(function(y) { filters.year[y] = false; });
        }
        if (Object.keys(filters.authorship).length === 0) {
            authorshipValues.forEach(function(a) { filters.authorship[a] = false; });
        }
        if (Object.keys(filters.journal).length === 0) {
            journals.forEach(function(j) { filters.journal[j] = false; });
        }

        let html = '';

        // --- Year Section ---
        html += '<div class="filter-dropdown-section">';
        html += '<div class="filter-dropdown-section-title">Year <span class="select-all-link" data-section="year">Select All</span></div>';
        years.forEach(function(year) {
            const checked = filters.year[year] ? 'checked' : '';
            html += '<div class="filter-dropdown-item">';
            html += '<input type="checkbox" data-section="year" value="' + window.escapeHTML(year) + '" ' + checked + '>';
            html += '<label>' + window.escapeHTML(year) + '</label>';
            html += '</div>';
        });
        html += '</div>';

        // --- Authorship Section ---
        html += '<div class="filter-dropdown-section">';
        html += '<div class="filter-dropdown-section-title">Authorship <span class="select-all-link" data-section="authorship">Select All</span></div>';
        authorshipValues.forEach(function(auth) {
            const checked = filters.authorship[auth] ? 'checked' : '';
            html += '<div class="filter-dropdown-item">';
            html += '<input type="checkbox" data-section="authorship" value="' + window.escapeHTML(auth) + '" ' + checked + '>';
            html += '<label>' + window.escapeHTML(auth) + '</label>';
            html += '</div>';
        });
        html += '</div>';

        // --- Journal Section ---
        html += '<div class="filter-dropdown-section">';
        html += '<div class="filter-dropdown-section-title">Journal <span class="select-all-link" data-section="journal">Select All</span></div>';
        journals.forEach(function(journal) {
            const checked = filters.journal[journal] ? 'checked' : '';
            html += '<div class="filter-dropdown-item">';
            html += '<input type="checkbox" data-section="journal" value="' + window.escapeHTML(journal) + '" ' + checked + '>';
            html += '<label>' + window.escapeHTML(journal) + '</label>';
            html += '</div>';
        });
        html += '</div>';

        // --- Actions ---
        html += '<div class="filter-dropdown-actions">';
        html += '<button class="filter-clear" id="filter-clear-all">Clear All</button>';
        html += '<button class="filter-apply" id="filter-apply">Apply</button>';
        html += '</div>';

        filterDropdown.innerHTML = html;

        // --- Event Listeners ---
        // Select All links
        filterDropdown.querySelectorAll('.select-all-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.stopPropagation();
                const section = this.dataset.section;
                const checkboxes = filterDropdown.querySelectorAll('input[data-section="' + section + '"]');
                const allChecked = Array.from(checkboxes).every(function(cb) { return cb.checked; });
                checkboxes.forEach(function(cb) {
                    cb.checked = !allChecked;
                });
            });
        });

        // Checkbox changes (update state immediately, but don't apply yet)
        filterDropdown.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
            cb.addEventListener('change', function() {
                const section = this.dataset.section;
                const value = this.value;
                filters[section][value] = this.checked;
            });
        });

        // Clear All
        filterDropdown.querySelector('#filter-clear-all').addEventListener('click', function() {
            ['year', 'authorship', 'journal'].forEach(function(section) {
                const checkboxes = filterDropdown.querySelectorAll('input[data-section="' + section + '"]');
                checkboxes.forEach(function(cb) {
                    cb.checked = false;
                    filters[section][cb.value] = false;
                });
            });
        });

        // Apply
        filterDropdown.querySelector('#filter-apply').addEventListener('click', function() {
            applyFiltersAndSort();
            loadedCount = Math.min(pageSize, filteredPublications.length);
            render();
            filterDropdown.classList.remove('open');
            filterBtn.classList.remove('active');
        });
    }

    // ============================================
    // BUILD SORT DROPDOWN
    // ============================================
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
                loadedCount = Math.min(pageSize, filteredPublications.length);
                render();
                sortDropdown.classList.remove('open');
                sortBtn.classList.remove('active');
            });
            sortDropdown.appendChild(div);
        });
    }

    // ============================================
    // SETUP CONTROLS
    // ============================================
    function setupControls() {
        controlsBar = document.getElementById('publications-controls');
        statusEl = document.getElementById('controls-status');
        infoEl = document.getElementById('status-info-icon');
        filterBtn = document.getElementById('filter-btn');
        sortBtn = document.getElementById('sort-btn');
        resetBtn = document.getElementById('reset-btn');
        filterDropdown = document.getElementById('filter-dropdown');
        sortDropdown = document.getElementById('sort-dropdown');
        badgeEl = document.getElementById('filter-badge');
        bannerEl = document.getElementById('publications-banner');

        if (!controlsBar) return;

        // Filter button toggle
        filterBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = filterDropdown.classList.contains('open');
            filterDropdown.classList.toggle('open');
            sortDropdown.classList.remove('open');
            if (!isOpen) {
                buildFilterDropdown();
            }
        });

        // Sort button toggle
        sortBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = sortDropdown.classList.contains('open');
            sortDropdown.classList.toggle('open');
            filterDropdown.classList.remove('open');
            if (!isOpen) {
                buildSortDropdown();
            }
        });

        // Reset button
        resetBtn.addEventListener('click', function() {
            // Reset filters
            ['year', 'authorship', 'journal'].forEach(function(section) {
                Object.keys(filters[section]).forEach(function(key) {
                    filters[section][key] = false;
                });
            });
            // Reset sort
            sortOrder = 'newest';
            isFiltered = false;
            applyFiltersAndSort();
            loadedCount = Math.min(pageSize, filteredPublications.length);
            render();
            filterDropdown.classList.remove('open');
            sortDropdown.classList.remove('open');
        });

        // Click outside to close dropdowns
        document.addEventListener('click', function() {
            filterDropdown.classList.remove('open');
            sortDropdown.classList.remove('open');
        });

        // Info icon click
        if (infoEl) {
            infoEl.addEventListener('click', function() {
                alert('This list is currently filtered. Click Reset to remove all filters and see the full list.');
            });
        }

        // Banner: View all button
        const bannerBtn = document.getElementById('banner-reset-btn');
        if (bannerBtn) {
            bannerBtn.addEventListener('click', function() {
                window.location.href = '/my-website/publications.html';
            });
        }
    }

    // ============================================
    // LOAD DATA & INIT
    // ============================================
    async function loadPublications() {
        container = document.getElementById('publications-list');

        try {
            const response = await fetch('/my-website/json/publications.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            allPublications = await response.json();

            if (!allPublications || allPublications.length === 0) {
                container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">No publications found.</p>';
                return;
            }

            // Check for single ID
            singleId = getUrlParam('id');

            // Build filter options from data (if not already built)
            const years = [...new Set(allPublications.map(function(p) { return p.year; }).filter(Boolean))].sort();
            const authorshipValues = [...new Set(allPublications.map(function(p) { return p.authorship; }).filter(Boolean))];
            const journals = [...new Set(allPublications.map(function(p) { return p.journal; }).filter(Boolean))].sort();

            years.forEach(function(y) { if (!filters.year[y]) filters.year[y] = false; });
            authorshipValues.forEach(function(a) { if (!filters.authorship[a]) filters.authorship[a] = false; });
            journals.forEach(function(j) { if (!filters.journal[j]) filters.journal[j] = false; });

            // Setup controls (must be done before rendering)
            setupControls();

            // Apply initial filters/sort
            applyFiltersAndSort();
            loadedCount = Math.min(pageSize, filteredPublications.length);
            render();

        } catch (error) {
            container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">Unable to load publications at this time. Please try again later.</p>';
            console.error('Error loading publications:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', loadPublications);

})();
