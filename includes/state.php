<?php

require_once __DIR__ . '/db.php';

function send_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function now_iso(): string
{
    return (new DateTime('now'))->format(DATE_ATOM);
}

/**
 * Berechnet aus den bisherigen Runden die Gesamtpunkte je Spieler und setzt
 * Status/Endzeit des Spiels neu - auch nach nachtraeglichen Korrekturen.
 * Bei mehreren Spielern mit dem gleichen (hoechsten) Endstand gewinnen alle
 * gemeinsam (Gleichstand moeglich).
 *
 * Gilt nur fuer Spiele MIT Zielwert (target_score > 0, Modus "Punkte bis
 * Höchstwert"). Spiele ohne Zielwert (target_score = 0, Modus "Offene
 * Punkterunde") werden ausschliesslich manuell ueber set_game_finished()
 * beendet/fortgesetzt, hier also uebersprungen.
 */
function recompute_game_status(PDO $pdo, int $gameId): void
{
    $game = $pdo->prepare('SELECT * FROM games WHERE id = ?');
    $game->execute([$gameId]);
    $game = $game->fetch(PDO::FETCH_ASSOC);
    if (!$game || (int) $game['target_score'] <= 0) {
        return;
    }

    $totals = get_totals($pdo, $gameId);
    $maxTotal = count($totals) > 0 ? max($totals) : 0;
    $reachedTarget = $maxTotal >= (int) $game['target_score'] && count($totals) > 0;

    if ($reachedTarget && $game['status'] !== 'finished') {
        $update = $pdo->prepare('UPDATE games SET status = "finished", ended_at = ? WHERE id = ?');
        $update->execute([now_iso(), $gameId]);
    } elseif (!$reachedTarget && $game['status'] !== 'active') {
        $update = $pdo->prepare('UPDATE games SET status = "active", ended_at = NULL WHERE id = ?');
        $update->execute([$gameId]);
    }
}

/**
 * Manuelles Beenden/Fortsetzen fuer Spiele ohne Zielwert ("Offene
 * Punkterunde") - hier gibt es keinen automatischen Sieg-Moment.
 */
function set_game_finished(PDO $pdo, int $gameId, bool $finished): void
{
    if ($finished) {
        $update = $pdo->prepare('UPDATE games SET status = "finished", ended_at = ? WHERE id = ?');
        $update->execute([now_iso(), $gameId]);
    } else {
        $update = $pdo->prepare('UPDATE games SET status = "active", ended_at = NULL WHERE id = ?');
        $update->execute([$gameId]);
    }
}

