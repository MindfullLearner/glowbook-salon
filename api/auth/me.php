<?php
/**
 * GET /api/auth/me.php
 * Used by the frontend on every page load to check: is anyone logged in, and who?
 */
require_once __DIR__ . '/../includes/auth.php';

if (!isLoggedIn()) {
    sendJson(['success' => true, 'loggedIn' => false]);
}

sendJson([
    'success' => true,
    'loggedIn' => true,
    'user' => [
        'id'   => $_SESSION['user_id'],
        'name' => $_SESSION['name'],
        'role' => $_SESSION['role'],
    ],
]);
