<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// Check if user is authenticated
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// If not authenticated, return empty notifications
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

// User is authenticated, proceed with normal flow
if ($method === 'GET') {
    try {
        $student_id = $_SESSION['user_id'];
        $user_role = $_SESSION['role'] ?? 'student';
        $type = $_GET['type'] ?? 'all'; // all, event_day, winner, system

        // Check if notifications table exists
        try {
            $checkTable = $pdo->query("SHOW TABLES LIKE 'notifications'");
            if ($checkTable->rowCount() === 0) {
                // Table doesn't exist, return empty array
                echo json_encode([]);
                exit;
            }
        }
        catch (PDOException $e) {
            // Database connection issue, return empty array
            error_log('Notifications DB Error: ' . $e->getMessage());
            echo json_encode([]);
            exit;
        }

        // Only students should see their own notifications
        // Schema: id, user_id, title, message, type, link, is_read, created_at
        $baseSql = "SELECT n.id, n.user_id, n.title, n.message, n.type, n.link, n.is_read, n.created_at,
                   'system' as related_type, 
                   NULL as related_title, 
                   NULL as related_image
                   FROM notifications n
                   WHERE n.user_id = ?";

        $params = [$student_id];

        // Filter by type
        if ($type !== 'all') {
            $baseSql .= " AND n.type = ?";
            $params[] = $type;
        }

        $baseSql .= " ORDER BY n.created_at DESC";

        $stmt = $pdo->prepare($baseSql);
        $stmt->execute($params);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($notifications);
    }
    catch (PDOException $e) {
        // Database error - return empty array
        error_log('Notifications DB Error: ' . $e->getMessage());
        echo json_encode([]);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

}
elseif ($method === 'PUT') {
    // Handle notification actions: read, unread, delete
    try {
        $student_id = $_SESSION['user_id'];
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->notification_id) || !isset($data->action)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing notification_id or action']);
            exit;
        }

        $notification_id = $data->notification_id;
        $action = $data->action;

        // Verify the notification belongs to this user
        $checkStmt = $pdo->prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?");
        $checkStmt->execute([$notification_id, $student_id]);
        if (!$checkStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Notification not found or unauthorized']);
            exit;
        }

        switch ($action) {
            case 'read':
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
                $stmt->execute([$notification_id, $student_id]);
                echo json_encode(['success' => true, 'message' => 'Marked as read']);
                break;

            case 'unread':
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 0 WHERE id = ? AND user_id = ?");
                $stmt->execute([$notification_id, $student_id]);
                echo json_encode(['success' => true, 'message' => 'Marked as unread']);
                break;

            case 'delete':
                $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
                $stmt->execute([$notification_id, $student_id]);
                echo json_encode(['success' => true, 'message' => 'Notification deleted']);
                break;

            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action. Use read, unread, or delete.']);
        }
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
