<?php
require_once '../../config/db.php';
header('Content-Type: text/plain');

$search = "Ceremony";
$stmt = $pdo->prepare("SELECT id, title, event_id, team_lead_id FROM sub_events WHERE title LIKE ?");
$stmt->execute(["%$search%"]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($results) > 0) {
    echo "Found " . count($results) . " sub-events matching '$search':\n\n";
    foreach ($results as $row) {
        echo "ID: " . $row['id'] . "\n";
        echo "Title: " . $row['title'] . "\n";
        echo "Event ID: " . $row['event_id'] . "\n";
        echo "Team Lead ID: " . ($row['team_lead_id'] ?? 'None') . "\n";
        echo "-------------------\n";
    }
}
else {
    echo "No sub-events found matching '$search'.\n";
    // List all just in case
    echo "\nListing ALL sub-events:\n";
    $stmt = $pdo->query("SELECT id, title FROM sub_events LIMIT 20");
    foreach ($stmt->fetchAll() as $row) {
        echo "[{$row['id']}] {$row['title']}\n";
    }
}
?>
