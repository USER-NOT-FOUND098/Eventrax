<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();
checkRole(['admin', 'creator']);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || !isset($data['email']) || !isset($data['role'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, email, and role are required']);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$role = trim($data['role']);
$institution = isset($data['institution']) ? trim($data['institution']) : '';
$password = isset($data['password']) ? $data['password'] : bin2hex(random_bytes(8)); // Auto-generate if not provided

// Validate role
$validRoles = ['admin', 'creator', 'teamlead', 'student'];
if (!in_array($role, $validRoles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role']);
    exit;
}

// Security: Creators cannot create Admins
if ($_SESSION['role'] === 'creator' && $role === 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Creators cannot create Admin accounts']);
    exit;
}

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(['error' => 'Email already exists']);
    exit;
}

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password_hash, role, institution, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW())
    ");
    $stmt->execute([$name, $email, $hashedPassword, $role, $institution]);

    $userId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => $role,
            'institution' => $institution,
            'status' => 'active'
        ]
    ]);
}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
}
?>
