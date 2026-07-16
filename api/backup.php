<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';

/**
 * Vollstaendiges Backup (SQLite-Datenbank + Avatare + Logo) als ZIP-Download
 * bzw. Wiederherstellung aus einer solchen ZIP-Datei - gedacht fuer einen
 * Server-Umzug oder als reines Sicherheitsnetz. Ein Import ERSETZT die
 * gesamte aktuelle Datenbank samt Bildern, deshalb serverseitige
 * Textbestaetigung zusaetzlich zur Bestaetigung im Frontend.
 */

const BACKUP_MAX_BYTES = 50 * 1024 * 1024;
const BACKUP_CONFIRM_PHRASE = 'ERSETZEN';

function backup_data_dir(): string
{
    return __DIR__ . '/../data';
}

function backup_avatars_dir(): string
{
    return backup_data_dir() . '/avatars';
}

function backup_rrmdir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (scandir($dir) as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . '/' . $item;
        is_dir($path) ? backup_rrmdir($path) : unlink($path);
    }
    rmdir($dir);
}

function backup_copy_dir(string $from, string $to): void
{
    if (!is_dir($from)) {
        return;
    }
    mkdir($to, 0755, true);
    foreach (scandir($from) as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        copy($from . '/' . $item, $to . '/' . $item);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pdo = get_db();

    // VACUUM INTO respektiert den WAL-Mode und liefert eine sauber
    // geschlossene, konsistente Momentaufnahme - statt evtl. noch
    // ungeflushte -wal/-shm-Dateien manuell mitkopieren zu muessen.
    $snapshotPath = tempnam(sys_get_temp_dir(), 'scoreboard_export_');
    unlink($snapshotPath);
    $pdo->exec('VACUUM INTO ' . $pdo->quote($snapshotPath));

    $zipPath = tempnam(sys_get_temp_dir(), 'scoreboard_zip_');
    $zip = new ZipArchive();
    $zip->open($zipPath, ZipArchive::OVERWRITE);
    $zip->addFile($snapshotPath, 'scoreboard.sqlite');

    $avatarsDir = backup_avatars_dir();
    if (is_dir($avatarsDir)) {
        foreach (scandir($avatarsDir) as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $zip->addFile($avatarsDir . '/' . $file, 'avatars/' . $file);
        }
    }

    foreach (['logo-square', 'logo-banner'] as $prefix) {
        foreach (glob(backup_data_dir() . '/' . $prefix . '.*') as $logoFile) {
            $zip->addFile($logoFile, basename($logoFile));
        }
    }

    $zip->close();
    unlink($snapshotPath);

    $filename = 'scoreboard-backup-' . date('Y-m-d-Hi') . '.zip';
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($zipPath));
    readfile($zipPath);
    unlink($zipPath);
    exit;
}

