<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check authentication
    checkAuth();
    
    try {
        $event_id = $_GET['id'] ?? null;
        $user_role = $_SESSION['role'] ?? null;
        $user_id = $_SESSION['user_id'] ?? null;
        
        if (!$event_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Event ID is required']);
            exit;
        }
        
        // Base query to get event details
        $sql = "SELECT e.*, u.name as creator_name, u.email as creator_email 
                FROM events e 
                JOIN users u ON e.creator_id = u.id 
                WHERE e.id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$event_id]);
        $event = $stmt->fetch();
        
        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }
        
        // Role-based access control
        switch ($user_role) {
            case 'admin':
                // Admins can view all events
                break;
                
            case 'creator':
                // Creators can view their own events and assigned events
                if ($event['creator_id'] != $user_id && $event['assigned_creator_id'] != $user_id) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied: You can only view your own or assigned events']);
                    exit;
                }
                break;
                
            case 'teamlead':
                // Team leads can view events they're assigned to
                $assignedSql = "SELECT COUNT(*) FROM event_assignments WHERE event_id = ? AND teamlead_id = ?";
                $assignedStmt = $pdo->prepare($assignedSql);
                $assignedStmt->execute([$event_id, $user_id]);
                $isAssigned = $assignedStmt->fetchColumn() > 0;
                
                if (!$isAssigned) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Access denied: You can only view assigned events']);
                    exit;
                }
                break;
                
            case 'student':
                // Students can view all events but with limited data
                // Remove sensitive information
                unset($event['budget'], $event['creator_email']);
                
                // Check if student is registered for this event
                $regSql = "SELECT status FROM registrations WHERE event_id = ? AND student_id = ?";
                $regStmt = $pdo->prepare($regSql);
                $regStmt->execute([$event_id, $user_id]);
                $registration = $regStmt->fetch();
                
                $event['user_registration'] = $registration ? $registration['status'] : null;
                $event['can_register'] = $event['status'] === 'upcoming' && !$registration;
                $event['can_view_details'] = true; // Students can view basic details
                $event['can_edit'] = false; // Students cannot edit
                $event['can_delete'] = false; // Students cannot delete
                $event['can_manage_subevents'] = false; // Students cannot manage sub-events
                
                // For frontend compatibility, treat 'confirmed' as 'registered'
                if ($registration && $registration['status'] === 'confirmed') {
                    $event['user_registration'] = 'registered';
                }
                break;
                
            default:
                http_response_code(403);
                echo json_encode(['error' => 'Access denied']);
                exit;
        }
        
        // Add sub-events for non-student users
        if ($user_role !== 'student') {
            $subEventSql = "SELECT * FROM sub_events WHERE event_id = ? ORDER BY start_time ASC";
            $subEventStmt = $pdo->prepare($subEventSql);
            $subEventStmt->execute([$event_id]);
            $event['sub_events'] = $subEventStmt->fetchAll();
        } else {
            // Students only get basic sub-event info
            $subEventSql = "SELECT id, title, description, venue, start_time, end_time, status FROM sub_events WHERE event_id = ? ORDER BY start_time ASC";
            $subEventStmt = $pdo->prepare($subEventSql);
            $subEventStmt->execute([$event_id]);
            $event['sub_events'] = $subEventStmt->fetchAll();
        }
        
        // Add registration count for all users
        $regCountSql = "SELECT COUNT(*) as count FROM registrations WHERE event_id = ?";
        $regCountStmt = $pdo->prepare($regCountSql);
        $regCountStmt->execute([$event_id]);
        $event['registration_count'] = $regCountStmt->fetch()['count'];
        
        echo json_encode($event);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
