<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Team leads only can propose, Creators/Admin can finalize
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->sub_event_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Sub-event ID required']);
    exit;
}

$subEventId = (int)$data->sub_event_id;
$userId = $_SESSION['user_id'];
$role = $_SESSION['role'];

try {
    // Get sub-event with ownership check
    $sql = "SELECT se.*, e.creator_id, e.title as event_title 
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

    // Team lead can only propose for their assigned sub-events
    if ($role === 'teamlead') {
        if ($subEvent['team_lead_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'You can only propose changes for sub-events assigned to you']);
            exit;
        }

        // Team leads can only propose, not finalize
        if (!isset($data->proposed_start) || !isset($data->proposed_end)) {
            http_response_code(400);
            echo json_encode(['error' => 'Proposed start and end times required']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE sub_events SET proposed_start = ?, proposed_end = ? WHERE id = ?");
        $stmt->execute([$data->proposed_start, $data->proposed_end, $subEventId]);

        echo json_encode([
            'success' => true,
            'message' => "Schedule proposal submitted. Awaiting creator approval."
        ]);

    } elseif (in_array($role, ['admin', 'creator'])) {
        // Creator/Admin can finalize
        if ($role === 'creator' && $subEvent['creator_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'You can only finalize your own events']);
            exit;
        }

        $updates = [];
        $params = [];

        if (isset($data->start_time)) {
            $updates[] = "start_time = ?";
            $params[] = $data->start_time;
        }
        if (isset($data->end_time)) {
            $updates[] = "end_time = ?";
            $params[] = $data->end_time;
        }
        if (isset($data->menu)) {
            $updates[] = "menu = ?";
            $params[] = $data->menu;
        }
        if (isset($data->finalized)) {
            $updates[] = "finalized = ?";
            $params[] = $data->finalized ? 1 : 0;
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        $params[] = $subEventId;
        $sql = "UPDATE sub_events SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode([
            'success' => true,
            'message' => "Sub-event schedule has been finalized."
        ]);
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized role']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
