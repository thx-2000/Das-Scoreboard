<?php

require_once __DIR__ . '/../includes/state.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET' && $id !== null) {
    $state = build_game_state($pdo, $id);
    if ($state === null) {
        send_json(['error' => 'Spiel nicht gefunden.'], 404);
    }
    send_json($state);
}

if ($method === 'GET') {
    $games = $pdo->query('SELECT * FROM games ORDER BY started_at DESC')->fetchAll(PDO::FETCH_ASSOC);

    $summaries = array_map(function ($game) use ($pdo) {
        $gameId = (int) $game['id'];

        $namesStmt = $pdo->prepare('
            SELECT p.name FROM game_players gp
            JOIN players p ON p.id = gp.player_id
            WHERE gp.game_id = ?
            ORDER BY p.name COLLATE NOCASE
        ');
        $namesStmt->execute([$gameId]);
        $names = array_column($namesStmt->fetchAll(PDO::FETCH_ASSOC), 'name');

        $winners = [];
        if ($game['status'] === 'finished') {
            $totals = get_totals($pdo, $gameId);
            if (count($totals) > 0) {
                $direction = $game['win_direction'] === 'lowest' ? 'lowest' : 'highest';
                $bestTotal = $direction === 'lowest' ? min($totals) : max($totals);
                $namesById = $pdo->prepare('SELECT id, name FROM players WHERE id = ?');
                foreach ($totals as $playerId => $total) {
                    if ($total === $bestTotal) {
                        $namesById->execute([$playerId]);
                        $p = $namesById->fetch(PDO::FETCH_ASSOC);
                        if ($p) $winners[] = $p['name'];
                    }
                }
            }
        }

        return [
            'id' => $gameId,
            'mode' => $game['mode'],
            'label' => $game['label'],
            'targetScore' => (int) $game['target_score'],
            'status' => $game['status'],
            'startedAt' => $game['started_at'],
            'endedAt' => $game['ended_at'],
            'playerNames' => $names,
            'winners' => $winners,
        ];
    }, $games);

    send_json($summaries);
}

if ($method === 'POST') {
    $body = read_json_body();
    $mode = trim((string) ($body['mode'] ?? ''));
    $label = trim((string) ($body['label'] ?? ''));
    $targetScore = (int) ($body['targetScore'] ?? 0);
    $winDirection = ($body['winDirection'] ?? 'highest') === 'lowest' ? 'lowest' : 'highest';
    $playerIds = array_map('intval', $body['playerIds'] ?? []);
    $playerIds = array_values(array_unique($playerIds));

    if ($mode === '') {
        send_json(['error' => 'Modus fehlt.'], 400);
    }
    // Nur der Modus "Punkte bis Höchstwert" braucht zwingend einen Zielwert -
    // "Offene Punkterunde" laeuft mit target_score = 0 (kein Zielwert).
    if ($mode === 'points_to_target' && $targetScore <= 0) {
        send_json(['error' => 'Zielwert muss groesser als 0 sein.'], 400);
    }
    if (count($playerIds) < 2) {
        send_json(['error' => 'Mindestens 2 Spieler erforderlich.'], 400);
    }

    $pdo->beginTransaction();

    $insertGame = $pdo->prepare('
        INSERT INTO games (mode, label, target_score, win_direction, status, started_at)
        VALUES (?, ?, ?, ?, "active", ?)
    ');
    $insertGame->execute([$mode, $label !== '' ? $label : null, max(0, $targetScore), $winDirection, now_iso()]);
    $gameId = (int) $pdo->lastInsertId();

    $insertGamePlayer = $pdo->prepare('INSERT INTO game_players (game_id, player_id) VALUES (?, ?)');
    foreach ($playerIds as $playerId) {
        $insertGamePlayer->execute([$gameId, $playerId]);
    }

    $pdo->commit();

    send_json(build_game_state($pdo, $gameId), 201);
}

if ($method === 'PATCH' && $id !== null) {
    $existing = $pdo->prepare('SELECT id FROM games WHERE id = ?');
    $existing->execute([$id]);
    if (!$existing->fetch(PDO::FETCH_ASSOC)) {
        send_json(['error' => 'Spiel nicht gefunden.'], 404);
    }

    $body = read_json_body();
    if (array_key_exists('finished', $body)) {
        set_game_finished($pdo, $id, (bool) $body['finished']);
    }

    send_json(build_game_state($pdo, $id));
}

if ($method === 'DELETE' && $id !== null) {
    $existing = $pdo->prepare('SELECT id FROM games WHERE id = ?');
    $existing->execute([$id]);
    if (!$existing->fetch(PDO::FETCH_ASSOC)) {
        send_json(['error' => 'Spiel nicht gefunden.'], 404);
    }

    $pdo->beginTransaction();
    $pdo->prepare('
        DELETE FROM round_scores WHERE round_id IN (SELECT id FROM rounds WHERE game_id = ?)
    ')->execute([$id]);
    $pdo->prepare('DELETE FROM rounds WHERE game_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM game_players WHERE game_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM games WHERE id = ?')->execute([$id]);
    $pdo->commit();

    send_json(['deleted' => true]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
