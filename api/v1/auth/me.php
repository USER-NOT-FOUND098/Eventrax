<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['authenticated' => false]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        unset($user['password_hash']);
        echo json_encode([
            'authenticated' => true,
            'user' => $user
        ]);
    } else {
        session_destroy();
        http_response_code(401);
        echo json_encode(['authenticated' => false]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching user']);
}
?>
