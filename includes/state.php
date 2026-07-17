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

    $totals = get_effective_totals($pdo, $game);
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
 * Liefert je Spieler den fuer Rang/Sieg/Ziel-Erreichung massgeblichen Wert:
 * im team_scoring "individual" (Migration 9) die Team-Summe fuer Team-
 * Mitglieder, sonst (Standardfall "shared" sowie Solo-Spieler) unveraendert
 * die eigenen Gesamtpunkte aus get_totals(). Zentrale Stelle fuer diese
 * Berechnung, genutzt von recompute_game_status(), get_winner_ids() und
 * build_game_state() - vermeidet, die Team-Summenbildung mehrfach zu
 * duplizieren.
 *
 * @param array $game Zeile aus der games-Tabelle (mind. id, team_scoring)
 * @return array<int,int> player_id => massgeblicher Wert
 */
function get_effective_totals(PDO $pdo, array $game): array
{
    $gameId = (int) $game['id'];
    $totals = get_totals($pdo, $gameId);

    $teamScoring = ($game['team_scoring'] ?? 'shared') === 'individual' ? 'individual' : 'shared';
    if ($teamScoring !== 'individual') {
        return $totals;
    }

    $rowsStmt = $pdo->prepare('SELECT player_id, team_number FROM game_players WHERE game_id = ?');
    $rowsStmt->execute([$gameId]);
    $rows = $rowsStmt->fetchAll(PDO::FETCH_ASSOC);

    $teamMembers = [];
    foreach ($rows as $r) {
        if ($r['team_number'] === null) continue;
        $teamMembers[(int) $r['team_number']][] = (int) $r['player_id'];
    }

    $teamSums = [];
    foreach ($teamMembers as $teamNumber => $memberIds) {
        // Team mit nur einem Mitglied gilt nicht als Team (Sicherheitsnetz,
        // analog zu resolve_team_labels() - kann aktuell nicht ueber die UI
        // entstehen).
        if (count($memberIds) < 2) continue;
        $sum = 0;
        foreach ($memberIds as $pid) {
            $sum += $totals[$pid] ?? 0;
        }
        $teamSums[$teamNumber] = $sum;
    }

    $effective = [];
    foreach ($rows as $r) {
        $pid = (int) $r['player_id'];
        $teamNumber = $r['team_number'] !== null ? (int) $r['team_number'] : null;
        $effective[$pid] = ($teamNumber !== null && isset($teamSums[$teamNumber]))
            ? $teamSums[$teamNumber]
            : ($totals[$pid] ?? 0);
    }
    return $effective;
}

/**
 * Ermittelt die Spieler-IDs der Sieger eines beendeten Spiels (Gleichstand
 * moeglich, dann mehrere Sieger). Leeres Array bei nicht beendeten Spielen.
 * Team-Mitglieder im team_scoring "shared" haben immer identische Totals
 * (siehe Migration 7) und erscheinen bei einem Team-Sieg folgerichtig beide
 * als Sieger; im "individual"-Modus sorgt get_effective_totals() dafuer,
 * dass hierfuer die Team-Summe statt der (ggf. abweichenden) Einzelwerte
 * zaehlt.
 *
 * @param array $game Zeile aus der games-Tabelle (mind. id, status, win_direction, team_scoring)
 * @return array<int,int> Spieler-IDs
 */
