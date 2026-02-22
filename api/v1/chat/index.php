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

    session_start();
    $currentUserId = $_SESSION['user_id'] ?? null;
    $currentRole = $_SESSION['role'] ?? 'student';

    $subEventId = $_GET['sub_event_id'] ?? null;

    try {
        // Get messages with sender info
        if ($subEventId) {
            $stmt = $pdo->prepare("
                SELECT cm.*, u.name as sender_name, u.role as sender_role
                FROM chat_messages cm 
                LEFT JOIN users u ON cm.sender_id = u.id 
                WHERE cm.sub_event_id = ? 
                ORDER BY cm.created_at ASC
            ");
            $stmt->execute([$subEventId]);
        } else {
            $stmt = $pdo->prepare("
                SELECT cm.*, u.name as sender_name, u.role as sender_role
                FROM chat_messages cm 
                LEFT JOIN users u ON cm.sender_id = u.id 
                WHERE cm.event_id = ? AND cm.sub_event_id IS NULL
                ORDER BY cm.created_at ASC
            ");
            $stmt->execute([$eventId]);
        }
        $messages = $stmt->fetchAll();

        // For students, show proper names for admin/creator/teamlead, anonymize only other students
        if ($currentRole === 'student') {
            foreach ($messages as &$msg) {
                if ($msg['sender_role'] === 'admin') {
                    $msg['sender_name'] = $msg['sender_name'] . ' (System Admin)';
                } elseif ($msg['sender_role'] === 'creator') {
                    $msg['sender_name'] = $msg['sender_name'] . ' (Creator)';
                } elseif ($msg['sender_role'] === 'teamlead') {
                    $msg['sender_name'] = $msg['sender_name'] . ' (Team Lead)';
                } else {
                    // Anonymize other students
                    $msg['sender_name'] = 'Anonymous Student';
                    $msg['sender_role'] = 'student';
                }
            }
        }

        echo json_encode($messages);
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
    
    // Students can only send messages to sub-events (duty chat)
    // Admin/Creator/TeamLead can send to any event
    if ($_SESSION['role'] === 'student') {
        if (!isset($data->sub_event_id)) {
            http_response_code(403);
            echo json_encode(['error' => 'Students can only send messages to sub-events']);
            exit;
        }
    }
    
    if (!isset($data->event_id) || !isset($data->content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    if (trim($data->content) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit;
    }

    try {
        $sql = "INSERT INTO chat_messages (event_id, sender_id, content, is_announcement, sub_event_id) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->event_id,
            $_SESSION['user_id'],
            trim($data->content),
            $data->is_announcement ?? false,
            $data->sub_event_id ?? null
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Fetch the created message with sender info
        $stmt = $pdo->prepare("
            SELECT cm.*, u.name as sender_name, u.role as sender_role
            FROM chat_messages cm 
            LEFT JOIN users u ON cm.sender_id = u.id 
            WHERE cm.id = ?
        ");
        $stmt->execute([$id]);
        $message = $stmt->fetch();
        
        echo json_encode(['success' => true, 'message' => $message]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
