<?php
// Local Development: Allow common Vite/React local ports
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// For local open-source testing on any port/IP
$is_local = preg_match('/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/', $origin);

if ($is_local) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

if (in_array($origin, $allowed_origins) || $is_local) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
