<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['creator', 'admin']);

try {
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['role'];
    $stats = [];
    
    // If admin, show all events. If creator, show only their events (created OR assigned)
    $isAdmin = (strtolower($userRole) === 'admin');
    
    // My Events Count
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM events");
        $stats['myEvents'] = $stmt->fetch()['count'];
    } else {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM events WHERE creator_id = ? OR assigned_creator_id = ?");
        $stmt->execute([$userId, $userId]);
        $stats['myEvents'] = $stmt->fetch()['count'];
    }
    
    // Events by Status
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM events GROUP BY status");
        $eventStatus = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    } else {
        $stmt = $pdo->prepare("SELECT status, COUNT(*) as count FROM events WHERE creator_id = ? OR assigned_creator_id = ? GROUP BY status");
        $stmt->execute([$userId, $userId]);
        $eventStatus = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }
    $stats['upcomingEvents'] = $eventStatus['upcoming'] ?? 0;
    $stats['ongoingEvents'] = $eventStatus['ongoing'] ?? 0;
    $stats['completedEvents'] = $eventStatus['completed'] ?? 0;

    // Total Budget
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT SUM(budget) as total FROM events");
        $stats['totalBudget'] = $stmt->fetch()['total'] ?? 0;
    } else {
        $stmt = $pdo->prepare("SELECT SUM(budget) as total FROM events WHERE creator_id = ? OR assigned_creator_id = ?");
        $stmt->execute([$userId, $userId]);
        $stats['totalBudget'] = $stmt->fetch()['total'] ?? 0;
    }

    // Total Expenses
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT SUM(amount) as total FROM expenses");
        $stats['totalExpenses'] = $stmt->fetch()['total'] ?? 0;
    } else {
        $stmt = $pdo->prepare("
            SELECT SUM(e.amount) as total 
            FROM expenses e 
            JOIN events ev ON e.event_id = ev.id 
            WHERE ev.creator_id = ? OR ev.assigned_creator_id = ?
        ");
        $stmt->execute([$userId, $userId]);
        $stats['totalExpenses'] = $stmt->fetch()['total'] ?? 0;
    }

    // Total Volunteers
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT COUNT(DISTINCT id) as count FROM volunteers");
        $stats['totalVolunteers'] = $stmt->fetch()['count'] ?? 0;
    } else {
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT v.id) as count 
            FROM volunteers v 
            JOIN sub_events se ON v.sub_event_id = se.id 
            JOIN events e ON se.event_id = e.id 
            WHERE e.creator_id = ? OR e.assigned_creator_id = ?
        ");
        $stmt->execute([$userId, $userId]);
        $stats['totalVolunteers'] = $stmt->fetch()['count'] ?? 0;
    }

    // Total Attendees
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM registrations");
        $stats['totalAttendees'] = $stmt->fetch()['count'] ?? 0;
    } else {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM registrations r 
            JOIN events e ON r.event_id = e.id 
            WHERE e.creator_id = ? OR e.assigned_creator_id = ?
        ");
        $stmt->execute([$userId, $userId]);
        $stats['totalAttendees'] = $stmt->fetch()['count'] ?? 0;
    }

    // Expense Breakdown by Category
    if ($isAdmin) {
        $stmt = $pdo->query("
            SELECT category, SUM(amount) as total 
            FROM expenses 
            GROUP BY category
        ");
        $stats['expensesByCategory'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $stmt = $pdo->prepare("
            SELECT ex.category, SUM(ex.amount) as total 
            FROM expenses ex 
            JOIN events ev ON ex.event_id = ev.id 
            WHERE ev.creator_id = ? OR ev.assigned_creator_id = ?
            GROUP BY ex.category
        ");
        $stmt->execute([$userId, $userId]);
        $stats['expensesByCategory'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
