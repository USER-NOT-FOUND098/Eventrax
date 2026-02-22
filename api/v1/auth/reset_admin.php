<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

try {
    // We'll use a plain password and hash it fresh
    $password = 'admin123';
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $email = 'admin@eventrax.com';
    $name = 'System Admin';

    // Update existing user password
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$hash, $email]);

    if ($stmt->rowCount() === 0) {
        // If user doesn't exist, insert them
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, institution, avatar, status) VALUES (?, ?, ?, 'admin', 'Eventrax HQ', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'active')");
        $stmt->execute([$name, $email, $hash]);
    }

    echo json_encode([
        'success' => true, 
        'message' => 'Admin user reset successful!',
        'details' => [
            'email' => $email,
            'password' => $password,
            'new_hash_used' => $hash
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
