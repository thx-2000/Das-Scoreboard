<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/settings.php';
require_once __DIR__ . '/../includes/state.php';

/**
 * Liefert/verwaltet die optionalen Logo-Uploads (Quadrat/Banner). Die
 * Bilddateien liegen in data/ (per .htaccess vom Webserver gesperrt),
 * werden also nie direkt ausgeliefert, sondern immer ueber diesen
 * Endpoint gestreamt - deshalb GET hier statt eines direkten Datei-Links.
 */

const LOGO_MIME_BY_EXT = [
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'svg' => 'image/svg+xml',
];
const LOGO_EXT_BY_MIME = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
    'image/svg+xml' => 'svg',
];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

function logo_file_path(string $type, string $ext): string
{
    return __DIR__ . '/../data/logo-' . $type . '.' . $ext;
}

function logo_upsert(PDO $pdo, string $key, string $value): void
{
    $upsert = $pdo->prepare('
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    ');
    $upsert->execute([$key, $value]);
}

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? '';

if (!in_array($type, ['square', 'banner'], true)) {
    send_json(['error' => 'Ungültiger Logo-Typ.'], 400);
}

if ($method === 'GET') {
    $settings = get_settings($pdo);
    $ext = $settings['logo_' . $type . '_ext'] ?? '';
    $path = $ext !== '' ? logo_file_path($type, $ext) : null;

    if ($ext === '' || !$path || !is_file($path)) {
        send_json(['error' => 'Kein Logo vorhanden.'], 404);
    }

    header('Content-Type: ' . LOGO_MIME_BY_EXT[$ext]);
    header('Cache-Control: public, max-age=3600');
    readfile($path);
    exit;
}

if ($method === 'POST') {
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        send_json(['error' => 'Kein gültiger Datei-Upload.'], 400);
    }

    $file = $_FILES['logo'];
    if ($file['size'] > LOGO_MAX_BYTES) {
        send_json(['error' => 'Datei ist zu groß (max. 2 MB).'], 400);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!isset(LOGO_EXT_BY_MIME[$mime])) {
        send_json(['error' => 'Nur PNG, JPEG oder SVG erlaubt.'], 400);
    }

    // Fuer Raster-Bilder zusaetzlich pruefen, dass es sich wirklich um ein
    // dekodierbares Bild handelt (getimagesize schlaegt bei kaputten/
    // umbenannten Dateien fehl). SVG hat keine Pixelmasse, daher separat.
    if ($mime !== 'image/svg+xml' && @getimagesize($file['tmp_name']) === false) {
        send_json(['error' => 'Datei ist kein gültiges Bild.'], 400);
    }

    $ext = LOGO_EXT_BY_MIME[$mime];

    // Alte Datei fuer diesen Typ entfernen, falls sie eine andere Endung hatte.
    foreach (array_keys(LOGO_MIME_BY_EXT) as $existingExt) {
        $old = logo_file_path($type, $existingExt);
        if (is_file($old)) {
            @unlink($old);
        }
    }

    $target = logo_file_path($type, $ext);
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        send_json(['error' => 'Datei konnte nicht gespeichert werden.'], 500);
    }

    logo_upsert($pdo, 'logo_' . $type . '_ext', $ext);

    send_json(['ok' => true, 'ext' => $ext]);
}

if ($method === 'DELETE') {
    $settings = get_settings($pdo);
    $ext = $settings['logo_' . $type . '_ext'] ?? '';
    if ($ext !== '') {
        $path = logo_file_path($type, $ext);
        if (is_file($path)) {
            @unlink($path);
        }
    }

    logo_upsert($pdo, 'logo_' . $type . '_ext', '');

    send_json(['ok' => true]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