if ($method === 'POST') {
    $confirm = trim((string) ($_POST['confirm'] ?? ''));
    if ($confirm !== BACKUP_CONFIRM_PHRASE) {
        send_json(['error' => 'Bestätigungstext stimmt nicht überein.'], 400);
    }

    if (!isset($_FILES['backup']) || $_FILES['backup']['error'] !== UPLOAD_ERR_OK) {
        send_json(['error' => 'Kein gültiger Datei-Upload.'], 400);
    }

    $file = $_FILES['backup'];
    if ($file['size'] > BACKUP_MAX_BYTES) {
        send_json(['error' => 'Datei ist zu groß (max. 50 MB).'], 400);
    }

    $zip = new ZipArchive();
    if ($zip->open($file['tmp_name']) !== true) {
        send_json(['error' => 'Datei ist keine gültige ZIP-Datei.'], 400);
    }

    // Eintragsnamen vor dem Entpacken pruefen (Zip-Slip-Schutz) - ".."
    // oder ein fuehrender "/" koennte sonst ausserhalb des Staging-
    // Verzeichnisses schreiben.
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $entryName = $zip->getNameIndex($i);
        if ($entryName === false || str_contains($entryName, '..') || str_starts_with($entryName, '/')) {
            $zip->close();
            send_json(['error' => 'ZIP enthält ungültige Dateipfade.'], 400);
        }
    }

    $stagingDir = backup_data_dir() . '/import-staging-' . bin2hex(random_bytes(6));
    mkdir($stagingDir, 0755, true);
    $zip->extractTo($stagingDir);
    $zip->close();

    $sqlitePath = $stagingDir . '/scoreboard.sqlite';
    if (!is_file($sqlitePath)) {
        backup_rrmdir($stagingDir);
        send_json(['error' => 'ZIP enthält keine scoreboard.sqlite.'], 400);
    }

    // Grundlegende Gueltigkeitspruefung, bevor die aktuelle DB ueberschrieben
    // wird: oeffnen, Integritaet pruefen, erwartete Kern-Tabellen da?
    try {
        $check = new PDO('sqlite:' . $sqlitePath);
        $check->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        if ($check->query('PRAGMA integrity_check')->fetchColumn() !== 'ok') {
            throw new RuntimeException('Integritätsprüfung fehlgeschlagen.');
        }
        $tables = $check->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
        foreach (['players', 'games', 'rounds', 'round_scores'] as $required) {
            if (!in_array($required, $tables, true)) {
                throw new RuntimeException('Erwartete Tabelle fehlt: ' . $required);
            }
        }
        $gameCount = (int) $check->query('SELECT COUNT(*) FROM games')->fetchColumn();
        $playerCount = (int) $check->query('SELECT COUNT(*) FROM players')->fetchColumn();
        $check = null;
    } catch (Throwable $e) {
        backup_rrmdir($stagingDir);
        send_json(['error' => 'Backup-Datei ist beschädigt oder ungültig.'], 400);
    }

    // Sicherheitsnetz: aktuellen Stand vor dem Ersetzen automatisch lokal
    // wegsichern (nicht ueber die UI erreichbar, aber falls etwas schief
    // geht liegt der vorherige Stand noch auf dem Server).
    $safetyDir = backup_data_dir() . '/pre-import-backup-' . date('Y-m-d-His');
    mkdir($safetyDir, 0755, true);
    if (is_file(backup_data_dir() . '/scoreboard.sqlite')) {
        copy(backup_data_dir() . '/scoreboard.sqlite', $safetyDir . '/scoreboard.sqlite');
    }
    backup_copy_dir(backup_avatars_dir(), $safetyDir . '/avatars');
    foreach (['logo-square', 'logo-banner'] as $prefix) {
        foreach (glob(backup_data_dir() . '/' . $prefix . '.*') as $logoFile) {
            copy($logoFile, $safetyDir . '/' . basename($logoFile));
        }
    }

    // Alte WAL/SHM-Reste entfernen, dann die neue DB einsetzen.
    foreach (['-wal', '-shm'] as $suffix) {
        $stale = backup_data_dir() . '/scoreboard.sqlite' . $suffix;
        if (is_file($stale)) {
            unlink($stale);
        }
    }
    rename($sqlitePath, backup_data_dir() . '/scoreboard.sqlite');

    // Avatare komplett ersetzen (nicht zusammenfuehren).
    if (is_dir(backup_avatars_dir())) {
        backup_rrmdir(backup_avatars_dir());
    }
    if (is_dir($stagingDir . '/avatars')) {
        rename($stagingDir . '/avatars', backup_avatars_dir());
    }

    // Logo-Dateien ersetzen.
    foreach (['logo-square', 'logo-banner'] as $prefix) {
        foreach (glob(backup_data_dir() . '/' . $prefix . '.*') as $old) {
            unlink($old);
        }
        foreach (glob($stagingDir . '/' . $prefix . '.*') as $new) {
            rename($new, backup_data_dir() . '/' . basename($new));
        }
    }

    backup_rrmdir($stagingDir);

    // Frische, eigene Verbindung statt get_db()'s statischem Cache: der haelt
    // sonst noch das alte (gerade ersetzte) Datei-Handle. Direkt danach
    // Migrationen nachfahren, falls das Backup von einer aelteren Version
    // stammt.
    $restored = new PDO('sqlite:' . backup_data_dir() . '/scoreboard.sqlite');
    $restored->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    run_migrations($restored);

    send_json(['ok' => true, 'games' => $gameCount, 'players' => $playerCount]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
