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

/**
 * Ermittelt die Spieler-IDs der Sieger eines beendeten Spiels (Gleichstand
 * moeglich, dann mehrere Sieger). Leeres Array bei nicht beendeten Spielen.
 * Team-Mitglieder haben immer identische Totals (siehe Migration 7) und
 * erscheinen bei einem Team-Sieg folgerichtig beide als Sieger.
 *
 * @param array $game Zeile aus der games-Tabelle (mind. id, status, win_direction)
 * @return array<int,int> Spieler-IDs
 */
function get_winner_ids(PDO $pdo, array $game): array
{
    if ($game['status'] !== 'finished') {
        return [];
    }
    $totals = get_totals($pdo, (int) $game['id']);
    if (count($totals) === 0) {
        return [];
    }
    $direction = $game['win_direction'] === 'lowest' ? 'lowest' : 'highest';
    $best = $direction === 'lowest' ? min($totals) : max($totals);

    $winnerIds = [];
    foreach ($totals as $playerId => $total) {
        if ($total === $best) {
            $winnerIds[] = (int) $playerId;
        }
    }
    return $winnerIds;
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

/**
 * Berechnet Statistiken ueber alle Spiele im optionalen Zeitfenster
 * [$fromTs, $toTs] (Unix-Timestamps, jeweils optional/inklusiv). Der
 * Vergleich laeuft bewusst ueber Timestamps statt String-Vergleich auf
 * started_at, damit ein Spieleabend, der ueber Mitternacht geht (z.B.
 * 18:00 bis 03:00 des Folgetags), korrekt als ein zusammenhaengender
 * Zeitraum gefiltert werden kann.
 *
 * Liefert:
 * - overall: Gesamt-Statistik je Spieler (modusuebergreifend), inkl.
 *   aktueller und laengster Siegesserie innerhalb des Zeitfensters
 * - byMode: dieselbe Statistik, aber getrennt je Modus (inkl. Punkte-
 *   schnitt - modusuebergreifend waere das nicht aussagekraeftig, da die
 *   Punkteskalen der Modi nicht vergleichbar sind)
 * - headToHead: paarweiser direkter Vergleich aller Spieler, die
 *   mindestens einmal gemeinsam in einem beendeten Spiel standen
 * - games: Rohliste der Spiele im Zeitfenster, fuer eine druckbare
 *   Zusammenfassung eines Spieleabends
 *
 * @return array{overall: array, byMode: array, headToHead: array, games: array}
 */
function build_stats(PDO $pdo, ?int $fromTs, ?int $toTs): array
{
    $namesStmt = $pdo->query('SELECT id, name FROM players');
    $nameById = [];
    foreach ($namesStmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
        $nameById[(int) $p['id']] = $p['name'];
    }

    $games = $pdo->query('SELECT * FROM games ORDER BY started_at ASC')->fetchAll(PDO::FETCH_ASSOC);

    $overall = [];
    $byMode = [];
    $streaks = [];
    $headToHead = [];
    $gamesOut = [];

    $participantsStmt = $pdo->prepare('SELECT player_id FROM game_players WHERE game_id = ?');

    foreach ($games as $game) {
        $startedTs = strtotime($game['started_at']);
        if ($startedTs === false) {
            continue;
        }
        if ($fromTs !== null && $startedTs < $fromTs) {
            continue;
        }
        if ($toTs !== null && $startedTs > $toTs) {
            continue;
        }

        $gameId = (int) $game['id'];
        $mode = $game['mode'];
        $isFinished = $game['status'] === 'finished';
        $totals = get_totals($pdo, $gameId);
        $winnerIds = get_winner_ids($pdo, $game);

        $participantsStmt->execute([$gameId]);
        $participantIds = array_map('intval', array_column($participantsStmt->fetchAll(PDO::FETCH_ASSOC), 'player_id'));
        sort($participantIds);

        foreach ($participantIds as $playerId) {
            if (!isset($overall[$playerId])) {
                $overall[$playerId] = ['gamesPlayed' => 0, 'gamesFinished' => 0, 'wins' => 0];
            }
            if (!isset($byMode[$mode][$playerId])) {
                $byMode[$mode][$playerId] = ['gamesPlayed' => 0, 'gamesFinished' => 0, 'wins' => 0, 'scoreSum' => 0, 'scoreCount' => 0];
            }
            if (!isset($streaks[$playerId])) {
                $streaks[$playerId] = ['current' => 0, 'longest' => 0];
            }

            $overall[$playerId]['gamesPlayed']++;
            $byMode[$mode][$playerId]['gamesPlayed']++;

            if ($isFinished) {
                $won = in_array($playerId, $winnerIds, true);

                $overall[$playerId]['gamesFinished']++;
                $byMode[$mode][$playerId]['gamesFinished']++;
                if ($won) {
                    $overall[$playerId]['wins']++;
                    $byMode[$mode][$playerId]['wins']++;
                }
                if (isset($totals[$playerId])) {
                    $byMode[$mode][$playerId]['scoreSum'] += $totals[$playerId];
                    $byMode[$mode][$playerId]['scoreCount']++;
                }

                if ($won) {
                    $streaks[$playerId]['current']++;
                    $streaks[$playerId]['longest'] = max($streaks[$playerId]['longest'], $streaks[$playerId]['current']);
                } else {
                    $streaks[$playerId]['current'] = 0;
                }
            }
        }

        if ($isFinished) {
            foreach ($participantIds as $i => $a) {
                foreach ($participantIds as $j => $b) {
                    if ($j <= $i) {
                        continue;
                    }
                    $key = $a . '-' . $b;
                    if (!isset($headToHead[$key])) {
                        $headToHead[$key] = ['aId' => $a, 'bId' => $b, 'aWins' => 0, 'bWins' => 0, 'draws' => 0, 'games' => 0];
                    }
                    $headToHead[$key]['games']++;
                    $aWon = in_array($a, $winnerIds, true);
                    $bWon = in_array($b, $winnerIds, true);
                    if ($aWon && $bWon) {
                        $headToHead[$key]['draws']++;
                    } elseif ($aWon) {
                        $headToHead[$key]['aWins']++;
                    } elseif ($bWon) {
                        $headToHead[$key]['bWins']++;
                    }
                }
            }
        }

        $gamesOut[] = [
            'id' => $gameId,
            'mode' => $mode,
            'label' => $game['label'],
            'startedAt' => $game['started_at'],
            'endedAt' => $game['ended_at'],
            'status' => $game['status'],
            'playerNames' => array_map(fn($id) => $nameById[$id] ?? '?', $participantIds),
            'winnerNames' => array_map(fn($id) => $nameById[$id] ?? '?', $winnerIds),
        ];
    }

    $overallOut = [];
    foreach ($overall as $playerId => $stats) {
        $overallOut[] = [
            'playerId' => $playerId,
            'name' => $nameById[$playerId] ?? '?',
            'gamesPlayed' => $stats['gamesPlayed'],
            'gamesFinished' => $stats['gamesFinished'],
            'wins' => $stats['wins'],
            'winRate' => $stats['gamesFinished'] > 0 ? $stats['wins'] / $stats['gamesFinished'] : null,
            'currentStreak' => $streaks[$playerId]['current'],
            'longestStreak' => $streaks[$playerId]['longest'],
        ];
    }
    usort($overallOut, fn($a, $b) => $b['wins'] - $a['wins']);

    $byModeOut = [];
    foreach ($byMode as $mode => $playerStats) {
        $rows = [];
        foreach ($playerStats as $playerId => $stats) {
            $rows[] = [
                'playerId' => $playerId,
                'name' => $nameById[$playerId] ?? '?',
                'gamesPlayed' => $stats['gamesPlayed'],
                'gamesFinished' => $stats['gamesFinished'],
                'wins' => $stats['wins'],
                'winRate' => $stats['gamesFinished'] > 0 ? $stats['wins'] / $stats['gamesFinished'] : null,
                'avgScore' => $stats['scoreCount'] > 0 ? $stats['scoreSum'] / $stats['scoreCount'] : null,
            ];
        }
        usort($rows, fn($a, $b) => $b['wins'] - $a['wins']);
        $byModeOut[$mode] = $rows;
    }

    $headToHeadOut = array_values(array_map(function ($h) use ($nameById) {
        return [
            'aId' => $h['aId'],
            'aName' => $nameById[$h['aId']] ?? '?',
            'bId' => $h['bId'],
            'bName' => $nameById[$h['bId']] ?? '?',
            'aWins' => $h['aWins'],
            'bWins' => $h['bWins'],
            'draws' => $h['draws'],
            'games' => $h['games'],
        ];
    }, $headToHead));
    usort($headToHeadOut, fn($a, $b) => $b['games'] - $a['games']);

    return [
        'overall' => $overallOut,
        'byMode' => $byModeOut,
        'headToHead' => $headToHeadOut,
        'games' => $gamesOut,
    ];
}
