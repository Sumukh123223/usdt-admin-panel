<?php
// Set your password here (simple protection)
$admin_password = "mySecret123";

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method Not Allowed";
    exit;
}

// Check password
$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['password']) || $data['password'] !== $admin_password) {
    http_response_code(403);
    echo "Forbidden";
    exit;
}

// Validate threshold
if (!isset($data['usdtThreshold']) || !is_numeric($data['usdtThreshold'])) {
    http_response_code(400);
    echo "Invalid input";
    exit;
}

// Save to threshold.json
file_put_contents("threshold.json", json_encode([
    "usdtThreshold" => floatval($data['usdtThreshold'])
], JSON_PRETTY_PRINT));

echo "✅ Threshold updated to " . $data['usdtThreshold'];
?>
