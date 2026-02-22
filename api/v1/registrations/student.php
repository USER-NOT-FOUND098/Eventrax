<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// Check if user is authenticated
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// If not authenticated, return empty array
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

// Check role - allow all authenticated users for now
// checkRole(['student']);

if ($method === 'GET') {
    try {
        $student_id = $_SESSION['user_id'];
        $user_role = $_SESSION['role'] ?? 'student';
        
        // Check if registrations table exists
        try {
            $checkTable = $pdo->query("SHOW TABLES LIKE 'registrations'");
            if ($checkTable->rowCount() === 0) {
                // Table doesn't exist, return empty array
                echo json_encode([]);
                exit;
            }
        } catch (PDOException $e) {
            // Database connection issue, return empty array
            error_log('Registrations DB Error: ' . $e->getMessage());
            echo json_encode([]);
            exit;
        }
        
        // Get registrations for current user only
        $sql = "SELECT r.*, e.title, e.venue, e.start_date, e.end_date, e.status as event_status, e.poster,
                u.name as creator_name
                FROM registrations r 
                JOIN events e ON r.event_id = e.id 
                JOIN users u ON e.creator_id = u.id 
                WHERE r.student_id = ? 
                ORDER BY e.start_date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$student_id]);
        $registrations = $stmt->fetchAll();
        
        echo json_encode($registrations);
    } catch (PDOException $e) {
        // Database error - return empty array
        error_log('Registrations DB Error: ' . $e->getMessage());
        echo json_encode([]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // Register for an event - Students only
    if ($_SESSION['role'] !== 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Only students can register for events']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->event_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Event ID required']);
        exit;
    }

    $eventId = (int)$data->event_id;
    $studentId = $_SESSION['user_id'];

    try {
        // Check if registrations table exists
        $checkTable = $pdo->query("SHOW TABLES LIKE 'registrations'");
        if ($checkTable->rowCount() === 0) {
            // Create registrations table
            $createTable = "
                CREATE TABLE registrations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    event_id INT NOT NULL,
                    student_id INT NOT NULL,
                    status VARCHAR(50) DEFAULT 'confirmed',
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_registration (event_id, student_id)
                )
            ";
            $pdo->exec($createTable);
        }

        // Check if event exists
        $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }

        // Check if already registered
        $stmt = $pdo->prepare("SELECT id FROM registrations WHERE event_id = ? AND student_id = ?");
        $stmt->execute([$eventId, $studentId]);
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Already registered for this event']);
            exit;
        }

        // Register
        $stmt = $pdo->prepare("INSERT INTO registrations (event_id, student_id, status) VALUES (?, ?, 'confirmed')");
        $stmt->execute([$eventId, $studentId]);

        echo json_encode([
            'success' => true,
            'message' => "Successfully registered for {$event['title']}",
            'registration_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
