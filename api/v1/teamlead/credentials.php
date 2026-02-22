<?php
/**
 * Special Credentials - Create Team Lead Credential
 * 
 * POST: { event_id, student_id?, email?, code?, expires_at? }
 * Creates a special credential that allows a student to become a team lead
 * Only Creators and Admins can create these credentials
 */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

header('Content-Type: application/json');

// Check authentication
$userId = checkAuth();

// Get user role
$roleStmt = $pdo->prepare("SELECT role, name FROM users WHERE id = ?");
$roleStmt->execute([$userId]);
$userInfo = $roleStmt->fetch();
$userRole = $userInfo['role'];

// Only creators and admins can create credentials
if (!in_array($userRole, ['admin', 'creator'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Only Creators and Admins can create Team Lead credentials']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // List all credentials created by this user
        $sql = "SELECT 
                    tlc.*,
                    e.title as event_title,
                    u.name as student_name,
                    u.email as student_email,
                    creator.name as created_by_name
                FROM team_lead_credentials tlc
                JOIN events e ON tlc.event_id = e.id
                LEFT JOIN users u ON tlc.student_id = u.id
                JOIN users creator ON tlc.created_by = creator.id
                WHERE tlc.created_by = ? OR ? = 'admin'
                ORDER BY tlc.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $userRole]);
        $credentials = $stmt->fetchAll();
        echo json_encode($credentials);

    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $eventId = $data['event_id'] ?? null;
        $studentId = $data['student_id'] ?? null;
        $email = $data['email'] ?? null;
        $customCode = $data['code'] ?? null;
        $expiresAt = $data['expires_at'] ?? null;

        if (!$eventId) {
            http_response_code(400);
            echo json_encode(['error' => 'event_id is required']);
            exit;
        }

        // Verify event exists and user has permission
        $eventStmt = $pdo->prepare("SELECT id, title, creator_id FROM events WHERE id = ?");
        $eventStmt->execute([$eventId]);
        $event = $eventStmt->fetch();

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found']);
            exit;
        }

        // Check if user can create credentials for this event
        if ($userRole !== 'admin' && $event['creator_id'] != $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'You can only create credentials for your own events']);
            exit;
        }

        // Generate unique credential code
        $credentialCode = $customCode ?: 'TL-' . strtoupper(bin2hex(random_bytes(4))) . '-' . date('Ymd');

        // Generate a random password
        $password = bin2hex(random_bytes(6));
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Default expiration: 7 days from now
        if (!$expiresAt) {
            $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
        }

        // Insert the credential
        $insertStmt = $pdo->prepare("
            INSERT INTO team_lead_credentials 
            (event_id, student_id, credential_code, password_hash, status, expires_at, created_by, created_at)
            VALUES (?, ?, ?, ?, 'active', ?, ?, NOW())
        ");
        $insertStmt->execute([$eventId, $studentId, $credentialCode, $hashedPassword, $expiresAt, $userId]);
        $credentialId = $pdo->lastInsertId();

        // If student ID provided, notify them
        if ($studentId) {
            $notifStmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, link, created_at)
                VALUES (?, 'Team Lead Credential Assigned', ?, 'info', ?, NOW())
            ");
            $notifStmt->execute([
                $studentId,
                "You have been assigned a Team Lead credential for the event '{$event['title']}'. Please check your credentials page.",
                '/student/credentials'
            ]);
        }

        echo json_encode([
            'success' => true,
            'credential_id' => $credentialId,
            'credential_code' => $credentialCode,
            'password' => $password, // Return plaintext password ONLY on creation
            'expires_at' => $expiresAt,
            'message' => 'Team Lead credential created successfully'
        ]);

    }
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }


}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
