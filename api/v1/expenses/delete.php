<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin', 'creator']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['expense_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Expense ID is required']);
        exit;
    }

    $expenseId = (int)$data['expense_id'];
    $userId = $_SESSION['user_id'];
    $userRole = strtolower($_SESSION['role']);

    try {
        // Fetch expense and parent event details to check permissions
        $stmt = $pdo->prepare("
            SELECT ex.id, ex.event_id, e.creator_id, e.assigned_creator_id 
            FROM expenses ex 
            JOIN events e ON ex.event_id = e.id 
            WHERE ex.id = ?
        ");
        $stmt->execute([$expenseId]);
        $expense = $stmt->fetch();

        if (!$expense) {
            http_response_code(404);
            echo json_encode(['error' => 'Expense not found']);
            exit;
        }

        // Permission Logic
        $canDelete = false;

        if ($userRole === 'admin') {
            $canDelete = true;
        } elseif ($userRole === 'creator') {
            if ($expense['creator_id'] == $userId || $expense['assigned_creator_id'] == $userId) {
                $canDelete = true;
            }
        }

        if (!$canDelete) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to delete this expense']);
            exit;
        }

        $deleteStmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
        $deleteStmt->execute([$expenseId]);

        echo json_encode(['success' => true, 'message' => 'Expense deleted successfully']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
