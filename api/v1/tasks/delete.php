<?php
/**
 * Delete Task
 * Only the creator of the task can delete it
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->task_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Task ID required']);
    exit;
}

$taskId = (int)$data->task_id;

try {
    // Get task details
    $stmt = $pdo->prepare("SELECT * FROM team_tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        http_response_code(404);
        echo json_encode(['error' => 'Task not found']);
        exit;
    }

    // Only the creator can delete the task
    if ($task['assigned_by'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Only the task creator can delete it']);
        exit;
    }

    // Delete the task
    $stmt = $pdo->prepare("DELETE FROM team_tasks WHERE id = ?");
    $stmt->execute([$taskId]);

    echo json_encode([
        'success' => true,
        'message' => 'Task deleted successfully'
    ]);
}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
