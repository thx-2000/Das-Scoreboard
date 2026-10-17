<?php

/**
 * RAGE, Phase 1 einer Runde: Ansagen serverseitig zwischenspeichern, damit sie
 * Neuladen/Geraetewechsel ueberleben, und mit "Ansagen abschliessen" sperren.
 * Erst Phase 2 (Ergebnisse, api/rage-rounds.php) legt die echte Runde an und
 * verwirft den Zwischenstand wieder.
 *
 * POST {gameId, bids?: {playerId: Stiche}, locked?: bool}
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';

$pdo = get_db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Methode nicht erlaubt.'], 405);
}

$body = read_json_body();
$gameId = (int) ($body['gameId'] ?? 0);

$gameStmt = $pdo->prepare('SELECT * FROM games WHERE id = ?');
$gameStmt->execute([$gameId]);
$game = $gameStmt->fetch(PDO::FETCH_ASSOC);
if (!$game) {
    send_json(['error' => 'Spiel nicht gefunden.'], 404);
}
if ($game['mode'] !== 'rage') {
    send_json(['error' => 'Dieser Endpunkt ist nur fuer den Modus RAGE.'], 400);
}
if ($game['status'] !== 'active') {
    send_json(['error' => 'Das Spiel ist beendet.'], 400);
}

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM rounds WHERE game_id = ?');
$countStmt->execute([$gameId]);
$nextRound = (int) $countStmt->fetchColumn() + 1;
if ($nextRound > 10) {
    send_json(['error' => 'Alle 10 Runden sind bereits gespielt.'], 400);
}
$cards = rage_cards_for_round($nextRound);

$locked = (bool) $game['rage_bids_locked'];

// Freigeben zuerst, damit "freigeben + neue Werte" in einem Aufruf moeglich ist.
if (($body['locked'] ?? null) === false) {
    $pdo->prepare('UPDATE games SET rage_bids_locked = 0 WHERE id = ?')->execute([$gameId]);
    $locked = false;
}

if (array_key_exists('bids', $body) && is_array($body['bids'])) {
    if ($locked) {
        send_json(['error' => 'Die Ansagen sind bereits abgeschlossen.'], 400);
    }
    $playersStmt = $pdo->prepare('SELECT player_id FROM game_players WHERE game_id = ? AND withdrawn_at IS NULL');
    $playersStmt->execute([$gameId]);
    $activeIds = array_map('intval', array_column($playersStmt->fetchAll(PDO::FETCH_ASSOC), 'player_id'));

    $upsert = $pdo->prepare('
        INSERT INTO rage_draft_bids (game_id, player_id, bid) VALUES (?, ?, ?)
        ON CONFLICT(game_id, player_id) DO UPDATE SET bid = excluded.bid
    ');
    foreach ($body['bids'] as $playerId => $bid) {
        if (!in_array((int) $playerId, $activeIds, true)) {
            continue;
        }
        // Einzelansage nie ueber der Kartenzahl, die Summe aller Ansagen darf
        // dagegen unter- oder ueberschreiten (siehe Spielregel).
        $upsert->execute([$gameId, (int) $playerId, max(0, min($cards, (int) $bid))]);
    }
}

if (($body['locked'] ?? null) === true) {
    $pdo->prepare('UPDATE games SET rage_bids_locked = 1 WHERE id = ?')->execute([$gameId]);
}

send_json(build_game_state($pdo, $gameId));
