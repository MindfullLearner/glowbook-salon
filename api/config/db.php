<?php
/**
 * Database connection for the API.
 * Uses PDO with prepared statements everywhere (SQL-injection safe).
 */

$DB_HOST = 'localhost';
$DB_NAME = 'salon_booking_system';
$DB_USER = 'root';       // <-- change this to your MySQL username
$DB_PASS = 'root';           // <-- change this to your MySQL password

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
    exit();
}
