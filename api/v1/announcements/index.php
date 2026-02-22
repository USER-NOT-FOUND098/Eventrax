<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check if user is authenticated
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        echo json_encode([]);
        exit;
    }

    $eventId = $_GET['event_id'] ?? null;
    $role = $_SESSION['role'] ?? 'student';

    try {
        // Check if announcements table exists
        try {
            $checkTable = $pdo->query("SHOW TABLES LIKE 'announcements'");
            if ($checkTable->rowCount() === 0) {
                // Table doesn't exist, return empty array
                echo json_encode([]);
                exit;
            }
        } catch (PDOException $e) {
            // Database connection issue, return empty array
            error_log('Announcements DB Error: ' . $e->getMessage());
            echo json_encode([]);
            exit;
        }
        
        $eventId = $_GET['event_id'] ?? null;
        $subEventId = $_GET['sub_event_id'] ?? null;
        $mainEventOnly = $_GET['main_event_only'] ?? null;
        
        if ($eventId) {
            // Fetch for specific event (optionally filtered by sub_event)
            $sql = "
                SELECT a.*, u.name as created_by_name, e.title as event_title, se.title as sub_event_title,
                (CASE WHEN ar.user_id IS NOT NULL THEN 1 ELSE 0 END) as is_read
                FROM announcements a 
                JOIN events e ON a.event_id = e.id
                LEFT JOIN sub_events se ON a.sub_event_id = se.id
                LEFT JOIN users u ON a.created_by = u.id 
                LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
                WHERE a.event_id = ?";
            
            $params = [$userId, $eventId];
            
            if ($mainEventOnly === 'true') {
                // Only get main event announcements (where sub_event_id is NULL)
                $sql .= " AND a.sub_event_id IS NULL";
            } elseif ($subEventId) {
                // Get announcements for specific sub-event
                $sql .= " AND a.sub_event_id = ?";
                $params[] = $subEventId;
            }
            
            $sql .= " ORDER BY a.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $announcements = $stmt->fetchAll();
            
            echo json_encode($announcements);
        } else {
            // Fetch all announcements for the user based on their role
            $sql = "
                SELECT a.*, u.name as created_by_name, e.title as event_title, se.title as sub_event_title,
                (CASE WHEN ar.user_id IS NOT NULL THEN 1 ELSE 0 END) as is_read
                FROM announcements a 
                JOIN events e ON a.event_id = e.id
                LEFT JOIN sub_events se ON a.sub_event_id = se.id
                LEFT JOIN users u ON a.created_by = u.id 
                LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
                WHERE a.target_audience LIKE '%all%' OR a.target_audience LIKE ?
                ORDER BY a.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, "%$role%"]);
            $announcements = $stmt->fetchAll();
            
            echo json_encode($announcements);
        }
    } catch (PDOException $e) {
        error_log('Announcements DB Error: ' . $e->getMessage());
        echo json_encode([]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // Create new announcement
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Debug: Log session info
    error_log('Announcement POST - Session: ' . print_r($_SESSION, true));
    error_log('Announcement POST - User ID: ' . ($_SESSION['user_id'] ?? 'NULL'));
    error_log('Announcement POST - Role: ' . ($_SESSION['role'] ?? 'NULL'));
    
    $userId = $_SESSION['user_id'] ?? null;
    $role = $_SESSION['role'] ?? '';
    
    // Debug: Log received data
    $inputData = file_get_contents("php://input");
    error_log('Announcement POST - Raw Input: ' . $inputData);
    
    if (!$userId || !in_array($role, ['admin', 'creator'])) {
        error_log('Announcement POST - Permission denied. User ID: ' . $userId . ', Role: ' . $role);
        http_response_code(403);
        echo json_encode(['error' => 'Only admin and creator can create announcements', 'debug' => [
            'user_id' => $userId,
            'role' => $role,
            'session_data' => $_SESSION
        ]]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->event_id) || !isset($data->title) || !isset($data->content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: event_id, title, content']);
        exit;
    }
    
    // Handle priority field (convert to target_audience if needed)
    $targetAudience = $data->target_audience ?? 'all';
    if (isset($data->priority)) {
        // Map priority to target audience
        switch ($data->priority) {
            case 'high':
                $targetAudience = 'all'; // High priority goes to all
                break;
            case 'medium':
                $targetAudience = 'admin,creator,teamlead'; // Medium to organizers
                break;
            case 'low':
                $targetAudience = 'student'; // Low to students only
                break;
            default:
                $targetAudience = 'all';
        }
    }
    
    try {
        // Check if announcements table exists
        $checkTable = $pdo->query("SHOW TABLES LIKE 'announcements'");
        if ($checkTable->rowCount() === 0) {
            // Create announcements table
            $createTable = "
                CREATE TABLE announcements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    event_id INT NOT NULL,
                    sub_event_id INT NULL,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    target_audience VARCHAR(100) DEFAULT 'all',
                    created_by INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                    FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id)
                )
            ";
            $pdo->exec($createTable);
        }
        
        $sql = "
            INSERT INTO announcements (event_id, sub_event_id, title, content, target_audience, created_by) 
            VALUES (?, ?, ?, ?, ?, ?)
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data->event_id,
            $data->sub_event_id ?? null,
            $data->title,
            $data->content,
            $targetAudience,
            $userId
        ]);
        
        $id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'id' => $id,
            'message' => 'Announcement created successfully'
        ]);
        
    } catch (PDOException $e) {
        error_log('Create Announcement Error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create announcement: ' . $e->getMessage()]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'PUT') {
    // Mark announcement as read - All authenticated users
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->announcement_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Announcement ID required']);
        exit;
    }
    
    $announcementId = (int)$data->announcement_id;
    
    try {
        // Check if announcement exists
        $stmt = $pdo->prepare("SELECT id FROM announcements WHERE id = ?");
        $stmt->execute([$announcementId]);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Announcement not found']);
            exit;
        }
        
        // Check if announcement_reads table exists
        $checkTable = $pdo->query("SHOW TABLES LIKE 'announcement_reads'");
        if ($checkTable->rowCount() === 0) {
            // Create announcement_reads table
            $createTable = "
                CREATE TABLE announcement_reads (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    announcement_id INT NOT NULL,
                    user_id INT NOT NULL,
                    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_read (announcement_id, user_id),
                    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ";
            $pdo->exec($createTable);
        }
        
        // Mark as read (insert or update)
        $stmt = $pdo->prepare("
            INSERT INTO announcement_reads (announcement_id, user_id, read_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$announcementId, $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Announcement marked as read'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    // Delete announcement
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    $role = $_SESSION['role'] ?? 'student';
    
    // Only admin, creator, or teamlead can delete announcements
    if (!in_array($role, ['admin', 'creator', 'teamlead'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Insufficient permissions']);
        exit;
    }
    
    $announcementId = $_GET['id'] ?? null;
    if (!$announcementId) {
        http_response_code(400);
        echo json_encode(['error' => 'Announcement ID required']);
        exit;
    }
    
    try {
        // Check if announcements table exists
        $checkTable = $pdo->query("SHOW TABLES LIKE 'announcements'");
        if ($checkTable->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Announcements table not found']);
            exit;
        }
        
        // Delete the announcement
        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
        $result = $stmt->execute([$announcementId]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Announcement deleted successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Announcement not found']);
        }
        
    } catch (PDOException $e) {
        error_log('Delete announcement error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete announcement']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
