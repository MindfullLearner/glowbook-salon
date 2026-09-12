<?php
/**
 * POST /api/auth/logout.php
 */
require_once __DIR__ . '/../includes/auth.php';

$_SESSION = [];
session_destroy();

sendJson(['success' => true, 'message' => 'Logged out.']);
