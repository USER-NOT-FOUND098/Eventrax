<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['role'];
$userId = $_SESSION['user_id'];

if ($method === 'GET') {
    // List volunteer applications
    try {
        if ($role === 'admin') {
            $sql = "SELECT va.*, se.title as sub_event_title, u.name as student_name, u.email as student_email 
                    FROM volunteer_applications va 
                    JOIN sub_events se ON va.sub_event_id = se.id 
                    JOIN users u ON va.student_id = u.id 
                    ORDER BY va.applied_at DESC";
            $stmt = $pdo->query($sql);
        } elseif ($role === 'creator') {
            // Creator sees applications for sub-events of their events
            $sql = "SELECT va.*, se.title as sub_event_title, u.name as student_name, u.email as student_email 
                    FROM volunteer_applications va 
                    JOIN sub_events se ON va.sub_event_id = se.id 
                    JOIN events e ON se.event_id = e.id
                    JOIN users u ON va.student_id = u.id 
                    WHERE e.creator_id = ?
                    ORDER BY va.applied_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);
        } elseif ($role === 'student') {
            // Student sees their own applications
            $sql = "SELECT va.*, se.title as sub_event_title 
                    FROM volunteer_applications va 
                    JOIN sub_events se ON va.sub_event_id = se.id 
                    WHERE va.student_id = ?
                    ORDER BY va.applied_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);
        } else {
            echo json_encode([]);
            exit;
        }

        echo json_encode($stmt->fetchAll());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // Apply for volunteer - Students only
    if ($role !== 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Only students can apply for volunteer positions']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->sub_event_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Sub-event ID required']);
        exit;
    }

    $subEventId = (int)$data->sub_event_id;
    $message = $data->message ?? '';

    try {
        // Check if sub-event exists
        $stmt = $pdo->prepare("SELECT se.*, e.title as event_title FROM sub_events se JOIN events e ON se.event_id = e.id WHERE se.id = ?");
        $stmt->execute([$subEventId]);
        $subEvent = $stmt->fetch();

        if (!$subEvent) {
            http_response_code(404);
            echo json_encode(['error' => 'Sub-event not found']);
            exit;
        }

        // Check if already applied
        $stmt = $pdo->prepare("SELECT id FROM volunteer_applications WHERE sub_event_id = ? AND student_id = ?");
        $stmt->execute([$subEventId, $userId]);
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Already applied for this volunteer position']);
            exit;
        }

        // Apply
        $stmt = $pdo->prepare("INSERT INTO volunteer_applications (sub_event_id, student_id, message) VALUES (?, ?, ?)");
        $stmt->execute([$subEventId, $userId, $message]);

        echo json_encode([
            'success' => true,
            'message' => "Applied to volunteer for {$subEvent['title']}. Awaiting approval.",
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
