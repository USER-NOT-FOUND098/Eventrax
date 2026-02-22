<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Admin only
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

if (!isset($data->user_id) || !isset($data->action)) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID and action required']);
    exit;
}

$userId = (int)$data->user_id;
$action = $data->action; // 'suspend' or 'activate'
$reason = $data->reason ?? '';
$adminId = $_SESSION['user_id'];

// Cannot suspend yourself
if ($userId === $adminId) {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot modify your own account']);
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

    // Cannot suspend other admins
    if ($user['role'] === 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Cannot modify admin accounts']);
        exit;
    }

    $newStatus = ($action === 'suspend') ? 'suspended' : 'active';
    
    $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $userId]);

    // Log admin action
    $stmt = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, 'user', ?, ?)");
    $stmt->execute([$adminId, $action, $userId, "Action: $action on {$user['email']}. Reason: $reason"]);

    $message = ($action === 'suspend') 
        ? "User {$user['name']} has been suspended."
        : "User {$user['name']} has been reactivated.";

    echo json_encode([
        'success' => true,
        'message' => $message,
        'newStatus' => $newStatus
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