/** @return array<int,int> player_id => Gesamtpunkte */
function get_totals(PDO $pdo, int $gameId): array
{
    $players = $pdo->prepare('
        SELECT p.id FROM game_players gp
        JOIN players p ON p.id = gp.player_id
        WHERE gp.game_id = ?
    ');
    $players->execute([$gameId]);
    $playerIds = array_column($players->fetchAll(PDO::FETCH_ASSOC), 'id');

    $totals = [];
    foreach ($playerIds as $id) {
        $totals[$id] = 0;
    }

    $scores = $pdo->prepare('
        SELECT rs.player_id, SUM(rs.points) AS total
        FROM round_scores rs
        JOIN rounds r ON r.id = rs.round_id
        WHERE r.game_id = ?
        GROUP BY rs.player_id
    ');
    $scores->execute([$gameId]);
    foreach ($scores->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $totals[(int) $row['player_id']] = (int) $row['total'];
    }

    return $totals;
}

/**
 * Ermittelt je team_number den Anzeigenamen eines Teams: manueller Name
 * (falls von einem Mitglied gesetzt) hat Vorrang, sonst automatisch aus den
 * Mitgliedsnamen gebildet ("Alice & Bob"). Teams mit nur noch einem
 * Mitglied gelten nicht mehr als Team (Anzeige faellt auf Solo-Namen
 * zurueck) - Sicherheitsnetz, kann aktuell nicht ueber die UI entstehen.
 *
 * @param array<int, array{id:int|string, name:string, team_number:?int, team_name:?string}> $players
 * @return array<int, string> team_number => Anzeigename
 */
function resolve_team_labels(array $players): array
{
    $membersByTeam = [];
    foreach ($players as $p) {
        if ($p['team_number'] === null) continue;
        $teamNumber = (int) $p['team_number'];
        $membersByTeam[$teamNumber]['names'][] = $p['name'];
        if (!empty($p['team_name']) && !isset($membersByTeam[$teamNumber]['customName'])) {
            $membersByTeam[$teamNumber]['customName'] = $p['team_name'];
        }
    }

    $teamLabels = [];
    foreach ($membersByTeam as $teamNumber => $info) {
        if (count($info['names']) < 2) continue;
        $teamLabels[$teamNumber] = $info['customName'] ?? implode(' & ', $info['names']);
    }
    return $teamLabels;
}

function build_game_state(PDO $pdo, int $gameId): ?array
{
    $gameStmt = $pdo->prepare('SELECT * FROM games WHERE id = ?');
    $gameStmt->execute([$gameId]);
    $game = $gameStmt->fetch(PDO::FETCH_ASSOC);
    if (!$game) {
        return null;
    }

    $playersStmt = $pdo->prepare('
        SELECT p.id, p.name, p.avatar_ext, gp.team_number, gp.team_name FROM game_players gp
        JOIN players p ON p.id = gp.player_id
        WHERE gp.game_id = ?
        ORDER BY p.id
    ');
    $playersStmt->execute([$gameId]);
    $players = $playersStmt->fetchAll(PDO::FETCH_ASSOC);
    $nameById = [];
    foreach ($players as $p) {
        $nameById[$p['id']] = $p['name'];
    }

    $teamLabels = resolve_team_labels($players);

    $roundsStmt = $pdo->prepare('SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number');
    $roundsStmt->execute([$gameId]);
    $rounds = $roundsStmt->fetchAll(PDO::FETCH_ASSOC);

    $scoresStmt = $pdo->prepare('
        SELECT rs.round_id, rs.player_id, rs.points, rs.bid, rs.actual_tricks,
               rs.rage_bonus_count, rs.rage_rache_count
        FROM round_scores rs
        JOIN rounds r ON r.id = rs.round_id
        WHERE r.game_id = ?
    ');
    $scoresStmt->execute([$gameId]);
    $scoresByRound = [];
    $rageDetailsByRound = [];
    foreach ($scoresStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $scoresByRound[$row['round_id']][(int) $row['player_id']] = (int) $row['points'];
        // Nur fuer den Modus RAGE relevant; bei anderen Modi bleiben diese
        // Spalten NULL und werden hier trotzdem mitgefuehrt (kostet nichts,
        // haelt build_game_state() aber modusuebergreifend einheitlich).
        $rageDetailsByRound[$row['round_id']][(int) $row['player_id']] = [
            'bid' => $row['bid'] !== null ? (int) $row['bid'] : null,
            'actualTricks' => $row['actual_tricks'] !== null ? (int) $row['actual_tricks'] : null,
            'rageBonusCount' => (int) $row['rage_bonus_count'],
            'rageRacheCount' => (int) $row['rage_rache_count'],
        ];
    }

    $roundsOut = array_map(function ($r) use ($scoresByRound, $rageDetailsByRound) {
        return [
            'id' => (int) $r['id'],
            'roundNumber' => (int) $r['round_number'],
            'createdAt' => $r['created_at'],
            'scores' => $scoresByRound[$r['id']] ?? new stdClass(),
            'rageDetails' => $rageDetailsByRound[$r['id']] ?? new stdClass(),
        ];
    }, $rounds);

    // "lowest" (z.B. bei Doppelkopf-artigen Spielen) dreht Rangfolge und
    // Sieg-Ermittlung um - Platz 1 ist dann der niedrigste Punktestand.
    $direction = $game['win_direction'] === 'lowest' ? 'lowest' : 'highest';

    $totals = get_totals($pdo, $gameId);

    // Team-Mitglieder haben immer identische Rundenwerte (siehe Migration 7)
    // und damit identische Gesamtpunkte - werden hier zu EINER Standings-
    // Zeile zusammengefasst statt als redundante Einzelzeilen mit
    // gleichem Wert angezeigt zu werden. memberIds gibt es bei Solo-Spielern
    // ebenfalls (nur mit sich selbst), damit das Frontend Stern-/Startspieler-
    // Logik einheitlich ueber memberIds statt id pruefen kann.
    $standingsByTeam = [];
    $soloStandings = [];
    foreach ($players as $p) {
        $playerId = (int) $p['id'];
        $teamNumber = $p['team_number'] !== null ? (int) $p['team_number'] : null;

        if ($teamNumber !== null && isset($teamLabels[$teamNumber])) {
            if (!isset($standingsByTeam[$teamNumber])) {
                $standingsByTeam[$teamNumber] = [
                    'id' => 'team-' . $teamNumber,
                    'name' => $teamLabels[$teamNumber],
                    'total' => $totals[$playerId] ?? 0,
                    'memberIds' => [],
                ];
            }
            $standingsByTeam[$teamNumber]['memberIds'][] = $playerId;
        } else {
            $soloStandings[] = [
                'id' => $playerId,
                'name' => $p['name'],
                'total' => $totals[$playerId] ?? 0,
                'memberIds' => [$playerId],
                // Nur bei Solo-Zeilen gesetzt - bei Team-Zeilen unklar, wessen
                // Foto stellvertretend gezeigt werden sollte, deshalb dort
                // bewusst kein Avatar (siehe Team-Zeile weiter oben, kein
                // avatarExt-Feld).
                'avatarExt' => $p['avatar_ext'],
            ];
        }
    }
    $standings = array_merge(array_values($standingsByTeam), $soloStandings);

    usort($standings, function ($a, $b) use ($direction) {
        $diff = $direction === 'lowest' ? $a['total'] - $b['total'] : $b['total'] - $a['total'];
        if ($diff !== 0) return $diff;
        return strcmp($a['name'], $b['name']);
    });

    $winners = [];
    if ($game['status'] === 'finished' && count($standings) > 0) {
        $bestTotal = $standings[0]['total'];
        foreach ($standings as $s) {
            if ($s['total'] === $bestTotal) {
                $winners[] = ['id' => $s['id'], 'name' => $s['name'], 'total' => $s['total']];
            }
        }
    }

    return [
        'id' => (int) $game['id'],
        'mode' => $game['mode'],
        'label' => $game['label'],
        'targetScore' => (int) $game['target_score'],
        'winDirection' => $direction,
        'status' => $game['status'],
        'startedAt' => $game['started_at'],
        'endedAt' => $game['ended_at'],
        'startingPlayerId' => $game['starting_player_id'] !== null ? (int) $game['starting_player_id'] : null,
        'totalRounds' => (int) $game['total_rounds'],
        'announceRoundEnd' => (bool) $game['announce_round_end'],
        'players' => array_map(function ($p) use ($teamLabels) {
            $teamNumber = $p['team_number'] !== null ? (int) $p['team_number'] : null;
            $teamLabel = $teamNumber !== null ? ($teamLabels[$teamNumber] ?? null) : null;
            return [
                'id' => (int) $p['id'],
                'name' => $p['name'],
                'avatarExt' => $p['avatar_ext'],
                'teamNumber' => $teamLabel !== null ? $teamNumber : null,
                'teamLabel' => $teamLabel,
            ];
        }, $players),
        'rounds' => $roundsOut,
        'standings' => $standings,
        'winners' => $winners,
    ];
}

/**
 * Verlaengert die vereinbarte Rundenzahl fuer den Modus "Punkterunde mit
 * fester Rundenzahl" - Status/Endzeit bleiben unangetastet, das Spiel laeuft
 * einfach mit dem neuen (hoeheren) Ziel weiter.
 */
function extend_total_rounds(PDO $pdo, int $gameId, int $additionalRounds): void
{
    if ($additionalRounds <= 0) {
        return;
    }
    $update = $pdo->prepare('UPDATE games SET total_rounds = total_rounds + ? WHERE id = ?');
    $update->execute([$additionalRounds, $gameId]);
}
