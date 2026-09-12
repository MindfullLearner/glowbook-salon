<?php
/**
 * POST /api/auth/register.php
 * Body: { name, email, password, confirm_password, phone }
 */
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = getJsonInput();
$name     = trim($input['name'] ?? '');
$email    = trim($input['email'] ?? '');
$phone    = trim($input['phone'] ?? '');
$password = $input['password'] ?? '';
$confirm  = $input['confirm_password'] ?? '';

$errors = [];

if ($name === '') {
    $errors[] = "Name is required.";
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Please enter a valid email address.";
}
if (strlen($password) < 8) {
    $errors[] = "Password must be at least 8 characters long.";
}
if (!preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
    $errors[] = "Password must include at least one uppercase letter and one number.";
}
if ($password !== $confirm) {
    $errors[] = "Passwords do not match.";
}

if (empty($errors)) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $errors[] = "An account with this email already exists.";
    }
}

if (!empty($errors)) {
    sendJson(['success' => false, 'message' => implode(' ', $errors), 'errors' => $errors], 422);
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')");
$stmt->execute([$name, $email, $hashedPassword, $phone]);

// Log the user in immediately after registering
$_SESSION['user_id'] = $pdo->lastInsertId();
$_SESSION['name']    = $name;
$_SESSION['role']    = 'user';

sendJson([
    'success' => true,
    'message' => 'Account created successfully.',
    'user' => ['id' => $_SESSION['user_id'], 'name' => $name, 'email' => $email, 'role' => 'user'],
]);
