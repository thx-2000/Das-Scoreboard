<?php

require_once __DIR__ . '/../includes/state.php';

/**
 * Liefert Statistiken ueber alle (oder per from/to zeitlich eingegrenzte)
 * Spiele - siehe build_stats() in includes/state.php fuer die genaue
 * Berechnung. from/to sind optionale Datum/Zeit-Strings (z.B. aus einem
 * <input type="datetime-local">) und werden ueber strtotime() in
 * Unix-Timestamps umgewandelt, damit ein Zeitraum ueber Mitternacht hinweg
 * (z.B. 18:00 bis 03:00 des Folgetags) korrekt funktioniert.
 */

function parse_optional_timestamp(?string $value): ?int
{
    if ($value === null || trim($value) === '') {
        return null;
    }
    $ts = strtotime($value);
    return $ts !== false ? $ts : null;
}

$pdo = get_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    send_json(['error' => 'Methode nicht erlaubt.'], 405);
}

$fromTs = parse_optional_timestamp($_GET['from'] ?? null);
$toTs = parse_optional_timestamp($_GET['to'] ?? null);

send_json([
    'range' => [
        'from' => $_GET['from'] ?? null,
        'to' => $_GET['to'] ?? null,
    ],
    ...build_stats($pdo, $fromTs, $toTs),
]);
