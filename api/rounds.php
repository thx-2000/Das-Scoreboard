<?php

require_once __DIR__ . '/../includes/state.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$gameId = isset($_GET['gameId']) ? (int) $_GET['gameId'] : null;
$roundId = isset($_GET['roundId']) ? (int) $_GET['roundId'] : null;

if ($gameId === null) {
    send_json(['error' => 'gameId fehlt.'], 400);
}

$gameStmt = $pdo->prepare('SELECT * FROM games WHERE id = ?');
$gameStmt->execute([$gameId]);
$game = $gameStmt->fetch(PDO::FETCH_ASSOC);
if (!$game) {
    send_json(['error' => 'Spiel nicht gefunden.'], 404);
}

function valid_scores_for_game(PDO $pdo, int $gameId, array $scores): array
{
    $playersStmt = $pdo->prepare('SELECT player_id FROM game_players WHERE game_id = ?');
    $playersStmt->execute([$gameId]);
    $validIds = array_column($playersStmt->fetchAll(PDO::FETCH_ASSOC), 'player_id');

    $result = [];
    foreach ($validIds as $playerId) {
        $result[$playerId] = (int) ($scores[$playerId] ?? 0);
    }
    return $result;
}

if ($method === 'POST' && $roundId === null) {
    $body = read_json_body();
    $scores = valid_scores_for_game($pdo, $gameId, $body['scores'] ?? []);

    $countStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM rounds WHERE game_id = ?');
    $countStmt->execute([$gameId]);
    $nextRoundNumber = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['c'] + 1;

    $pdo->beginTransaction();

    $insertRound = $pdo->prepare('INSERT INTO rounds (game_id, round_number, created_at) VALUES (?, ?, ?)');
    $insertRound->execute([$gameId, $nextRoundNumber, now_iso()]);
    $newRoundId = (int) $pdo->lastInsertId();

    $insertScore = $pdo->prepare('INSERT INTO round_scores (round_id, player_id, points) VALUES (?, ?, ?)');
    foreach ($scores as $playerId => $points) {
        $insertScore->execute([$newRoundId, $playerId, $points]);
    }

    $pdo->commit();

    recompute_game_status($pdo, $gameId);
    send_json(build_game_state($pdo, $gameId), 201);
}

if ($roundId === null) {
    send_json(['error' => 'roundId fehlt.'], 400);
}

$roundStmt = $pdo->prepare('SELECT * FROM rounds WHERE id = ? AND game_id = ?');
$roundStmt->execute([$roundId, $gameId]);
if (!$roundStmt->fetch(PDO::FETCH_ASSOC)) {
    send_json(['error' => 'Runde nicht gefunden.'], 404);
}

if ($method === 'PATCH') {
    $body = read_json_body();
    $scores = valid_scores_for_game($pdo, $gameId, $body['scores'] ?? []);

    $update = $pdo->prepare('UPDATE round_scores SET points = ? WHERE round_id = ? AND player_id = ?');
    foreach ($scores as $playerId => $points) {
        $update->execute([$points, $roundId, $playerId]);
    }

    recompute_game_status($pdo, $gameId);
    send_json(build_game_state($pdo, $gameId));
}

if ($method === 'DELETE') {
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM round_scores WHERE round_id = ?')->execute([$roundId]);
    $pdo->prepare('DELETE FROM rounds WHERE id = ?')->execute([$roundId]);

    // Nachfolgende Rundennummern nachruecken lassen, damit sie luecken- und
    // reihenfolgetreu bleiben.
    $remaining = $pdo->prepare('SELECT id FROM rounds WHERE game_id = ? ORDER BY round_number');
    $remaining->execute([$gameId]);
    $renumber = $pdo->prepare('UPDATE rounds SET round_number = ? WHERE id = ?');
    $i = 1;
    foreach ($remaining->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $renumber->execute([$i, $r['id']]);
        $i++;
    }
    $pdo->commit();

    recompute_game_status($pdo, $gameId);
    send_json(build_game_state($pdo, $gameId));
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
