<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Creators and Admins only
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['admin', 'creator'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized. Creator or Admin access required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->sub_event_id) || !isset($data->team_lead_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Sub-event ID and Team Lead ID required']);
    exit;
}

$subEventId = (int)$data->sub_event_id;
$teamLeadId = (int)$data->team_lead_id;
$userId = $_SESSION['user_id'];
$role = $_SESSION['role'];

try {
    // Get sub-event with ownership check
    $sql = "SELECT se.*, se.creator_id as sub_event_creator_id, e.creator_id as event_creator_id, e.title as event_title 
            FROM sub_events se 
            JOIN events e ON se.event_id = e.id
            WHERE se.id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$subEventId]);
    $subEvent = $stmt->fetch();

    if (!$subEvent) {
        http_response_code(404);
        echo json_encode(['error' => 'Sub-event not found']);
        exit;
    }

    // Check permission - only event creator, sub-event creator, or admin can assign
    // Allow if user created the SUB-EVENT OR users created the PARENT EVENT
    $isSubEventCreator = ($subEvent['sub_event_creator_id'] == $userId);
    $isEventCreator = ($subEvent['event_creator_id'] == $userId);

    if ($role !== 'admin' && !$isSubEventCreator && !$isEventCreator) {
        http_response_code(403);
        echo json_encode(['error' => "You can only assign team leads for your own events or sub-events. Debug: Role=$role, SubEventCreator={$subEvent['sub_event_creator_id']}, EventCreator={$subEvent['event_creator_id']}, UserID=$userId"]);
        exit;
    }

    // Verify team lead exists and is a teamlead
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND role = 'teamlead' AND status = 'active'");
    $stmt->execute([$teamLeadId]);
    $teamLead = $stmt->fetch();

    if (!$teamLead) {
        http_response_code(404);
        echo json_encode(['error' => 'Team lead not found or not an active team lead']);
        exit;
    }

    // Assign team lead
    $stmt = $pdo->prepare("UPDATE sub_events SET team_lead_id = ? WHERE id = ?");
    $stmt->execute([$teamLeadId, $subEventId]);

    echo json_encode([
        'success' => true,
        'message' => "{$teamLead['name']} has been assigned as team lead for {$subEvent['title']}"
    ]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
