<?php
require_once '../../config/db.php';
header('Content-Type: text/plain');

try {
    $stmt = $pdo->query("DESCRIBE sub_events");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo $col['Field'] . " (" . $col['Type'] . ")\n";
    }
}
catch (Exception $e) {
    echo $e->getMessage();
}
?>
