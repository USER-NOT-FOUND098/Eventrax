<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// Basic Validation
if (!isset($data->name) || !isset($data->email) || !isset($data->password) || !isset($data->role)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$name = htmlspecialchars(strip_tags($data->name));
$email = strtolower(filter_var($data->email, FILTER_SANITIZE_EMAIL));
$password = $data->password;
$role = $data->role;
$institution = isset($data->institution) ? htmlspecialchars(strip_tags($data->institution)) : '';

// Validate Role - BLOCK admin registration via public signup
$allowed_roles = ['creator', 'teamlead', 'student'];
if (!in_array($role, $allowed_roles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role. Admin accounts cannot be created via signup.']);
    exit;
}

// Determine status based on role
// Creators and Team Leads require admin/creator approval
// Students are active immediately
$status = in_array($role, ['creator', 'teamlead']) ? 'pending' : 'active';

// Hash Password
$password_hash = password_hash($password, PASSWORD_DEFAULT);
$avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($name);

try {
    // Check if email exists
    $check = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
    $check->execute([$email]);
    if ($check->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists']);
        exit;
    }

    // Insert User with status
    $sql = "INSERT INTO users (name, email, password_hash, role, status, institution, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$name, $email, $password_hash, $role, $status, $institution, $avatar]);

    $userId = $pdo->lastInsertId();

    // Fetch the new user
    $stmt = $pdo->prepare("SELECT id, name, email, role, status, institution, avatar, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    $message = ($status === 'pending')
        ? 'Registration submitted! Your account is pending admin approval.'
        : 'Registration successful! You can now login.';

    echo json_encode([
        'success' => true,
        'user' => $user,
        'message' => $message,
        'requiresApproval' => ($status === 'pending')
    ]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
}
