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

    try {
        $stmt = $pdo->prepare("
            SELECT e.*, se.title as sub_event_title
            FROM expenses e 
            LEFT JOIN sub_events se ON e.sub_event_id = se.id
            WHERE e.event_id = ?
            ORDER BY e.created_at DESC
        ");
        $stmt->execute([$eventId]);
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
    
    if (!isset($data->event_id) || !isset($data->title) || !isset($data->amount)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    try {
        $sql = "INSERT INTO expenses (event_id, title, description, amount, quantity, category, sub_event_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->event_id,
            $data->title,
            $data->description ?? '',
            $data->amount,
            $data->quantity ?? 1,
            $data->category ?? 'Other',
            $data->sub_event_id ?? null,
            $_SESSION['user_id']
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Fetch created expense
        $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        $expense = $stmt->fetch();
        
        echo json_encode(['success' => true, 'expense' => $expense, 'id' => $id]);
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
        echo json_encode(['error' => 'Missing expense id']);
        exit;
    }

    try {
        $sql = "UPDATE expenses SET title=?, description=?, amount=?, quantity=?, category=?, sub_event_id=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->title,
            $data->description ?? '',
            $data->amount,
            $data->quantity ?? 1,
            $data->category ?? 'Other',
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
        $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
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
