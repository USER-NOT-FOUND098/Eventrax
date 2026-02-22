<?php
/**
 * Special Credentials - Redeem Team Lead Credential
 * 
 * POST: { credential_code, password }
 * Allows a student to redeem a credential and become a team lead for the event
 */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

header('Content-Type: application/json');

// Check authentication
$userId = checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $credentialCode = $data['credential_code'] ?? null;
    $password = $data['password'] ?? null;

    if (!$credentialCode || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'credential_code and password are required']);
        exit;
    }

    // Find the credential
    $credStmt = $pdo->prepare("
        SELECT tlc.*, e.title as event_title, e.id as event_id
        FROM team_lead_credentials tlc
        JOIN events e ON tlc.event_id = e.id
        WHERE tlc.credential_code = ?
    ");
    $credStmt->execute([$credentialCode]);
    $credential = $credStmt->fetch();

    if (!$credential) {
        http_response_code(404);
        echo json_encode(['error' => 'Invalid credential code']);
        exit;
    }

    // Check if expired
    if (strtotime($credential['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['error' => 'This credential has expired']);
        exit;
    }

    // Check if already used
    if ($credential['status'] === 'used') {
        http_response_code(400);
        echo json_encode(['error' => 'This credential has already been used']);
        exit;
    }

    // Check if revoked
    if ($credential['status'] === 'revoked') {
        http_response_code(400);
        echo json_encode(['error' => 'This credential has been revoked']);
        exit;
    }

    // If credential is tied to a specific student, verify it's them
    if ($credential['student_id'] && $credential['student_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'This credential was assigned to another student']);
        exit;
    }

    // Verify password
    if (!password_verify($password, $credential['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid password']);
        exit;
    }

    // Update user role to teamlead if they're a student
    $userStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $currentRole = $userStmt->fetchColumn();

    if ($currentRole === 'student') {
        $updateRoleStmt = $pdo->prepare("UPDATE users SET role = 'teamlead' WHERE id = ?");
        $updateRoleStmt->execute([$userId]);
    }

    // Mark credential as used
    $updateCredStmt = $pdo->prepare("
        UPDATE team_lead_credentials 
        SET status = 'used', used_at = NOW(), used_by = ?
        WHERE id = ?
    ");
    $updateCredStmt->execute([$userId, $credential['id']]);

    // Assign user to all sub-events of this event as team lead
    $subEventsStmt = $pdo->prepare("SELECT id FROM sub_events WHERE event_id = ?");
    $subEventsStmt->execute([$credential['event_id']]);
    $subEvents = $subEventsStmt->fetchAll();

    foreach ($subEvents as $subEvent) {
        // Check if assignment already exists
        $checkStmt = $pdo->prepare("
            SELECT id FROM team_lead_assignments 
            WHERE user_id = ? AND sub_event_id = ?
        ");
        $checkStmt->execute([$userId, $subEvent['id']]);

        if (!$checkStmt->fetch()) {
            $assignStmt = $pdo->prepare("
                INSERT INTO team_lead_assignments (user_id, sub_event_id, assigned_by, role, status, assigned_at)
                VALUES (?, ?, ?, 'lead', 'active', NOW())
            ");
            $assignStmt->execute([$userId, $subEvent['id'], $credential['created_by']]);
        }
    }

    // Also update sub_events team_lead_id
    $updateSubEventsStmt = $pdo->prepare("
        UPDATE sub_events SET team_lead_id = ? 
        WHERE event_id = ? AND (team_lead_id IS NULL OR team_lead_id = 0)
    ");
    $updateSubEventsStmt->execute([$userId, $credential['event_id']]);

    // Notify the credential creator
    $notifStmt = $pdo->prepare("
        INSERT INTO notifications (user_id, title, message, type, link, created_at)
        VALUES (?, 'Credential Redeemed', ?, 'success', ?, NOW())
    ");

    $userNameStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
    $userNameStmt->execute([$userId]);
    $userName = $userNameStmt->fetchColumn();

    $notifStmt->execute([
        $credential['created_by'],
        "{$userName} has redeemed the Team Lead credential for '{$credential['event_title']}'",
        '/creator/events/' . $credential['event_id']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Credential redeemed successfully! You are now a Team Lead for this event.',
        'event_title' => $credential['event_title'],
        'new_role' => 'teamlead'
    ]);


}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
