<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List Events
    try {
        $sql = "SELECT e.*, u.name as creator_name FROM events e JOIN users u ON e.creator_id = u.id ORDER BY e.start_date ASC";
        // If query param 'id' is present, fetch one
        if (isset($_GET['id'])) {
             $sql = "SELECT e.*, u.name as creator_name FROM events e JOIN users u ON e.creator_id = u.id WHERE e.id = ?";
             $stmt = $pdo->prepare($sql);
             $stmt->execute([$_GET['id']]);
             $event = $stmt->fetch();
             echo json_encode($event ?: null);
             exit;
        }

        // If 'created_by_admin=true', filter events created by admins
        if (isset($_GET['created_by_admin']) && $_GET['created_by_admin'] === 'true') {
            $sql = "SELECT e.*, u.name as creator_name FROM events e JOIN users u ON e.creator_id = u.id WHERE u.role = 'admin' ORDER BY e.start_date ASC";
            $stmt = $pdo->query($sql);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // If 'mine=true', filter by creator_id from session (unless admin)
        if (isset($_GET['mine']) && $_GET['mine'] === 'true') {
            session_start();
            if (isset($_SESSION['user_id'])) {
                // If admin, show all events. If creator, show only their events
                if (isset($_SESSION['role']) && strtolower($_SESSION['role']) === 'admin') {
                    $sql = "SELECT e.*, u.name as creator_name FROM events e JOIN users u ON e.creator_id = u.id ORDER BY e.start_date ASC";
                    $stmt = $pdo->query($sql);
                } else {
                    // Start session if not started (safety check, though already started above)
                    // For creators: show events created BY them OR assigned TO them
                    $sql = "SELECT e.*, u.name as creator_name FROM events e JOIN users u ON e.creator_id = u.id WHERE e.creator_id = ? OR e.assigned_creator_id = ? ORDER BY e.start_date ASC";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id']]);
                }
                echo json_encode($stmt->fetchAll());
                exit;
            }
        }

        $stmt = $pdo->query($sql);
        $events = $stmt->fetchAll();
        echo json_encode($events);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Create Event
    session_start();
    if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['admin', 'creator'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));
    
    // Validation omitted for brevity, assume valid input
    try {
        $sql = "INSERT INTO events (title, description, poster, banner, venue, start_date, end_date, budget, creator_id, creator_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->title,
            $data->description ?? '',
            $data->poster ?? '',
            $data->banner ?? '',
            $data->venue,
            $data->start_date,
            $data->end_date,
            $data->budget ?? 0,
            $_SESSION['user_id'],
            $data->creator_instructions ?? ''
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
}
?>
