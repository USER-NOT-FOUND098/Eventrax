<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List registrations - requires authentication
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    try {
        $role = $_SESSION['role'];
        $userId = $_SESSION['user_id'];

        if ($role === 'admin') {
            // Admin sees all registrations
            $sql = "SELECT r.*, e.title as event_title, u.name as student_name, u.email as student_email 
                    FROM registrations r 
                    JOIN events e ON r.event_id = e.id 
                    JOIN users u ON r.student_id = u.id 
                    ORDER BY r.registered_at DESC";
            $stmt = $pdo->query($sql);
        } elseif ($role === 'creator') {
            // Creator sees registrations for their events
            $sql = "SELECT r.*, e.title as event_title, u.name as student_name, u.email as student_email 
                    FROM registrations r 
                    JOIN events e ON r.event_id = e.id 
                    JOIN users u ON r.student_id = u.id 
                    WHERE e.creator_id = ?
                    ORDER BY r.registered_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);
        } elseif ($role === 'student') {
            // Student sees their own registrations
            $sql = "SELECT r.*, e.title as event_title 
                    FROM registrations r 
                    JOIN events e ON r.event_id = e.id 
                    WHERE r.student_id = ?
                    ORDER BY r.registered_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->query("SELECT 1 WHERE 1=0"); // Empty result
        }

        echo json_encode($stmt->fetchAll());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // Register for an event - Students only
    session_start();
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Only students can register for events']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->event_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID required']);
        exit;
    }

    $eventId = (int)$data->event_id;
    $studentId = $_SESSION['user_id'];

    try {
        // Check if event exists
        $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }

        // Check if already registered
        $stmt = $pdo->prepare("SELECT id FROM registrations WHERE event_id = ? AND student_id = ?");
        $stmt->execute([$eventId, $studentId]);
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Already registered for this event']);
            exit;
        }

        // Register
        $stmt = $pdo->prepare("INSERT INTO registrations (event_id, student_id, status) VALUES (?, ?, 'confirmed')");
        $stmt->execute([$eventId, $studentId]);

        echo json_encode([
            'success' => true,
            'message' => "Successfully registered for {$event['title']}",
            'registration_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    // Cancel registration - Student only
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $registrationId = $_GET['id'] ?? null;
    if (!$registrationId) {
        http_response_code(400);
        echo json_encode(['error' => 'Registration ID required']);
        exit;
    }

    try {
        // Verify ownership
        $stmt = $pdo->prepare("SELECT * FROM registrations WHERE id = ? AND student_id = ?");
        $stmt->execute([$registrationId, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Registration not found or not yours']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
        $stmt->execute([$registrationId]);

        echo json_encode(['success' => true, 'message' => 'Registration cancelled']);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
