<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();
// Allow admin and creator roles
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'creator'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT id, name, email, role, institution, avatar, status, created_at, last_login FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    // Map to camelCase for the frontend
    $mappedUsers = array_map(function($user) {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'institution' => $user['institution'],
            'avatar' => $user['avatar'],
            'status' => $user['status'],
            'createdAt' => $user['created_at'],
            'lastLogin' => $user['last_login']
        ];
    }, $users);
    
    echo json_encode($mappedUsers);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
