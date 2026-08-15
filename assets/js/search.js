/**
 * ============================================
 * SEARCH.JS – Central Search (Modal + Autocomplete + Word Suggestions)
 * ============================================
 * This script handles:
 * - Opening/closing the search modal
 * - Autocomplete suggestions showing unique words with result counts
 * - Spelling suggestions ("Did you mean?") when no word suggestions found
 * - Redirecting to search.html with the query
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        searchPlaceholder: 'Search the site ...',
        debounceDelay: 250,
        maxDropdownHeight: 260,
        jsonFiles: [
            { url: '/my-website/json/publications.json', source: 'publication' },
            { url: '/my-website/json/blog.json', source: 'blog' },
            { url: '/my-website/json/pages.json', source: 'page' }
        ]
    };

    // ============================================
    // STATE
    // ============================================
    let allItems = [];
    let wordFrequency = {};  // word -> count
    let uniqueWords = [];    // sorted by count descending
    let currentQuery = '';
    let selectedIndex = -1;
    let isModalOpen = false;

    // ============================================
    // DOM REFERENCES
    // ============================================
    let overlay, input, dropdown, closeBtn;

    // ============================================
    // LEVENSHTEIN DISTANCE (for spelling suggestions)
    // ============================================
    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
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

        const scored = wordList.map(function(word) {
            const distance = levenshteinDistance(lowerQuery, word);
            return { word: word, distance: distance };
        });

        return scored
            .filter(function(s) { return s.distance <= 2 && s.distance > 0; })
            .sort(function(a, b) { return a.distance - b.distance; })
            .slice(0, maxSuggestions)
            .map(function(s) { return s.word; });
    }

    // ============================================
    // BUILD WORD FREQUENCY INDEX
    // ============================================
    function buildWordFrequency() {
        const freq = {};
        allItems.forEach(function(item) {
            const text = item.searchableText;
            const words = text.split(/\s+/);
            const uniqueWordsInItem = new Set(words);
            uniqueWordsInItem.forEach(function(word) {
                if (word.length >= 2) {
                    freq[word] = (freq[word] || 0) + 1;
                }
            });
        });
        wordFrequency = freq;
        // Sort unique words by count descending
        uniqueWords = Object.keys(freq).sort(function(a, b) {
            return freq[b] - freq[a];
        });
    }

    // ============================================
    // GET WORD SUGGESTIONS (starts with query)
    // ============================================
    function getWordSuggestions(query) {
        if (!query || query.trim().length === 0) return [];
        const lowerQuery = query.toLowerCase().trim();
        // If query has spaces, take the first word as the prefix
        const prefix = lowerQuery.split(/\s+/)[0];
        if (prefix.length < 2) return [];

        const suggestions = [];
        // Iterate through uniqueWords (already sorted by count)
        for (let i = 0; i < uniqueWords.length && suggestions.length < 20; i++) {
            const word = uniqueWords[i];
            if (word.startsWith(prefix)) {
                suggestions.push({
                    word: word,
                    count: wordFrequency[word]
                });
            }
        }
        return suggestions;
    }

    // ============================================
    // BUILD SEARCH INDEX
    // ============================================
    function buildSearchIndex(data, source) {
        const items = [];
        data.forEach(function(item) {
            const searchableText = [
                item.title || '',
                item.shortTitle || '',
                item.authorship || '',
                item.journal || '',
                item.year || '',
                item.summary || '',
                item.categories ? item.categories.join(' ') : '',
                item.keywords ? item.keywords.join(' ') : ''
            ].join(' ').toLowerCase();

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
                searchableText: searchableText,
                raw: item
            });
        });
        return items;
    }

    // ============================================
    // LOAD ALL JSON DATA
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
            buildWordFrequency(); // Build frequency index after loading
            return allItems;
        } catch (error) {
            console.error('Error loading search data:', error);
            allItems = [];
            return allItems;
        }
    }

    // ============================================
    // RENDER DROPDOWN (with word suggestions + counts)
    // ============================================
    function renderDropdown() {
        if (!dropdown) return;
        dropdown.innerHTML = '';

        const query = input.value.trim();
        if (query.length === 0) {
            dropdown.classList.remove('active');
            return;
        }

        const suggestions = getWordSuggestions(query);

        if (suggestions.length === 0) {
            // No word suggestions – try spelling suggestions
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
                empty.textContent = 'No matches found. Try a different keyword.';
            }
            dropdown.appendChild(empty);
            dropdown.classList.add('active');
            return;
        }

        // Render word suggestions with counts
        suggestions.forEach(function(suggestion, index) {
            const div = document.createElement('div');
            div.className = 'search-dropdown-item';
            if (index === selectedIndex) {
                div.classList.add('active');
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'suggestion-text';
            textSpan.textContent = suggestion.word + ' (' + suggestion.count + ')';

            div.appendChild(textSpan);

            div.addEventListener('click', function() {
                performSearch(suggestion.word);
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
    // HIGHLIGHT SELECTED DROPDOWN ITEM
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
    // HANDLE INPUT (with debounce)
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
                const text = item.textContent.trim();
                // Extract the word before the parenthesis
                const word = text.split('(')[0].trim();
                performSearch(word);
                return;
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
    // OPEN / CLOSE MODAL
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

    // ============================================
    // EXPOSE GLOBALLY
    // ============================================
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
