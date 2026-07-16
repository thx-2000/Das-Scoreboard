<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';
require_once __DIR__ . '/../includes/settings.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    send_json([
        'settings' => public_settings(get_settings($pdo)),
        'languages' => supported_languages(),
    ]);
}

if ($method === 'PATCH') {
    $body = read_json_body();

    if (!empty($body['reset'])) {
        reset_settings($pdo);
    } else {
        $updates = is_array($body) ? $body : [];

        // Passwort separat behandeln statt ueber den generischen Weg: wird
        // gehasht statt wie andere Einstellungen als Klartext gespeichert.
        // Leeres/fehlendes Feld = Passwort unveraendert lassen (kein
        // versehentliches Loeschen beim Speichern anderer Einstellungen).
        if (!empty($updates['new_password'])) {
            set_access_password_hash($pdo, password_hash((string) $updates['new_password'], PASSWORD_DEFAULT));
        }
        unset($updates['new_password'], $updates['access_password_hash']);

        save_settings($pdo, $updates);
    }

    send_json([
        'settings' => public_settings(get_settings($pdo)),
        'languages' => supported_languages(),
    ]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
