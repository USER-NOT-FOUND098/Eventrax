<?php
/**
 * Get Valid Assignees for Task Assignment
 * 
 * Returns list of users that current user can assign tasks to:
 * - Admin → Creators, Team Leads
 * - Creator → Team Leads (for their events), Volunteers
 * - Team Lead → Volunteers (for their sub-events)
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'];

try {
    $assignees = [];

    if ($userRole === 'admin') {
        // Admin can assign to Creators and Team Leads
        $stmt = $pdo->prepare("
            SELECT id, name, email, role, avatar, institution
            FROM users 
            WHERE role IN ('creator', 'teamlead') AND status = 'active'
            ORDER BY role, name
        ");
        $stmt->execute();
        $assignees = $stmt->fetchAll();
    }
    elseif ($userRole === 'creator') {
        // Creator can assign to:
        // 1. Team Leads of their events
        // 2. Volunteers (students) of their events
        $stmt = $pdo->prepare("
            SELECT DISTINCT u.id, u.name, u.email, u.role, u.avatar, u.institution,
                   se.title as sub_event_title, e.title as event_title
            FROM users u
            JOIN sub_events se ON (se.team_lead_id = u.id OR 
                EXISTS (
                    SELECT 1 FROM volunteer_applications va 
                    WHERE va.student_id = u.id AND va.sub_event_id = se.id AND va.status = 'approved'
                ))
            JOIN events e ON se.event_id = e.id
            WHERE (e.creator_id = ? OR e.assigned_creator_id = ?)
              AND u.status = 'active'
            ORDER BY u.role DESC, u.name
        ");
        $stmt->execute([$userId, $userId]);
        $assignees = $stmt->fetchAll();
    }
    elseif ($userRole === 'teamlead') {
        // Team Lead can assign to volunteers in their sub-events
        $stmt = $pdo->prepare("
            SELECT DISTINCT u.id, u.name, u.email, u.role, u.avatar, u.institution,
                   se.title as sub_event_title
            FROM users u
            JOIN volunteer_applications va ON va.student_id = u.id AND va.status = 'approved'
            JOIN sub_events se ON va.sub_event_id = se.id
            WHERE se.team_lead_id = ?
              AND u.status = 'active'
            ORDER BY u.name
        ");
        $stmt->execute([$userId]);
        $assignees = $stmt->fetchAll();
    }
    else {
        // Students cannot assign tasks
        http_response_code(403);
        echo json_encode(['error' => 'Students cannot assign tasks']);
        exit;
    }

    echo json_encode($assignees);
}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
