<?php
/**
 * /api/stylists.php
 *
 * GET    -> list stylists. Everyone sees active-only by default.
 *           Admin can pass ?all=1 to see inactive ones too.
 * POST   -> create a new stylist (admin only)
 * PUT    -> update a stylist (admin only). Body must include "id".
 * DELETE -> delete a stylist (admin only). Use ?id=123
 */
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        if (isAdmin() && isset($_GET['all'])) {
            $stylists = $pdo->query("SELECT * FROM stylists ORDER BY name")->fetchAll();
        } else {
            $stylists = $pdo->query("SELECT * FROM stylists WHERE is_active = 1 ORDER BY name")->fetchAll();
        }
        sendJson(['success' => true, 'stylists' => $stylists]);
        break;

    case 'POST':
        requireAdmin();
        $input = getJsonInput();
        $name      = trim($input['name'] ?? '');
        $specialty = trim($input['specialty'] ?? '');
        $isActive  = !empty($input['is_active']) ? 1 : 0;

        if ($name === '') sendJson(['success' => false, 'message' => 'Stylist name is required.'], 422);

        $stmt = $pdo->prepare("INSERT INTO stylists (name, specialty, is_active) VALUES (?, ?, ?)");
        $stmt->execute([$name, $specialty, $isActive]);

        sendJson(['success' => true, 'message' => 'Stylist added.', 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) sendJson(['success' => false, 'message' => 'Missing stylist id.'], 422);

        $name      = trim($input['name'] ?? '');
        $specialty = trim($input['specialty'] ?? '');
        $isActive  = !empty($input['is_active']) ? 1 : 0;

        if ($name === '') sendJson(['success' => false, 'message' => 'Stylist name is required.'], 422);

        $stmt = $pdo->prepare("UPDATE stylists SET name=?, specialty=?, is_active=? WHERE id=?");
        $stmt->execute([$name, $specialty, $isActive, $id]);

        sendJson(['success' => true, 'message' => 'Stylist updated.']);
        break;

    case 'DELETE':
        requireAdmin();
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) sendJson(['success' => false, 'message' => 'Missing stylist id.'], 422);

        $stmt = $pdo->prepare("DELETE FROM stylists WHERE id = ?");
        $stmt->execute([$id]);

        sendJson(['success' => true, 'message' => 'Stylist removed.']);
        break;

    default:
        sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}
