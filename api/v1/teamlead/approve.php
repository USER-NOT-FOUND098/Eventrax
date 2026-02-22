<?php
/**
 * Team Lead - Approve/Reject Volunteer Application
 * 
 * POST: { application_id, action: 'approve'|'reject', feedback? }
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $applicationId = $data['application_id'] ?? null;
    $action = $data['action'] ?? null;
    $feedback = $data['feedback'] ?? null;

    if (!$applicationId || !$action) {
        http_response_code(400);
        echo json_encode(['error' => 'application_id and action are required']);
        exit;
    }

    if (!in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(['error' => 'action must be "approve" or "reject"']);
        exit;
    }

    // Get the application details
    $appStmt = $pdo->prepare("
        SELECT va.*, se.team_lead_id, se.event_id, e.creator_id
        FROM volunteer_applications va
        JOIN sub_events se ON va.sub_event_id = se.id
        JOIN events e ON se.event_id = e.id
        WHERE va.id = ?
    ");
    $appStmt->execute([$applicationId]);
    $application = $appStmt->fetch();

    if (!$application) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        exit;
    }

    // Check permission: must be admin, event creator, or assigned team lead
    $canApprove = ($userRole === 'admin')
        || ($application['creator_id'] == $userId)
        || ($application['team_lead_id'] == $userId);

    if (!$canApprove) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to review this application']);
        exit;
    }

    // Update the application status
    $newStatus = $action === 'approve' ? 'approved' : 'rejected';
    $updateStmt = $pdo->prepare("
        UPDATE volunteer_applications 
        SET status = ?, feedback = ?, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ?
    ");
    $updateStmt->execute([$newStatus, $feedback, $userId, $applicationId]);

    // If approved, add to volunteers table
    if ($action === 'approve') {
        // Check if volunteer entry already exists
        $checkStmt = $pdo->prepare("
            SELECT id FROM volunteers 
            WHERE sub_event_id = ? AND user_id = ?
        ");
        $checkStmt->execute([$application['sub_event_id'], $application['student_id']]);

        if (!$checkStmt->fetch()) {
            $insertStmt = $pdo->prepare("
                INSERT INTO volunteers (sub_event_id, user_id, role, assigned_at)
                VALUES (?, ?, 'Volunteer', NOW())
            ");
            $insertStmt->execute([$application['sub_event_id'], $application['student_id']]);
        }

        // Create notification for student
        $notifStmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, link, created_at)
            VALUES (?, 'Volunteer Application Approved', 'Your volunteer application has been approved!', 'success', ?, NOW())
        ");
        $notifStmt->execute([
            $application['student_id'],
            '/student/volunteer'
        ]);
    }
    else {
        // Create notification for rejected application
        $notifStmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, link, created_at)
            VALUES (?, 'Volunteer Application Update', 'Your volunteer application was not approved at this time.', 'info', ?, NOW())
        ");
        $notifStmt->execute([
            $application['student_id'],
            '/student/volunteer'
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => "Application {$newStatus} successfully"
    ]);


}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
