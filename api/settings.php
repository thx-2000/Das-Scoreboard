<?php

require_once __DIR__ . '/../includes/state.php';
require_once __DIR__ . '/../includes/settings.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    send_json([
        'settings' => get_settings($pdo),
        'languages' => supported_languages(),
    ]);
}

if ($method === 'PATCH') {
    $body = read_json_body();

    if (!empty($body['reset'])) {
        reset_settings($pdo);
    } else {
        save_settings($pdo, is_array($body) ? $body : []);
    }

    send_json([
        'settings' => get_settings($pdo),
        'languages' => supported_languages(),
    ]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
