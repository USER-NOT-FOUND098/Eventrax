<?php
/**
 * Team Lead - Get Volunteer Applications
 * 
 * Returns pending volunteer applications for sub-events assigned to the logged-in team lead
 */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

header('Content-Type: application/json');

// Check authentication
$userId = checkAuth();

// Get user role
$roleStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$roleStmt->execute([$userId]);
$userRole = $roleStmt->fetchColumn();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get applications for sub-events where user is team lead
        // Team leads can see applications for their assigned sub-events
        // Admins and Creators can see all applications

        if ($userRole === 'admin' || $userRole === 'creator') {
            // Admins and Creators see all applications
            $sql = "SELECT 
                        va.id,
                        va.student_id,
                        u.name as student_name,
                        u.email as student_email,
                        u.avatar as student_avatar,
                        va.sub_event_id,
                        se.title as sub_event_title,
                        e.title as event_title,
                        e.id as event_id,
                        va.message,
                        va.status,
                        va.reviewed_by,
                        va.reviewed_at,
                        va.applied_at as created_at
                    FROM volunteer_applications va
                    JOIN users u ON va.student_id = u.id
                    JOIN sub_events se ON va.sub_event_id = se.id
                    JOIN events e ON se.event_id = e.id
                    ORDER BY va.applied_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
        }
        else {
            // Team leads only see applications for their assigned sub-events
            $sql = "SELECT 
                        va.id,
                        va.student_id,
                        u.name as student_name,
                        u.email as student_email,
                        u.avatar as student_avatar,
                        va.sub_event_id,
                        se.title as sub_event_title,
                        e.title as event_title,
                        e.id as event_id,
                        va.message,
                        va.status,
                        va.reviewed_by,
                        va.reviewed_at,
                        va.applied_at as created_at
                    FROM volunteer_applications va
                    JOIN users u ON va.student_id = u.id
                    JOIN sub_events se ON va.sub_event_id = se.id
                    JOIN events e ON se.event_id = e.id
                    WHERE se.team_lead_id = ?
                    ORDER BY va.applied_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);
        }

        $applications = $stmt->fetchAll();
        echo json_encode($applications);

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
