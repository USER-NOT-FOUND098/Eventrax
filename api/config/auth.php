<?php
// api/config/auth.php

function checkAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    return $_SESSION['user_id'];
}

function checkRole($allowedRoles) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['role'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - No Role']);
        exit;
    }

    $currentRole = strtolower($_SESSION['role']);
    // Normalize allowed roles
    $allowedRoles = array_map('strtolower', $allowedRoles);

    if (!in_array($currentRole, $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - Insufficient Permissions']);
        exit;
    }
}
?>
