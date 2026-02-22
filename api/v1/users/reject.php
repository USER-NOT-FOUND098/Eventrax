<?php
/**
 * Reject User Registration
 * DELETE pending users who are rejected
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Admin or Creator required
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['admin', 'creator'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized. Admin or Creator access required.']);
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
$rejecterId = $_SESSION['user_id'];
$rejecterRole = $_SESSION['role'];

try {
    // Check if user exists and is pending
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(['error' => 'User is not pending approval']);
        exit;
    }

    // Permission check: Creators can only reject Team Leads, Admins can reject anyone
    if ($rejecterRole === 'creator' && $user['role'] !== 'teamlead') {
        http_response_code(403);
        echo json_encode(['error' => 'Creators can only reject Team Lead accounts']);
        exit;
    }

    // Delete the pending user
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    // Log the action
    $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, 'reject', 'user', ?, ?)");
    $stmt->execute([$rejecterId, $userId, "Rejected user registration: {$user['email']} (by {$rejecterRole})"]);

    echo json_encode([
        'success' => true,
        'message' => "User {$user['name']} has been rejected and removed."
    ]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
