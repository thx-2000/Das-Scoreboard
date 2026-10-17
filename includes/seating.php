<?php

/**
 * Sitzordnung und Geberwechsel (Migration 17/18) - fuer RAGE immer aktiv, bei
 * den anderen Modi optional ueber games.show_dealer ("Geber anzeigen" im
 * Setup).
 */

/**
 * Alle Spieler eines Spiels in Sitzreihenfolge (im Uhrzeigersinn), auch
 * ausgeschiedene - die bleiben Teil des Kreises, werden beim Geberwechsel
 * aber uebersprungen. Ohne erfasste Sitzordnung (seat_position NULL) gilt
 * die Spieler-ID als stabile Ersatzreihenfolge.
 *
 * @return array<int, array{id:int, active:bool}>
 */
function game_seat_order(PDO $pdo, int $gameId): array
{
    $stmt = $pdo->prepare('
        SELECT player_id, withdrawn_at FROM game_players
        WHERE game_id = ?
        ORDER BY seat_position IS NULL, seat_position, player_id
    ');
    $stmt->execute([$gameId]);
    return array_map(fn($r) => [
        'id' => (int) $r['player_id'],
        'active' => $r['withdrawn_at'] === null,
    ], $stmt->fetchAll(PDO::FETCH_ASSOC));
}

/** Index des naechsten aktiven Sitzes im Uhrzeigersinn NACH $index (bei $inclusive: ab $index). */
function game_next_active_seat(array $seats, int $index, bool $inclusive = false): int
{
    $n = count($seats);
    for ($step = $inclusive ? 0 : 1; $step <= $n; $step++) {
        $j = ($index + $step) % $n;
        if ($seats[$j]['active']) {
            return $j;
        }
    }
    return $index;
}

/**
 * Geber der naechsten Runde und der Spieler, bei dem die Ansage beginnt
 * (links vom Geber). Runde 1: der zufaellig gezogene Startspieler gibt. Danach
 * rueckt der Geber je Runde einen aktiven Sitz im Uhrzeigersinn weiter,
 * ausgehend vom gespeicherten Geber der letzten Runde (rounds.dealer_id) -
 * so bleibt die Reihenfolge stabil, wenn Spieler ausscheiden oder dazukommen.
 * Runden ohne gespeicherten Geber (Altspiele) werden vom Startspieler aus
 * nachgezaehlt.
 *
 * @return array{dealerId:?int, bidStartId:?int}
 */
function game_round_roles(PDO $pdo, int $gameId): array
{
    $seats = game_seat_order($pdo, $gameId);
    if (count(array_filter($seats, fn($s) => $s['active'])) === 0) {
        return ['dealerId' => null, 'bidStartId' => null];
    }

    $indexById = [];
    foreach ($seats as $i => $s) {
        $indexById[$s['id']] = $i;
    }

    $gameStmt = $pdo->prepare('SELECT starting_player_id FROM games WHERE id = ?');
    $gameStmt->execute([$gameId]);
    $startingId = $gameStmt->fetchColumn();

    $lastStmt = $pdo->prepare('SELECT dealer_id FROM rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1');
    $lastStmt->execute([$gameId]);
    $lastRow = $lastStmt->fetch(PDO::FETCH_ASSOC);

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM rounds WHERE game_id = ?');
    $countStmt->execute([$gameId]);
    $roundCount = (int) $countStmt->fetchColumn();

    if ($lastRow && $lastRow['dealer_id'] !== null && isset($indexById[(int) $lastRow['dealer_id']])) {
        $dealerIdx = game_next_active_seat($seats, $indexById[(int) $lastRow['dealer_id']]);
    } else {
        $baseIdx = $startingId !== null && isset($indexById[(int) $startingId]) ? $indexById[(int) $startingId] : 0;
        $dealerIdx = game_next_active_seat($seats, $baseIdx, true);
        for ($i = 0; $i < $roundCount; $i++) {
            $dealerIdx = game_next_active_seat($seats, $dealerIdx);
        }
    }

    return [
        'dealerId' => $seats[$dealerIdx]['id'],
        'bidStartId' => $seats[game_next_active_seat($seats, $dealerIdx)]['id'],
    ];
}

/**
 * Setzt $playerId (muss bereits in game_players stehen) direkt hinter
 * $afterPlayerId in die Sitzreihenfolge - bzw. ans Ende, wenn $afterPlayerId
 * fehlt oder nicht im Spiel sitzt - und nummeriert alle Sitze lueckenlos neu.
 */
function game_place_seat(PDO $pdo, int $gameId, int $playerId, ?int $afterPlayerId): void
{
    $ids = array_values(array_filter(
        array_column(game_seat_order($pdo, $gameId), 'id'),
        fn($id) => $id !== $playerId
    ));
    $pos = $afterPlayerId !== null ? array_search($afterPlayerId, $ids, true) : false;
    $insertAt = $pos === false ? count($ids) : $pos + 1;
    array_splice($ids, $insertAt, 0, [$playerId]);

    $update = $pdo->prepare('UPDATE game_players SET seat_position = ? WHERE game_id = ? AND player_id = ?');
    foreach ($ids as $i => $id) {
        $update->execute([$i, $gameId, $id]);
    }
}
