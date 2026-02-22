<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll();
        
        // Map to camelCase
        $mapped = array_map(function($n) {
            return [
                'id' => $n['id'],
                'title' => $n['title'],
                'message' => $n['message'],
                'type' => $n['type'],
                'read' => (bool)$n['is_read'],
                'createdAt' => $n['created_at']
            ];
        }, $notifications);
        
        echo json_encode($mapped);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $notifId = $data->notification_id ?? null;
    
    if (!$notifId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing notification_id']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$notifId, $userId]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
}
?>
