<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $eventId = $_GET['event_id'] ?? null;
    if (!$eventId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing event_id']);
        exit;
    }

    $subEventId = $_GET['sub_event_id'] ?? null;

    try {
        if ($subEventId) {
            $stmt = $pdo->prepare("SELECT p.*, se.title as sub_event_title FROM prizes p LEFT JOIN sub_events se ON p.sub_event_id = se.id WHERE p.sub_event_id = ? ORDER BY p.position ASC");
            $stmt->execute([$subEventId]);
        } else {
            $stmt = $pdo->prepare("SELECT p.*, se.title as sub_event_title FROM prizes p LEFT JOIN sub_events se ON p.sub_event_id = se.id WHERE p.event_id = ? ORDER BY p.position ASC");
            $stmt->execute([$eventId]);
        }
        echo json_encode($stmt->fetchAll());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
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
    
    if (!isset($data->event_id) || !isset($data->title) || !isset($data->position)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    try {
        $sql = "INSERT INTO prizes (event_id, sub_event_id, position, title, description, value) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->event_id,
            $data->sub_event_id ?? null,
            $data->position,
            $data->title,
            $data->description ?? '',
            $data->value ?? 0
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Fetch the created prize
        $stmt = $pdo->prepare("SELECT * FROM prizes WHERE id = ?");
        $stmt->execute([$id]);
        $prize = $stmt->fetch();
        
        echo json_encode(['success' => true, 'prize' => $prize]);
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

    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing prize id']);
        exit;
    }

    try {
        // Update prize with winner details
        $sql = "UPDATE prizes SET position=?, title=?, description=?, value=?, winner_id=?, winner_name=?, winner_section=?, winner_usn=?, sub_event_id=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->position ?? 1,
            $data->title ?? '',
            $data->description ?? '',
            $data->value ?? 0,
            $data->winner_id ?? null,
            $data->winner_name ?? null,
            $data->winner_section ?? null,
            $data->winner_usn ?? null,
            $data->sub_event_id ?? null,
            $data->id
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

    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM prizes WHERE id = ?");
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
