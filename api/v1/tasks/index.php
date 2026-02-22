<?php
/**
 * Tasks API - View and Create Tasks
 * 
 * GET: Fetch tasks based on user role
 *   - Admin: Tasks they created
 *   - Creator: Tasks for their events + tasks assigned to them
 *   - Team Lead: Tasks assigned to them + tasks they assigned
 *   - Student: Tasks assigned to them
 * 
 * POST: Create a new task
 *   - Admin → Creator, Team Lead
 *   - Creator → Team Lead, Volunteer (Student)
 *   - Team Lead → Volunteer (Student)
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $tasks = [];

        if ($userRole === 'admin') {
            // Admin sees tasks they created
            $stmt = $pdo->prepare("
                SELECT t.*, 
                       u.name as assigned_to_name,
                       u.email as assigned_to_email,
                       u.role as assigned_to_role,
                       ab.name as assigned_by_name,
                       se.title as sub_event_title,
                       e.title as event_title
                FROM team_tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                LEFT JOIN users ab ON t.assigned_by = ab.id
                LEFT JOIN sub_events se ON t.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE t.assigned_by = ?
                ORDER BY 
                    CASE WHEN t.status = 'pending' THEN 0 
                         WHEN t.status = 'in_progress' THEN 1 
                         ELSE 2 END,
                    t.deadline ASC
            ");
            $stmt->execute([$userId]);
            $tasks = $stmt->fetchAll();
        }
        elseif ($userRole === 'creator') {
            // Creator sees tasks assigned to them + tasks they created
            $stmt = $pdo->prepare("
                SELECT t.*, 
                       u.name as assigned_to_name,
                       u.email as assigned_to_email,
                       u.role as assigned_to_role,
                       ab.name as assigned_by_name,
                       se.title as sub_event_title,
                       e.title as event_title
                FROM team_tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                LEFT JOIN users ab ON t.assigned_by = ab.id
                LEFT JOIN sub_events se ON t.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE t.assigned_to = ? OR t.assigned_by = ?
                ORDER BY 
                    CASE WHEN t.status = 'pending' THEN 0 
                         WHEN t.status = 'in_progress' THEN 1 
                         ELSE 2 END,
                    t.deadline ASC
            ");
            $stmt->execute([$userId, $userId]);
            $tasks = $stmt->fetchAll();
        }
        elseif ($userRole === 'teamlead') {
            // Team Lead sees tasks assigned to them + tasks they created
            $stmt = $pdo->prepare("
                SELECT t.*, 
                       u.name as assigned_to_name,
                       u.email as assigned_to_email,
                       u.role as assigned_to_role,
                       ab.name as assigned_by_name,
                       se.title as sub_event_title,
                       e.title as event_title
                FROM team_tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                LEFT JOIN users ab ON t.assigned_by = ab.id
                LEFT JOIN sub_events se ON t.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE t.assigned_to = ? OR t.assigned_by = ?
                ORDER BY 
                    CASE WHEN t.status = 'pending' THEN 0 
                         WHEN t.status = 'in_progress' THEN 1 
                         ELSE 2 END,
                    t.deadline ASC
            ");
            $stmt->execute([$userId, $userId]);
            $tasks = $stmt->fetchAll();
        }
        else {
            // Student sees only tasks assigned to them
            $stmt = $pdo->prepare("
                SELECT t.*, 
                       u.name as assigned_to_name,
                       ab.name as assigned_by_name,
                       se.title as sub_event_title,
                       e.title as event_title
                FROM team_tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                LEFT JOIN users ab ON t.assigned_by = ab.id
                LEFT JOIN sub_events se ON t.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE t.assigned_to = ?
                ORDER BY 
                    CASE WHEN t.status = 'pending' THEN 0 
                         WHEN t.status = 'in_progress' THEN 1 
                         ELSE 2 END,
                    t.deadline ASC
            ");
            $stmt->execute([$userId]);
            $tasks = $stmt->fetchAll();
        }

        echo json_encode($tasks);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // Validate required fields
    if (!isset($data->title) || !isset($data->assigned_to)) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and assigned_to are required']);
        exit;
    }

    $title = htmlspecialchars(strip_tags($data->title));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : '';
    $assignedTo = (int)$data->assigned_to;
    $subEventId = isset($data->sub_event_id) ? (int)$data->sub_event_id : null;
    $deadline = isset($data->deadline) ? $data->deadline : null;
    $priority = isset($data->priority) ? $data->priority : 'medium';

    try {
        // Get assignee details
        $stmt = $pdo->prepare("SELECT id, role, name FROM users WHERE id = ?");
        $stmt->execute([$assignedTo]);
        $assignee = $stmt->fetch();

        if (!$assignee) {
            http_response_code(404);
            echo json_encode(['error' => 'Assignee not found']);
            exit;
        }

        // Role-based permission check
        $allowedRoles = [];
        if ($userRole === 'admin') {
            $allowedRoles = ['creator', 'teamlead'];
        }
        elseif ($userRole === 'creator') {
            $allowedRoles = ['teamlead', 'student'];
        }
        elseif ($userRole === 'teamlead') {
            $allowedRoles = ['student'];
        }

        if (!in_array($assignee['role'], $allowedRoles)) {
            http_response_code(403);
            echo json_encode(['error' => "You cannot assign tasks to {$assignee['role']}s"]);
            exit;
        }

        // For Team Lead assigning to student, verify they are in the same sub-event
        if ($userRole === 'teamlead' && $subEventId) {
            $stmt = $pdo->prepare("SELECT team_lead_id FROM sub_events WHERE id = ?");
            $stmt->execute([$subEventId]);
            $subEvent = $stmt->fetch();

            if (!$subEvent || $subEvent['team_lead_id'] != $userId) {
                http_response_code(403);
                echo json_encode(['error' => 'You can only assign tasks for sub-events you lead']);
                exit;
            }
        }

        // Insert task
        $stmt = $pdo->prepare("
            INSERT INTO team_tasks (sub_event_id, assigned_to, assigned_by, title, description, deadline, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$subEventId, $assignedTo, $userId, $title, $description, $deadline, $priority]);
        $taskId = $pdo->lastInsertId();

        // Send notification to assignee
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, link, created_at)
            VALUES (?, 'task_assigned', 'New Task Assigned', ?, ?, NOW())
        ");
        $notifyMessage = "You have been assigned a new task: $title";
        $notifyLink = $assignee['role'] === 'teamlead' ? '/teamlead/tasks' : '/student/tasks';
        $stmt->execute([$assignedTo, $notifyMessage, $notifyLink]);

        echo json_encode([
            'success' => true,
            'message' => "Task assigned to {$assignee['name']}",
            'task_id' => $taskId
        ]);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
