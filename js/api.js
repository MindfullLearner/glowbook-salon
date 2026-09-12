/**
 * api.js — thin wrapper around fetch() for talking to the PHP API.
 *
 * Each page sets `window.API_BASE` BEFORE loading this file, e.g.:
 *   <script>window.API_BASE = 'api';</script>       (pages at project root)
 *   <script>window.API_BASE = '../api';</script>     (pages inside /admin)
 */

/**
 * Call an API endpoint.
 * @param {string} path   e.g. 'auth/login.php' or 'services.php'
 * @param {string} method 'GET' | 'POST' | 'PUT' | 'DELETE'
 * @param {object} [body] request payload, sent as JSON
 * @returns {Promise<object>} the parsed JSON response
 */
async function apiCall(path, method = 'GET', body = null) {
    const options = {
        method,
        credentials: 'same-origin', // send the session cookie
        headers: { 'Content-Type': 'application/json' },
    };
    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${window.API_BASE}/${path}`, options);
    const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response.' }));

    if (!response.ok && response.status === 401) {
        // Session expired or never logged in — send back to login
        window.location.href = pathToRoot() + 'login.html';
        return data;
    }
    return data;
}

/**
 * Figures out the relative path back to the project root, based on API_BASE.
 * If API_BASE is '../api' (an /admin/ page), root is '../'. Otherwise it's './'.
 */
function pathToRoot() {
    return window.API_BASE.startsWith('..') ? '../' : './';
}

/** Small helper to show a message inside a container element */
function showAlert(containerEl, message, type = 'error') {
    containerEl.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
