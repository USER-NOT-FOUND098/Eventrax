-- Phase 2 Migration: Resilient Version
-- If you get a "Duplicate column" error, it just means that part is already done.
-- You can run these lines one by one in phpMyAdmin.

USE eventrax_db;

-- 1. Add status column to users (Skip if already exists)
-- ALTER TABLE users ADD COLUMN status ENUM('pending', 'active', 'suspended') DEFAULT 'active' AFTER role;

-- 2. Update existing users to be active
UPDATE users SET status = 'active' WHERE status IS NULL OR status = '';

-- 3. Add volunteer_applications table (Safe to run multiple times)
CREATE TABLE IF NOT EXISTS volunteer_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_event_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    message TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_application (sub_event_id, student_id)
);

-- 4. Add fields to sub_events (Run these one by one if they fail)
-- If status exists but these don't, run these:
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS proposed_start DATETIME NULL AFTER end_time;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS proposed_end DATETIME NULL AFTER proposed_start;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS menu TEXT NULL AFTER proposed_end;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS finalized BOOLEAN DEFAULT FALSE AFTER menu;

-- 5. Admin logs (Safe to run multiple times)
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

