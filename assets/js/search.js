/**
 * ============================================
 * SEARCH.JS – Central Search (Modal + Autocomplete + Spelling Suggestions)
 * ============================================
 * This script handles:
 * - Opening/closing the search modal
 * - Autocomplete suggestions as the user types
 * - Spelling suggestions ("Did you mean?") when no matches found
 * - Redirecting to search.html with the query
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        searchPlaceholder: 'Search the site ...',
        debounceDelay: 250, // milliseconds
        maxDropdownHeight: 260, // pixels
        jsonFiles: [
            { url: '/my-website/json/publications.json', source: 'publication' },
            { url: '/my-website/json/blog.json', source: 'blog' },
            { url: '/my-website/json/pages.json', source: 'page' }
        ]
    };

    // ============================================
    // STATE
    // ============================================
    let allItems = []; // All searchable items from all JSON files
    let currentQuery = '';
    let selectedIndex = -1;
    let isModalOpen = false;

    // ============================================
    // DOM REFERENCES (built on demand)
    // ============================================
    let overlay, input, dropdown, closeBtn, searchIcon;

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
        const wordList = new Set();
        
        // Build a list of unique words from allItems (titles, summaries, etc.)
        allItems.forEach(function(item) {
            const text = item.searchableText;
            const words = text.split(/\s+/);
            words.forEach(function(word) {
                // Keep words longer than 2 characters
                if (word.length >= 3) {
                    wordList.add(word);
                }
            });
        });
        
        // If no data loaded, return empty
        if (wordList.size === 0) return [];
        
        // Score each word by Levenshtein distance
        const scored = Array.from(wordList).map(function(word) {
            const distance = levenshteinDistance(lowerQuery, word);
            return { word: word, distance: distance };
        });
        
        // Filter words with distance <= 2 (close match) and distance > 0
        // Also exclude exact matches (distance === 0) because we already have matches
        const closeMatches = scored
            .filter(function(s) { return s.distance <= 2 && s.distance > 0; })
            .sort(function(a, b) { return a.distance - b.distance; })
            .slice(0, maxSuggestions)
            .map(function(s) { return s.word; });
        
        return closeMatches;
    }

    // ============================================
    // BUILD SEARCH INDEX
    // ============================================
    function buildSearchIndex(data, source) {
        const items = [];
        
        data.forEach(function(item) {
            // Build a searchable text string from all fields
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

            // Determine the label and link for this item
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
                // Store original data for later use
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
            return allItems;
        } catch (error) {
            console.error('Error loading search data:', error);
            allItems = [];
            return allItems;
        }
    }

    // ============================================
    // SEARCH / AUTOCOMPLETE LOGIC
    // ============================================
    
    function getSuggestions(query) {
            if (!query || query.trim().length === 0) {
                return [];
            }
        
            const lowerQuery = query.toLowerCase().trim();
            const words = lowerQuery.split(/\s+/).filter(function(w) { return w.length > 0; });
            const isPhrase = words.length > 2; // If more than 2 words, treat as a phrase
        
            // Score each item based on how well it matches
            const scored = allItems.map(function(item) {
                let score = 0;
                const text = item.searchableText;
                const titleLower = (item.title || '').toLowerCase();
        
                // --- EXACT PHRASE MATCH (highest priority) ---
                if (text.includes(lowerQuery)) {
                    score += 100; // Very high score for exact phrase
                }
                if (titleLower.includes(lowerQuery)) {
                    score += 80; // Even higher if the phrase is in the title
                }
        
                // --- INDIVIDUAL WORD MATCHES (lower priority) ---
                // If the query is a phrase (3+ words), reduce individual word scores
                const wordWeight = isPhrase ? 2 : 10;
        
                words.forEach(function(word) {
                    if (word.length >= 2 && text.includes(word)) {
                        score += wordWeight;
                    }
                    if (word.length >= 2 && titleLower.includes(word)) {
                        score += wordWeight * 1.5;
                    }
                });
        
                // --- BOOST FOR TITLE MATCH (always) ---
                // If the title starts with the query (very strong signal)
                if (titleLower.startsWith(lowerQuery)) {
                    score += 50;
                }
        
                return { item: item, score: score };
            });
        
            // Filter out zero scores and sort by score (highest first)
            const results = scored
                .filter(function(s) { return s.score > 0; })
                .sort(function(a, b) { return b.score - a.score; })
                .map(function(s) { return s.item; });
        
            return results;
        }

    // ============================================
    // RENDER DROPDOWN (with spelling suggestions)
    // ============================================
    
    function renderDropdown(suggestions) {
        if (!dropdown) return;

        dropdown.innerHTML = '';

        if (suggestions.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'search-dropdown-empty';
            
            const query = input.value.trim();
            const spellingSuggestions = getSpellingSuggestions(query);
            
            if (spellingSuggestions.length > 0) {
                // Build a clickable list of suggestions
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
                    
                    // Add comma and space after each suggestion except the last
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

        // Limit to 30 suggestions (with scroll bar)
        const maxDisplay = 30;
        const displayItems = suggestions.slice(0, maxDisplay);

        displayItems.forEach(function(item, index) {
            const div = document.createElement('div');
            div.className = 'search-dropdown-item';
            if (index === selectedIndex) {
                div.classList.add('active');
            }

            // Suggestion text (highlight match)
            const textSpan = document.createElement('span');
            textSpan.className = 'suggestion-text';
            textSpan.textContent = item.title;

            // Source label
            const sourceSpan = document.createElement('span');
            sourceSpan.className = 'suggestion-source source-' + item.source;
            sourceSpan.textContent = item.sourceLabel;

            div.appendChild(textSpan);
            div.appendChild(sourceSpan);

            // Click to search
            div.addEventListener('click', function() {
                performSearch(item.title);
            });

            // Mouse enter for keyboard navigation sync
            div.addEventListener('mouseenter', function() {
                selectedIndex = index;
                highlightSelected();
            });

            dropdown.appendChild(div);
        });

        // Show "and more" if there are more items
        if (suggestions.length > maxDisplay) {
            const more = document.createElement('div');
            more.className = 'search-dropdown-item';
            more.style.cssText = 'opacity: 0.4; font-size: 0.8rem; justify-content: center; cursor: default;';
            more.textContent = '+ ' + (suggestions.length - maxDisplay) + ' more results...';
            dropdown.appendChild(more);
        }

        dropdown.classList.add('active');
        selectedIndex = -1; // Reset selection
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
    // PERFORM SEARCH (Redirect to search.html)
    // ============================================
    
    function performSearch(query) {
        if (!query || query.trim().length === 0) return;
        const encoded = encodeURIComponent(query.trim());
        window.location.href = '/my-website/search.html?q=' + encoded;
    }

    // ============================================
    // HANDLE INPUT (Debounced)
    // ============================================
    let debounceTimer = null;

    function handleInput() {
        const query = input.value;

        // Store current query for dropdown navigation
        currentQuery = query;

        if (query.trim().length === 0) {
            dropdown.classList.remove('active');
            return;
        }

        // Debounce the search
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            const suggestions = getSuggestions(query);
            renderDropdown(suggestions);
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
            // If there's a selected item, use its text
            if (selectedIndex >= 0 && selectedIndex < dropdownItems.length) {
                const item = dropdownItems[selectedIndex];
                const textEl = item.querySelector('.suggestion-text');
                if (textEl) {
                    performSearch(textEl.textContent);
                    return;
                }
            }
            // Otherwise, use the input value
            performSearch(input.value);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (dropdownItems.length > 0) {
                selectedIndex = Math.min(selectedIndex + 1, dropdownItems.length - 1);
                highlightSelected();
                // Scroll into view
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

        // Build modal if not exists
        if (!overlay) {
            buildModal();
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // Focus the input after a short delay
        setTimeout(function() {
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);

        // Load data if not loaded yet
        if (allItems.length === 0) {
            loadAllData();
        }

        // Reset state
        selectedIndex = -1;
        if (dropdown) {
            dropdown.classList.remove('active');
            dropdown.innerHTML = '';
        }
        if (input) {
            input.value = '';
            currentQuery = '';
        }

        // Close on escape key
        document.addEventListener('keydown', handleKeydown);
    }

    function closeModal() {
        if (!isModalOpen) return;
        isModalOpen = false;

        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = '';

        // Remove escape key listener
        document.removeEventListener('keydown', handleKeydown);
    }

    // ============================================
    // BUILD MODAL DOM
    // ============================================
    function buildModal() {
        // Overlay
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.id = 'search-modal';

        // Click outside to close
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Container
        const container = document.createElement('div');
        container.className = 'search-box-container';

        // Input row
        const inputRow = document.createElement('div');
        inputRow.className = 'search-input-row';

        const magnifier = document.createElement('i');
        magnifier.className = 'fa-solid fa-magnifying-glass';

        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = CONFIG.searchPlaceholder;
        input.setAttribute('aria-label', 'Search the site');
        input.autocomplete = 'off';

        // Close button
        closeBtn = document.createElement('button');
        closeBtn.className = 'search-close-btn';
        closeBtn.setAttribute('aria-label', 'Close search');
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.addEventListener('click', closeModal);

        inputRow.appendChild(magnifier);
        inputRow.appendChild(input);
        inputRow.appendChild(closeBtn);

        // Dropdown
        dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';

        // Assemble
        container.appendChild(inputRow);
        container.appendChild(dropdown);
        overlay.appendChild(container);

        // Append to body
        document.body.appendChild(overlay);

        // Input events
        input.addEventListener('input', handleInput);

        // Keyboard shortcut: Ctrl+K or Cmd+K
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
    // INITIALIZE: Find Search Icon & Attach Event
    // ============================================
    function initSearch() {
        // Wait for navbar to be injected (it might not exist yet)
        const checkInterval = setInterval(function() {
            const searchIconElement = document.querySelector('.navbar-icons a[aria-label*="Search"]') ||
                                     document.querySelector('.navbar-icons a i.fa-magnifying-glass')?.closest('a');

            if (searchIconElement) {
                clearInterval(checkInterval);
                // Override the default link behavior
                searchIconElement.addEventListener('click', function(e) {
                    e.preventDefault();
                    openModal();
                });
                // Also add a cursor style
                searchIconElement.style.cursor = 'pointer';
                console.log('✅ Search icon attached.');
            }
        }, 500);

        // Also load data in background
        setTimeout(function() {
            if (allItems.length === 0) {
                loadAllData();
            }
        }, 1000);
    }

    // ============================================
    // EXPOSE FUNCTIONS GLOBALLY (for debugging)
    // ============================================
    window.search = {
        open: openModal,
        close: closeModal,
        loadData: loadAllData
    };

    // ============================================
    // START
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        // Build modal immediately (hidden)
        buildModal();
        // Initialize search icon attachment
        initSearch();
    });

})();
