<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin']);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['new_role'])) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID and new role are required']);
    exit;
}

$userId = (int)$data['user_id'];
$newRole = trim($data['new_role']);

// Validate role
$validRoles = ['admin', 'creator', 'teamlead', 'student'];
if (!in_array($newRole, $validRoles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role']);
    exit;
}

// Check if user exists
$stmt = $pdo->prepare("SELECT id, name, role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

// Prevent changing own role (security measure)
if ($userId === $_SESSION['user_id']) {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot change your own role']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->execute([$newRole, $userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Role updated successfully',
        'user' => [
            'id' => $userId,
            'name' => $user['name'],
            'previous_role' => $user['role'],
            'new_role' => $newRole
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update role: ' . $e->getMessage()]);
}
?>
