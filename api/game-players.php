<?php

/**
 * Live-Bearbeitung der Teilnehmerliste eines laufenden Spiels (Migration 16):
 * Spieler hinzufuegen (optional mit Startpunktwert) oder als ausgeschieden
 * markieren. Nie ein echtes DELETE aus game_players - Historie/Punktestand
 * eines ausgeschiedenen Spielers bleiben erhalten, siehe includes/state.php.
 */

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

function require_active_game(PDO $pdo, int $gameId): array
{
    $stmt = $pdo->prepare('SELECT * FROM games WHERE id = ?');
    $stmt->execute([$gameId]);
    $game = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$game) {
        send_json(['error' => 'Spiel nicht gefunden.'], 404);
    }
    if ($game['status'] !== 'active') {
        send_json(['error' => 'Die Teilnehmerliste laesst sich nur bei einem laufenden Spiel aendern.'], 400);
    }
    return $game;
}

if ($method === 'POST') {
    $body = read_json_body();
    $gameId = (int) ($body['gameId'] ?? 0);
    $playerId = (int) ($body['playerId'] ?? 0);
    $startingScore = (int) ($body['startingScore'] ?? 0);

    require_active_game($pdo, $gameId);

    $playerStmt = $pdo->prepare('SELECT id FROM players WHERE id = ? AND deleted_at IS NULL');
    $playerStmt->execute([$playerId]);
    if (!$playerStmt->fetch(PDO::FETCH_ASSOC)) {
        send_json(['error' => 'Spieler nicht gefunden.'], 404);
    }

    $existingStmt = $pdo->prepare('SELECT withdrawn_at FROM game_players WHERE game_id = ? AND player_id = ?');
    $existingStmt->execute([$gameId, $playerId]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing && $existing['withdrawn_at'] === null) {
        send_json(['error' => 'Spieler ist bereits Teil des Spiels.'], 400);
    }

    if ($existing) {
        // War zuvor ausgeschieden und kommt erneut dazu - withdrawn_at loeschen
        // statt einer zweiten Zeile (game_players hat game_id+player_id als
        // Primary Key). Startpunktwert wird dabei bewusst neu gesetzt.
        $pdo->prepare('UPDATE game_players SET withdrawn_at = NULL, starting_score = ? WHERE game_id = ? AND player_id = ?')
            ->execute([$startingScore, $gameId, $playerId]);
    } else {
        $pdo->prepare('INSERT INTO game_players (game_id, player_id, starting_score) VALUES (?, ?, ?)')
            ->execute([$gameId, $playerId, $startingScore]);
    }

    recompute_game_status($pdo, $gameId);
    send_json(build_game_state($pdo, $gameId), 201);
}

if ($method === 'PATCH') {
    $body = read_json_body();
    $gameId = (int) ($body['gameId'] ?? 0);
    $playerId = (int) ($body['playerId'] ?? 0);

    require_active_game($pdo, $gameId);

    $memberStmt = $pdo->prepare('SELECT withdrawn_at FROM game_players WHERE game_id = ? AND player_id = ?');
    $memberStmt->execute([$gameId, $playerId]);
    $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
    if (!$member) {
        send_json(['error' => 'Spieler ist nicht Teil des Spiels.'], 404);
    }
    if ($member['withdrawn_at'] !== null) {
        send_json(['error' => 'Spieler ist bereits ausgeschieden.'], 400);
    }

    $activeCountStmt = $pdo->prepare('SELECT COUNT(*) FROM game_players WHERE game_id = ? AND withdrawn_at IS NULL');
    $activeCountStmt->execute([$gameId]);
    if ((int) $activeCountStmt->fetchColumn() <= 2) {
        send_json(['error' => 'Mindestens 2 aktive Spieler muessen im Spiel bleiben.'], 400);
    }

    $pdo->prepare('UPDATE game_players SET withdrawn_at = ? WHERE game_id = ? AND player_id = ?')
        ->execute([now_iso(), $gameId, $playerId]);

    recompute_game_status($pdo, $gameId);
    send_json(build_game_state($pdo, $gameId));
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
