<?php
/**
 * Remove Team Lead/Volunteer from Sub-Event
 * 
 * POST: Remove a user from team lead or volunteer role
 * - Requires admin or creator role
 * - Notifies the removed user
 */
require_once '../../config/cors.php';
require_once '../../config/db.php';

session_start();

// Creators and Admins only
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['admin', 'creator'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized. Creator or Admin access required.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->sub_event_id) || !isset($data->user_id) || !isset($data->type)) {
    http_response_code(400);
    echo json_encode(['error' => 'sub_event_id, user_id, and type (lead/volunteer) required']);
    exit;
}

$subEventId = (int)$data->sub_event_id;
$userId = (int)$data->user_id;
$type = $data->type; // 'lead' or 'volunteer'
$message = $data->message ?? 'No reason provided';
$removerId = $_SESSION['user_id'];
$role = $_SESSION['role'];

try {
    // Get sub-event with ownership check
    $stmt = $pdo->prepare("
        SELECT se.*, e.creator_id, e.assigned_creator_id, e.title as event_title
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

    // Check permission
    if ($role !== 'admin' && $subEvent['creator_id'] != $removerId && $subEvent['assigned_creator_id'] != $removerId) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only remove members from your own events']);
        exit;
    }

    // Get user details
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($type === 'lead') {
        // Remove team lead from sub_events
        if ($subEvent['team_lead_id'] == $userId) {
            $stmt = $pdo->prepare("UPDATE sub_events SET team_lead_id = NULL WHERE id = ?");
            $stmt->execute([$subEventId]);
        }

        // Update volunteer application status to 'removed'
        $stmt = $pdo->prepare("
            UPDATE volunteer_applications 
            SET status = 'removed', reviewed_at = NOW(), reviewed_by = ? 
            WHERE sub_event_id = ? AND student_id = ? AND role = 'Team Lead'
        ");
        $stmt->execute([$removerId, $subEventId, $userId]);

        // Remove from volunteers table
        $stmt = $pdo->prepare("DELETE FROM volunteers WHERE sub_event_id = ? AND user_id = ? AND role = 'Team Lead'");
        $stmt->execute([$subEventId, $userId]);

        // Notify removed team lead
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id) 
            VALUES (?, ?, ?, 'warning', 'sub_event', ?)
        ");
        $notificationMessage = "You have been removed as Team Lead from '{$subEvent['title']}'.";
        if ($message && $message !== 'No reason provided') {
            $notificationMessage .= " Reason: {$message}";
        }
        $stmt->execute([$userId, 'Team Lead Role Removed', $notificationMessage, $subEventId]);

        echo json_encode([
            'success' => true,
            'message' => "Team Lead {$user['name']} has been removed and notified."
        ]);
    }
    else {
        // Remove volunteer
        $stmt = $pdo->prepare("
            UPDATE volunteer_applications 
            SET status = 'removed', reviewed_at = NOW(), reviewed_by = ? 
            WHERE sub_event_id = ? AND student_id = ? AND role = 'Volunteer'
        ");
        $stmt->execute([$removerId, $subEventId, $userId]);

        // Remove from volunteers table
        $stmt = $pdo->prepare("DELETE FROM volunteers WHERE sub_event_id = ? AND user_id = ? AND role = 'Volunteer'");
        $stmt->execute([$subEventId, $userId]);

        // Notify removed volunteer
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id) 
            VALUES (?, ?, ?, 'warning', 'sub_event', ?)
        ");
        $notificationMessage = "You have been removed as Volunteer from '{$subEvent['title']}'.";
        if ($message && $message !== 'No reason provided') {
            $notificationMessage .= " Reason: {$message}";
        }
        $stmt->execute([$userId, 'Volunteer Role Removed', $notificationMessage, $subEventId]);

        echo json_encode([
            'success' => true,
            'message' => "Volunteer {$user['name']} has been removed and notified."
        ]);
    }

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
