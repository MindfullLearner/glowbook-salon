<?php
/**
 * POST /api/auth/login.php
 * Body: { email, password }
 */
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = getJsonInput();
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    sendJson(['success' => false, 'message' => 'Please enter both email and password.'], 422);
}

$stmt = $pdo->prepare("SELECT id, name, password, role FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

// password_verify() checks the plain password against the stored bcrypt hash
if (!$user || !password_verify($password, $user['password'])) {
    // Deliberately vague: don't reveal whether it was the email or the password that was wrong
    sendJson(['success' => false, 'message' => 'Invalid email or password.'], 401);
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['name']    = $user['name'];
$_SESSION['role']    = $user['role'];

sendJson([
    'success' => true,
    'message' => 'Logged in successfully.',
    'user' => ['id' => $user['id'], 'name' => $user['name'], 'role' => $user['role']],
]);
