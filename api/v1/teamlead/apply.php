<?php
/**
 * Team Lead Application for Sub-Events
 * Allows pending team leads to apply to manage specific sub-events
 * 
 * POST: Submit application
 * GET: Get user's applications status
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Must be logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$userId = $_SESSION['user_id'];
$userRole = $_SESSION['role'];

// Only team leads (pending or active) can apply
if (!in_array($userRole, ['teamlead', 'student'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Only Team Leads or Students can apply to manage sub-events']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user's team lead applications
    try {
        $stmt = $pdo->prepare("
            SELECT 
                tla.id,
                tla.sub_event_id,
                se.title as sub_event_title,
                e.title as event_title,
                e.id as event_id,
                tla.message,
                tla.status,
                tla.feedback,
                tla.created_at,
                tla.reviewed_at
            FROM teamlead_applications tla
            JOIN sub_events se ON tla.sub_event_id = se.id
            JOIN events e ON se.event_id = e.id
            WHERE tla.user_id = ?
            ORDER BY tla.created_at DESC
        ");
        $stmt->execute([$userId]);
        $applications = $stmt->fetchAll();

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

    if (!isset($data->sub_event_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Sub-event ID required']);
        exit;
    }

    $subEventId = (int)$data->sub_event_id;
    $message = isset($data->message) ? htmlspecialchars(strip_tags($data->message)) : '';

    try {
        // Check if sub-event exists and doesn't already have a team lead
        $stmt = $pdo->prepare("
            SELECT se.*, e.title as event_title, e.creator_id 
            FROM sub_events se 
            JOIN events e ON se.event_id = e.id
            WHERE se.id = ?
        ");
        $stmt->execute([$subEventId]);
        $subEvent = $stmt->fetch();

        if (!$subEvent) {
            http_response_code(404);
            echo json_encode(['error' => 'Sub-event not found']);
            exit;
        }

        if ($subEvent['team_lead_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'This sub-event already has a Team Lead assigned']);
            exit;
        }

        // Check for existing pending application
        $stmt = $pdo->prepare("
            SELECT id, status FROM teamlead_applications 
            WHERE user_id = ? AND sub_event_id = ?
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([$userId, $subEventId]);
        $existingApp = $stmt->fetch();

        if ($existingApp) {
            if ($existingApp['status'] === 'pending') {
                http_response_code(400);
                echo json_encode(['error' => 'You already have a pending application for this sub-event']);
                exit;
            }
            // If user was previously approved but is no longer the team lead, 
            // update their old application status to 'removed' and allow reapplication
            if ($existingApp['status'] === 'approved' && $subEvent['team_lead_id'] != $userId) {
                $updateStmt = $pdo->prepare("UPDATE teamlead_applications SET status = 'removed', feedback = 'Reassigned to another team lead' WHERE id = ?");
                $updateStmt->execute([$existingApp['id']]);
            }
        }

        // Create application
        $stmt = $pdo->prepare("
            INSERT INTO teamlead_applications (user_id, sub_event_id, message, status, created_at)
            VALUES (?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([$userId, $subEventId, $message]);
        $applicationId = $pdo->lastInsertId();

        // Notify the event creator
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message, link, created_at)
            VALUES (?, 'teamlead_application', 'New Team Lead Application', ?, ?, NOW())
        ");
        $notifyMessage = "A new application to lead '{$subEvent['title']}' has been submitted.";
        $notifyLink = "/creator/team";
        $stmt->execute([$subEvent['creator_id'], $notifyMessage, $notifyLink]);

        echo json_encode([
            'success' => true,
            'message' => 'Application submitted successfully! The event creator will review your application.',
            'application_id' => $applicationId
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
