<?php
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

if (!isset($data->application_id) || !isset($data->action)) {
    http_response_code(400);
    echo json_encode(['error' => 'Application ID and action required']);
    exit;
}

$applicationId = (int)$data->application_id;
$action = $data->action; // 'approve' or 'reject'
$reviewerId = $_SESSION['user_id'];
$role = $_SESSION['role'];

try {
    // Get application with ownership check
    $sql = "SELECT va.*, se.title as sub_event_title, e.creator_id 
            FROM volunteer_applications va 
            JOIN sub_events se ON va.sub_event_id = se.id 
            JOIN events e ON se.event_id = e.id
            WHERE va.id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$applicationId]);
    $application = $stmt->fetch();

    if (!$application) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        exit;
    }

    // Check permission - only event creator or admin can approve
    if ($role !== 'admin' && $application['creator_id'] !== $reviewerId) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only approve volunteers for your own events']);
        exit;
    }

    $newStatus = ($action === 'approve') ? 'approved' : 'rejected';
    
    $stmt = $pdo->prepare("UPDATE volunteer_applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?");
    $stmt->execute([$newStatus, $reviewerId, $applicationId]);

    // If approved, add to volunteers table
    if ($action === 'approve') {
        $stmt = $pdo->prepare("INSERT INTO volunteers (sub_event_id, user_id, role) VALUES (?, ?, 'Volunteer') ON DUPLICATE KEY UPDATE role = 'Volunteer'");
        $stmt->execute([$application['sub_event_id'], $application['student_id']]);
    }

    echo json_encode([
        'success' => true,
        'message' => "Volunteer application has been " . ($action === 'approve' ? 'approved' : 'rejected'),
        'newStatus' => $newStatus
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
