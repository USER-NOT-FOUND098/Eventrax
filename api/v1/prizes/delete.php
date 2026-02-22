<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin', 'creator']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['prize_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Prize ID is required']);
        exit;
    }

    $prizeId = (int)$data['prize_id'];
    $userId = $_SESSION['user_id'];
    $userRole = strtolower($_SESSION['role']);

    try {
        // Fetch prize and parent event details to check permissions
        $stmt = $pdo->prepare("
            SELECT p.id, p.event_id, e.creator_id, e.assigned_creator_id 
            FROM prizes p 
            JOIN events e ON p.event_id = e.id 
            WHERE p.id = ?
        ");
        $stmt->execute([$prizeId]);
        $prize = $stmt->fetch();

        if (!$prize) {
            http_response_code(404);
            echo json_encode(['error' => 'Prize not found']);
            exit;
        }

        // Permission Logic
        $canDelete = false;

        if ($userRole === 'admin') {
            $canDelete = true;
        } elseif ($userRole === 'creator') {
            if ($prize['creator_id'] == $userId || $prize['assigned_creator_id'] == $userId) {
                $canDelete = true;
            }
        }

        if (!$canDelete) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to delete this prize']);
            exit;
        }

        $deleteStmt = $pdo->prepare("DELETE FROM prizes WHERE id = ?");
        $deleteStmt->execute([$prizeId]);

        echo json_encode(['success' => true, 'message' => 'Prize deleted successfully']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
