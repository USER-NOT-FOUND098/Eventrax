<?php
/**
 * Direct Team Lead/Volunteer Assignment API
 * 
 * POST: Assign a user directly as team lead or volunteer
 * - Requires admin or creator role
 * - If replacing existing team lead, notifies the old one and updates their status
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
$assignerId = $_SESSION['user_id'];
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

    // Check permission - only event creator/assigned creator or admin can assign
    if ($role !== 'admin' && $subEvent['creator_id'] != $assignerId && $subEvent['assigned_creator_id'] != $assignerId) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only assign members for your own events']);
        exit;
    }

    // Get user details
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($type === 'lead') {
        // Check if there's an existing team lead
        $oldLeadId = $subEvent['team_lead_id'];
        $oldLeadName = null;

        if ($oldLeadId && $oldLeadId != $userId) {
            // Get old team lead name
            $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $stmt->execute([$oldLeadId]);
            $oldLead = $stmt->fetch();
            $oldLeadName = $oldLead ? $oldLead['name'] : 'Previous Lead';

            // Notify old team lead that they've been replaced
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, related_type, related_id) 
                VALUES (?, ?, ?, 'warning', 'sub_event', ?)
            ");
            $stmt->execute([
                $oldLeadId,
                'Team Lead Role Removed',
                "You have been replaced as Team Lead for '{$subEvent['title']}' by {$user['name']}.",
                $subEventId
            ]);

            // Update old team lead's volunteer application status to 'removed' if they had one
            $stmt = $pdo->prepare("
                UPDATE volunteer_applications 
                SET status = 'removed', reviewed_at = NOW(), reviewed_by = ? 
                WHERE sub_event_id = ? AND student_id = ? AND status = 'approved' AND role = 'Team Lead'
            ");
            $stmt->execute([$assignerId, $subEventId, $oldLeadId]);

            // Also remove them from volunteers table for team lead role
            $stmt = $pdo->prepare("DELETE FROM volunteers WHERE sub_event_id = ? AND user_id = ? AND role = 'Team Lead'");
            $stmt->execute([$subEventId, $oldLeadId]);
        }

        // Update sub_events table with new team lead
        $stmt = $pdo->prepare("UPDATE sub_events SET team_lead_id = ? WHERE id = ?");
        $stmt->execute([$userId, $subEventId]);

        // Add to volunteers table as Team Lead
        $stmt = $pdo->prepare("INSERT INTO volunteers (sub_event_id, user_id, role) VALUES (?, ?, 'Team Lead') ON DUPLICATE KEY UPDATE role = 'Team Lead'");
        $stmt->execute([$subEventId, $userId]);

        // Update or create volunteer application for Team Lead role
        $stmt = $pdo->prepare("
            INSERT INTO volunteer_applications (sub_event_id, student_id, role, status, message, reviewed_at, reviewed_by) 
            VALUES (?, ?, 'Team Lead', 'approved', 'Directly assigned by creator/admin', NOW(), ?)
            ON DUPLICATE KEY UPDATE status = 'approved', role = 'Team Lead', reviewed_at = NOW(), reviewed_by = ?
        ");
        $stmt->execute([$subEventId, $userId, $assignerId, $assignerId]);

        // Notify new team lead
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id) 
            VALUES (?, ?, ?, 'success', 'sub_event', ?)
        ");
        $stmt->execute([
            $userId,
            'Team Lead Assigned',
            "You have been assigned as Team Lead for '{$subEvent['title']}' in {$subEvent['event_title']}! You now have access to manage this sub-event.",
            $subEventId
        ]);

        $message = "Team Lead assigned successfully.";
        if ($oldLeadName) {
            $message .= " Previous lead ({$oldLeadName}) has been notified.";
        }

        echo json_encode([
            'success' => true,
            'message' => $message
        ]);
    }
    else {
        // Assign as volunteer
        $stmt = $pdo->prepare("INSERT INTO volunteers (sub_event_id, user_id, role) VALUES (?, ?, 'Volunteer') ON DUPLICATE KEY UPDATE role = 'Volunteer'");
        $stmt->execute([$subEventId, $userId]);

        // Create volunteer application record
        $stmt = $pdo->prepare("
            INSERT INTO volunteer_applications (sub_event_id, student_id, role, status, message, reviewed_at, reviewed_by) 
            VALUES (?, ?, 'Volunteer', 'approved', 'Directly assigned by creator/admin', NOW(), ?)
            ON DUPLICATE KEY UPDATE status = 'approved', reviewed_at = NOW(), reviewed_by = ?
        ");
        $stmt->execute([$subEventId, $userId, $assignerId, $assignerId]);

        // Notify volunteer
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id) 
            VALUES (?, ?, ?, 'info', 'sub_event', ?)
        ");
        $stmt->execute([
            $userId,
            'Volunteer Assignment',
            "You have been assigned as a Volunteer for '{$subEvent['title']}' in {$subEvent['event_title']}.",
            $subEventId
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Volunteer assigned successfully'
        ]);
    }

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
