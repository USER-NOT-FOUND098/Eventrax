<?php
/**
 * Team Lead - Remove Volunteer
 * 
 * POST: { volunteer_id, sub_event_id, reason }
 * Removes a volunteer for misbehavior and logs the removal
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

    $volunteerId = $data['volunteer_id'] ?? null;
    $subEventId = $data['sub_event_id'] ?? null;
    $reason = $data['reason'] ?? null;

    if (!$volunteerId || !$subEventId || !$reason) {
        http_response_code(400);
        echo json_encode(['error' => 'volunteer_id, sub_event_id, and reason are required']);
        exit;
    }

    // Get the sub-event and event details
    $seStmt = $pdo->prepare("
        SELECT se.*, e.creator_id, e.title as event_title
        FROM sub_events se
        JOIN events e ON se.event_id = e.id
        WHERE se.id = ?
    ");
    $seStmt->execute([$subEventId]);
    $subEvent = $seStmt->fetch();

    if (!$subEvent) {
        http_response_code(404);
        echo json_encode(['error' => 'Sub-event not found']);
        exit;
    }

    // Check permission: must be admin, event creator, or assigned team lead
    $canRemove = ($userRole === 'admin')
        || ($subEvent['creator_id'] == $userId)
        || ($subEvent['team_lead_id'] == $userId);

    if (!$canRemove) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to remove volunteers from this sub-event']);
        exit;
    }

    // Get volunteer info before removal
    $volStmt = $pdo->prepare("
        SELECT v.*, u.name as volunteer_name, u.email as volunteer_email
        FROM volunteers v
        JOIN users u ON v.user_id = u.id
        WHERE v.user_id = ? AND v.sub_event_id = ?
    ");
    $volStmt->execute([$volunteerId, $subEventId]);
    $volunteer = $volStmt->fetch();

    if (!$volunteer) {
        http_response_code(404);
        echo json_encode(['error' => 'Volunteer not found in this sub-event']);
        exit;
    }

    // Log the removal
    $logStmt = $pdo->prepare("
        INSERT INTO volunteer_removals (volunteer_id, sub_event_id, removed_by, reason, removed_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $logStmt->execute([$volunteerId, $subEventId, $userId, $reason]);

    // Remove from volunteers table
    $deleteStmt = $pdo->prepare("DELETE FROM volunteers WHERE user_id = ? AND sub_event_id = ?");
    $deleteStmt->execute([$volunteerId, $subEventId]);

    // Update application status if exists
    $updateAppStmt = $pdo->prepare("
        UPDATE volunteer_applications 
        SET status = 'rejected', feedback = ?
        WHERE student_id = ? AND sub_event_id = ?
    ");
    $updateAppStmt->execute(["Removed: $reason", $volunteerId, $subEventId]);

    // Notify the removed volunteer
    $notifStmt = $pdo->prepare("
        INSERT INTO notifications (user_id, title, message, type, link, created_at)
        VALUES (?, 'Volunteer Role Removed', ?, 'warning', ?, NOW())
    ");
    $notifStmt->execute([
        $volunteerId,
        "You have been removed from the sub-event '{$subEvent['title']}'. Reason: {$reason}",
        '/student/volunteer'
    ]);

    // Notify the event creator (if removed by team lead)
    if ($subEvent['creator_id'] != $userId && $userRole !== 'admin') {
        $creatorNotifStmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, link, created_at)
            VALUES (?, 'Volunteer Removed', ?, 'info', ?, NOW())
        ");
        $creatorNotifStmt->execute([
            $subEvent['creator_id'],
            "Team Lead removed volunteer '{$volunteer['volunteer_name']}' from '{$subEvent['title']}'. Reason: {$reason}",
            '/creator/events/' . $subEvent['event_id']
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Volunteer removed successfully'
    ]);


}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
