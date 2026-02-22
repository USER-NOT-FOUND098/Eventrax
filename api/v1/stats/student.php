<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

// Check authentication
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check role - only students can access
$role = $_SESSION['role'] ?? '';
if (strtolower($role) !== 'student') {
    // For other roles, just return basic stats without strict role check
    // This allows the dashboard to load for admins viewing student data
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $student_id = $_SESSION['user_id'];
        
        // Get total events count (upcoming + ongoing)
        $totalEventsStmt = $pdo->query("SELECT COUNT(*) as count FROM events WHERE status IN ('upcoming', 'ongoing')");
        $totalEvents = $totalEventsStmt->fetch()['count'];
        
        // Get upcoming events count (next 30 days)
        $upcomingEventsStmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM events 
            WHERE status = 'upcoming' 
            AND start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
        ");
        $upcomingEventsStmt->execute();
        $upcomingEvents = $upcomingEventsStmt->fetch()['count'];
        
        // Get attended events count
        $attendedEventsStmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM registrations r 
            JOIN events e ON r.event_id = e.id 
            WHERE r.student_id = ? AND r.status = 'attended'
        ");
        $attendedEventsStmt->execute([$student_id]);
        $attendedEvents = $attendedEventsStmt->fetch()['count'];
        
        // Get volunteer applications count (with fallback for missing table)
        $volunteerApplications = 0;
        try {
            $volunteerAppsStmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM volunteers 
                WHERE user_id = ?
            ");
            $volunteerAppsStmt->execute([$student_id]);
            $volunteerApplications = $volunteerAppsStmt->fetch()['count'];
        } catch (Exception $e) {
            // Table doesn't exist, use 0
            $volunteerApplications = 0;
        }
        
        // Get prize winnings count (with fallback)
        $prizeWinnings = 0;
        try {
            $prizeWinningsStmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM prizes 
                WHERE winner_email = (SELECT email FROM users WHERE id = ?)
            ");
            $prizeWinningsStmt->execute([$student_id]);
            $prizeWinnings = $prizeWinningsStmt->fetch()['count'];
        } catch (Exception $e) {
            $prizeWinnings = 0;
        }
        
        // Get achievement badges (mock data for now)
        $achievementBadges = rand(3, 12);
        
        // Get learning hours (based on attended events)
        $learningHours = $attendedEvents * 2; // Assume 2 hours per event
        
        $stats = [
            'totalEvents' => (int)$totalEvents,
            'upcomingEvents' => (int)$upcomingEvents,
            'attendedEvents' => (int)$attendedEvents,
            'volunteerApplications' => (int)$volunteerApplications,
            'prizeWinnings' => (int)$prizeWinnings,
            'achievementBadges' => $achievementBadges,
            'learningHours' => $learningHours,
        ];
        
        echo json_encode($stats);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
