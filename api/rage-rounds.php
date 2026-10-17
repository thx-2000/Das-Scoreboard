<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';
require_once __DIR__ . '/../includes/rage.php';

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
if ($game['mode'] !== 'rage') {
    send_json(['error' => 'Dieser Endpunkt ist nur fuer den Modus RAGE.'], 400);
}

/** @return array<int, array{bid:int, actualTricks:int, rageBonusCount:int, rageRacheCount:int}> */
function rage_entries_for_game(PDO $pdo, int $gameId, array $rawEntries, bool $onlyActive = false): array
{
    // Neue Runden: ausgeschiedene Spieler (Migration 16) bekommen keinen
    // Eintrag - sonst wuerde ihr fehlendes "0 angesagt, 0 gemacht" jede Runde
    // 10 Punkte bringen. Korrekturen (PATCH) duerfen alte Zeilen aller
    // Spieler betreffen.
    $sql = 'SELECT player_id FROM game_players WHERE game_id = ?' . ($onlyActive ? ' AND withdrawn_at IS NULL' : '');
    $playersStmt = $pdo->prepare($sql);
    $playersStmt->execute([$gameId]);
    $playerIds = array_column($playersStmt->fetchAll(PDO::FETCH_ASSOC), 'player_id');

    $result = [];
    foreach ($playerIds as $playerId) {
        $entry = $rawEntries[$playerId] ?? [];
        $result[$playerId] = [
            'bid' => (int) ($entry['bid'] ?? 0),
            'actualTricks' => (int) ($entry['actualTricks'] ?? 0),
            'rageBonusCount' => max(0, (int) ($entry['rageBonusCount'] ?? 0)),
            'rageRacheCount' => max(0, (int) ($entry['rageRacheCount'] ?? 0)),
        ];
    }
    return $result;
}

if ($method === 'POST' && $roundId === null) {
    $body = read_json_body();
    $entries = rage_entries_for_game($pdo, $gameId, $body['entries'] ?? [], true);

    $countStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM rounds WHERE game_id = ?');
    $countStmt->execute([$gameId]);
    $nextRoundNumber = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['c'] + 1;

    if ($nextRoundNumber > 10) {
        send_json(['error' => 'Alle 10 Runden sind bereits gespielt.'], 400);
    }

    $dealerId = game_round_roles($pdo, $gameId)['dealerId'];

    $pdo->beginTransaction();

    $insertRound = $pdo->prepare('INSERT INTO rounds (game_id, round_number, created_at, dealer_id) VALUES (?, ?, ?, ?)');
    $insertRound->execute([$gameId, $nextRoundNumber, now_iso(), $dealerId]);
    $newRoundId = (int) $pdo->lastInsertId();

    $insertScore = $pdo->prepare('
        INSERT INTO round_scores (round_id, player_id, points, bid, actual_tricks, rage_bonus_count, rage_rache_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    foreach ($entries as $playerId => $e) {
        $points = compute_rage_points($e['bid'], $e['actualTricks'], $e['rageBonusCount'], $e['rageRacheCount']);
        $insertScore->execute([$newRoundId, $playerId, $points, $e['bid'], $e['actualTricks'], $e['rageBonusCount'], $e['rageRacheCount']]);
    }

    $pdo->commit();

    rage_clear_draft($pdo, $gameId);

    if ($nextRoundNumber >= 10) {
        set_game_finished($pdo, $gameId, true);
    }

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
    $entries = rage_entries_for_game($pdo, $gameId, $body['entries'] ?? []);

    $update = $pdo->prepare('
        UPDATE round_scores
        SET points = ?, bid = ?, actual_tricks = ?, rage_bonus_count = ?, rage_rache_count = ?
        WHERE round_id = ? AND player_id = ?
    ');
    foreach ($entries as $playerId => $e) {
        $points = compute_rage_points($e['bid'], $e['actualTricks'], $e['rageBonusCount'], $e['rageRacheCount']);
        $update->execute([$points, $e['bid'], $e['actualTricks'], $e['rageBonusCount'], $e['rageRacheCount'], $roundId, $playerId]);
    }

    send_json(build_game_state($pdo, $gameId));
}

if ($method === 'DELETE') {
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM round_scores WHERE round_id = ?')->execute([$roundId]);
    $pdo->prepare('DELETE FROM rounds WHERE id = ?')->execute([$roundId]);

    $remaining = $pdo->prepare('SELECT id FROM rounds WHERE game_id = ? ORDER BY round_number');
    $remaining->execute([$gameId]);
    $renumber = $pdo->prepare('UPDATE rounds SET round_number = ? WHERE id = ?');
    $i = 1;
    $remainingRows = $remaining->fetchAll(PDO::FETCH_ASSOC);
    foreach ($remainingRows as $r) {
        $renumber->execute([$i, $r['id']]);
        $i++;
    }
    $pdo->commit();

    // Geber und Rundennummer der naechsten Runde aendern sich - gespeicherte
    // Ansagen passen dann nicht mehr.
    rage_clear_draft($pdo, $gameId);

    if (count($remainingRows) < 10) {
        set_game_finished($pdo, $gameId, false);
    }

    send_json(build_game_state($pdo, $gameId));
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
