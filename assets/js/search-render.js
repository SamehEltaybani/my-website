/**
*SEARCH-RENDER.JS
* This handles rendering results, filtering, sorting, and recent searches (specific to the search results page only).
* It is different from search.js, which handles the modal, autocomplete, and dropdown suggestions (used on all pages).
**/


(function() {
        'use strict';

        let allItems = [];
        let currentFilter = 'all';
        let currentQuery = '';
        let loadedCount = 0;
        const pageSize = 10;

        // ============================================
        // TEXT NORMALIZATION & PHRASE EXTRACTION
        // (same as in search.js)
        // ============================================
        

// Stop words and protected words
        
        const STOP_WORDS = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'it', 'its', 'this', 'that', 'these', 'those'];
        const PROTECTED_ACRONYMS = ['ai', 'llm', 'llms', 'rn', 'icu', 'np', 'md', 'phd', 'covid', 'sars', 'ehr', 'emr'];

        function filterStopWords(words) {
            return words.filter(function(w) {
                const lower = w.toLowerCase();
                if (PROTECTED_ACRONYMS.includes(lower)) return true;
                return !STOP_WORDS.includes(lower);
            });
        }

        function stem(word) {
            let w = word.toLowerCase();
            if (w.length < 4) return w;
            if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
            else if (w.endsWith('es')) w = w.slice(0, -2);
            else if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
            else if (w.endsWith('ing')) w = w.slice(0, -3);
            else if (w.endsWith('ed')) w = w.slice(0, -2);
            return w;
        }

        function levenshteinDistance(a, b) {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            const matrix = [];
            for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
            for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b[i-1] === a[j-1]) { matrix[i][j] = matrix[i-1][j-1]; }
                    else { matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1); }
                }
            }
            return matrix[b.length][a.length];
        }

        
        function normalizeText(text) {
            if (!text) return '';
            return text
                .toLowerCase()
                .replace(/[.,!?;:()\[\]{}"'“”‘’\/\-_]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function extractPhrases(text, n) {
            const words = text.split(/\s+/);
            if (words.length < n) return [];
            const phrases = [];
            for (let i = 0; i <= words.length - n; i++) {
                phrases.push(words.slice(i, i + n).join(' '));
            }
            return phrases;
        }

        // ============================================
        // GET URL PARAM
        // ============================================
        
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        // ============================================
        // LOAD DATA
        // ============================================
        
        async function loadData() {
            try {
                const files = [
                    { url: '/my-website/json/publications.json', source: 'publication', label: 'Publication' },
                    { url: '/my-website/json/blog.json', source: 'blog', label: 'Blog' },
                    { url: '/my-website/json/pages.json', source: 'page', label: 'Page' }
                ];

                let allResults = [];

                for (const file of files) {
                    try {
                        const response = await fetch(file.url);
                        if (!response.ok) continue;
                        const data = await response.json();

                        data.forEach(function(item) {
                            const rawText = [
                                item.title || '',
                                item.shortTitle || '',
                                item.authorship || '',
                                item.journal || '',
                                item.year || '',
                                item.summary || '',
                                item.categories ? item.categories.join(' ') : '',
                                item.keywords ? item.keywords.join(' ') : ''
                            ].join(' ').toLowerCase();

                            const normalizedText = normalizeText(rawText);

                            let link = '#';
                            let id = item.id || '';

                            if (file.source === 'publication') {
                                link = '/my-website/publications.html?id=' + encodeURIComponent(id);
                            } else if (file.source === 'blog') {
                                link = '/my-website/blog.html?id=' + encodeURIComponent(id);
                            } else if (file.source === 'page') {
                                link = item.url || '#';
                            }

                            allResults.push({
                                id: id,
                                title: item.title || 'Untitled',
                                source: file.source,
                                sourceLabel: file.label,
                                link: link,
                                searchableText: rawText,
                                normalizedText: normalizedText,
                                raw: item
                            });
                        });
                    } catch (e) {
                        console.warn('Could not load', file.url, e);
                    }
                }

                allItems = allResults;
                return allItems;
            } catch (error) {
                console.error('Error loading search data:', error);
                return [];
            }
        }

        // ============================================
        // SEARCH ITEMS (with consecutive phrase matching)
        // ============================================
        
               function searchItems(query, filter) {
            if (!query || query.trim().length === 0) {
                return [];
            }

            const normalizedQuery = normalizeText(query);
            let queryWords = normalizedQuery.split(/\s+/).filter(function(w) { return w.length > 0; });
            
            let results = allItems;
            if (filter !== 'all') {
                results = results.filter(function(item) { return item.source === filter; });
            }

            // Apply Stop Words ONLY if > 1 word
            let activeQuery = normalizedQuery;
            if (queryWords.length > 1) {
                const filteredWords = filterStopWords(queryWords);
                if (filteredWords.length > 0) {
                    activeQuery = filteredWords.join(' ');
                    queryWords = filteredWords;
                }
            }

            const isPhrase = queryWords.length >= 3;

            if (!isPhrase) {
                // Short query: use simple word matching + Stemming
                const words = activeQuery.split(/\s+/).filter(function(w) { return w.length > 0; });
                const stemmedWords = words.map(stem);

                const scored = results.map(function(item) {
                    let score = 0;
                    const text = item.normalizedText;
                    const titleLower = (item.title || '').toLowerCase();
                    const stemmedText = text.split(/\s+/).map(stem).join(' ');

                    words.forEach(function(word, index) {
                        const sWord = stemmedWords[index];
                        if (text.includes(word) || stemmedText.includes(sWord)) score += 5;
                        if (titleLower.includes(word) || stem(titleLower).includes(sWord)) score += 10;
                    });

                    return { item: item, score: score };
                });

                const filtered = scored
                    .filter(function(s) { return s.score > 0; })
                    .sort(function(a, b) { return b.score - a.score; })
                    .map(function(s) { return s.item; });

                return filtered;
            }

            // Phrase query: EXACTLY AS BEFORE (Untouched for safety)
            const bigrams = extractPhrases(normalizedQuery, 2);
            const trigrams = extractPhrases(normalizedQuery, 3);

            const scored = results.map(function(item) {
                const itemText = item.normalizedText;
                let score = 0, matchedBigrams = 0, matchedTrigrams = 0;

                bigrams.forEach(function(phrase) {
                    if (itemText.includes(phrase)) { matchedBigrams++; score += 2; }
                });
                trigrams.forEach(function(phrase) {
                    if (itemText.includes(phrase)) { matchedTrigrams++; score += 5; }
                });
                if (itemText.includes(normalizedQuery)) { score += 10; }

                return { item: item, score: score, matchedBigrams: matchedBigrams, matchedTrigrams: matchedTrigrams };
            });

            return scored
                .filter(function(s) {
                    if (s.matchedTrigrams >= 1) return true;
                    if (s.matchedBigrams >= 2) return true;
                    return false;
                })
                .sort(function(a, b) { return b.score - a.score; })
                .map(function(s) { return s.item; });
        }

        // ============================================
        // HIGHLIGHT TEXT (simple)
        // ============================================
        
        function highlightText(text, query) {
            if (!text || !query) return text;
            const lowerText = text.toLowerCase();
            const lowerQuery = query.toLowerCase().trim();
            const index = lowerText.indexOf(lowerQuery);
            if (index === -1) return text;
            const before = text.substring(0, index);
            const match = text.substring(index, index + query.length);
            const after = text.substring(index + query.length);
            return before + '<span style="background: rgba(0, 173, 181, 0.15); font-weight: 600; padding: 0 2px; border-radius: 2px;">' + match + '</span>' + after;
        }

        // ============================================
        // RENDER RESULTS
        // ============================================

                function renderResults(results, query)         function renderResults(results, query) {
            const container = document.getElementById('search-results-list');
            const countEl = document.getElementById('results-count');

            let autocorrectMessage = '';

            // TYPO TOLERANCE (New)
            if (results.length === 0 && query.length > 2) {
                const qWords = query.toLowerCase().split(/\s+/);
                const allWords = new Set();
                allItems.forEach(item => {
                    item.normalizedText.split(/\s+/).forEach(w => { if (w.length >= 4) allWords.add(w); });
                });
                let bestMatch = null;
                let minDist = 3;
                qWords.forEach(qw => {
                    if (qw.length < 4) return;
                    allWords.forEach(w => {
                        const d = levenshteinDistance(qw, w);
                        if (d < minDist) { minDist = d; bestMatch = w; }
                    });
                });

                if (bestMatch) {
                    const correctedResults = searchItems(bestMatch, currentFilter);
                    if (correctedResults.length > 0) {
                        const originalQuery = query;
                        results = correctedResults; 
                        query = bestMatch;          
                        loadedCount = 0;            
                        autocorrectMessage = `No results found for "<strong>${window.escapeHTML(originalQuery)}</strong>". Showing results for "<a href="#" onclick="window.location.href='?q=${encodeURIComponent(bestMatch)}'; return false;">${window.escapeHTML(bestMatch)}</a>" instead.`;
                    }
                }
            }

            if (results.length === 0) {
                countEl.innerHTML = 'No results found for "<strong>' + window.escapeHTML(query) + '</strong>".';
            } else {
                countEl.innerHTML = results.length + ' result' + (results.length > 1 ? 's' : '') + ' for "<strong>' + window.escapeHTML(query) + '</strong>"';
            }

            container.innerHTML = '';

            if (autocorrectMessage) {
                const banner = document.createElement('div');
                banner.className = 'autocorrect-banner';
                banner.innerHTML = autocorrectMessage;
                container.appendChild(banner);
            }

            if (results.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: var(--space-xl) 0;">
                        <p style="font-size: 1.2rem; color: var(--dark-color); opacity: 0.6; margin-bottom: var(--space-sm);">
                            <i class="fa-regular fa-face-sad-tear" style="font-size: 2rem; display: block; margin-bottom: var(--space-md); color: var(--accent-color);"></i>
                            No results found for "<strong>${window.escapeHTML(query)}</strong>".
                        </p>
                        <p style="color: var(--dark-color); opacity: 0.4; font-size: 0.95rem;">
                            Try different keywords, check your spelling, or browse the site navigation above.
                        </p>
                    </div>
                `;
                return;
            }

            if (loadedCount === 0 || loadedCount > results.length) {
                loadedCount = Math.min(pageSize, results.length);
            }

            for (let i = 0; i < loadedCount; i++) {
                if (i > 0 && i % pageSize === 0) {
                    const pageNum = Math.floor(i / pageSize) + 1;
                    const abovePage = pageNum - 1;
                    const belowPage = pageNum;
                    const sep = document.createElement('div');
                    sep.className = 'search-separator';
                    sep.innerHTML = `
                        <span class="separator-label separator-above">Page ${abovePage} ▲</span>
                        <span class="separator-line"></span>
                        <span class="separator-label separator-below">Page ${belowPage} ▼</span>
                    `;
                    container.appendChild(sep);
                }

                const item = results[i];
                const card = document.createElement('a');
                card.className = 'search-result-card';
                card.href = item.link;

                const row = document.createElement('div');
                row.className = 'result-row';

                const title = document.createElement('span');
                title.className = 'result-title';
                title.innerHTML = highlightText(item.title, query);

                const source = document.createElement('span');
                source.className = 'result-source source-' + item.source;
                source.textContent = item.sourceLabel;

                row.appendChild(title);
                row.appendChild(source);
                card.appendChild(row);
                container.appendChild(card);
            }

            if (loadedCount < results.length) {
                const currentPage = Math.ceil(loadedCount / pageSize);
                const nextPage = currentPage + 1;
                const sep = document.createElement('div');
                sep.className = 'search-separator';
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
                    loadedCount = Math.min(loadedCount + pageSize, results.length);
                    renderResults(results, query);
                });
                wrapper.appendChild(seeMoreBtn);
                container.appendChild(wrapper);
            }
        }
       

        // ============================================
        // RECENT SEARCHES
        // ============================================
        
        function getRecentSearches() {
            try {
                const stored = localStorage.getItem('recentSearches');
                if (stored) return JSON.parse(stored);
            } catch (e) {}
            return [];
        }

        function saveRecentSearch(query) {
            if (!query || query.trim().length === 0) return;
            let recent = getRecentSearches();
            recent = recent.filter(function(item) {
                return item.toLowerCase() !== query.toLowerCase().trim();
            });
            recent.unshift(query.trim());
            recent = recent.slice(0, 5);
            try {
                localStorage.setItem('recentSearches', JSON.stringify(recent));
            } catch (e) {}
            renderRecentSearches();
        }

        function clearRecentSearches() {
            try {
                localStorage.removeItem('recentSearches');
            } catch (e) {}
            renderRecentSearches();
        }

        function renderRecentSearches() {
            const container = document.getElementById('recent-list');
            const recent = getRecentSearches();

            if (recent.length === 0) {
                container.innerHTML = '<span style="font-size: 0.85rem; color: var(--dark-color); opacity: 0.3;">No recent searches</span>';
                return;
            }

            container.innerHTML = '';
            recent.forEach(function(query) {
                const a = document.createElement('a');
                a.className = 'search-recent-item';
                a.href = '/my-website/search.html?q=' + encodeURIComponent(query);
                a.textContent = query;

                const clearBtn = document.createElement('button');
                clearBtn.className = 'clear-recent';
                clearBtn.setAttribute('aria-label', 'Remove from recent searches');
                clearBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                clearBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let recent = getRecentSearches();
                    recent = recent.filter(function(item) {
                        return item.toLowerCase() !== query.toLowerCase();
                    });
                    try {
                        localStorage.setItem('recentSearches', JSON.stringify(recent));
                    } catch (e) {}
                    renderRecentSearches();
                });

                a.appendChild(clearBtn);
                container.appendChild(a);
            });

            const clearAll = document.createElement('button');
            clearAll.className = 'search-recent-item';
            clearAll.style.cssText = 'background: transparent; opacity: 0.4; font-size: 0.75rem; cursor: pointer; border: none; font-family: inherit;';
            clearAll.textContent = 'Clear all';
            clearAll.addEventListener('click', function() {
                clearRecentSearches();
            });
            container.appendChild(clearAll);
        }

        
        // ============================================
        // FILTER BUTTONS
        // ============================================

        
          function setupFilters() {
            const buttons = document.querySelectorAll('.search-filter-btn');
            buttons.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    buttons.forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    loadedCount = 0;
                    const results = searchItems(currentQuery, currentFilter);
                    renderResults(results, currentQuery);
                });
            });
        }

        
        // ============================================
        // INIT
        // ============================================
        
        async function init() {
            setupFilters();

            const query = getQueryParam('q');
            if (!query) {
                document.getElementById('results-count').textContent = 'No search query provided.';
                document.getElementById('search-results-list').innerHTML = `
                    <div style="text-align: center; padding: var(--space-xl) 0;">
                        <p style="color: var(--dark-color); opacity: 0.5;">Please use the search box to search the site.</p>
                    </div>
                `;
                renderRecentSearches();
                return;
            }

            currentQuery = query;
            await loadData();
            loadedCount = 0;
            const results = searchItems(query, 'all');
            renderResults(results, query);
            saveRecentSearch(query);
            renderRecentSearches();
        }
        
        document.addEventListener('DOMContentLoaded', init);
    })();
