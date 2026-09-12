<?php
/**
 * GET /api/users.php?search=
 * Admin only - lists all registered (non-admin) users with their booking count.
 */
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$search = trim($_GET['search'] ?? '');

$sql = "SELECT u.id, u.name, u.email, u.phone, u.created_at,
               (SELECT COUNT(*) FROM appointments a WHERE a.user_id = u.id) AS appointment_count
        FROM users u WHERE u.role = 'user'";
$params = [];
if ($search !== '') {
    $sql .= " AND (u.name LIKE ? OR u.email LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
$sql .= " ORDER BY u.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

sendJson(['success' => true, 'users' => $stmt->fetchAll()]);
