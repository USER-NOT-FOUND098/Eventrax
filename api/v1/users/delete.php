<?php
/**
 * Delete User
 * Permanently remove a user content
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Admin required
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized. Admin access required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

$userId = (int)$data->user_id;
$adminId = $_SESSION['user_id'];

// Prevent self-deletion
if ($userId === $adminId) {
    http_response_code(403);
    echo json_encode(['error' => 'You cannot delete your own account']);
    exit;
}

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Delete the user
    // Note: Foreign key constraints on dependent tables (notifications, tasks, etc.) should handle cleanup (ON DELETE CASCADE)
    // If not, we might need manual cleanup, but ideally DB handles it.

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    // Log the action
    $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, 'delete', 'user', ?, ?)");
    $stmt->execute([$adminId, $userId, "Deleted user: {$user['email']}"]);

    echo json_encode([
        'success' => true,
        'message' => "User {$user['name']} has been permanently deleted."
    ]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]);
}
?>
