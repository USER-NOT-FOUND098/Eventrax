<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $userId = $_SESSION['user_id'];
        $userRole = strtolower($_SESSION['role']);

        // Get applications for a specific event (admin only)
        if (isset($_GET['event_id'])) {
            if ($userRole !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Only admins can view event applications']);
                exit;
            }

            $eventId = (int)$_GET['event_id'];
            $stmt = $pdo->prepare("
                SELECT 
                    a.*,
                    u.name as creator_name,
                    u.email as creator_email,
                    u.avatar as creator_avatar,
                    e.title as event_title,
                    reviewer.name as reviewed_by_name
                FROM event_applications a
                JOIN users u ON a.creator_id = u.id
                JOIN events e ON a.event_id = e.id
                LEFT JOIN users reviewer ON a.reviewed_by = reviewer.id
                WHERE a.event_id = ?
                ORDER BY a.applied_at DESC
            ");
            $stmt->execute([$eventId]);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Get creator's own applications
        if (isset($_GET['my_applications']) && $_GET['my_applications'] === 'true') {
            $stmt = $pdo->prepare("
                SELECT 
                    a.*,
                    e.title as event_title,
                    e.venue as event_venue,
                    e.start_date as event_start_date,
                    e.poster as event_poster,
                    reviewer.name as reviewed_by_name
                FROM event_applications a
                JOIN events e ON a.event_id = e.id
                LEFT JOIN users reviewer ON a.reviewed_by = reviewer.id
                WHERE a.creator_id = ?
                ORDER BY a.applied_at DESC
            ");
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll());
            exit;
        }

        // Default: return empty array
        echo json_encode([]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