function get_winner_ids(PDO $pdo, array $game): array
{
    if ($game['status'] !== 'finished') {
        return [];
    }
    $totals = get_effective_totals($pdo, $game);
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
    $teamScoring = ($game['team_scoring'] ?? 'shared') === 'individual' ? 'individual' : 'shared';

    if ($teamScoring === 'individual') {
        // Jeder Spieler traegt eigene Punkte ein (siehe Migration 9) - anders
        // als im "shared"-Team-Modus keine identischen Rundenwerte. Das
        // Team-Ergebnis ist die Summe der Mitglieder-Totals (siehe
        // get_effective_totals()), wird aber NICHT zu einer Zeile
        // zusammengefasst: jeder Spieler bleibt sichtbar, zeigt zusaetzlich
        // teamLabel/teamTotal. rankValue ist der Wert, der fuer Rang/Sieg
        // zaehlt (Team-Summe fuer Team-Mitglieder, sonst die eigenen Punkte)
        // - Team-Mitglieder teilen sich dadurch denselben Rang, obwohl ihre
        // einzelnen Punkte unterschiedlich sein koennen.
        $effectiveTotals = get_effective_totals($pdo, $game);

        $standings = [];
        foreach ($players as $p) {
            $playerId = (int) $p['id'];
            $teamNumber = $p['team_number'] !== null ? (int) $p['team_number'] : null;
            $hasTeam = $teamNumber !== null && isset($teamLabels[$teamNumber]);
            $ownTotal = $totals[$playerId] ?? 0;
            $rankValue = $effectiveTotals[$playerId] ?? $ownTotal;

            $standings[] = [
                'id' => $playerId,
                'name' => $p['name'],
                'total' => $ownTotal,
                'memberIds' => [$playerId],
                'avatarExt' => $p['avatar_ext'],
                'teamLabel' => $hasTeam ? $teamLabels[$teamNumber] : null,
                'teamTotal' => $hasTeam ? $rankValue : null,
                'rankValue' => $rankValue,
            ];
        }
    } else {
        // Team-Mitglieder haben immer identische Rundenwerte (siehe
        // Migration 7) und damit identische Gesamtpunkte - werden hier zu
        // EINER Standings-Zeile zusammengefasst statt als redundante
        // Einzelzeilen mit gleichem Wert angezeigt zu werden. memberIds gibt
        // es bei Solo-Spielern ebenfalls (nur mit sich selbst), damit das
        // Frontend Stern-/Startspieler-Logik einheitlich ueber memberIds
        // statt id pruefen kann.
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
        foreach ($standings as &$s) {
            $s['rankValue'] = $s['total'];
        }
        unset($s);
    }

    usort($standings, function ($a, $b) use ($direction) {
        $diff = $direction === 'lowest' ? $a['rankValue'] - $b['rankValue'] : $b['rankValue'] - $a['rankValue'];
        if ($diff !== 0) return $diff;
        return strcmp($a['name'], $b['name']);
    });

    $winners = [];
    if ($game['status'] === 'finished' && count($standings) > 0) {
        $bestRankValue = $standings[0]['rankValue'];
        foreach ($standings as $s) {
            if ($s['rankValue'] === $bestRankValue) {
                // 'total' im Sieger-Banner zeigt bewusst rankValue (bei einem
                // Team im individual-Modus dessen Summe), nicht den ggf.
                // abweichenden Einzelwert des Mitglieds - sonst wuerde der
                // Banner nur die Punkte EINES Team-Mitglieds zeigen.
                $winners[] = ['id' => $s['id'], 'name' => $s['name'], 'total' => $s['rankValue']];
            }
        }
    }

    // "Bonus bei Zielerreichung" (nur "Punkte bis Hoechstwert", Migration 12):
    // wird bewusst ERST NACH der obigen Sieger-Ermittlung addiert, die auf
    // den rohen Totals beruht (identisch zu recompute_game_status() /
    // get_effective_totals()) - der Bonus darf nie beeinflussen, OB oder
    // WANN das Ziel erreicht wird, sondern zeigt nur einen zusaetzlichen
    // Bonus im Endergebnis der bereits ermittelten Sieger. Bei Gleichstand
    // am Ziel bekommen alle gemeinsamen Sieger den Bonus. Bleibt dadurch
    // automatisch korrektursicher: eine nachtraegliche Korrektur, die den
    // Sieger unter das Ziel drueckt, loescht auch den Bonus wieder (dieser
    // Codepfad greift ja nur noch fuer die NEU ermittelten Sieger).
    $targetBonus = (int) ($game['target_bonus'] ?? 0);
    if ($targetBonus > 0 && count($winners) > 0) {
        $winnerIds = array_column($winners, 'id');
        foreach ($standings as &$s) {
            if (in_array($s['id'], $winnerIds, true)) {
                $s['total'] += $targetBonus;
                $s['rankValue'] += $targetBonus;
            }
        }
        unset($s);
        foreach ($winners as &$w) {
            $w['total'] += $targetBonus;
        }
        unset($w);
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
        'teamScoring' => $teamScoring,
        'targetBonus' => (int) ($game['target_bonus'] ?? 0),
        'allowNegative' => (bool) ($game['allow_negative'] ?? 1),
        'rageShowBonusMalus' => (bool) ($game['rage_show_bonus_malus'] ?? 1),
        'roundEntrySteps' => $game['round_entry_steps'] ?? '1,5,10',
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

    // Kennzahlen-Kacheln (Mockup-Abgleich): totalGames/finishedGames zaehlen
    // alle Spiele im Filterzeitraum unabhaengig vom Modus. winRate meint hier
    // bewusst den Anteil bereits abgeschlossener Spiele (nicht die
    // individuelle Sieg-% eines Spielers, die gibt es bereits pro Zeile in
    // $overallOut) - Frontend beschriftet das entsprechend als "Beendet".
    // avgScore mittelt nur ueber die 3 Punkte-basierten Modi (RAGE-Punkte
    // sind wertemaessig nicht vergleichbar und wuerden den Schnitt verzerren).
    $totalGames = count($gamesOut);
    $finishedGames = count(array_filter($gamesOut, fn($g) => $g['status'] === 'finished'));

    $pointBasedModes = ['points_to_target', 'points_open', 'fixed_rounds'];
    $scoreSum = 0.0;
    $scoreCount = 0;
    foreach ($pointBasedModes as $mode) {
        foreach ($byModeOut[$mode] ?? [] as $row) {
            if ($row['avgScore'] !== null) {
                $scoreSum += $row['avgScore'];
                $scoreCount++;
            }
        }
    }

    $summary = [
        'totalGames' => $totalGames,
        'finishedGames' => $finishedGames,
        'winRate' => $totalGames > 0 ? $finishedGames / $totalGames : null,
        'avgScore' => $scoreCount > 0 ? $scoreSum / $scoreCount : null,
    ];

    return [
        'summary' => $summary,
        'overall' => $overallOut,
        'byMode' => $byModeOut,
        'headToHead' => $headToHeadOut,
        'games' => $gamesOut,
    ];
}
