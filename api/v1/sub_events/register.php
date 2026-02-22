<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// Check if user is authenticated
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// If not authenticated, return error
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check role - allow all authenticated users for now
// checkRole(['student']);

if ($method === 'GET') {
    try {
        $student_id = $_SESSION['user_id'];
        $sub_event_id = $_GET['sub_event_id'] ?? null;
        
        if ($sub_event_id) {
            // Check if student is registered for this sub-event
            $sql = "SELECT r.*, se.title, se.description, se.venue, se.start_time, se.end_time, se.status,
                    e.title as event_title, e.poster as event_poster
                    FROM sub_event_registrations r 
                    JOIN sub_events se ON r.sub_event_id = se.id 
                    JOIN events e ON se.event_id = e.id 
                    WHERE r.student_id = ? AND r.sub_event_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$student_id, $sub_event_id]);
            $registration = $stmt->fetch();
            
            echo json_encode($registration);
            exit; // Add exit to prevent continuing to else block
        } else {
            // Get all sub-event registrations for current student
            $sql = "SELECT r.*, se.title, se.description, se.venue, se.start_time, se.end_time, se.status,
                    e.title as event_title, e.poster as event_poster
                    FROM sub_event_registrations r 
                    JOIN sub_events se ON r.sub_event_id = se.id 
                    JOIN events e ON se.event_id = e.id 
                    WHERE r.student_id = ? 
                    ORDER BY se.start_time DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$student_id]);
            $registrations = $stmt->fetchAll();
            
            echo json_encode($registrations);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit; // Add exit to prevent continuing to POST block
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    try {
        $student_id = $_SESSION['user_id'];
        $sub_event_id = $data->sub_event_id ?? null;
        
        if (!$sub_event_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Sub-event ID is required']);
            exit;
        }
        
        // Check if sub-event exists and is upcoming
        $subEventSql = "SELECT se.id, se.title, se.status, se.event_id, e.title as event_title, e.status as event_status
                        FROM sub_events se 
                        JOIN events e ON se.event_id = e.id 
                        WHERE se.id = ?";
        $subEventStmt = $pdo->prepare($subEventSql);
        $subEventStmt->execute([$sub_event_id]);
        $subEvent = $subEventStmt->fetch();
        
        if (!$subEvent) {
            http_response_code(404);
            echo json_encode(['error' => 'Sub-event not found']);
            exit;
        }
        
        // Removed status check - allow registration for any sub-event as long as user is registered for main event
        // if ($subEvent['status'] !== 'upcoming' || $subEvent['event_status'] !== 'upcoming') {
        //     http_response_code(400);
        //     echo json_encode(['error' => 'Registration is only open for upcoming sub-events']);
        //     exit;
        // }
        
        // Check if student is registered for the main event
        $mainEventRegSql = "SELECT id, status FROM registrations WHERE student_id = ? AND event_id = ?";
        $mainEventRegStmt = $pdo->prepare($mainEventRegSql);
        $mainEventRegStmt->execute([$student_id, $subEvent['event_id']]);
        $mainEventReg = $mainEventRegStmt->fetch();
        
        if (!$mainEventReg || !in_array($mainEventReg['status'], ['registered', 'confirmed'])) {
            http_response_code(400);
            echo json_encode(['error' => 'You must register for the main event first']);
            exit;
        }
        
        // Check if already registered for this sub-event
        $existingSql = "SELECT id FROM sub_event_registrations WHERE student_id = ? AND sub_event_id = ?";
        $existingStmt = $pdo->prepare($existingSql);
        $existingStmt->execute([$student_id, $sub_event_id]);
        
        if ($existingStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'You are already registered for this sub-event']);
            exit;
        }
        
        // Create sub-event registration
        $insertSql = "INSERT INTO sub_event_registrations (student_id, sub_event_id, status, registered_at) VALUES (?, ?, 'registered', NOW())";
        $insertStmt = $pdo->prepare($insertSql);
        
        if ($insertStmt->execute([$student_id, $sub_event_id])) {
            echo json_encode([
                'success' => true,
                'message' => 'Successfully registered for ' . $subEvent['title'],
                'registration_id' => $pdo->lastInsertId()
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to register for sub-event']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

if ($method === 'DELETE') {
    try {
        $student_id = $_SESSION['user_id'];
        $sub_event_id = $_GET['sub_event_id'] ?? null;
        
        if (!$sub_event_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Sub-event ID is required']);
            exit;
        }
        
        // Delete sub-event registration (only if it belongs to current student)
        $deleteSql = "DELETE FROM sub_event_registrations WHERE student_id = ? AND sub_event_id = ?";
        $deleteStmt = $pdo->prepare($deleteSql);
        
        if ($deleteStmt->execute([$student_id, $sub_event_id])) {
            if ($deleteStmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Sub-event registration cancelled successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Sub-event registration not found']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to cancel sub-event registration']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
