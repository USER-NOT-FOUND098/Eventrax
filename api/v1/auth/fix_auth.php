<?php
// fix_auth.php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
require_once '../../config/db.php';

echo "<h1>Eventrax Emergency Fix</h1>";

try {
    $email = 'admin@eventrax.com';
    $password = 'admin123';
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    // 1. Clear existing
    $pdo->prepare("DELETE FROM users WHERE email = ?")->execute([$email]);
    
    // 2. Insert fresh admin
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, institution, avatar) VALUES ('System Admin', ?, ?, 'admin', 'Eventrax HQ', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin')");
    $stmt->execute([$email, $hash]);
    
    echo "<div style='color: green; font-weight: bold; font-size: 1.2em;'>";
    echo "SUCCESS! Admin User has been reset.<br>";
    echo "Email: $email<br>";
    echo "Password: $password<br>";
    echo "</div>";
    
    echo "<p>Now, go back to your app at <a href='http://localhost:5173/login'>http://localhost:5173/login</a> and use these credentials.</p>";

} catch (Exception $e) {
    echo "<div style='color: red;'>Error: " . $e->getMessage() . "</div>";
}
?>
