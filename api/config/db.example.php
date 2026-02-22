<?php
// Database Configuration Example
// INSTRUCTIONS: Rename this file to `db.php` and update the credentials below.
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '<YOUR_PASSWORD_HERE>');
define('DB_NAME', 'eventrax_db');

// Prevent PHP warnings from breaking JSON response
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
}
catch (PDOException $e) {
    // Return JSON error if connection fails
    header('Content-Type: application/json');
    http_response_code(500);

    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
