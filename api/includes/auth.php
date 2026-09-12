<?php
/**
 * Shared bootstrap for every API endpoint.
 * Handles: session start, CORS (for local dev when frontend/API run on different ports),
 * JSON response helper, auth guards, and JSON request-body parsing.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// ---- CORS (safe to leave on even when same-origin) ----
// Allows the frontend to send/receive the session cookie during local development
// even if it's served from a different port (e.g. VSCode Live Server on :5500).
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight request - nothing else to do
    http_response_code(204);
    exit();
}

/**
 * Send a JSON response and stop execution.
 */
function sendJson($data, int $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Reads and decodes a JSON request body (for POST/PUT requests) into an assoc array.
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function isLoggedIn(): bool {
    return isset($_SESSION['user_id']);
}

function isAdmin(): bool {
    return isLoggedIn() && $_SESSION['role'] === 'admin';
}

/**
 * Call at the top of any endpoint that requires a logged-in user.
 * Sends a 401 JSON error and stops execution if not logged in.
 */
function requireLogin() {
    if (!isLoggedIn()) {
        sendJson(['success' => false, 'message' => 'You must be logged in.'], 401);
    }
}

/**
 * Call at the top of any endpoint that is admin-only.
 * Sends a 403 JSON error and stops execution if not an admin.
 */
function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        sendJson(['success' => false, 'message' => 'Admin access required.'], 403);
    }
}
