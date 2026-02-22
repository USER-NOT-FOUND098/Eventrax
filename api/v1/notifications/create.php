<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin', 'creator']);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user_id']) || !isset($data['title']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID, title, and message are required']);
    exit;
}

$recipientId = (int)$data['user_id'];
$title = trim($data['title']);
$message = trim($data['message']);
$type = isset($data['type']) ? trim($data['type']) : 'system';
$subEventId = isset($data['sub_event_id']) ? (int)$data['sub_event_id'] : null;
$eventId = isset($data['event_id']) ? (int)$data['event_id'] : null;

try {
    // Verify recipient exists
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $checkStmt->execute([$recipientId]);
    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Recipient user not found']);
        exit;
    }

    // Generate link based on event/sub-event
    $link = null;
    if ($subEventId) {
        $link = "/team/sub-events/" . $subEventId;
    }
    elseif ($eventId) {
        $link = "/events/" . $eventId;
    }

    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
    ");

    $stmt->execute([
        $recipientId,
        $type,
        $title,
        $message,
        $link
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Notification sent successfully',
        'id' => $pdo->lastInsertId()
    ]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send notification: ' . $e->getMessage()]);
}
?>
