<?php

require_once __DIR__ . '/db.php';

/**
 * Standardwerte, identisch zu den urspruenglichen Werten in css/style.css.
 * "_light"/"_dark" Suffix = Basis-Farben, die zwingend pro Hell-/Dunkelmodus
 * unterschiedlich sein muessen (sonst waere der jeweils andere Modus kaputt).
 * Ohne Suffix = Akzent-/Funktionsfarben, die bewusst in beiden Modi denselben
 * Wert verwenden.
 */
function default_settings(): array
{
    return [
        'language' => 'de',
        'app_title' => 'Das Scoreboard',

        'color_bg_light' => '#f1f2f4',
        'color_bg_dark' => '#17181b',
        'color_surface_light' => '#ffffff',
        'color_surface_dark' => '#202226',
        'color_text_light' => '#1c1e22',
        'color_text_dark' => '#eef0f2',
        'color_text_muted_light' => '#6b7280',
        'color_text_muted_dark' => '#9aa0b0',
        'color_border_light' => '#dfe1e5',
        'color_border_dark' => '#2d2f34',

        'color_green' => '#39ff14',
        'color_green_strong' => '#16a34a',
        'color_amber' => '#ffb700',
        'color_amber_strong' => '#b45309',
        'color_on_accent' => '#0b1210',
        'color_focus' => '#2563eb',
        'color_danger' => '#d1293d',
    ];
}

function supported_languages(): array
{
    // Reihenfolge = Anzeigereihenfolge im Sprachwahl-Dropdown. Neue Sprache
    // hinzufuegen: hier eintragen + passende i18n/{code}.json anlegen.
    return [
        'de' => 'Deutsch',
        'en' => 'English',
    ];
}

function get_settings(PDO $pdo): array
{
    $rows = $pdo->query('SELECT key, value FROM settings')->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_merge(default_settings(), $rows);
}

function is_valid_hex_color(string $value): bool
{
    return (bool) preg_match('/^#[0-9a-fA-F]{6}$/', $value);
}

/**
 * Speichert nur bekannte Settings-Schluessel mit gueltigem Wert (Hex-Farbe
 * bzw. unterstuetzte Sprache) - unbekannte oder ungueltige Eintraege werden
 * stillschweigend uebersprungen, damit ein Tippfehler im Request nicht die
 * ganze Speicherung verhindert.
 */
function save_settings(PDO $pdo, array $updates): void
{
    $defaults = default_settings();
    $languages = supported_languages();

    $upsert = $pdo->prepare('
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    ');

    foreach ($updates as $key => $value) {
        if (!array_key_exists($key, $defaults)) {
            continue;
        }
        $value = (string) $value;

        if ($key === 'language') {
            if (!array_key_exists($value, $languages)) {
                continue;
            }
        } elseif ($key === 'app_title') {
            $value = trim($value);
            if ($value === '' || mb_strlen($value) > 60) {
                continue;
            }
        } elseif (!is_valid_hex_color($value)) {
            continue;
        }

        $upsert->execute([$key, $value]);
    }
}

function reset_settings(PDO $pdo): void
{
    $pdo->exec('DELETE FROM settings');
}
