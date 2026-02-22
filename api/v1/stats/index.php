<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

// Stats are read-only, allow access without strict session check
// The frontend will handle auth redirects if needed
session_start();

try {
    $stats = [];
    
    // Total Events
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM events");
    $stats['totalEvents'] = $stmt->fetch()['count'];
    
    // Events by Status
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM events GROUP BY status");
    $eventStatus = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    $stats['upcomingEvents'] = $eventStatus['upcoming'] ?? 0;
    $stats['ongoingEvents'] = $eventStatus['ongoing'] ?? 0;
    $stats['completedEvents'] = $eventStatus['completed'] ?? 0;

    // Total Users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $stats['totalUsers'] = $stmt->fetch()['count'];

    // Users by Status
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM users GROUP BY status");
    $userStatus = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    $stats['pendingApprovals'] = $userStatus['pending'] ?? 0;
    $stats['activeUsers'] = $userStatus['active'] ?? 0;
    $stats['suspendedUsers'] = $userStatus['suspended'] ?? 0;

    // Total Budget
    $stmt = $pdo->query("SELECT SUM(budget) as total FROM events");
    $stats['totalBudget'] = $stmt->fetch()['total'] ?? 0;

    // Total Expenses
    $stmt = $pdo->query("SELECT SUM(amount) as total FROM expenses");
    $stats['totalExpenses'] = $stmt->fetch()['total'] ?? 0;

    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
