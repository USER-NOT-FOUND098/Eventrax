<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

// This script generates automated notifications for students
// Should be run via cron job daily

function generateEventDayReminders($pdo) {
    try {
        // Get events happening today
        $today = date('Y-m-d');
        $eventsSql = "SELECT e.id, e.title, e.venue, e.start_date, e.end_date, 
                    r.student_id, u.name as student_name, u.email
                    FROM events e
                    JOIN registrations r ON e.id = r.event_id
                    JOIN users u ON r.student_id = u.id
                    WHERE DATE(e.start_date) = ? 
                    AND e.status = 'upcoming'
                    AND r.status = 'registered'";
        
        $eventsStmt = $pdo->prepare($eventsSql);
        $eventsStmt->execute([$today]);
        $todayEvents = $eventsStmt->fetchAll();
        
        $notificationsCreated = 0;
        
        foreach ($todayEvents as $event) {
            // Check if notification already exists for this student and event
            $existingSql = "SELECT id FROM notifications 
                          WHERE user_id = ? AND user_type = 'student' 
                          AND event_id = ? AND type = 'event_day'
                          AND DATE(created_at) = ?";
            $existingStmt = $pdo->prepare($existingSql);
            $existingStmt->execute([$event['student_id'], $event['id'], $today]);
            
            if (!$existingStmt->fetch()) {
                // Create event day reminder
                $insertSql = "INSERT INTO notifications 
                             (user_id, user_type, type, title, message, event_id, is_read, created_at) 
                             VALUES (?, 'student', 'event_day', ?, ?, ?, 0, NOW())";
                
                $title = "🎉 Event Today: " . $event['title'];
                $message = sprintf(
                    "Good news! Your registered event '%s' is happening today at %s. Don't forget to attend!",
                    $event['title'],
                    date('h:i A', strtotime($event['start_date']))
                );
                
                $insertStmt = $pdo->prepare($insertSql);
                if ($insertStmt->execute([$event['student_id'], $title, $message, $event['id']])) {
                    $notificationsCreated++;
                }
            }
        }
        
        return $notificationsCreated;
        
    } catch (Exception $e) {
        error_log("Error generating event day reminders: " . $e->getMessage());
        return 0;
    }
}

function generateSubEventReminders($pdo) {
    try {
        // Get sub-events happening today
        $today = date('Y-m-d');
        $subEventsSql = "SELECT se.id, se.title, se.venue, se.start_time, se.end_time,
                        ser.student_id, u.name as student_name, u.email,
                        e.title as event_title
                        FROM sub_events se
                        JOIN sub_event_registrations ser ON se.id = ser.sub_event_id
                        JOIN users u ON ser.student_id = u.id
                        JOIN events e ON se.event_id = e.id
                        WHERE DATE(se.start_time) = ? 
                        AND se.status = 'upcoming'
                        AND ser.status = 'registered'";
        
        $subEventsStmt = $pdo->prepare($subEventsSql);
        $subEventsStmt->execute([$today]);
        $todaySubEvents = $subEventsStmt->fetchAll();
        
        $notificationsCreated = 0;
        
        foreach ($todaySubEvents as $subEvent) {
            // Check if notification already exists
            $existingSql = "SELECT id FROM notifications 
                          WHERE user_id = ? AND user_type = 'student' 
                          AND sub_event_id = ? AND type = 'event_day'
                          AND DATE(created_at) = ?";
            $existingStmt = $pdo->prepare($existingSql);
            $existingStmt->execute([$subEvent['student_id'], $subEvent['id'], $today]);
            
            if (!$existingStmt->fetch()) {
                // Create sub-event reminder
                $insertSql = "INSERT INTO notifications 
                             (user_id, user_type, type, title, message, sub_event_id, is_read, created_at) 
                             VALUES (?, 'student', 'event_day', ?, ?, ?, 0, NOW())";
                
                $title = "⏰ Sub-Event Today: " . $subEvent['title'];
                $message = sprintf(
                    "Reminder! Your sub-event '%s' from '%s' is happening today at %s in %s.",
                    $subEvent['title'],
                    $subEvent['event_title'],
                    date('h:i A', strtotime($subEvent['start_time'])),
                    $subEvent['venue']
                );
                
                $insertStmt = $pdo->prepare($insertSql);
                if ($insertStmt->execute([$subEvent['student_id'], $title, $message, $subEvent['id']])) {
                    $notificationsCreated++;
                }
            }
        }
        
        return $notificationsCreated;
        
    } catch (Exception $e) {
        error_log("Error generating sub-event reminders: " . $e->getMessage());
        return 0;
    }
}

