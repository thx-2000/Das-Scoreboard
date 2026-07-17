<?php

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/state.php';

/**
 * Eigene Spiele-Presets ("Meine Spiele" auf der Startseite) - eine
 * gespeicherte Kombination aus Modus + Einrichten-Werten (z.B. "Flip7" =
 * Punkte bis Hoechstwert, 200, hoechste Punktzahl, Schritte 1/5/10), die
 * das Einrichten-Formular des jeweiligen Modus vorausfuellt statt es leer
 * zu zeigen. Nur fuer die 3 generischen Punkte-Modi relevant, nicht RAGE
 * (das hat bereits ein festes Regelwerk, siehe Startseite).
 */

const PRESET_ALLOWED_MODES = ['points_to_target', 'points_open', 'fixed_rounds'];

function all_presets(PDO $pdo): array
{
    $rows = $pdo->query('SELECT * FROM game_presets ORDER BY sort_order, id')->fetchAll(PDO::FETCH_ASSOC);
    return array_map(fn ($p) => [
        'id' => (int) $p['id'],
        'name' => $p['name'],
        'mode' => $p['mode'],
        'targetScore' => (int) $p['target_score'],
        'totalRounds' => (int) $p['total_rounds'],
        'winDirection' => $p['win_direction'],
        'roundEntrySteps' => $p['round_entry_steps'],
        'targetBonus' => (int) $p['target_bonus'],
        'allowNegative' => (bool) $p['allow_negative'],
        'announceRoundEnd' => (bool) $p['announce_round_end'],
        'isFavorite' => (bool) $p['is_favorite'],
        'sortOrder' => (int) $p['sort_order'],
    ], $rows);
}

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET') {
    send_json(all_presets($pdo));
}

if ($method === 'POST') {
    $body = read_json_body();
    $name = trim((string) ($body['name'] ?? ''));
    $mode = trim((string) ($body['mode'] ?? ''));
    $targetScore = max(0, (int) ($body['targetScore'] ?? 0));
    $totalRounds = max(0, (int) ($body['totalRounds'] ?? 0));
    $winDirection = ($body['winDirection'] ?? 'highest') === 'lowest' ? 'lowest' : 'highest';
    $roundEntrySteps = sanitize_round_entry_steps((string) ($body['roundEntrySteps'] ?? '1,5,10'));
    $targetBonus = max(0, (int) ($body['targetBonus'] ?? 0));
    $allowNegative = array_key_exists('allowNegative', $body) ? (bool) $body['allowNegative'] : true;
    $announceRoundEnd = !empty($body['announceRoundEnd']);

    if ($name === '') {
        send_json(['error' => 'Name darf nicht leer sein.'], 400);
    }
    if (!in_array($mode, PRESET_ALLOWED_MODES, true)) {
        send_json(['error' => 'Ungültiger Modus.'], 400);
    }
    if ($mode === 'points_to_target' && $targetScore <= 0) {
        send_json(['error' => 'Zielwert muss größer als 0 sein.'], 400);
    }
    if ($mode === 'fixed_rounds' && $totalRounds <= 0) {
        send_json(['error' => 'Rundenzahl muss größer als 0 sein.'], 400);
    }

    $nextOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), -1) + 1 FROM game_presets')->fetchColumn();

    $pdo->prepare('
        INSERT INTO game_presets (name, mode, target_score, total_rounds, win_direction, round_entry_steps, target_bonus, allow_negative, announce_round_end, is_favorite, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    ')->execute([
        $name, $mode, $targetScore, $totalRounds, $winDirection, $roundEntrySteps,
        $targetBonus, $allowNegative ? 1 : 0, $announceRoundEnd ? 1 : 0, $nextOrder, now_iso(),
    ]);

    send_json(all_presets($pdo), 201);
}

if ($method === 'PATCH' && isset($_GET['reorder'])) {
    // Komplette neue Reihenfolge auf einmal (Drag&Drop liefert die volle
    // Liste, die Auf/Ab-Pfeile im Frontend berechnen die neue Reihenfolge
    // clientseitig und schicken sie genauso mit) - einfacher als ein
    // separater Swap-Endpunkt, deckt beide Bedienwege mit einem Codepfad ab.
    $body = read_json_body();
    $order = array_map('intval', $body['order'] ?? []);
    if (count($order) === 0) {
        send_json(['error' => 'order fehlt.'], 400);
    }

    $update = $pdo->prepare('UPDATE game_presets SET sort_order = ? WHERE id = ?');
    foreach ($order as $index => $presetId) {
        $update->execute([$index, $presetId]);
    }

    send_json(all_presets($pdo));
}

if ($id === null) {
    send_json(['error' => 'Preset-ID fehlt.'], 400);
}

if ($method === 'PATCH') {
    $body = read_json_body();
    $fields = [];
    $params = [];

    if (array_key_exists('name', $body)) {
        $name = trim((string) $body['name']);
        if ($name === '') {
            send_json(['error' => 'Name darf nicht leer sein.'], 400);
        }
        $fields[] = 'name = ?';
        $params[] = $name;
    }
    if (array_key_exists('mode', $body)) {
        $mode = trim((string) $body['mode']);
        if (!in_array($mode, PRESET_ALLOWED_MODES, true)) {
            send_json(['error' => 'Ungültiger Modus.'], 400);
        }
        $fields[] = 'mode = ?';
        $params[] = $mode;
    }
    if (array_key_exists('targetScore', $body)) {
        $fields[] = 'target_score = ?';
        $params[] = max(0, (int) $body['targetScore']);
    }
    if (array_key_exists('totalRounds', $body)) {
        $fields[] = 'total_rounds = ?';
        $params[] = max(0, (int) $body['totalRounds']);
    }
    if (array_key_exists('winDirection', $body)) {
        $fields[] = 'win_direction = ?';
        $params[] = $body['winDirection'] === 'lowest' ? 'lowest' : 'highest';
    }
    if (array_key_exists('roundEntrySteps', $body)) {
        $fields[] = 'round_entry_steps = ?';
        $params[] = sanitize_round_entry_steps((string) $body['roundEntrySteps']);
    }
    if (array_key_exists('targetBonus', $body)) {
        $fields[] = 'target_bonus = ?';
        $params[] = max(0, (int) $body['targetBonus']);
    }
    if (array_key_exists('allowNegative', $body)) {
        $fields[] = 'allow_negative = ?';
        $params[] = $body['allowNegative'] ? 1 : 0;
    }
    if (array_key_exists('announceRoundEnd', $body)) {
        $fields[] = 'announce_round_end = ?';
        $params[] = $body['announceRoundEnd'] ? 1 : 0;
    }
    if (array_key_exists('isFavorite', $body)) {
        $fields[] = 'is_favorite = ?';
        $params[] = $body['isFavorite'] ? 1 : 0;
    }

    if (count($fields) > 0) {
        $params[] = $id;
        $pdo->prepare('UPDATE game_presets SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }

    send_json(all_presets($pdo));
}

if ($method === 'DELETE') {
    $pdo->prepare('DELETE FROM game_presets WHERE id = ?')->execute([$id]);
    send_json(all_presets($pdo));
}

send_json(['error' => 'Methode nicht erlaubt.'], 405);
