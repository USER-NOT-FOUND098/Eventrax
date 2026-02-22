<?php
require_once '../../config/cors.php';
require_once '../../config/db.php';
require_once '../../config/auth.php';

checkAuth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get current user profile
    try {
        $userId = $_SESSION['user_id'];
        
        $stmt = $pdo->prepare("
            SELECT id, name, email, role, institution, avatar, phone, status, created_at, last_login 
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            exit;
        }
        
        // Map to camelCase for the frontend
        $mappedUser = [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'institution' => $user['institution'],
            'avatar' => $user['avatar'],
            'phone' => $user['phone'],
            'status' => $user['status'],
            'createdAt' => $user['created_at'],
            'lastLogin' => $user['last_login']
        ];
        
        echo json_encode($mappedUser);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'PUT' || $method === 'POST') {
    // Update user profile
    $data = json_decode(file_get_contents("php://input"));
    
    $userId = $_SESSION['user_id'];
    $allowedFields = ['name', 'email', 'institution', 'phone', 'avatar'];
    $updates = [];
    $params = [];
    
    // Validate and build update query
    foreach ($allowedFields as $field) {
        if (isset($data->$field)) {
            $value = trim($data->$field);
            
            // Validate email format
            if ($field === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                exit;
            }
            
            // Validate phone format (basic)
            if ($field === 'phone' && !empty($value) && !preg_match('/^[\d\s\-\+\(\)]+$/', $value)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid phone format']);
                exit;
            }
            
            $updates[] = "$field = ?";
            $params[] = $value;
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        exit;
    }
    
    // Add user ID to params
    $params[] = $userId;
    
    try {
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Get updated user data
        $stmt = $pdo->prepare("
            SELECT id, name, email, role, institution, avatar, phone, status, created_at, last_login 
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $updatedUser = $stmt->fetch();
        
        // Map to camelCase for the frontend
        $mappedUser = [
            'id' => $updatedUser['id'],
            'name' => $updatedUser['name'],
            'email' => $updatedUser['email'],
            'role' => $updatedUser['role'],
            'institution' => $updatedUser['institution'],
            'avatar' => $updatedUser['avatar'],
            'phone' => $updatedUser['phone'],
            'status' => $updatedUser['status'],
            'createdAt' => $updatedUser['created_at'],
            'lastLogin' => $updatedUser['last_login']
        ];
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $mappedUser
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    // Handle account deletion request
    try {
        $userId = $_SESSION['user_id'];
        
        // This would typically just mark the account for deletion
        // Actual deletion would be handled by admin
        $stmt = $pdo->prepare("
            UPDATE users 
            SET status = 'deletion_requested', 
            deletion_requested_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Account deletion request submitted. Your account will be reviewed for deletion.'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