function generateWinnerNotifications($pdo) {
    try {
        // Check for completed events with winners (assuming prizes table exists)
        $recentlyCompletedSql = "SELECT e.id, e.title, p.winner_email, p.prize_name, p.prize_description
                                FROM events e
                                JOIN prizes p ON e.id = p.event_id
                                WHERE e.status = 'completed'
                                AND DATE(e.end_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
                                AND p.winner_email IS NOT NULL
                                AND p.winner_email != ''";
        
        $completedStmt = $pdo->prepare($recentlyCompletedSql);
        $completedStmt->execute();
        $completedEvents = $completedStmt->fetchAll();
        
        $notificationsCreated = 0;
        
        foreach ($completedEvents as $event) {
            // Find student by email
            $studentSql = "SELECT id, name FROM users WHERE email = ? AND role = 'student'";
            $studentStmt = $pdo->prepare($studentSql);
            $studentStmt->execute([$event['winner_email']]);
            $student = $studentStmt->fetch();
            
            if ($student) {
                // Check if notification already exists
                $existingSql = "SELECT id FROM notifications 
                              WHERE user_id = ? AND user_type = 'student' 
                              AND event_id = ? AND type = 'winner'";
                $existingStmt = $pdo->prepare($existingSql);
                $existingStmt->execute([$student['id'], $event['id']]);
                
                if (!$existingStmt->fetch()) {
                    // Create winner notification
                    $insertSql = "INSERT INTO notifications 
                                 (user_id, user_type, type, title, message, event_id, is_read, created_at) 
                                 VALUES (?, 'student', 'winner', ?, ?, ?, 0, NOW())";
                    
                    $title = "🏆 Congratulations! You Won!";
                    $message = sprintf(
                        "Amazing news! You won the '%s' prize from the event '%s'. %s",
                        $event['prize_name'],
                        $event['title'],
                        $event['prize_description'] ? $event['prize_description'] : 'Contact the event organizer for prize collection.'
                    );
                    
                    $insertStmt = $pdo->prepare($insertSql);
                    if ($insertStmt->execute([$student['id'], $title, $message, $event['id']])) {
                        $notificationsCreated++;
                    }
                }
            }
        }
        
        return $notificationsCreated;
        
    } catch (Exception $e) {
        error_log("Error generating winner notifications: " . $e->getMessage());
        return 0;
    }
}

// Main execution
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Allow manual triggering for testing
    $type = $_POST['type'] ?? 'all';
    
    $eventReminders = 0;
    $subEventReminders = 0;
    $winnerNotifications = 0;
    
    if ($type === 'all' || $type === 'event_day') {
        $eventReminders = generateEventDayReminders($pdo);
        $subEventReminders = generateSubEventReminders($pdo);
    }
    
    if ($type === 'all' || $type === 'winner') {
        $winnerNotifications = generateWinnerNotifications($pdo);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Notification generation completed',
        'stats' => [
            'event_day_reminders' => $eventReminders + $subEventReminders,
            'winner_notifications' => $winnerNotifications,
            'total_created' => $eventReminders + $subEventReminders + $winnerNotifications
        ]
    ]);
    
} elseif ($method === 'GET') {
    // Get generation statistics
    try {
        $today = date('Y-m-d');
        
        $statsSql = "SELECT type, COUNT(*) as count 
                    FROM notifications 
                    WHERE DATE(created_at) = ? AND user_type = 'student'
                    GROUP BY type";
        $statsStmt = $pdo->prepare($statsSql);
        $statsStmt->execute([$today]);
        $stats = $statsStmt->fetchAll();
        
        $unreadSql = "SELECT COUNT(*) as count 
                     FROM notifications 
                     WHERE user_type = 'student' AND is_read = 0";
        $unreadStmt = $pdo->prepare($unreadSql);
        $unreadStmt->execute();
        $unreadCount = $unreadStmt->fetch()['count'];
        
        echo json_encode([
            'success' => true,
            'today_stats' => $stats,
            'total_unread' => $unreadCount,
            'last_run' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
