<?php
/**
 * Volunteers API
 * 
 * GET: Fetch volunteer applications/assignments
 * - Admin/Creator/TeamLead can view applications
 * - list_type=assigned: returns approved volunteers for a sub-event
 * - sub_event_id: filter by specific sub-event
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
$userRole = $_SESSION['role'] ?? '';

try {
    $subEventId = isset($_GET['sub_event_id']) ? (int)$_GET['sub_event_id'] : null;
    $listType = $_GET['list_type'] ?? 'applications';

    // If list_type=assigned, return approved volunteers for the sub-event
    if ($listType === 'assigned' && $subEventId) {
        // Anyone with access to the sub-event can see assigned volunteers
        $stmt = $pdo->prepare("
            SELECT 
                va.id,
                va.student_id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.avatar as user_avatar,
                'Volunteer' as role,
                va.status,
                va.applied_at
            FROM volunteer_applications va
            JOIN users u ON va.student_id = u.id
            WHERE va.sub_event_id = ? AND va.status = 'approved'
            ORDER BY va.applied_at ASC
        ");
        $stmt->execute([$subEventId]);
        $volunteers = $stmt->fetchAll();

        echo json_encode($volunteers);
        exit;
    }

    // If list_type=my_team, return all approved volunteers for sub-events where user is team lead
    if ($listType === 'my_team' && $userRole === 'teamlead') {
        $stmt = $pdo->prepare("
            SELECT 
                va.id,
                va.student_id as user_id,
                u.name as name,
                u.email as email,
                u.avatar as avatar,
                va.sub_event_id,
                se.title as sub_event_title,
                e.title as event_title,
                'Volunteer' as role,
                va.applied_at as assigned_at
            FROM volunteer_applications va
            JOIN users u ON va.student_id = u.id
            JOIN sub_events se ON va.sub_event_id = se.id
            LEFT JOIN events e ON se.event_id = e.id
            WHERE va.status = 'approved' AND se.team_lead_id = ?
            ORDER BY se.title ASC, va.applied_at DESC
        ");
        $stmt->execute([$userId]);
        $volunteers = $stmt->fetchAll();

        echo json_encode($volunteers);
        exit;
    }

    // Regular applications view requires proper role
    if (!in_array($userRole, ['admin', 'creator', 'teamlead'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Building query based on role and filters
    if ($userRole === 'admin') {
        if ($subEventId) {
            $stmt = $pdo->prepare("
                SELECT 
                    va.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.avatar as student_avatar,
                    se.title as sub_event_title,
                    e.title as event_title
                FROM volunteer_applications va
                JOIN users u ON va.student_id = u.id
                LEFT JOIN sub_events se ON va.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE va.sub_event_id = ?
                ORDER BY va.applied_at DESC
            ");
            $stmt->execute([$subEventId]);
        }
        else {
            $stmt = $pdo->query("
                SELECT 
                    va.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.avatar as student_avatar,
                    se.title as sub_event_title,
                    e.title as event_title
                FROM volunteer_applications va
                JOIN users u ON va.student_id = u.id
                LEFT JOIN sub_events se ON va.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                ORDER BY va.applied_at DESC
            ");
        }
    }
    else if ($userRole === 'creator') {
        if ($subEventId) {
            $stmt = $pdo->prepare("
                SELECT 
                    va.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.avatar as student_avatar,
                    se.title as sub_event_title,
                    e.title as event_title
                FROM volunteer_applications va
                JOIN users u ON va.student_id = u.id
                LEFT JOIN sub_events se ON va.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE va.sub_event_id = ? AND e.creator_id = ?
                ORDER BY va.applied_at DESC
            ");
            $stmt->execute([$subEventId, $userId]);
        }
        else {
            $stmt = $pdo->prepare("
                SELECT 
                    va.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.avatar as student_avatar,
                    se.title as sub_event_title,
                    e.title as event_title
                FROM volunteer_applications va
                JOIN users u ON va.student_id = u.id
                LEFT JOIN sub_events se ON va.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE e.creator_id = ?
                ORDER BY va.applied_at DESC
            ");
            $stmt->execute([$userId]);
        }
    }
    else if ($userRole === 'teamlead') {
        // Team lead can see applications for sub-events they lead
        if ($subEventId) {
            $stmt = $pdo->prepare("
                SELECT 
                    va.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.avatar as student_avatar,
                    se.title as sub_event_title,
                    e.title as event_title
                FROM volunteer_applications va
                JOIN users u ON va.student_id = u.id
                LEFT JOIN sub_events se ON va.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE va.sub_event_id = ? AND se.team_lead_id = ?
                ORDER BY va.applied_at DESC
            ");
            $stmt->execute([$subEventId, $userId]);
        }
        else {
            $stmt = $pdo->prepare("
                SELECT 
                    va.*,
                    u.name as student_name,
                    u.email as student_email,
                    u.avatar as student_avatar,
                    se.title as sub_event_title,
                    e.title as event_title
                FROM volunteer_applications va
                JOIN users u ON va.student_id = u.id
                LEFT JOIN sub_events se ON va.sub_event_id = se.id
                LEFT JOIN events e ON se.event_id = e.id
                WHERE se.team_lead_id = ?
                ORDER BY va.applied_at DESC
            ");
            $stmt->execute([$userId]);
        }
    }

    $applications = $stmt->fetchAll();

    // Map to consistent format for the frontend
    $mappedApplications = array_map(function ($app) {
        return [
        'id' => $app['id'],
        'sub_event_id' => $app['sub_event_id'],
        'student_id' => $app['student_id'],
        'status' => $app['status'],
        'role' => $app['role'] ?? 'volunteer',
        'message' => $app['message'] ?? '',
        'student_name' => $app['student_name'],
        'student_email' => $app['student_email'],
        'student_avatar' => $app['student_avatar'],
        'sub_event_title' => $app['sub_event_title'] ?? 'Unknown Sub-Event',
        'event_title' => $app['event_title'] ?? 'Unknown Event',
        'applied_at' => $app['applied_at'] ?? $app['created_at'] ?? null
        ];
    }, $applications);

    echo json_encode($mappedApplications);


}
catch (PDOException $e) {
    error_log('Fetch applications error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch applications', 'details' => $e->getMessage()]);
}
?>
