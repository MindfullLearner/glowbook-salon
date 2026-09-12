<?php
/**
 * GET /api/dashboard.php
 * Returns different stats depending on whether the logged-in user is a regular user or an admin.
 */
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (isAdmin()) {
    $stats = [
        'total_appointments' => $pdo->query("SELECT COUNT(*) AS c FROM appointments")->fetch()['c'],
        'today_appointments'  => $pdo->query("SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = CURDATE()")->fetch()['c'],
        'pending_count'       => $pdo->query("SELECT COUNT(*) AS c FROM appointments WHERE status = 'pending'")->fetch()['c'],
        'total_users'         => $pdo->query("SELECT COUNT(*) AS c FROM users WHERE role = 'user'")->fetch()['c'],
    ];

    $recent = $pdo->query("
        SELECT a.*, s.name AS service_name, u.name AS user_name
        FROM appointments a
        JOIN services s ON s.id = a.service_id
        JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC LIMIT 8
    ")->fetchAll();

} else {
    $userId = $_SESSION['user_id'];

    $stmt = $pdo->prepare("SELECT COUNT(*) AS c FROM appointments WHERE user_id = ?");
    $stmt->execute([$userId]);
    $total = $stmt->fetch()['c'];

    $stmt = $pdo->prepare("SELECT COUNT(*) AS c FROM appointments WHERE user_id = ? AND appointment_date >= CURDATE() AND status != 'cancelled'");
    $stmt->execute([$userId]);
    $upcoming = $stmt->fetch()['c'];

    $stmt = $pdo->prepare("SELECT COUNT(*) AS c FROM appointments WHERE user_id = ? AND status = 'completed'");
    $stmt->execute([$userId]);
    $completed = $stmt->fetch()['c'];

    $stats = ['total' => $total, 'upcoming' => $upcoming, 'completed' => $completed];

    $stmt = $pdo->prepare("
        SELECT a.*, s.name AS service_name, s.price
        FROM appointments a
        JOIN services s ON s.id = a.service_id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC LIMIT 5
    ");
    $stmt->execute([$userId]);
    $recent = $stmt->fetchAll();
}

sendJson(['success' => true, 'stats' => $stats, 'recent' => $recent]);
