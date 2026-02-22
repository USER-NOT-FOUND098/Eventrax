<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing ID']);
    exit;
}

if ($method === 'GET') {
    // Fetch single event with computed fields
    try {
        // Get base event data
        $stmt = $pdo->prepare("
            SELECT e.*, u.name as creator_name 
            FROM events e 
            LEFT JOIN users u ON e.creator_id = u.id 
            WHERE e.id = ?
        ");
        $stmt->execute([$id]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }

        // Get total expenses
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE event_id = ?");
        $stmt->execute([$id]);
        $event['total_expenses'] = (float) $stmt->fetch()['total'];

        // Get sub-event count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM sub_events WHERE event_id = ?");
        $stmt->execute([$id]);
        $event['sub_event_count'] = (int) $stmt->fetch()['count'];

        // Get volunteer count (from sub_events)
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT v.id) as count 
            FROM volunteers v 
            INNER JOIN sub_events se ON v.sub_event_id = se.id 
            WHERE se.event_id = ?
        ");
        $stmt->execute([$id]);
        $event['volunteer_count'] = (int) $stmt->fetch()['count'];

        // Get registration count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM registrations WHERE event_id = ?");
        $stmt->execute([$id]);
        $event['attendee_count'] = (int) $stmt->fetch()['count'];

        // Get prize count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM prizes WHERE event_id = ?");
        $stmt->execute([$id]);
        $event['prize_count'] = (int) $stmt->fetch()['count'];

        // Get announcement count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM announcements WHERE event_id = ?");
        $stmt->execute([$id]);
        $event['announcement_count'] = (int) $stmt->fetch()['count'];

        echo json_encode($event);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'PUT') {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    if ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'creator') {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));
    
    try {
        $sql = "UPDATE events SET title=?, description=?, venue=?, start_date=?, end_date=?, budget=?, status=?, creator_instructions=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->title,
            $data->description,
            $data->venue,
            $data->start_date,
            $data->end_date,
            $data->budget,
            $data->status,
            $data->creator_instructions ?? null,
            $id
        ]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    if ($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'creator') {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
