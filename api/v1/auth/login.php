<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';



// Basic Check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing email or password']);
    exit;
}

$email = strtolower(trim($data->email));
$password = $data->password;





try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Check user status
        $status = $user['status'] ?? 'active';
        
        if ($status === 'pending') {
            http_response_code(403);
            echo json_encode([
                'error' => 'Your account is pending approval. Please wait for admin to approve your registration.',
                'status' => 'pending'
            ]);
            exit;
        }
        
        if ($status === 'suspended') {
            http_response_code(403);
            echo json_encode([
                'error' => 'Your account has been suspended. Please contact admin.',
                'status' => 'suspended'
            ]);
            exit;
        }

        // Successful login
        unset($user['password_hash']); // Don't send hash back
        
        // Start Session for state
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user' => $user,
            'message' => 'Login successful'
        ]);
        exit;
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
}


