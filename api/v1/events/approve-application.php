<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['application_id']) || !isset($data['status'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID and status are required']);
        exit;
    }

    $applicationId = (int)$data['application_id'];
    $status = $data['status']; // 'approved' or 'rejected'
    $adminId = $_SESSION['user_id'];

    if (!in_array($status, ['approved', 'rejected'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status. Must be approved or rejected']);
        exit;
    }

    try {
        // Get application details
        $stmt = $pdo->prepare("SELECT event_id, creator_id FROM event_applications WHERE id = ?");
        $stmt->execute([$applicationId]);
        $application = $stmt->fetch();

        if (!$application) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found']);
            exit;
        }

        $pdo->beginTransaction();

        // Update application status
        $stmt = $pdo->prepare("
            UPDATE event_applications 
            SET status = ?, reviewed_at = NOW(), reviewed_by = ? 
            WHERE id = ?
        ");
        $stmt->execute([$status, $adminId, $applicationId]);

        if ($status === 'approved') {
            // Assign creator to event
            $stmt = $pdo->prepare("UPDATE events SET assigned_creator_id = ? WHERE id = ?");
            $stmt->execute([$application['creator_id'], $application['event_id']]);

            // Reject all other pending applications for this event
            $stmt = $pdo->prepare("
                UPDATE event_applications 
                SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ? 
                WHERE event_id = ? AND id != ? AND status = 'pending'
            ");
            $stmt->execute([$adminId, $application['event_id'], $applicationId]);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Application ' . $status . ' successfully'
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
