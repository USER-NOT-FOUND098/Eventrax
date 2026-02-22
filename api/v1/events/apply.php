<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['creator', 'admin']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Creator applies to manage an event
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['event_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID is required']);
        exit;
    }

    $eventId = (int)$data['event_id'];
    $creatorId = $_SESSION['user_id'];
    $message = $data['message'] ?? '';

    try {
        // Check if event exists
        $stmt = $pdo->prepare("SELECT id, title, creator_id, assigned_creator_id FROM events WHERE id = ?");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }

        // Check if creator is already the owner
        if ($event['creator_id'] == $creatorId) {
            http_response_code(400);
            echo json_encode(['error' => 'You are already the creator of this event']);
            exit;
        }

        // Check if already assigned
        if ($event['assigned_creator_id'] == $creatorId) {
            http_response_code(400);
            echo json_encode(['error' => 'You are already assigned to this event']);
            exit;
        }

        // Check if already applied
        $stmt = $pdo->prepare("SELECT id, status FROM event_applications WHERE event_id = ? AND creator_id = ?");
        $stmt->execute([$eventId, $creatorId]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['status'] === 'pending') {
                http_response_code(400);
                echo json_encode(['error' => 'You have already applied to this event']);
                exit;
            } elseif ($existing['status'] === 'approved') {
                http_response_code(400);
                echo json_encode(['error' => 'Your application was already approved']);
                exit;
            }
            // If rejected, allow reapplication by updating the existing record
            $stmt = $pdo->prepare("UPDATE event_applications SET status = 'pending', message = ?, applied_at = NOW() WHERE id = ?");
            $stmt->execute([$message, $existing['id']]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Application resubmitted successfully',
                'application_id' => $existing['id']
            ]);
            exit;
        }

        // Create new application
        $stmt = $pdo->prepare("INSERT INTO event_applications (event_id, creator_id, message) VALUES (?, ?, ?)");
        $stmt->execute([$eventId, $creatorId, $message]);

        echo json_encode([
            'success' => true,
            'message' => 'Application submitted successfully',
            'application_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
