<?php
/**
 * Team Lead Tables Migration
 * Creates all necessary tables for the Team Lead panel
 * 
 * Run this in browser: http://localhost/eventrax/api/migrations/migrate_team_lead_tables.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

header('Content-Type: application/json');

$results = [];

try {
    // 1. Team Lead Assignments - Links users to sub-events as team leads
    $sql1 = "CREATE TABLE IF NOT EXISTS team_lead_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sub_event_id INT NOT NULL,
        assigned_by INT NOT NULL,
        role ENUM('lead', 'co-lead') DEFAULT 'lead',
        status ENUM('active', 'inactive') DEFAULT 'active',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (user_id, sub_event_id)
    )";
    $pdo->exec($sql1);
    $results[] = ['table' => 'team_lead_assignments', 'status' => 'created'];

    // 2. Volunteer Applications - Tracks applications to sub-events
    $sql2 = "CREATE TABLE IF NOT EXISTS volunteer_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        sub_event_id INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        message TEXT,
        feedback TEXT,
        reviewed_by INT,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_application (student_id, sub_event_id)
    )";
    $pdo->exec($sql2);
    $results[] = ['table' => 'volunteer_applications', 'status' => 'created'];

    // 3. Team Tasks - Task assignments for team members
    $sql3 = "CREATE TABLE IF NOT EXISTS team_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sub_event_id INT NOT NULL,
        assigned_to INT,
        assigned_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        deadline DATETIME,
        status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql3);
    $results[] = ['table' => 'team_tasks', 'status' => 'created'];

    // 4. Team Announcements - Announcements for specific sub-events
    $sql4 = "CREATE TABLE IF NOT EXISTS team_announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sub_event_id INT NOT NULL,
        created_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql4);
    $results[] = ['table' => 'team_announcements', 'status' => 'created'];

    // 5. Team Lead Credentials - Special event-specific login credentials (Future Feature)
    $sql5 = "CREATE TABLE IF NOT EXISTS team_lead_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sub_event_id INT NOT NULL,
        credential_id VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql5);
    $results[] = ['table' => 'team_lead_credentials', 'status' => 'created'];

    // 6. Volunteer Removals - Track removed volunteers with reason
    $sql6 = "CREATE TABLE IF NOT EXISTS volunteer_removals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        volunteer_id INT NOT NULL,
        sub_event_id INT NOT NULL,
        removed_by INT NOT NULL,
        reason TEXT NOT NULL,
        removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
        FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql6);
    $results[] = ['table' => 'volunteer_removals', 'status' => 'created'];

    echo json_encode([
        'success' => true,
        'message' => 'All team lead tables created successfully',
        'results' => $results
    ]);

}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Migration failed: ' . $e->getMessage()
    ]);
}
?>
