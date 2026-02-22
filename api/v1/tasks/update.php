<?php
/**
 * Update Task Status/Details
 * 
 * POST: Update task
 *   - Assignee can: mark complete, in_progress
 *   - Creator of task can: update any field
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
    $stmt = $pdo->prepare("
        SELECT t.*, u.name as assigned_to_name 
        FROM team_tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        http_response_code(404);
        echo json_encode(['error' => 'Task not found']);
        exit;
    }

    // Permission check: must be assignee or creator of task
    $isAssignee = $task['assigned_to'] == $userId;
    $isCreator = $task['assigned_by'] == $userId;

    if (!$isAssignee && !$isCreator) {
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized to update this task']);
        exit;
    }

    // Build update query
    $updates = [];
    $params = [];

    // Status update
    if (isset($data->status)) {
        $validStatuses = ['pending', 'in_progress', 'completed', 'overdue'];
        if (!in_array($data->status, $validStatuses)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status']);
            exit;
        }
        $updates[] = "status = ?";
        $params[] = $data->status;

        if ($data->status === 'completed') {
            $updates[] = "completed_at = NOW()";
        }
    }

    // Creator can update more fields
    if ($isCreator) {
        if (isset($data->title)) {
            $updates[] = "title = ?";
            $params[] = htmlspecialchars(strip_tags($data->title));
        }
        if (isset($data->description)) {
            $updates[] = "description = ?";
            $params[] = htmlspecialchars(strip_tags($data->description));
        }
        if (isset($data->deadline)) {
            $updates[] = "deadline = ?";
            $params[] = $data->deadline;
        }
        if (isset($data->priority)) {
            $updates[] = "priority = ?";
            $params[] = $data->priority;
        }
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No updates provided']);
        exit;
    }

    $params[] = $taskId;
    $sql = "UPDATE team_tasks SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Notify if status changed to completed
    if (isset($data->status) && $data->status === 'completed' && $isAssignee) {
        // Notify the task creator
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, link, created_at)
            VALUES (?, 'task_completed', 'Task Completed', ?, ?, NOW())
        ");
        $notifyMessage = "{$task['assigned_to_name']} completed the task: {$task['title']}";
        $stmt->execute([$task['assigned_by'], $notifyMessage, '']);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Task updated successfully'
    ]);
}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
