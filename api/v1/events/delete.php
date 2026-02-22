<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin', 'creator']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['event_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID is required']);
        exit;
    }

    $eventId = (int)$data['event_id'];
    $userId = $_SESSION['user_id'];
    $userRole = strtolower($_SESSION['role']);

    try {
        // Fetch event details to check permissions
        $stmt = $pdo->prepare("SELECT id, creator_id, assigned_creator_id FROM events WHERE id = ?");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }

        // Permission Logic
        $canDelete = false;

        if ($userRole === 'admin') {
            $canDelete = true;
        } elseif ($userRole === 'creator') {
            // Creators can ONLY delete their own created events.
            // They CANNOT delete events assigned to them.
            if ($event['creator_id'] == $userId) {
                $canDelete = true;
            }
        }

        if (!$canDelete) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to delete this event']);
            exit;
        }

        // Proceed with deletion
        // Note: Assuming Foreign Keys are set to CASCADE. 
        // If not, we'd need to manually delete sub_events, expenses, etc.
        // For robustness, we'll rely on the DB, but wrap in try-catch for FK errors.
        
        $deleteStmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
        $deleteStmt->execute([$eventId]);

        echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);

    } catch (PDOException $e) {
        // Handle FK Constraint violations if CASCADE isn't set
        if ($e->getCode() == '23000') {
             http_response_code(400);
             echo json_encode(['error' => 'Cannot delete event because it has related data (Sub-events, Registrations, etc.)']);
             // In a full implementation, we might want to manually delete children here if cascade is missing.
        } else {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
