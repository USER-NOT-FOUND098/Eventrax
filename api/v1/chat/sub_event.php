<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Check if user is authenticated
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$userName = $_SESSION['name'] ?? 'Anonymous';
$userRole = $_SESSION['role'] ?? 'student';

if ($method === 'GET') {
    $subEventId = $_GET['sub_event_id'] ?? null;
    
    if (!$subEventId) {
        http_response_code(400);
        echo json_encode(['error' => 'Sub-event ID required']);
        exit;
    }
    
    try {
        // Use the existing chat_messages table
        $stmt = $pdo->prepare("
            SELECT c.*, u.name as sender_name, u.role as sender_role
            FROM chat_messages c 
            LEFT JOIN users u ON c.sender_id = u.id 
            WHERE c.sub_event_id = ? AND c.is_announcement = 0
            ORDER BY c.created_at ASC
        ");
        $stmt->execute([$subEventId]);
        $messages = $stmt->fetchAll();
        
        echo json_encode($messages);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $subEventId = $data->sub_event_id ?? null;
    $message = $data->message ?? '';
    $isAnonymous = $data->is_anonymous ?? true;
    
    if (!$subEventId || empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'Sub-event ID and message required']);
        exit;
    }
    
    try {
        // Check if table exists
        try {
            $pdo->query("CREATE TABLE IF NOT EXISTS sub_event_chat (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sub_event_id INT NOT NULL,
                user_id INT NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                is_anonymous BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )");
        } catch (PDOException $e) {
            // Table might already exist
        }
        
        // Check if user is registered for this sub-event
        $checkReg = $pdo->prepare("
            SELECT id FROM sub_event_registrations 
            WHERE sub_event_id = ? AND student_id = ?
        ");
        $checkReg->execute([$subEventId, $userId]);
        
        if ($checkReg->rowCount() === 0 && $userRole !== 'admin' && $userRole !== 'creator' && $userRole !== 'teamlead') {
            http_response_code(403);
            echo json_encode(['error' => 'You must register for this sub-event to chat']);
            exit;
        }
        
        $displayName = $isAnonymous ? 'Anonymous' : $userName;
        
        // Use the existing chat_messages table
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (event_id, sub_event_id, sender_id, content, is_announcement) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        // Get the event_id from the sub-event
        $eventStmt = $pdo->prepare("SELECT event_id FROM sub_events WHERE id = ?");
        $eventStmt->execute([$subEventId]);
        $eventData = $eventStmt->fetch();
        $eventId = $eventData ? $eventData['event_id'] : 0;
        
        if ($stmt->execute([$eventId, $subEventId, $userId, $message, 0])) {
            $msgId = $pdo->lastInsertId();
            
            // Get the inserted message with user info
            $msgStmt = $pdo->prepare("
                SELECT c.*, u.name as sender_name, u.role as sender_role
                FROM chat_messages c 
                LEFT JOIN users u ON c.sender_id = u.id 
                WHERE c.id = ?
            ");
            $msgStmt->execute([$msgId]);
            $newMessage = $msgStmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => $newMessage
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to send message']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
