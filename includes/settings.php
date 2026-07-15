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
        'sound_enabled' => '1',

        // 'classic' (Standard, heutiger Look) | 'bold' ("Bold Scorekeeper" -
        // dunkles, hochkontrastiges zweites Aussehen). Bold nutzt eigene,
        // feste Farb-Tokens (siehe css/style.css [data-theme-style="bold"])
        // statt der unten stehenden individuell einstellbaren Farben - die
        // gelten weiterhin ausschliesslich fuer Classic.
        'theme_style' => 'classic',

        // Vereinfachte Akzentfarben-Auswahl (5 Presets, siehe
        // accent_color_palette()) - ist der sichtbare Hauptteil der
        // Aussehen-Einstellung in BEIDEN Themes. Unter Bold wird direkt
        // dieser Preset-Name gespeichert (Bold hat keine freien Hex-Felder).
        // Unter Classic dient er nur als Schnellwahl, die beim Auswaehlen
        // color_green/color_green_strong ueberschreibt - die eigentliche
        // Quelle bleibt fuer Classic weiterhin die Hex-Farbe selbst, damit
        // Fein-Anpassungen im aufklappbaren Erweitert-Bereich moeglich
        // bleiben (siehe css/style.css Bold-Root fuer die Hex-Werte je Preset).
        'bold_accent' => 'green',

        // Nur fuer Bold relevant (Classic hat eigene Hell-/Dunkel-Basisfarben
        // unten). 'dark' (Standard) | 'dark_blue' | 'black'.
        'bold_background' => 'dark',

        // Nur fuer Bold relevant. 'classic' (Standard, heutige Kartenoptik) |
        // 'modern' (groesserer Radius, weicherer Schatten, dezenterer Rand).
        'bold_card_style' => 'classic',

        // 'none' (Standard) | 'square' | 'banner'. Die _ext-Werte ('' = kein
        // Logo hochgeladen, sonst 'png'/'jpg'/'svg') werden ausschliesslich
        // von api/logo.php gesetzt, nicht ueber das generische Settings-
        // Formular - siehe save_settings().
        'logo_mode' => 'none',
        'logo_square_ext' => '',
        'logo_banner_ext' => '',

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

        // Kommagetrennte Liste erlaubter Schrittweiten (aus ROUND_ENTRY_STEP_VALUES)
        // fuer die Schritt-Buttons bei der Rundenerfassung. Gilt fuer Punkte bis
        // Hoechstwert, Offene Punkterunde und Feste Rundenzahl (nicht RAGE).
        'round_entry_steps' => '1,5,10',

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
 * Erlaubte Schrittweiten fuer die Schritt-Buttons bei der Rundenerfassung -
 * zentrale Liste, damit Settings-UI, Validierung und Frontend synchron bleiben.
 */
function round_entry_step_values(): array
{
    return [1, 5, 10, 50, 100, 500, 1000];
}

/**
 * 5 kuratierte Akzentfarben-Presets (Hauptfarbe + abgedunkelte "-strong"-
 * Variante fuer Text/Kontrast, gleiches Prinzip wie die bestehenden Hex-Paare).
 * Einzige Quelle fuer diese Werte - wird von js/theme.js (Bold) und der
 * Settings-Seite (beide Themes, siehe accent_color_picker in settings.php)
 * genutzt, damit Frontend und Backend nicht zwei Kopien pflegen.
 */
function accent_color_palette(): array
{
    return [
        'green' => ['#b6ff1a', '#8fd400'],
        'orange' => ['#ff8a3d', '#e0451c'],
        'pink' => ['#ff3daa', '#d4008a'],
        'violet' => ['#b088ff', '#8a5cf0'],
        'cyan' => ['#22d3ee', '#0ea5c4'],
    ];
}

/**
 * 3 Hintergrund-Presets fuer Bold (bg, surface, border) - Classic hat
 * weiterhin eigene, unabhaengige Hell-/Dunkel-Basisfarben.
 */
function bold_background_palette(): array
{
    return [
        'dark' => ['#0b0d10', '#16191e', '#262b32'],
        'dark_blue' => ['#0a0e1a', '#141a2b', '#232c42'],
        'black' => ['#000000', '#121212', '#2a2a2a'],
    ];
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
        } elseif ($key === 'logo_mode') {
            if (!in_array($value, ['none', 'square', 'banner'], true)) {
                continue;
            }
        } elseif ($key === 'sound_enabled') {
            if (!in_array($value, ['0', '1'], true)) {
                continue;
            }
        } elseif ($key === 'theme_style') {
            if (!in_array($value, ['classic', 'bold'], true)) {
                continue;
            }
        } elseif ($key === 'bold_accent') {
            if (!array_key_exists($value, accent_color_palette())) {
                continue;
            }
        } elseif ($key === 'bold_background') {
            if (!array_key_exists($value, bold_background_palette())) {
                continue;
            }
        } elseif ($key === 'bold_card_style') {
            if (!in_array($value, ['classic', 'modern'], true)) {
                continue;
            }
        } elseif ($key === 'round_entry_steps') {
            $allowed = round_entry_step_values();
            $selected = array_filter(array_map('intval', explode(',', $value)), fn ($n) => in_array($n, $allowed, true));
            $selected = array_values(array_unique($selected));
            sort($selected);
            $value = $selected === [] ? '1,5,10' : implode(',', $selected);
        } elseif ($key === 'logo_square_ext' || $key === 'logo_banner_ext') {
            // Nur api/logo.php darf diese Werte setzen (direkter Upsert dort),
            // nicht das generische Settings-Formular.
            continue;
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
