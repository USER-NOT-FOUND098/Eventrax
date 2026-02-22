<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $subEventId = $_GET['sub_event_id'] ?? null;
    if (!$subEventId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing sub_event_id']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM accessories WHERE sub_event_id = ? ORDER BY id ASC");
        $stmt->execute([$subEventId]);
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

    $data = json_decode(file_get_contents("php://input"));
    if (!isset($data->sub_event_id) || !isset($data->name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    try {
        $sql = "INSERT INTO accessories (sub_event_id, name, quantity, unit_cost, status) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->sub_event_id,
            $data->name,
            $data->quantity ?? 1,
            $data->unit_cost ?? 0.00,
            $data->status ?? 'available'
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
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
        echo json_encode(['error' => 'Missing resource id']);
        exit;
    }

    try {
        $sql = "UPDATE accessories SET name=?, quantity=?, unit_cost=?, status=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->name,
            $data->quantity,
            $data->unit_cost,
            $data->status,
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
        echo json_encode(['error' => 'Missing resource id']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM accessories WHERE id = ?");
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
