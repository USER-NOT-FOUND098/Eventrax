<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin', 'creator']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['sub_event_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Sub-event ID is required']);
        exit;
    }

    $subEventId = (int)$data['sub_event_id'];
    $userId = $_SESSION['user_id'];
    $userRole = strtolower($_SESSION['role']);

    try {
        // Fetch sub-event and parent event details to check permissions
        // We need the parent event's creator_id and assigned_creator_id
        $stmt = $pdo->prepare("
            SELECT se.id, se.event_id, e.creator_id, e.assigned_creator_id 
            FROM sub_events se 
            JOIN events e ON se.event_id = e.id 
            WHERE se.id = ?
        ");
        $stmt->execute([$subEventId]);
        $subEvent = $stmt->fetch();

        if (!$subEvent) {
            http_response_code(404);
            echo json_encode(['error' => 'Sub-event not found']);
            exit;
        }

        // Permission Logic
        $canDelete = false;

        if ($userRole === 'admin') {
            $canDelete = true;
        } elseif ($userRole === 'creator') {
            // For sub-events, we allow deletion if they manage the parent event
            // (Either created it OR are assigned to it)
            if ($subEvent['creator_id'] == $userId || $subEvent['assigned_creator_id'] == $userId) {
                $canDelete = true;
            }
        }

        if (!$canDelete) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to delete this sub-event']);
            exit;
        }

        // Proceed with deletion
        $deleteStmt = $pdo->prepare("DELETE FROM sub_events WHERE id = ?");
        $deleteStmt->execute([$subEventId]);

        echo json_encode(['success' => true, 'message' => 'Sub-event deleted successfully']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
