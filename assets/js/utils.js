/**
 * ============================================
 * UTILITY FUNCTIONS – SECURITY & HELPERS
 * ============================================
 * This file contains reusable functions that protect your website
 * from security risks and make common tasks easier.
 * All functions are pure and have no side effects.
 */

/**
 * escapeHTML – Prevents Cross-Site Scripting (XSS) attacks
 * 
 * What it does:
 * Takes any user-supplied or external text (like from your JSON files)
 * and converts special characters into their safe HTML entities.
 * For example: "<script>" becomes "&lt;script&gt;" which is displayed
 * as plain text, never executed as code.
 * 
 * Usage:
 *   const safeText = escapeHTML(userInput);
 *   document.getElementById('output').textContent = safeText; // safe
 *   // OR if you MUST use innerHTML (rare), use:
 *   document.getElementById('output').innerHTML = safeText;
 * 
 * @param {string} str – The raw input string to sanitize
 * @returns {string} – The sanitized, safe string
 */
function escapeHTML(str) {
    if (!str) return ''; // If empty or null, return empty string
    return String(str)
        .replace(/&/g, '&amp;')    // Ampersand first (to avoid double-encoding)
        .replace(/</g, '&lt;')     // Less-than sign
        .replace(/>/g, '&gt;')     // Greater-than sign
        .replace(/"/g, '&quot;')   // Double quote
        .replace(/'/g, '&#039;');  // Single quote (apostrophe)
}

/**
 * sanitizeSearchQuery – Extra safety for search inputs
 * 
 * Strips out any non-alphanumeric characters from a search query
 * to prevent injection attempts via the URL bar.
 * 
 * @param {string} query – The raw search term from the URL
 * @returns {string} – A cleaned, safe search term
 */
function sanitizeSearchQuery(query) {
    if (!query) return '';
    // Remove anything that is not a letter, number, space, or dash
    return String(query).replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
}

/**
 * getURLParameter – Safely read a query parameter from the URL
 * 
 * Example: If your URL is search.html?q=cancer+data
 * calling getURLParameter('q') returns "cancer data"
 * 
 * @param {string} param – The parameter name (e.g., 'q')
 * @returns {string|null} – The decoded parameter value, or null if not found
 */
function getURLParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(param);
    return value ? decodeURIComponent(value) : null;
}

/**
 * createSafeLink – Generates an <a> tag with security attributes
 * 
 * Use this when creating dynamic links in JavaScript to ensure
 * that any external link automatically gets rel="noopener noreferrer"
 * 
 * @param {string} href – The destination URL
 * @param {string} text – The visible link text
 * @param {boolean} external – Set to true if it's an external site
 * @returns {string} – A safe HTML anchor element as a string
 */
function createSafeLink(href, text, external = false) {
    const safeHref = escapeHTML(href);
    const safeText = escapeHTML(text);
    let relAttr = '';
    let targetAttr = '';
    
    if (external) {
        relAttr = ' rel="noopener noreferrer"';
        targetAttr = ' target="_blank"';
    }
    
    return `<a href="${safeHref}"${targetAttr}${relAttr}>${safeText}</a>`;
}

/**
 * fetchJSON – Safely fetch a JSON file with error handling
 * 
 * Use this instead of raw fetch() to automatically handle
 * network errors and parse failures.
 * 
 * @param {string} url – Path to the JSON file (e.g., 'json/publications.json')
 * @returns {Promise<object|array>} – The parsed JSON data
 */
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch JSON from', url, error);
        return null; // Graceful failure – your page can show a fallback message
    }
}

/**
 * ============================================
 * EXPOSE FUNCTIONS GLOBALLY
 * ============================================
 * This makes all the above functions available to other JavaScript files
 * (like search.js) that are loaded after this file.
 */
window.escapeHTML = escapeHTML;
window.sanitizeSearchQuery = sanitizeSearchQuery;
window.getURLParameter = getURLParameter;
window.createSafeLink = createSafeLink;
window.fetchJSON = fetchJSON;

// ============================================
// SCROLL TO TOP ON PAGE REFRESH
// ============================================
window.addEventListener('beforeunload', function() {
    window.scrollTo(0, 0);
});

// Also scroll to top when page loads
if (performance.navigation.type === 1) {
    window.scrollTo(0, 0);
}

// Modern replacement for older browsers
if (performance.getEntriesByType) {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        window.scrollTo(0, 0);
    }
}
