<?php

require_once __DIR__ . '/../includes/auth.php';
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

        $winnerIds = get_winner_ids($pdo, $game);
        $winners = [];
        if (count($winnerIds) > 0) {
            $namesById = $pdo->prepare('SELECT name FROM players WHERE id = ?');
            foreach ($winnerIds as $playerId) {
                $namesById->execute([$playerId]);
                $p = $namesById->fetch(PDO::FETCH_ASSOC);
                if ($p) $winners[] = $p['name'];
            }
        }

        $roundsPlayed = 0;
        if ((int) $game['total_rounds'] > 0) {
            $countStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM rounds WHERE game_id = ?');
            $countStmt->execute([$gameId]);
            $roundsPlayed = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['c'];
        }

        return [
            'id' => $gameId,
            'mode' => $game['mode'],
            'label' => $game['label'],
            'targetScore' => (int) $game['target_score'],
            'totalRounds' => (int) $game['total_rounds'],
            'roundsPlayed' => $roundsPlayed,
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
    $totalRounds = (int) ($body['totalRounds'] ?? 0);
    $announceRoundEnd = !empty($body['announceRoundEnd']);
    $playerIds = array_map('intval', $body['playerIds'] ?? []);
    $playerIds = array_values(array_unique($playerIds));

    // Mockup-Abgleich: 3 neue Setup-Optionen (Migration 12). targetBonus nur
    // bei "Punkte bis Hoechstwert" relevant (siehe get_effective_totals()),
    // allowNegative bei den 3 Punkte-Modi (nicht RAGE, siehe api/rounds.php),
    // rageShowBonusMalus nur bei RAGE (reine Anzeige-Einstellung, siehe
    // modes/rage/game.js) - Defaults entsprechen dem bisherigen Verhalten.
    $targetBonus = max(0, (int) ($body['targetBonus'] ?? 0));
    $allowNegative = array_key_exists('allowNegative', $body) ? (bool) $body['allowNegative'] : true;
    $rageShowBonusMalus = array_key_exists('rageShowBonusMalus', $body) ? (bool) $body['rageShowBonusMalus'] : true;

    // Schrittweiten fuer die Schritt-Buttons bei der Rundenerfassung (Migration
    // 13) - seit Einfuehrung der Spiele-Presets pro Spiel statt global, damit
    // z.B. "Flip7" (1/5/10) und "Tutto" (100/500/1000) unterschiedliche
    // Vorschlaege haben koennen. Nicht bei RAGE relevant, wird dort aber
    // trotzdem mit dem Standardwert gespeichert (schadet nicht, wird ignoriert).
    $roundEntrySteps = sanitize_round_entry_steps((string) ($body['roundEntrySteps'] ?? '1,5,10'));

    // Team-Modus gibt es bewusst nur in den 3 Punkte-Modi, nicht bei RAGE
    // (dort haben Ansage/Stiche eine ganz andere Struktur pro Spieler) -
    // teamAssignments/teamNames werden bei RAGE deshalb ignoriert, auch wenn
    // sie (fehlerhaft) mitgeschickt wuerden. Format:
    // teamAssignments: { "<playerId>": <teamNumber> }, teamNames: { "<teamNumber>": "<Name>" }
    $teamAssignments = $mode !== 'rage' && is_array($body['teamAssignments'] ?? null) ? $body['teamAssignments'] : [];
    $teamNames = $mode !== 'rage' && is_array($body['teamNames'] ?? null) ? $body['teamNames'] : [];
    // "shared" (Standard): Team-Mitglieder tragen gemeinsam einen Punktwert
    // pro Runde ein. "individual": jeder Spieler traegt eigene Punkte ein,
    // das Team-Ergebnis ist die Summe - siehe build_game_state().
    $teamScoring = ($body['teamScoring'] ?? 'shared') === 'individual' ? 'individual' : 'shared';
    // Geber-Anzeige (Migration 18): bei RAGE immer, sonst per Setup-Option. Die
    // Reihenfolge von playerIds ist dann die Sitzordnung im Uhrzeigersinn.
    $showDealer = $mode === 'rage' || !empty($body['showDealer']);

    if ($mode === '') {
        send_json(['error' => 'Modus fehlt.'], 400);
    }
    // Nur der Modus "Punkte bis Höchstwert" braucht zwingend einen Zielwert -
    // "Offene Punkterunde" laeuft mit target_score = 0 (kein Zielwert).
    if ($mode === 'points_to_target' && $targetScore <= 0) {
        send_json(['error' => 'Zielwert muss groesser als 0 sein.'], 400);
    }
    // "Punkterunde mit fester Rundenzahl" braucht zwingend eine Rundenzahl.
    if ($mode === 'fixed_rounds' && $totalRounds <= 0) {
        send_json(['error' => 'Rundenzahl muss groesser als 0 sein.'], 400);
    }
    if (count($playerIds) < 2) {
        send_json(['error' => 'Mindestens 2 Spieler erforderlich.'], 400);
    }

    // Wertungsbogen: die Wertungen (Zeilen des Bogens) kommen vom Setup, z.B.
    // ["Baeume", "Tiere", "Hoehle"]. Pro Wertung entsteht unten eine Runde.
    $categories = [];
    if ($mode === 'score_sheet') {
        // Eintrag = Text oder {label, helper}; helper ist nur eine Kennung fuer eine
        // Rechenhilfe im Frontend (z.B. "cascadia:bear:A").
        foreach (is_array($body['categories'] ?? null) ? $body['categories'] : [] as $category) {
            $rawLabel = is_array($category) ? ($category['label'] ?? '') : $category;
            $categoryLabel = mb_substr(trim((string) $rawLabel), 0, 60);
            $helper = is_array($category) ? trim((string) ($category['helper'] ?? '')) : '';
            if ($categoryLabel !== '') {
                $categories[] = [
                    'label' => $categoryLabel,
                    'helper' => preg_match('/^[A-Za-z0-9:_-]{1,30}$/', $helper) ? $helper : null,
                ];
            }
        }
        $categories = array_slice($categories, 0, 40);
        if (count($categories) === 0) {
            send_json(['error' => 'Mindestens eine Wertung erforderlich.'], 400);
        }
    }

    // Startspieler: auf Wunsch ein bestimmter Mitspieler (startingPlayerId),
    // sonst zufaellig unter den teilnehmenden Spielern ausgelost.
    $requestedStart = (int) ($body['startingPlayerId'] ?? 0);
    $startingPlayerId = in_array($requestedStart, $playerIds, true)
        ? $requestedStart
        : $playerIds[array_rand($playerIds)];

    $pdo->beginTransaction();

    $insertGame = $pdo->prepare('
        INSERT INTO games (mode, label, target_score, win_direction, status, started_at, starting_player_id, total_rounds, announce_round_end, team_scoring, target_bonus, allow_negative, rage_show_bonus_malus, round_entry_steps, show_dealer)
        VALUES (?, ?, ?, ?, "active", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $insertGame->execute([
        $mode, $label !== '' ? $label : null, max(0, $targetScore), $winDirection, now_iso(), $startingPlayerId,
        max(0, $totalRounds), $announceRoundEnd ? 1 : 0, $teamScoring,
        $targetBonus, $allowNegative ? 1 : 0, $rageShowBonusMalus ? 1 : 0, $roundEntrySteps,
        $showDealer ? 1 : 0,
    ]);
    $gameId = (int) $pdo->lastInsertId();

    $insertGamePlayer = $pdo->prepare('
        INSERT INTO game_players (game_id, player_id, team_number, team_name, seat_position) VALUES (?, ?, ?, ?, ?)
    ');
    foreach ($playerIds as $seatIndex => $playerId) {
        $teamNumber = isset($teamAssignments[$playerId]) ? (int) $teamAssignments[$playerId] : null;
        $teamName = $teamNumber !== null && !empty($teamNames[$teamNumber])
            ? trim((string) $teamNames[$teamNumber])
            : null;
        // Mit Geber-Anzeige ist die Reihenfolge von playerIds die Sitzordnung
        // im Uhrzeigersinn (Setup fragt sie ab); sonst ist sie nur die
        // Klickreihenfolge und wird deshalb nicht gespeichert.
        $insertGamePlayer->execute([$gameId, $playerId, $teamNumber, $teamName !== '' ? $teamName : null, $showDealer ? $seatIndex : null]);
    }

    if ($mode === 'score_sheet') {
        $insertRound = $pdo->prepare('INSERT INTO rounds (game_id, round_number, created_at, label, helper) VALUES (?, ?, ?, ?, ?)');
        $insertScore = $pdo->prepare('INSERT INTO round_scores (round_id, player_id, points) VALUES (?, ?, 0)');
        foreach ($categories as $index => $category) {
            $insertRound->execute([$gameId, $index + 1, now_iso(), $category['label'], $category['helper']]);
            $roundId = (int) $pdo->lastInsertId();
            foreach ($playerIds as $playerId) {
                $insertScore->execute([$roundId, $playerId]);
            }
        }
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
    if (array_key_exists('extendRounds', $body)) {
        extend_total_rounds($pdo, $id, (int) $body['extendRounds']);
    }
    // Live-Bearbeitung eines laufenden Spiels (Migration 16) - Frontend zeigt
    // das Zielwert-Feld nur bei "Punkte bis Hoechstwert" an, serverseitig
    // bewusst kein Modus-Check, damit dieser PATCH-Zweig generisch bleibt.
    if (array_key_exists('targetScore', $body)) {
        $pdo->prepare('UPDATE games SET target_score = ? WHERE id = ?')
            ->execute([max(0, (int) $body['targetScore']), $id]);
        recompute_game_status($pdo, $id);
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
    $pdo->prepare('DELETE FROM rage_draft_bids WHERE game_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM game_players WHERE game_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM games WHERE id = ?')->execute([$id]);
    $pdo->commit();

    send_json(['deleted' => true]);
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
