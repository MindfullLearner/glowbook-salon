<?php
/**
 * /api/appointments.php
 *
 * GET    -> list appointments.
 *           - Normal user: only their own. Supports ?search=&status=
 *           - Admin: everyone's. Supports ?search=&status=
 * POST   -> book a new appointment (any logged-in user)
 *           Body: { service_id, appointment_date, appointment_time, notes }
 * PUT    -> update an appointment. Two supported uses:
 *           - User reschedules their OWN appointment: { id, appointment_date, appointment_time }
 *           - Admin changes status of ANY appointment: { id, status }
 * DELETE -> cancel an appointment (soft-delete: sets status = 'cancelled'). Use ?id=123
 *           A user can only cancel their own; an admin can cancel any.
 */
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/config/db.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_SESSION['user_id'];

switch ($method) {

    case 'GET':
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? '');

        $sql = "
            SELECT a.*, s.name AS service_name, s.price, u.name AS user_name, u.email AS user_email,
                   st.name AS stylist_name
            FROM appointments a
            JOIN services s ON s.id = a.service_id
            JOIN users u ON u.id = a.user_id
            LEFT JOIN stylists st ON st.id = a.stylist_id
            WHERE 1=1
        ";
        $params = [];

        if (!isAdmin()) {
            $sql .= " AND a.user_id = ?";
            $params[] = $userId;
        }
        if ($search !== '') {
            $sql .= isAdmin() ? " AND (u.name LIKE ? OR s.name LIKE ?)" : " AND s.name LIKE ?";
            $params[] = "%$search%";
            if (isAdmin()) $params[] = "%$search%";
        }
        if ($status !== '') {
            $sql .= " AND a.status = ?";
            $params[] = $status;
        }
        $sql .= " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        sendJson(['success' => true, 'appointments' => $stmt->fetchAll()]);
        break;

    case 'POST':
        $input = getJsonInput();
        $serviceId = (int)($input['service_id'] ?? 0);
        $stylistId = !empty($input['stylist_id']) ? (int)$input['stylist_id'] : null; // null = "any available stylist"
        $date      = trim($input['appointment_date'] ?? '');
        $time      = trim($input['appointment_time'] ?? '');
        $notes     = trim($input['notes'] ?? '');

        $errors = [];
        if ($serviceId <= 0) $errors[] = "Please choose a service.";
        if ($date === '' || strtotime($date) < strtotime(date('Y-m-d'))) $errors[] = "Please choose a valid date (today or later).";
        if ($time === '') $errors[] = "Please choose a time slot.";

        // Only block the slot if the SAME stylist is already booked then (a stylist can't be in two places at once).
        // If no specific stylist was chosen, we don't block on time alone, since the salon may have multiple stylists free.
        if (empty($errors) && $stylistId !== null) {
            $stmt = $pdo->prepare("SELECT id FROM appointments WHERE stylist_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'");
            $stmt->execute([$stylistId, $date, $time]);
            if ($stmt->fetch()) $errors[] = "That stylist is already booked at this time. Please pick another time or stylist.";
        }

        if (!empty($errors)) sendJson(['success' => false, 'message' => implode(' ', $errors)], 422);

        $stmt = $pdo->prepare(
            "INSERT INTO appointments (user_id, service_id, stylist_id, appointment_date, appointment_time, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')"
        );
        $stmt->execute([$userId, $serviceId, $stylistId, $date, $time, $notes]);

        sendJson(['success' => true, 'message' => 'Appointment booked! It is pending confirmation.', 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) sendJson(['success' => false, 'message' => 'Missing appointment id.'], 422);

        // Fetch the appointment first to check ownership
        $stmt = $pdo->prepare("SELECT * FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        $appt = $stmt->fetch();
        if (!$appt) sendJson(['success' => false, 'message' => 'Appointment not found.'], 404);
        if (!isAdmin() && $appt['user_id'] != $userId) {
            sendJson(['success' => false, 'message' => 'You can only modify your own appointments.'], 403);
        }

        if (isset($input['status'])) {
            // Status change - admin only
            requireAdmin();
            $validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
            if (!in_array($input['status'], $validStatuses)) {
                sendJson(['success' => false, 'message' => 'Invalid status.'], 422);
            }
            $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
            $stmt->execute([$input['status'], $id]);
            sendJson(['success' => true, 'message' => 'Appointment status updated.']);
        } else {
            // Reschedule - date/time change, resets to pending
            $date = trim($input['appointment_date'] ?? '');
            $time = trim($input['appointment_time'] ?? '');
            if ($date === '' || $time === '') {
                sendJson(['success' => false, 'message' => 'Please provide a new date and time.'], 422);
            }
            $stmt = $pdo->prepare("UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = 'pending' WHERE id = ?");
            $stmt->execute([$date, $time, $id]);
            sendJson(['success' => true, 'message' => 'Appointment rescheduled.']);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) sendJson(['success' => false, 'message' => 'Missing appointment id.'], 422);

        $stmt = $pdo->prepare("SELECT user_id FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        $appt = $stmt->fetch();
        if (!$appt) sendJson(['success' => false, 'message' => 'Appointment not found.'], 404);
        if (!isAdmin() && $appt['user_id'] != $userId) {
            sendJson(['success' => false, 'message' => 'You can only cancel your own appointments.'], 403);
        }

        $stmt = $pdo->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$id]);
        sendJson(['success' => true, 'message' => 'Appointment cancelled.']);
        break;

    default:
        sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}
