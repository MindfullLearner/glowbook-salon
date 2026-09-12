<?php
/**
 * /api/services.php
 *
 * GET    -> list services. Everyone sees active-only by default.
 *           Admin can pass ?all=1 to see inactive ones too.
 * POST   -> create a new service (admin only)
 * PUT    -> update a service (admin only). Body must include "id".
 * DELETE -> delete a service (admin only). Use ?id=123
 */
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

requireLogin(); // every action here requires at least a logged-in user

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        if (isAdmin() && isset($_GET['all'])) {
            $services = $pdo->query("SELECT * FROM services ORDER BY name")->fetchAll();
        } else {
            $services = $pdo->query("SELECT * FROM services WHERE is_active = 1 ORDER BY name")->fetchAll();
        }
        sendJson(['success' => true, 'services' => $services]);
        break;

    case 'POST':
        requireAdmin();
        $input = getJsonInput();
        $name     = trim($input['name'] ?? '');
        $desc     = trim($input['description'] ?? '');
        $duration = (int)($input['duration_minutes'] ?? 0);
        $price    = (float)($input['price'] ?? 0);
        $isActive = !empty($input['is_active']) ? 1 : 0;

        $errors = [];
        if ($name === '') $errors[] = "Service name is required.";
        if ($duration <= 0) $errors[] = "Duration must be greater than 0.";
        if ($price < 0) $errors[] = "Price cannot be negative.";
        if (!empty($errors)) sendJson(['success' => false, 'message' => implode(' ', $errors)], 422);

        $stmt = $pdo->prepare("INSERT INTO services (name, description, duration_minutes, price, is_active) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $desc, $duration, $price, $isActive]);

        sendJson(['success' => true, 'message' => 'Service created.', 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        requireAdmin();
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) sendJson(['success' => false, 'message' => 'Missing service id.'], 422);

        $name     = trim($input['name'] ?? '');
        $desc     = trim($input['description'] ?? '');
        $duration = (int)($input['duration_minutes'] ?? 0);
        $price    = (float)($input['price'] ?? 0);
        $isActive = !empty($input['is_active']) ? 1 : 0;

        $errors = [];
        if ($name === '') $errors[] = "Service name is required.";
        if ($duration <= 0) $errors[] = "Duration must be greater than 0.";
        if ($price < 0) $errors[] = "Price cannot be negative.";
        if (!empty($errors)) sendJson(['success' => false, 'message' => implode(' ', $errors)], 422);

        $stmt = $pdo->prepare("UPDATE services SET name=?, description=?, duration_minutes=?, price=?, is_active=? WHERE id=?");
        $stmt->execute([$name, $desc, $duration, $price, $isActive, $id]);

        sendJson(['success' => true, 'message' => 'Service updated.']);
        break;

    case 'DELETE':
        requireAdmin();
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) sendJson(['success' => false, 'message' => 'Missing service id.'], 422);

        $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
        $stmt->execute([$id]);

        sendJson(['success' => true, 'message' => 'Service deleted.']);
        break;

    default:
        sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}
