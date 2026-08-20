/**
 * ============================================
 * PUBLICATIONS.JS – Load, Render, Filter, Sort
 This is for the list of publications (publications.html)
 * ============================================
 */

(function() {
    'use strict';

    let allPublications = [];
    let filteredPublications = [];
    let loadedCount = 0;
    const pageSize = 10;

    let filters = {
        year: {},
        authorship: {},
        journal: {}
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
        
        return html;
    }

    function allSelectedInCategory(category) {
        const keys = Object.keys(filters[category]);
        if (keys.length === 0) return false;
        return keys.every(function(key) { return filters[category][key] === true; });
    }

    function countSelectedValues() {
        let count = 0;
        ['year', 'authorship', 'journal'].forEach(function(category) {
            Object.values(filters[category]).forEach(function(value) {
                if (value === true) count++;
            });
        });
        return count;
    }

    function applyFiltersAndSort() {
        if (singleId) {
            const singlePub = allPublications.find(function(p) { return p.id === singleId; });
            filteredPublications = singlePub ? [singlePub] : [];
            return;
        }
        let result = allPublications.slice();
        let filterCount = 0;

        const selectedYears = Object.keys(filters.year).filter(function(key) { return filters.year[key] === true; });
        if (selectedYears.length > 0 && !allSelectedInCategory('year')) {
            filterCount++;
            result = result.filter(function(p) { return selectedYears.includes(p.year); });
        }

        const selectedAuthorship = Object.keys(filters.authorship).filter(function(key) { return filters.authorship[key] === true; });
        if (selectedAuthorship.length > 0 && !allSelectedInCategory('authorship')) {
            filterCount++;
            result = result.filter(function(p) { return selectedAuthorship.includes(p.authorship); });
        }

        const selectedJournals = Object.keys(filters.journal).filter(function(key) { return filters.journal[key] === true; });
        if (selectedJournals.length > 0 && !allSelectedInCategory('journal')) {
            filterCount++;
            result = result.filter(function(p) { return selectedJournals.includes(p.journal); });
        }

        isFiltered = filterCount > 0;

        if (sortOrder === 'newest') {
            result.sort(function(a, b) { return (parseInt(b.year) || 0) - (parseInt(a.year) || 0); });
        } else {
            result.sort(function(a, b) { return (parseInt(a.year) || 0) - (parseInt(b.year) || 0); });
        }
        filteredPublications = result;
    }

    // ----- Render -----
    function render() {
        if (!container) container = document.getElementById('publications-list');
        if (singleId) {
            if (controlsBar) controlsBar.style.display = 'none';
            if (bannerEl) bannerEl.classList.add('show');
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

        if (controlsBar) controlsBar.style.display = 'flex';
        if (bannerEl) bannerEl.classList.remove('show');

        if (loadedCount === 0 || loadedCount > filteredPublications.length) {
            loadedCount = Math.min(pageSize, filteredPublications.length);
        }
        container.innerHTML = '';
        if (filteredPublications.length === 0) {
            container.innerHTML = '<p style="color: var(--dark-color); opacity: 0.6;">No publications match the selected filters.</p>';
            updateStatus();
            return;
        }

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

    // ----- UI Updates -----
    function updateStatus() {
        if (!statusEl) return;
        const total = filteredPublications.length;
        const shown = Math.min(loadedCount, total);
        const totalPages = Math.ceil(total / pageSize);
        const loadedPages = Math.ceil(shown / pageSize);

        if (singleId) {
            statusEl.innerHTML = 'Showing <span class="status-highlight">1</span> of <span class="status-highlight">1</span> publication';
            if (infoEl) infoEl.style.display = 'none';
            return;
        }
        const pubWord = total === 1 ? 'publication' : 'publications';
        const pageWord = totalPages === 1 ? 'page' : 'pages';
        let text = 'Showing <span class="status-highlight">' + shown + '</span> of <span class="status-highlight">' + total + '</span> ' + pubWord;
        if (totalPages > 0) {
            text += ' (<span class="status-highlight">' + loadedPages + '</span>/<span class="status-highlight">' + totalPages + '</span> ' + pageWord + ')';
        }
        statusEl.innerHTML = text;

        if (isFiltered && shown < allPublications.length) {
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

    // ----- Build dropdowns -----
    
    function buildFilterDropdown() {
    if (!filterDropdown) return;

    const years = [...new Set(allPublications.map(function(p) { return p.year; }).filter(Boolean))].sort();
    const authorshipValues = [...new Set(allPublications.map(function(p) { return p.authorship; }).filter(Boolean))];
    const journals = [...new Set(allPublications.map(function(p) { return p.journal; }).filter(Boolean))].sort();

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
    html += '<div class="filter-dropdown-header">';
    html += '<span style="font-weight: 600; font-size: 0.9rem; color: var(--dark-color);">Filter Publications</span>';
    html += '<button class="close-dropdown" id="filter-close-btn" aria-label="Close filter menu"><i class="fa-solid fa-xmark"></i></button>';
    html += '</div>';

    // Year
    html += '<div class="filter-dropdown-section">';
    html += '<div class="filter-dropdown-section-title">Year</div>';
    html += '<div class="filter-dropdown-scroll">';
    years.forEach(function(year) {
        const checked = filters.year[year] ? 'checked' : '';
        html += '<div class="filter-dropdown-item">';
        html += '<input type="checkbox" data-section="year" value="' + window.escapeHTML(year) + '" ' + checked + '>';
        html += '<label>' + window.escapeHTML(year) + '</label>';
        html += '</div>';
    });
    html += '</div></div>';

    // Authorship
    html += '<div class="filter-dropdown-section">';
    html += '<div class="filter-dropdown-section-title">Authorship</div>';
    html += '<div class="filter-dropdown-scroll">';
    authorshipValues.forEach(function(auth) {
        const checked = filters.authorship[auth] ? 'checked' : '';
        html += '<div class="filter-dropdown-item">';
        html += '<input type="checkbox" data-section="authorship" value="' + window.escapeHTML(auth) + '" ' + checked + '>';
        html += '<label>' + window.escapeHTML(auth) + '</label>';
        html += '</div>';
    });
    html += '</div></div>';

    // Journal
    html += '<div class="filter-dropdown-section">';
    html += '<div class="filter-dropdown-section-title">Journal</div>';
    html += '<div class="filter-dropdown-scroll">';
    journals.forEach(function(journal) {
        const checked = filters.journal[journal] ? 'checked' : '';
        html += '<div class="filter-dropdown-item">';
        html += '<input type="checkbox" data-section="journal" value="' + window.escapeHTML(journal) + '" ' + checked + '>';
        html += '<label>' + window.escapeHTML(journal) + '</label>';
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
        ['year', 'authorship', 'journal'].forEach(function(section) {
            const checkboxes = filterDropdown.querySelectorAll('input[data-section="' + section + '"]');
            checkboxes.forEach(function(cb) {
                cb.checked = false;
                filters[section][cb.value] = false;
            });
        });
    });

    filterDropdown.querySelector('#filter-apply').addEventListener('click', function() {
        applyFiltersAndSort();
        loadedCount = Math.min(pageSize, filteredPublications.length);
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
                loadedCount = Math.min(pageSize, filteredPublications.length);
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

    // Get the filter button position
    const rect = filterBtn.getBoundingClientRect();
    
    // Position the dropdown below the button
    filterDropdown.style.position = 'fixed';
    filterDropdown.style.top = (rect.bottom + 8) + 'px';
    filterDropdown.style.right = (window.innerWidth - rect.right) + 'px';
    filterDropdown.style.left = 'auto';
    filterDropdown.style.bottom = 'auto';
    
    filterDropdown.classList.add('open');
    
    // Create overlay if not exists
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
    controlsBar = document.getElementById('publications-controls');
    statusEl = document.getElementById('controls-status');
    infoEl = document.getElementById('status-info-icon');
    filterBtn = document.getElementById('filter-btn');
    sortBtn = document.getElementById('sort-btn');
    resetBtn = document.getElementById('reset-btn');
    // Get the dropdown from the container, not from inside controls bar
    filterDropdown = document.getElementById('filter-dropdown-container');
    sortDropdown = document.getElementById('sort-dropdown');
    badgeEl = document.getElementById('filter-badge');
    bannerEl = document.getElementById('publications-banner');

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
        ['year', 'authorship', 'journal'].forEach(function(section) {
            Object.keys(filters[section]).forEach(function(key) {
                filters[section][key] = false;
            });
        });
        sortOrder = 'newest';
        isFiltered = false;
        applyFiltersAndSort();
        loadedCount = Math.min(pageSize, filteredPublications.length);
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
            window.location.href = '/my-website/publications.html';
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

            singleId = getUrlParam('id');

            const years = [...new Set(allPublications.map(function(p) { return p.year; }).filter(Boolean))].sort();
            const authorshipValues = [...new Set(allPublications.map(function(p) { return p.authorship; }).filter(Boolean))];
            const journals = [...new Set(allPublications.map(function(p) { return p.journal; }).filter(Boolean))].sort();

            years.forEach(function(y) { if (!filters.year[y]) filters.year[y] = false; });
            authorshipValues.forEach(function(a) { if (!filters.authorship[a]) filters.authorship[a] = false; });
            journals.forEach(function(j) { if (!filters.journal[j]) filters.journal[j] = false; });

            setupControls();

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
