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
$role = $_SESSION['role'];

try {
    if ($role === 'teamlead') {
        // Team lead sees their assigned sub-events
        $sql = "SELECT se.*, e.title as event_title, e.start_date as event_start, e.end_date as event_end
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id 
                WHERE se.team_lead_id = ?
                ORDER BY se.start_time ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
    } elseif ($role === 'admin') {
        // Admin sees all sub-events
        $sql = "SELECT se.*, e.title as event_title, u.name as team_lead_name
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id 
                LEFT JOIN users u ON se.team_lead_id = u.id
                ORDER BY se.start_time ASC";
        $stmt = $pdo->query($sql);
    } elseif ($role === 'creator') {
        // Creator sees sub-events for their events (created or assigned)
        $sql = "SELECT se.*, e.title as event_title, u.name as team_lead_name
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id 
                LEFT JOIN users u ON se.team_lead_id = u.id
                WHERE e.creator_id = ? OR e.assigned_creator_id = ?
                ORDER BY se.start_time ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $userId]);
    } elseif ($role === 'student') {
        // Student sees sub-events they are registered for
        $sql = "SELECT ser.*, se.title, se.description, se.venue, se.start_time, se.end_time, se.status as sub_event_status,
                e.title as event_title, e.id as event_id, e.start_date as event_start_date, e.end_date as event_end_date
                FROM sub_event_registrations ser 
                JOIN sub_events se ON ser.sub_event_id = se.id 
                JOIN events e ON se.event_id = e.id 
                WHERE ser.student_id = ? 
                ORDER BY e.start_date DESC, se.start_time ASC";
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
?>
