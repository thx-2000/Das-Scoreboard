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
 */
function recompute_game_status(PDO $pdo, int $gameId): void
{
    $game = $pdo->prepare('SELECT * FROM games WHERE id = ?');
    $game->execute([$gameId]);
    $game = $game->fetch(PDO::FETCH_ASSOC);
    if (!$game) {
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

function build_game_state(PDO $pdo, int $gameId): ?array
{
    $gameStmt = $pdo->prepare('SELECT * FROM games WHERE id = ?');
    $gameStmt->execute([$gameId]);
    $game = $gameStmt->fetch(PDO::FETCH_ASSOC);
    if (!$game) {
        return null;
    }

    $playersStmt = $pdo->prepare('
        SELECT p.id, p.name FROM game_players gp
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

    $roundsStmt = $pdo->prepare('SELECT * FROM rounds WHERE game_id = ? ORDER BY round_number');
    $roundsStmt->execute([$gameId]);
    $rounds = $roundsStmt->fetchAll(PDO::FETCH_ASSOC);

    $scoresStmt = $pdo->prepare('
        SELECT rs.round_id, rs.player_id, rs.points
        FROM round_scores rs
        JOIN rounds r ON r.id = rs.round_id
        WHERE r.game_id = ?
    ');
    $scoresStmt->execute([$gameId]);
    $scoresByRound = [];
    foreach ($scoresStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $scoresByRound[$row['round_id']][(int) $row['player_id']] = (int) $row['points'];
    }

    $roundsOut = array_map(function ($r) use ($scoresByRound) {
        return [
            'id' => (int) $r['id'],
            'roundNumber' => (int) $r['round_number'],
            'createdAt' => $r['created_at'],
            'scores' => $scoresByRound[$r['id']] ?? new stdClass(),
        ];
    }, $rounds);

    $totals = get_totals($pdo, $gameId);
    $standings = [];
    foreach ($players as $p) {
        $standings[] = [
            'id' => (int) $p['id'],
            'name' => $p['name'],
            'total' => $totals[$p['id']] ?? 0,
        ];
    }
    usort($standings, function ($a, $b) {
        if ($b['total'] !== $a['total']) return $b['total'] - $a['total'];
        return strcmp($a['name'], $b['name']);
    });

    $winners = [];
    if ($game['status'] === 'finished' && count($standings) > 0) {
        $maxTotal = $standings[0]['total'];
        foreach ($standings as $s) {
            if ($s['total'] === $maxTotal) {
                $winners[] = ['id' => $s['id'], 'name' => $s['name'], 'total' => $s['total']];
            }
        }
    }

    return [
        'id' => (int) $game['id'],
        'mode' => $game['mode'],
        'label' => $game['label'],
        'targetScore' => (int) $game['target_score'],
        'status' => $game['status'],
        'startedAt' => $game['started_at'],
        'endedAt' => $game['ended_at'],
        'players' => array_map(fn($p) => ['id' => (int) $p['id'], 'name' => $p['name']], $players),
        'rounds' => $roundsOut,
        'standings' => $standings,
        'winners' => $winners,
    ];
}
