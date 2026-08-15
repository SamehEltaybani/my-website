/**
 * ============================================
 * SEARCH.JS – Central Search (Phrase + Consecutive Word Matching)
 * ============================================
 * Features:
 * - Normalizes text (removes punctuation, normalizes hyphens)
 * - Extracts consecutive 2-word and 3-word phrases from queries
 * - Matches items by phrase overlap (order matters)
 * - Spelling suggestions as fallback
 * - Word suggestions for short queries
 */

(function() {
    'use strict';

    const CONFIG = {
        searchPlaceholder: 'Search the site ...',
        debounceDelay: 250,
        jsonFiles: [
            { url: '/my-website/json/publications.json', source: 'publication' },
            { url: '/my-website/json/blog.json', source: 'blog' },
            { url: '/my-website/json/pages.json', source: 'page' }
        ]
    };

    let allItems = [];
    let wordFrequency = {};
    let uniqueWords = [];
    let currentQuery = '';
    let selectedIndex = -1;
    let isModalOpen = false;
    let overlay, input, dropdown, closeBtn;

    // ============================================
    // TEXT NORMALIZATION
    // ============================================
    function normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            // Replace punctuation and special characters with space
            .replace(/[.,!?;:()\[\]{}"'“”‘’\/\-_]/g, ' ')
            // Collapse multiple spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ============================================
    // EXTRACT PHRASES (n-grams) of consecutive words
    // ============================================
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
    // LEVENSHTEIN DISTANCE (for spelling suggestions)
    // ============================================
    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i-1] === a[j-1]) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1,
                        matrix[i][j-1] + 1,
                        matrix[i-1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function getSpellingSuggestions(query, maxSuggestions = 3) {
        if (!query || query.trim().length < 3) return [];
        const lowerQuery = query.toLowerCase().trim();
        const wordList = Object.keys(wordFrequency);
        if (wordList.length === 0) return [];

        // For multi-word queries, check each word individually
        const words = lowerQuery.split(/\s+/);
        const allSuggestions = [];
        words.forEach(function(word) {
            if (word.length < 3) return;
            const scored = wordList.map(function(w) {
                return { word: w, distance: levenshteinDistance(word, w) };
            });
            const matches = scored
                .filter(function(s) { return s.distance <= 2 && s.distance > 0; })
                .sort(function(a, b) { return a.distance - b.distance; })
                .slice(0, 1)
                .map(function(s) { return s.word; });
            allSuggestions.push(matches[0]);
        });
        // Return unique suggestions, remove undefined
        return allSuggestions.filter(function(w) { return w !== undefined; }).slice(0, maxSuggestions);
    }

    // ============================================
    // BUILD WORD FREQUENCY INDEX
    // ============================================
    function buildWordFrequency() {
        const freq = {};
        allItems.forEach(function(item) {
            const text = item.normalizedText || normalizeText(item.searchableText);
            const words = text.split(/\s+/);
            const uniqueWordsInItem = new Set(words);
            uniqueWordsInItem.forEach(function(word) {
                if (word.length >= 2) {
                    freq[word] = (freq[word] || 0) + 1;
                }
            });
        });
        wordFrequency = freq;
        uniqueWords = Object.keys(freq).sort(function(a, b) {
            return freq[b] - freq[a];
        });
    }

    function getWordSuggestions(query) {
        if (!query || query.trim().length === 0) return [];
        const lowerQuery = query.toLowerCase().trim();
        const prefix = lowerQuery.split(/\s+/)[0];
        if (prefix.length < 2) return [];
        const suggestions = [];
        for (let i = 0; i < uniqueWords.length && suggestions.length < 20; i++) {
            const word = uniqueWords[i];
            if (word.startsWith(prefix)) {
                suggestions.push({ word: word, count: wordFrequency[word] });
            }
        }
        return suggestions;
    }

    // ============================================
    // BUILD SEARCH INDEX (with normalized text)
    // ============================================
    function buildSearchIndex(data, source) {
        const items = [];
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

            let label = '';
            let link = '';
            let id = item.id || '';

            if (source === 'publication') {
                label = 'Publication';
                link = '/my-website/publications.html?id=' + encodeURIComponent(id);
            } else if (source === 'blog') {
                label = 'Blog';
                link = '/my-website/blog.html?id=' + encodeURIComponent(id);
            } else if (source === 'page') {
                label = 'Page';
                link = item.url || '#';
            }

            items.push({
                id: id,
                title: item.title || 'Untitled',
                source: source,
                sourceLabel: label,
                link: link,
                searchableText: rawText,
                normalizedText: normalizedText,
                raw: item
            });
        });
        return items;
    }

    // ============================================
    // LOAD DATA
    // ============================================
    async function loadAllData() {
        try {
            const fetchPromises = CONFIG.jsonFiles.map(function(file) {
                return fetch(file.url)
                    .then(function(response) {
                        if (!response.ok) throw new Error('Failed to load ' + file.url);
                        return response.json();
                    })
                    .then(function(data) {
                        return buildSearchIndex(data, file.source);
                    })
                    .catch(function(error) {
                        console.warn('Could not load ' + file.url, error);
                        return [];
                    });
            });
            const results = await Promise.all(fetchPromises);
            allItems = results.flat();
            buildWordFrequency();
            return allItems;
        } catch (error) {
            console.error('Error loading search data:', error);
            allItems = [];
            return allItems;
        }
    }

    // ============================================
    // GET SUGGESTIONS (for dropdown)
    // ============================================
    function getSuggestions(query) {
        if (!query || query.trim().length === 0) return [];

        const normalizedQuery = normalizeText(query);
        const queryWords = normalizedQuery.split(/\s+/).filter(function(w) { return w.length > 0; });
        const isPhrase = queryWords.length >= 3;

        // If it's a short query (1-2 words), use word suggestions
        if (!isPhrase) {
            // Use original word suggestion logic
            const wordSuggestions = getWordSuggestions(query);
            return wordSuggestions.map(function(s) { return { type: 'word', word: s.word, count: s.count }; });
        }

        // For phrase queries: extract 2-grams and 3-grams
        const bigrams = extractPhrases(normalizedQuery, 2);
        const trigrams = extractPhrases(normalizedQuery, 3);

        // Score each item based on matching consecutive phrases
        const scored = allItems.map(function(item) {
            const itemText = item.normalizedText;
            let score = 0;
            let matchedBigrams = 0;
            let matchedTrigrams = 0;

            // Check bigrams
            bigrams.forEach(function(phrase) {
                if (itemText.includes(phrase)) {
                    matchedBigrams++;
                    score += 2;
                }
            });

            // Check trigrams (higher weight)
            trigrams.forEach(function(phrase) {
                if (itemText.includes(phrase)) {
                    matchedTrigrams++;
                    score += 5;
                }
            });

            // Also boost if the entire normalized query appears as a phrase
            if (itemText.includes(normalizedQuery)) {
                score += 10;
            }

            // Return item with score and match details
            return {
                item: item,
                score: score,
                matchedBigrams: matchedBigrams,
                matchedTrigrams: matchedTrigrams
            };
        });

        // Filter: For phrase queries, require at least 1 trigram match OR 2 bigram matches
        const minBigrams = 2;
        const minTrigrams = 1;

        const filtered = scored
            .filter(function(s) {
                if (s.matchedTrigrams >= minTrigrams) return true;
                if (s.matchedBigrams >= minBigrams) return true;
                return false;
            })
            .sort(function(a, b) { return b.score - a.score; })
            .map(function(s) { return s.item; });

        return filtered;
    }

    // ============================================
    // RENDER DROPDOWN
    // ============================================
    function renderDropdown() {
        if (!dropdown) return;
        dropdown.innerHTML = '';

        const query = input.value.trim();
        if (query.length === 0) {
            dropdown.classList.remove('active');
            return;
        }

        const suggestions = getSuggestions(query);

        if (suggestions.length === 0) {
            // No suggestions – try spelling suggestions
            const empty = document.createElement('div');
            empty.className = 'search-dropdown-empty';
            const spellingSuggestions = getSpellingSuggestions(query);
            if (spellingSuggestions.length > 0) {
                const prefix = document.createTextNode('No matches found. Did you mean: ');
                empty.appendChild(prefix);
                spellingSuggestions.forEach(function(word, index) {
                    const span = document.createElement('span');
                    span.textContent = word;
                    span.style.cssText = `
                        color: var(--dark-color, #222831);
                        font-weight: 600;
                        cursor: pointer;
                        padding: 0 2px;
                        border-radius: 2px;
                        transition: color 0.2s ease, background 0.2s ease;
                    `;
                    span.addEventListener('mouseenter', function() {
                        this.style.color = 'var(--accent-color, #00ADB5)';
                        this.style.background = 'rgba(0,173,181,0.08)';
                    });
                    span.addEventListener('mouseleave', function() {
                        this.style.color = 'var(--dark-color, #222831)';
                        this.style.background = 'transparent';
                    });
                    span.addEventListener('click', function(e) {
                        e.stopPropagation();
                        performSearch(word);
                    });
                    empty.appendChild(span);
                    if (index < spellingSuggestions.length - 1) {
                        const comma = document.createTextNode(', ');
                        empty.appendChild(comma);
                    }
                });
                const questionMark = document.createTextNode('?');
                empty.appendChild(questionMark);
            } else {
                // If it's a phrase query, maybe show the phrase itself if it matches any item?
                // Already handled by getSuggestions, but let's add a fallback.
                const phraseMatches = allItems.filter(function(item) {
                    return item.normalizedText.includes(normalizeText(query));
                });
                if (phraseMatches.length > 0) {
                    const div = document.createElement('div');
                    div.className = 'search-dropdown-item';
                    const textSpan = document.createElement('span');
                    textSpan.className = 'suggestion-text';
                    textSpan.textContent = '"' + query + '" (' + phraseMatches.length + ')';
                    div.appendChild(textSpan);
                    div.addEventListener('click', function() {
                        performSearch(query);
                    });
                    dropdown.appendChild(div);
                    dropdown.classList.add('active');
                    return;
                } else {
                    empty.textContent = 'No matches found. Try a different keyword.';
                }
            }
            dropdown.appendChild(empty);
            dropdown.classList.add('active');
            return;
        }

        // Show suggestions (max 20)
        const maxDisplay = 20;
        const displayItems = suggestions.slice(0, maxDisplay);

        displayItems.forEach(function(item, index) {
            const div = document.createElement('div');
            div.className = 'search-dropdown-item';
            if (index === selectedIndex) {
                div.classList.add('active');
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'suggestion-text';
            // Show title and source
            textSpan.textContent = item.title + ' (' + item.sourceLabel + ')';

            const sourceSpan = document.createElement('span');
            sourceSpan.className = 'suggestion-source source-' + item.source;
            sourceSpan.textContent = item.sourceLabel;

            div.appendChild(textSpan);
            div.appendChild(sourceSpan);

            div.addEventListener('click', function() {
                performSearch(query);
            });

            div.addEventListener('mouseenter', function() {
                selectedIndex = index;
                highlightSelected();
            });

            dropdown.appendChild(div);
        });

        dropdown.classList.add('active');
        selectedIndex = -1;
    }

    // ============================================
    // HIGHLIGHT
    // ============================================
    function highlightSelected() {
        if (!dropdown) return;
        const items = dropdown.querySelectorAll('.search-dropdown-item');
        items.forEach(function(el, idx) {
            if (idx === selectedIndex) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // ============================================
    // PERFORM SEARCH
    // ============================================
    function performSearch(query) {
        if (!query || query.trim().length === 0) return;
        const encoded = encodeURIComponent(query.trim());
        window.location.href = '/my-website/search.html?q=' + encoded;
    }

    // ============================================
    // INPUT HANDLING
    // ============================================
    let debounceTimer = null;

    function handleInput() {
        const query = input.value;
        currentQuery = query;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            renderDropdown();
        }, CONFIG.debounceDelay);
    }

    // ============================================
    // KEYBOARD NAVIGATION
    // ============================================
    function handleKeydown(e) {
        const dropdownItems = dropdown ? dropdown.querySelectorAll('.search-dropdown-item') : [];

        if (e.key === 'Escape') {
            closeModal();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < dropdownItems.length) {
                const item = dropdownItems[selectedIndex];
                const titleEl = item.querySelector('.suggestion-text');
                if (titleEl) {
                    // Extract the title from the text (before the source label)
                    const text = titleEl.textContent.trim();
                    const titleOnly = text.split(' (')[0];
                    performSearch(titleOnly);
                    return;
                }
            }
            performSearch(input.value);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (dropdownItems.length > 0) {
                selectedIndex = Math.min(selectedIndex + 1, dropdownItems.length - 1);
                highlightSelected();
                const active = dropdown.querySelector('.search-dropdown-item.active');
                if (active) {
                    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (dropdownItems.length > 0) {
                selectedIndex = Math.max(selectedIndex - 1, 0);
                highlightSelected();
                const active = dropdown.querySelector('.search-dropdown-item.active');
                if (active) {
                    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
            return;
        }
    }

    // ============================================
    // MODAL CONTROLS
    // ============================================
    function openModal() {
        if (isModalOpen) return;
        isModalOpen = true;

        if (!overlay) {
            buildModal();
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(function() {
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);

        if (allItems.length === 0) {
            loadAllData();
        }

        selectedIndex = -1;
        if (dropdown) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
        }
        if (input) {
            input.value = '';
            currentQuery = '';
        }

        document.addEventListener('keydown', handleKeydown);
    }

    function closeModal() {
        if (!isModalOpen) return;
        isModalOpen = false;

        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeydown);
    }

    // ============================================
    // BUILD MODAL DOM
    // ============================================
    function buildModal() {
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.id = 'search-modal';

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        });

        const container = document.createElement('div');
        container.className = 'search-box-container';

        const inputRow = document.createElement('div');
        inputRow.className = 'search-input-row';

        const magnifier = document.createElement('i');
        magnifier.className = 'fa-solid fa-magnifying-glass';

        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = CONFIG.searchPlaceholder;
        input.setAttribute('aria-label', 'Search the site');
        input.autocomplete = 'off';

        closeBtn = document.createElement('button');
        closeBtn.className = 'search-close-btn';
        closeBtn.setAttribute('aria-label', 'Close search');
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.addEventListener('click', closeModal);

        inputRow.appendChild(magnifier);
        inputRow.appendChild(input);
        inputRow.appendChild(closeBtn);

        dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';

        container.appendChild(inputRow);
        container.appendChild(dropdown);
        overlay.appendChild(container);

        document.body.appendChild(overlay);

        input.addEventListener('input', handleInput);

        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (isModalOpen) {
                    closeModal();
                } else {
                    openModal();
                }
            }
        });

        console.log('✅ Search modal built.');
    }

    // ============================================
    // INITIALIZE
    // ============================================
    function initSearch() {
        const checkInterval = setInterval(function() {
            const searchIconElement = document.querySelector('.navbar-icons a[aria-label*="Search"]') ||
                                     document.querySelector('.navbar-icons a i.fa-magnifying-glass')?.closest('a');

            if (searchIconElement) {
                clearInterval(checkInterval);
                searchIconElement.addEventListener('click', function(e) {
                    e.preventDefault();
                    openModal();
                });
                searchIconElement.style.cursor = 'pointer';
                console.log('✅ Search icon attached.');
            }
        }, 500);

        setTimeout(function() {
            if (allItems.length === 0) {
                loadAllData();
            }
        }, 1000);
    }

    window.search = {
        open: openModal,
        close: closeModal,
        loadData: loadAllData
    };

    document.addEventListener('DOMContentLoaded', function() {
        buildModal();
        initSearch();
    });

})();
