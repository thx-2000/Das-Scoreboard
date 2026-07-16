<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';

/**
 * Liefert/verwaltet den optionalen Avatar-Upload je Spieler (Passfoto-
 * Ausschnitt, 2:3 Hochformat). Die Bilddatei liegt in data/avatars/ (per
 * .htaccess vom Webserver gesperrt), wird also nie direkt ausgeliefert,
 * sondern immer ueber diesen Endpoint gestreamt - deshalb GET hier statt
 * eines direkten Datei-Links. Der Bildausschnitt (Pan/Zoom auf 2:3) wird
 * bereits im Browser per Canvas zugeschnitten (js/avatar-cropper.js) -
 * hier kommt nur noch das fertig zugeschnittene Bild an.
 */

const AVATAR_MIME_BY_EXT = [
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
];
const AVATAR_EXT_BY_MIME = [
    'image/png' => 'png',
    'image/jpeg' => 'jpg',
];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
// Toleranz fuer den 2:3-Seitenverhaeltnis-Check - der Cropper liefert exakt
// 2:3, etwas Spielraum faengt Rundungsfehler ab, ohne die Pruefung sinnlos
// zu machen.
const AVATAR_RATIO_TOLERANCE = 0.03;

function avatar_dir(): string
{
    return __DIR__ . '/../data/avatars';
}

function avatar_file_path(int $playerId, string $ext): string
{
    return avatar_dir() . '/' . $playerId . '.' . $ext;
}

function avatar_find_existing(int $playerId): ?string
{
    foreach (array_keys(AVATAR_MIME_BY_EXT) as $ext) {
        $path = avatar_file_path($playerId, $ext);
        if (is_file($path)) {
            return $ext;
        }
    }
    return null;
}

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$playerId = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($playerId === null) {
    send_json(['error' => 'Spieler-ID fehlt.'], 400);
}

$playerStmt = $pdo->prepare('SELECT id FROM players WHERE id = ?');
$playerStmt->execute([$playerId]);
if (!$playerStmt->fetch(PDO::FETCH_ASSOC)) {
    send_json(['error' => 'Spieler nicht gefunden.'], 404);
}

if ($method === 'GET') {
    $ext = avatar_find_existing($playerId);
    if ($ext === null) {
        send_json(['error' => 'Kein Avatar vorhanden.'], 404);
    }

    header('Content-Type: ' . AVATAR_MIME_BY_EXT[$ext]);
    header('Cache-Control: public, max-age=3600');
    readfile(avatar_file_path($playerId, $ext));
    exit;
}

if ($method === 'POST') {
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        send_json(['error' => 'Kein gültiger Datei-Upload.'], 400);
    }

    $file = $_FILES['avatar'];
    if ($file['size'] > AVATAR_MAX_BYTES) {
        send_json(['error' => 'Datei ist zu groß (max. 2 MB).'], 400);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!isset(AVATAR_EXT_BY_MIME[$mime])) {
        send_json(['error' => 'Nur PNG oder JPEG erlaubt.'], 400);
    }

    $imageSize = @getimagesize($file['tmp_name']);
    if ($imageSize === false) {
        send_json(['error' => 'Datei ist kein gültiges Bild.'], 400);
    }

    [$width, $height] = $imageSize;
    $ratio = $width / $height;
    if (abs($ratio - 2 / 3) > AVATAR_RATIO_TOLERANCE) {
        send_json(['error' => 'Bild muss im Hochformat 2:3 zugeschnitten sein.'], 400);
    }

    $ext = AVATAR_EXT_BY_MIME[$mime];

    if (!is_dir(avatar_dir())) {
        mkdir(avatar_dir(), 0755, true);
    }

    // Alte Datei entfernen, falls sie eine andere Endung hatte.
    $existingExt = avatar_find_existing($playerId);
    if ($existingExt !== null && $existingExt !== $ext) {
        @unlink(avatar_file_path($playerId, $existingExt));
    }

    $target = avatar_file_path($playerId, $ext);
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        send_json(['error' => 'Datei konnte nicht gespeichert werden.'], 500);
    }

    $pdo->prepare('UPDATE players SET avatar_ext = ? WHERE id = ?')->execute([$ext, $playerId]);

    send_json(['ok' => true, 'ext' => $ext]);
}

if ($method === 'DELETE') {
    $existingExt = avatar_find_existing($playerId);
    if ($existingExt !== null) {
        @unlink(avatar_file_path($playerId, $existingExt));
    }

    $pdo->prepare('UPDATE players SET avatar_ext = NULL WHERE id = ?')->execute([$playerId]);

    send_json(['ok' => true]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
