<?php
require_once '../../config/cors.php';
// Cache bust 1
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    $eventId = $_GET['event_id'] ?? null;

    try {
        if ($id) {
            // Fetch single sub-event with its parent event title
            $stmt = $pdo->prepare("
                SELECT se.*, e.title as event_title, u.name as team_lead_name
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id
                LEFT JOIN users u ON se.team_lead_id = u.id 
                WHERE se.id = ?
            ");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        }
        elseif ($eventId) {
            // Fetch all for an event
            $stmt = $pdo->prepare("
                SELECT se.*, u.name as team_lead_name, se.team_lead_contact as team_lead_phone 
                FROM sub_events se 
                LEFT JOIN users u ON se.team_lead_id = u.id 
                WHERE se.event_id = ?
                ORDER BY se.start_time ASC
            ");
            $stmt->execute([$eventId]);
            $subEvents = $stmt->fetchAll();

            // Ensure banner_url is included in response
            foreach ($subEvents as &$subEvent) {
                if (!isset($subEvent['banner_url'])) {
                    $subEvent['banner_url'] = null;
                }
                // Map banner_url to banner for frontend compatibility
                $subEvent['banner'] = $subEvent['banner_url'];
            }

            echo json_encode($subEvents);
        }
        elseif (isset($_GET['all']) && $_GET['all'] === 'true') {
            // Fetch ALL sub-events regardless of event
            $stmt = $pdo->prepare("
                SELECT se.*, e.title as event_title, u.name as team_lead_name 
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id
                LEFT JOIN users u ON se.team_lead_id = u.id 
                ORDER BY se.start_time ASC
            ");
            $stmt->execute();
            $subEvents = $stmt->fetchAll();
            echo json_encode($subEvents);
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing event_id or id parameter']);
        }
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->event_id) || !isset($data->title)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    // Generate unique code
    $uniqueCode = 'SE-' . strtoupper(substr(md5(uniqid()), 0, 6));

    // Ownership Check: User must generally own the parent event to add sub-events
    // (Or be an Admin)
    if ($_SESSION['role'] !== 'admin') {
        $checkStmt = $pdo->prepare("SELECT creator_id, assigned_creator_id FROM events WHERE id = ?");
        $checkStmt->execute([$data->event_id]);
        $parentEvent = $checkStmt->fetch();

        if (!$parentEvent) {
            http_response_code(404);
            echo json_encode(['error' => 'Parent event not found']);
            exit;
        }

        // Allow Original Creator OR Assigned Creator
        if ($parentEvent['creator_id'] != $_SESSION['user_id'] && $parentEvent['assigned_creator_id'] != $_SESSION['user_id']) {
            // Strict Block for everyone else
            http_response_code(403);
            echo json_encode(['error' => 'Unauthorized. You do not own the parent event.']);
            exit;
        }
    }

    try {
        $sql = "INSERT INTO sub_events (event_id, title, description, start_time, end_time, venue, team_lead_id, team_lead_contact, section, unique_code, expected_time, budget, banner_url, lead_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->event_id,
            $data->title,
            $data->description ?? '',
            $data->start_time ?? date('Y-m-d H:i:s'),
            $data->end_time ?? date('Y-m-d H:i:s'),
            $data->venue ?? '',
            $data->team_lead_id ?? null,
            $data->team_lead_contact ?? '',
            $data->section ?? '',
            $uniqueCode,
            $data->expected_time ?? 60,
            $data->budget ?? 0,
            $data->banner_url ?? null,
            $data->lead_instructions ?? null
        ]);

        $id = $pdo->lastInsertId();

        // Fetch created sub-event
        $stmt = $pdo->prepare("SELECT * FROM sub_events WHERE id = ?");
        $stmt->execute([$id]);
        $subEvent = $stmt->fetch();

        echo json_encode(['success' => true, 'sub_event' => $subEvent, 'id' => $id]);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

}
elseif ($method === 'PUT') {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing sub-event id']);
        exit;
    }

    try {
        // Ownership Check: Only Admin or Parent Event Creator can edit
        // (Optionally Team Lead could, but user requested strict restriction for now)
        if ($_SESSION['role'] !== 'admin') {
            $checkStmt = $pdo->prepare("
                SELECT e.creator_id, e.assigned_creator_id 
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id 
                WHERE se.id = ?
            ");
            $checkStmt->execute([$data->id]);
            $parentEvent = $checkStmt->fetch();

            if (!$parentEvent) {
                http_response_code(404);
                echo json_encode(['error' => 'Sub-event not found']);
                exit;
            }

            if ($parentEvent['creator_id'] != $_SESSION['user_id'] && $parentEvent['assigned_creator_id'] != $_SESSION['user_id']) {
                // Strict Block
                http_response_code(403);
                echo json_encode(['error' => 'Unauthorized. You do not own the parent event.']);
                exit;
            }
        }

        // Get current team_lead_id to preserve it if not explicitly changed
        $currentStmt = $pdo->prepare("SELECT team_lead_id FROM sub_events WHERE id = ?");
        $currentStmt->execute([$data->id]);
        $currentData = $currentStmt->fetch();

        // Preserve team_lead_id if not explicitly provided or if it's null
        $teamLeadId = (property_exists($data, 'team_lead_id') && $data->team_lead_id !== null)
            ? $data->team_lead_id
            : ($currentData['team_lead_id'] ?? null);

        $sql = "UPDATE sub_events SET title=?, description=?, start_time=?, end_time=?, venue=?, team_lead_id=?, team_lead_contact=?, section=?, expected_time=?, status=?, budget=?, banner_url=?, lead_instructions=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->title,
            $data->description ?? '',
            $data->start_time,
            $data->end_time,
            $data->venue,
            $teamLeadId,
            $data->team_lead_contact ?? '',
            $data->section ?? '',
            $data->expected_time ?? 60,
            $data->status ?? 'upcoming',
            $data->budget ?? 0,
            $data->banner_url ?? null,
            $data->lead_instructions ?? null,
            $data->id
        ]);
        echo json_encode(['success' => true]);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'DELETE') {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing sub-event id']);
        exit;
    }

    try {
        // Ownership Check
        if ($_SESSION['role'] !== 'admin') {
            $checkStmt = $pdo->prepare("
                SELECT e.creator_id, e.assigned_creator_id 
                FROM sub_events se 
                JOIN events e ON se.event_id = e.id 
                WHERE se.id = ?
            ");
            $checkStmt->execute([$id]);
            $parentEvent = $checkStmt->fetch();

            if (!$parentEvent) {
                // If sub-event doesn't exist, we can't delete it anyway
                // But let's return 404 for clarity or let the DELETE below handle it (which returns success on non-existent rows usually)
                // Better to fail if not found for strictness
                http_response_code(404);
                echo json_encode(['error' => 'Sub-event not found']);
                exit;
            }

            // Allow Original Creator OR Assigned Creator to delete SUB-EVENTS
            if ($parentEvent['creator_id'] != $_SESSION['user_id'] && $parentEvent['assigned_creator_id'] != $_SESSION['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Unauthorized. You do not own the parent event.']);
                exit;
            }
        }

        $stmt = $pdo->prepare("DELETE FROM sub_events WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
