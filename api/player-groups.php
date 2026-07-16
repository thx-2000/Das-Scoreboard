<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

function all_groups(PDO $pdo): array
{
    $groups = $pdo->query('SELECT id, name, active FROM player_groups ORDER BY name COLLATE NOCASE')->fetchAll(PDO::FETCH_ASSOC);

    $memberStmt = $pdo->prepare('
        SELECT p.id, p.name, p.avatar_ext
        FROM player_group_members gm
        JOIN players p ON p.id = gm.player_id
        WHERE gm.group_id = ? AND p.deleted_at IS NULL
        ORDER BY p.name COLLATE NOCASE
    ');

    return array_map(function ($group) use ($memberStmt) {
        $memberStmt->execute([$group['id']]);
        $members = $memberStmt->fetchAll(PDO::FETCH_ASSOC);
        return [
            'id' => (int) $group['id'],
            'name' => $group['name'],
            'active' => (bool) $group['active'],
            'playerIds' => array_map(fn($m) => (int) $m['id'], $members),
            'players' => array_map(fn($m) => [
                'id' => (int) $m['id'],
                'name' => $m['name'],
                'avatarExt' => $m['avatar_ext'],
            ], $members),
        ];
    }, $groups);
}

function set_group_members(PDO $pdo, int $groupId, array $playerIds): void
{
    $pdo->prepare('DELETE FROM player_group_members WHERE group_id = ?')->execute([$groupId]);
    $insert = $pdo->prepare('INSERT OR IGNORE INTO player_group_members (group_id, player_id) VALUES (?, ?)');
    foreach (array_unique(array_map('intval', $playerIds)) as $playerId) {
        $insert->execute([$groupId, $playerId]);
    }
}

if ($method === 'GET') {
    send_json(all_groups($pdo));
}

if ($method === 'POST') {
    $body = read_json_body();
    $name = trim((string) ($body['name'] ?? ''));
    $playerIds = $body['playerIds'] ?? [];

    if ($name === '') {
        send_json(['error' => 'Name darf nicht leer sein.'], 400);
    }

    $pdo->prepare('INSERT INTO player_groups (name, active) VALUES (?, 1)')->execute([$name]);
    $groupId = (int) $pdo->lastInsertId();
    set_group_members($pdo, $groupId, $playerIds);

    send_json(all_groups($pdo), 201);
}

if ($id === null) {
    send_json(['error' => 'Gruppen-ID fehlt.'], 400);
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
        $pdo->prepare('UPDATE player_groups SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    if (array_key_exists('playerIds', $body)) {
        set_group_members($pdo, $id, $body['playerIds']);
    }

    send_json(all_groups($pdo));
}

if ($method === 'DELETE') {
    // Echtes Loeschen (keine Historie referenziert Gruppen) - CASCADE raeumt
    // player_group_members automatisch mit auf, siehe Migration 11.
    $pdo->prepare('DELETE FROM player_groups WHERE id = ?')->execute([$id]);
    send_json(all_groups($pdo));
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
