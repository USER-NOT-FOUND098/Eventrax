<?php
/**
 * Get/Review Team Lead Applications
 * For Creator/Admin to view and approve/reject Team Lead applications
 * 
 * GET: List applications for events the user created
 * POST: Approve or reject an application
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Must be logged in as admin or creator
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['admin', 'creator'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Admin or Creator access required']);
    exit;
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'];

// Debug: Log details
error_log("applications-review.php - User ID: $userId, Role: $userRole");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if ($userRole === 'admin') {
            // Admin sees all applications
            $sql = "
                SELECT 
                    tla.id,
                    tla.user_id,
                    u.name as applicant_name,
                    u.email as applicant_email,
                    u.avatar as applicant_avatar,
                    u.institution as applicant_institution,
                    tla.sub_event_id,
                    se.title as sub_event_title,
                    e.id as event_id,
                    e.title as event_title,
                    ec.name as creator_name,
                    tla.message,
                    tla.status,
                    tla.feedback,
                    tla.reviewed_by,
                    rb.name as reviewed_by_name,
                    tla.reviewed_at,
                    tla.created_at
                FROM teamlead_applications tla
                JOIN users u ON tla.user_id = u.id
                JOIN sub_events se ON tla.sub_event_id = se.id
                JOIN events e ON se.event_id = e.id
                JOIN users ec ON e.creator_id = ec.id
                LEFT JOIN users rb ON tla.reviewed_by = rb.id
                ORDER BY 
                    CASE WHEN tla.status = 'pending' THEN 0 ELSE 1 END,
                    tla.created_at DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
        }
        else {
            // Creator sees applications for their events only
            $sql = "
                SELECT 
                    tla.id,
                    tla.user_id,
                    u.name as applicant_name,
                    u.email as applicant_email,
                    u.avatar as applicant_avatar,
                    u.institution as applicant_institution,
                    tla.sub_event_id,
                    se.title as sub_event_title,
                    e.id as event_id,
                    e.title as event_title,
                    tla.message,
                    tla.status,
                    tla.feedback,
                    tla.reviewed_by,
                    rb.name as reviewed_by_name,
                    tla.reviewed_at,
                    tla.created_at
                FROM teamlead_applications tla
                JOIN users u ON tla.user_id = u.id
                JOIN sub_events se ON tla.sub_event_id = se.id
                JOIN events e ON se.event_id = e.id
                LEFT JOIN users rb ON tla.reviewed_by = rb.id
                WHERE (e.creator_id = ? OR e.assigned_creator_id = ?)
                ORDER BY 
                    CASE WHEN tla.status = 'pending' THEN 0 ELSE 1 END,
                    tla.created_at DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $userId]);
            error_log("applications-review.php - Creator query executed for user_id: $userId");
        }

        $applications = $stmt->fetchAll();
        error_log("applications-review.php - Found " . count($applications) . " applications");
        echo json_encode($applications);

    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->application_id) || !isset($data->action)) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID and action required']);
        exit;
    }

    $applicationId = (int)$data->application_id;
    $action = $data->action; // 'approve' or 'reject'
    $feedback = isset($data->feedback) ? htmlspecialchars(strip_tags($data->feedback)) : '';

    if (!in_array($action, ['approve', 'reject'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action. Use "approve" or "reject"']);
        exit;
    }

    try {
        // Get application details
        $stmt = $pdo->prepare("
            SELECT tla.*, se.title as sub_event_title, se.team_lead_id, e.creator_id, e.assigned_creator_id, e.title as event_title
            FROM teamlead_applications tla
            JOIN sub_events se ON tla.sub_event_id = se.id
            JOIN events e ON se.event_id = e.id
            WHERE tla.id = ?
        ");
        $stmt->execute([$applicationId]);
        $application = $stmt->fetch();

        if (!$application) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found']);
            exit;
        }

        // Permission check: Admin or event creator/assigned creator
        $assignedCreatorId = isset($application['assigned_creator_id']) ? $application['assigned_creator_id'] : null;
        if ($userRole !== 'admin' && $application['creator_id'] != $userId && $assignedCreatorId != $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Not authorized to review this application']);
            exit;
        }

        if ($application['status'] !== 'pending') {
            http_response_code(400);
            echo json_encode(['error' => 'Application has already been reviewed']);
            exit;
        }

        $newStatus = $action === 'approve' ? 'approved' : 'rejected';

        // Start transaction
        $pdo->beginTransaction();

        // Update application status
        $stmt = $pdo->prepare("
            UPDATE teamlead_applications 
            SET status = ?, feedback = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$newStatus, $feedback, $userId, $applicationId]);

        if ($action === 'approve') {
            // Check if sub-event already has a team lead
            if ($application['team_lead_id']) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'This sub-event already has a Team Lead assigned']);
                exit;
            }

            // Assign the applicant as team lead
            $stmt = $pdo->prepare("UPDATE sub_events SET team_lead_id = ? WHERE id = ?");
            $stmt->execute([$application['user_id'], $application['sub_event_id']]);

            // Update user role to teamlead if they're a student
            $stmt = $pdo->prepare("UPDATE users SET role = 'teamlead' WHERE id = ? AND role = 'student'");
            $stmt->execute([$application['user_id']]);

            // Reject other pending applications for the same sub-event
            $stmt = $pdo->prepare("
                UPDATE teamlead_applications 
                SET status = 'rejected', 
                    feedback = 'Another applicant was selected',
                    reviewed_by = ?,
                    reviewed_at = NOW()
                WHERE sub_event_id = ? AND id != ? AND status = 'pending'
            ");
            $stmt->execute([$userId, $application['sub_event_id'], $applicationId]);
        }

        // Notify the applicant
        $notifyTitle = $action === 'approve'
            ? 'Team Lead Application Approved!'
            : 'Team Lead Application Update';
        $notifyMessage = $action === 'approve'
            ? "Congratulations! Your application to lead '{$application['sub_event_title']}' has been approved."
            : "Your application to lead '{$application['sub_event_title']}' was not approved." . ($feedback ? " Feedback: $feedback" : "");

        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, link, created_at)
            VALUES (?, 'teamlead_application_result', ?, ?, ?, NOW())
        ");
        $link = $action === 'approve' ? '/teamlead/dashboard' : '/teamlead/all-events';
        $stmt->execute([$application['user_id'], $notifyTitle, $notifyMessage, $link]);

        $pdo->commit();

        $applicantName = isset($application['applicant_name']) ? $application['applicant_name'] : 'User';
        $message = $action === 'approve'
            ? "Application approved! {$applicantName} is now the Team Lead."
            : "Application rejected.";

        echo json_encode([
            'success' => true,
            'message' => $message
        ]);

    }
    catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
