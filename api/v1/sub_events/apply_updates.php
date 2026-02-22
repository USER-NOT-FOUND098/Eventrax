<?php
require_once '../../config/db.php';

try {
    // 1. Add fields to sub_events table
    echo "Updating sub_events table...\n";
    $pdo->exec("ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500) DEFAULT NULL");
    $pdo->exec("ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS lead_instructions TEXT DEFAULT NULL");
    echo "Sub-events table updated successfully.\n";

    // 2. Add sub_event_id to announcements table
    echo "Updating announcements table...\n";
    $pdo->exec("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS sub_event_id INT DEFAULT NULL");
    
    // Add foreign key if not exists (optional but good practice)
    try {
        $pdo->exec("ALTER TABLE announcements ADD CONSTRAINT fk_sub_event FOREIGN KEY (sub_event_id) REFERENCES sub_events(id) ON DELETE CASCADE");
        echo "Foreign key constraint added to announcements table.\n";
    } catch (Exception $ek) {
        echo "Note: Foreign key might already exist or could not be added: " . $ek->getMessage() . "\n";
    }
    
    echo "Announcements table updated successfully.\n";

} catch (Exception $e) {
    echo "Error applying updates: " . $e->getMessage() . "\n";
    exit(1);
}
?>
