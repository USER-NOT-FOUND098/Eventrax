<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

echo "=== EventRAX API Debugger ===\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "Script: " . $_SERVER['PHP_SELF'] . "\n\n";

echo "--- Request Info ---\n";
echo "Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "GET Parameters:\n";
print_r($_GET);
echo "\n";

echo "--- Database Connection ---\n";
try {
    // Adjust path as needed based on where this file is placed relative to config
    $configPath = '../../config/db.php';
    if (!file_exists($configPath)) {
        throw new Exception("Config file not found at: $configPath");
    }
    require_once $configPath;
    echo "Database connection successful.\n";
}
catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
    exit;
}

echo "\n--- Testing 'all=true' Query ---\n";
try {
    $sql = "SELECT se.id, se.title FROM sub_events se ORDER BY se.start_time ASC LIMIT 5";
    echo "Test SQL: $sql\n";

    $stmt = $pdo->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Query executed successfully.\n";
    echo "Found " . count($results) . " sub-events in a basic query.\n";

    if (count($results) > 0) {
        echo "First 3 results:\n";
        print_r(array_slice($results, 0, 3));
    }


}
catch (Exception $e) {
    echo "Query Failed: " . $e->getMessage() . "\n";
}

echo "\n--- Server Environment ---\n";
echo "PHP Version: " . phpversion() . "\n";
?>
