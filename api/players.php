<?php

require_once __DIR__ . '/../includes/state.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

function all_players(PDO $pdo, bool $includeInactive): array
{
    // Echt geloeschte Spieler (deleted_at gesetzt) erscheinen nie in dieser
    // Liste, unabhaengig von includeInactive - sie bleiben nur ueber
    // vergangene Spiele (Verlauf/Statistik) sichtbar, siehe Migration 10.
    $sql = 'SELECT id, name, active, avatar_ext FROM players WHERE deleted_at IS NULL';
    if (!$includeInactive) {
        $sql .= ' AND active = 1';
    }
    $sql .= ' ORDER BY name COLLATE NOCASE';
    $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    return array_map(fn($p) => [
        'id' => (int) $p['id'],
        'name' => $p['name'],
        'active' => (bool) $p['active'],
        'avatarExt' => $p['avatar_ext'],
    ], $rows);
}

if ($method === 'GET') {
    $includeInactive = isset($_GET['all']);
    send_json(all_players($pdo, $includeInactive));
}

if ($method === 'POST') {
    $body = read_json_body();
    $name = trim((string) ($body['name'] ?? ''));

    if ($name === '') {
        send_json(['error' => 'Name darf nicht leer sein.'], 400);
    }

    $insert = $pdo->prepare('INSERT INTO players (name, active) VALUES (?, 1)');
    $insert->execute([$name]);

    send_json(all_players($pdo, isset($_GET['all'])), 201);
}

if ($id === null) {
    send_json(['error' => 'Spieler-ID fehlt.'], 400);
}

if ($method === 'PATCH') {
    $body = read_json_body();
    $fields = [];
    $params = [];

    if (array_key_exists('name', $body)) {
        $name = trim((string) $body['name']);
        if ($name === '') {
            send_json(['error' => 'Name darf nicht leer sein.'], 400);
        }
        $fields[] = 'name = ?';
        $params[] = $name;
    }
    if (array_key_exists('active', $body)) {
        $fields[] = 'active = ?';
        $params[] = $body['active'] ? 1 : 0;
    }

    if (count($fields) > 0) {
        $params[] = $id;
        $pdo->prepare('UPDATE players SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    send_json(all_players($pdo, isset($_GET['all'])));
}

if ($method === 'DELETE') {
    // Echtes Loeschen: Spieler verschwindet komplett aus der Spieler-
    // Verwaltung (weder Aktiv- noch Deaktiviert-Liste), bleibt aber ueber
    // vergangene Spiele (Verlauf/Statistik) weiterhin mit Namen sichtbar -
    // die Zeile selbst bleibt wegen der Fremdschluessel erhalten (siehe
    // Migration 10). Anders als das bisherige Aktiv/Inaktiv-Umschalten
    // (PATCH active) gibt es dafuer keinen Weg zurueck in der UI.
    $pdo->prepare('UPDATE players SET deleted_at = ? WHERE id = ?')->execute([now_iso(), $id]);
    send_json(all_players($pdo, isset($_GET['all'])));
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
