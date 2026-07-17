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

        // Einfacher, geteilter Passwortschutz fuer die ganze App (siehe
        // includes/auth.php) - kein User-System, ein Passwort fuer alle.
        // access_password_hash wird ausschliesslich serverseitig ueber
        // password_hash() gesetzt (api/settings.php), nie direkt per PATCH
        // beschreibbar, und nie an den Client ausgeliefert (siehe
        // public_settings() weiter unten).
        'access_enabled' => '0',
        'access_password_hash' => '',

        // 'classic' | 'bold' ("Bold Scorekeeper" - dunkles, hochkontrastiges
        // zweites Aussehen) | 'flip' ("Flip Board" - Anzeigetafel-Optik,
        // Standard seit dessen Einfuehrung). Bold nutzt eigene, feste
        // Farb-Tokens (siehe css/style.css [data-theme-style="bold"]) statt
        // der unten stehenden individuell einstellbaren Farben - die gelten
        // nur fuer Classic. Flip Board hat eigene Hex-Felder (flip_color_*),
        // parallel zu Classic, aber mit kleinerem Feldsatz.
        'theme_style' => 'flip',

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

        // Vereinfachte Akzentfarben-Auswahl fuer Flip Board (5 Presets, siehe
        // flip_accent_palette()) - aendert nur die beiden flip_color_accent_*
        // Felder unten, Hintergrund/Flaeche/Text bleiben davon unberuehrt.
        'flip_accent' => 'amber',

        // Flip Board eigene Basisfarben (Hell/Dunkel getrennt wie bei
        // Classic, aber kleinerer Feldsatz: kein eigenes Rand/Fokus/Fehler-Set,
        // die Anzeigetafel-Optik leitet Rahmen/Trennlinien direkt aus der
        // Textfarbe ab, siehe css/style.css [data-theme-style="flip"]).
        'flip_color_bg_light' => '#edeef0',
        'flip_color_bg_dark' => '#14171a',
        'flip_color_surface_light' => '#ffffff',
        'flip_color_surface_dark' => '#1e2226',
        'flip_color_ink_light' => '#16181b',
        'flip_color_ink_dark' => '#f2efe6',
        'flip_color_accent_light' => '#c9761a',
        'flip_color_accent_dark' => '#f2a93b',

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

/**
 * Entfernt den Passwort-Hash aus einem Settings-Array, bevor es als JSON an
 * den Client geht - der Hash hat serverseitig (includes/auth.php) zu bleiben,
 * das Frontend braucht ihn nie.
 */
function public_settings(array $settings): array
{
    // Abgeleitetes Flag statt Hash - Frontend zeigt damit an, ob ueberhaupt
    // schon ein Passwort hinterlegt ist, ohne den Hash selbst zu kennen.
    $settings['access_password_set'] = $settings['access_password_hash'] !== '' ? '1' : '0';
    unset($settings['access_password_hash']);
    return $settings;
}

/**
 * Setzt den Passwort-Hash direkt, unter Umgehung von save_settings() - dort
 * wird der Schluessel bewusst per continue; abgewiesen, um Schreibzugriffe
 * ueber den generischen PATCH-Weg zu verhindern. Einziger legitimer Aufrufer
 * ist api/settings.php (new_password-Feld, dort per password_hash() erzeugt).
 */
function set_access_password_hash(PDO $pdo, string $hash): void
{
    $upsert = $pdo->prepare('
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    ');
    $upsert->execute(['access_password_hash', $hash]);
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
 * Prueft/normalisiert eine kommagetrennte Schrittweiten-Liste gegen
 * round_entry_step_values() - genutzt beim Anlegen eines Spiels
 * (api/games.php) und beim Speichern eines Presets (api/game-presets.php).
 * Seit Migration 13 pro Spiel/Preset statt global (siehe includes/db.php).
 */
function sanitize_round_entry_steps(string $value): string
{
    $allowed = round_entry_step_values();
    $selected = array_filter(array_map('intval', explode(',', $value)), fn ($n) => in_array($n, $allowed, true));
    $selected = array_values(array_unique($selected));
    sort($selected);
    return $selected === [] ? '1,5,10' : implode(',', $selected);
}

/**
 * Auswahl an einfarbigen Linien-Icons fuer eigene Spiele-Presets
 * (Einstellungen -> Meine Spiele) - bewusst keine bunten Emoji (wirkten zu
 * generisch/KI-generiert), stattdessen dieselbe schlichte SVG-Linien-Optik
 * wie die eingebauten Modus-Icons. Gespiegelt in js/preset-icons.js (dort
 * fuer Startseite/Einstellungen-Liste, hier fuers Formular) - beide Seiten
 * muessen bei Aenderungen synchron bleiben.
 */
function preset_icon_options(): array
{
    return [
        'dice', 'star', 'target', 'grid', 'flame', 'controller', 'bolt', 'clover',
        'gem', 'crown', 'anchor', 'sun', 'flag', 'medal', 'hourglass', 'key',
        'camera', 'music', 'compass', 'book', 'rocket',
        'dice-1', 'dice-2', 'dice-3', 'dice-4', 'dice-5', 'dice-6', 'dice-pair',
        'card-diamond', 'card-heart', 'card-spade', 'card-club',
        'cards-stack', 'cards-fan', 'card-back', 'card-joker',
    ];
}

function preset_icon_svg_paths(): array
{
    return [
        'dice' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
        'star' => '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.4-5.6 3.4 1.4-6.3-4.8-4.3 6.4-.6z" stroke-linejoin="round"/>',
        'target' => '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
        'grid' => '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10.5h16M4 15.5h16M10.5 4v16M15.5 4v16"/>',
        'flame' => '<path d="M4 20l6-16 4 10 4-6 2 12" stroke-linecap="round" stroke-linejoin="round"/>',
        'controller' => '<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 11v4M6 13h4" stroke-linecap="round"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
        'bolt' => '<path d="M13 3 4 14h6l-1 7 9-11h-6z" stroke-linejoin="round"/>',
        'clover' => '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M12 12v8" stroke-linecap="round"/>',
        'gem' => '<path d="M12 2l7 7-7 13-7-13z" stroke-linejoin="round"/><path d="M5 9h14"/>',
        'crown' => '<path d="M4 18h16M4 18l1-8 4 4 3-6 3 6 4-4 1 8" stroke-linejoin="round" stroke-linecap="round"/>',
        'anchor' => '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M6 15l6 5 6-5M5 12h4M15 12h4" stroke-linecap="round" stroke-linejoin="round"/>',
        'sun' => '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4 12H2M22 12h-2M6 6 4.5 4.5M18 6l1.5-1.5M6 18l-1.5 1.5M18 18l1.5 1.5" stroke-linecap="round"/>',
        'flag' => '<path d="M6 3v18" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" stroke-linejoin="round"/>',
        'medal' => '<circle cx="12" cy="9" r="5"/><path d="M9 13l-3 8 6-3 6 3-3-8" stroke-linejoin="round"/>',
        'hourglass' => '<path d="M6 3h12l-6 9z" stroke-linejoin="round"/><path d="M6 21h12l-6-9z" stroke-linejoin="round"/>',
        'key' => '<circle cx="7" cy="12" r="4"/><path d="M11 12h10M16 12v3M19 12v3" stroke-linecap="round"/>',
        'camera' => '<rect x="3" y="7" width="18" height="13" rx="2"/><rect x="9" y="4" width="6" height="4" rx="1"/><circle cx="12" cy="14" r="3.5"/>',
        'music' => '<circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="16" r="2.5"/><path d="M9.5 18V5l9-2v13" stroke-linecap="round" stroke-linejoin="round"/>',
        'compass' => '<circle cx="12" cy="12" r="9"/><path d="M15 9l-1.5 4.5L9 15l1.5-4.5z" stroke-linejoin="round"/>',
        'book' => '<path d="M2 5l10 2 10-2v14l-10-2-10 2z" stroke-linejoin="round"/><path d="M12 7v14"/>',
        'rocket' => '<path d="M12 2l3 9-3 4-3-4z" stroke-linejoin="round"/><path d="M9 15l-2 5 3-1M15 15l2 5-3-1" stroke-linejoin="round" stroke-linecap="round"/><circle cx="12" cy="8" r="1.3" fill="currentColor" stroke="none"/>',

        // Wuerfel-Augenzahlen 1-6 (klassisches Pip-Layout) + Wuerfelpaar,
        // fuer Presets, die spezifisch ein Wuerfelspiel abbilden wollen.
        'dice-1' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
        'dice-2' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
        'dice-3' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
        'dice-4' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
        'dice-5' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
        'dice-6' => '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="16.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
        'dice-pair' => '<rect x="2" y="7" width="9" height="9" rx="2"/><circle cx="4.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><rect x="13" y="8" width="9" height="9" rx="2"/><circle cx="15.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="19.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="19.5" cy="14.5" r="0.8" fill="currentColor" stroke="none"/>',

        // Spielkarten: einzelne Farbsymbole, gestapelt/gefaechert, Rueckseite
        // und Joker - fuer Presets, die spezifisch ein Kartenspiel abbilden.
        'card-diamond' => '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8l2.5 4-2.5 4-2.5-4z" fill="currentColor" stroke="none"/>',
        'card-heart' => '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8 12 10.5 15 8 16.5 11 12 17 7.5 11z" fill="currentColor" stroke="none" stroke-linejoin="round"/>',
        'card-spade' => '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 7 16.5 13 15 16 12 13.5 9 16 7.5 13z" fill="currentColor" stroke="none"/><path d="M11.3 15.3h1.4l.3 2.7h-2z" fill="currentColor" stroke="none"/>',
        'card-club' => '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="9" r="1.8" fill="currentColor" stroke="none"/><circle cx="9.7" cy="12.2" r="1.8" fill="currentColor" stroke="none"/><circle cx="14.3" cy="12.2" r="1.8" fill="currentColor" stroke="none"/><path d="M11.3 14h1.4l.4 3h-2.2z" fill="currentColor" stroke="none"/>',
        'cards-stack' => '<rect x="3" y="6" width="13" height="16" rx="2"/><rect x="8" y="2" width="13" height="16" rx="2"/>',
        'cards-fan' => '<rect x="2" y="4" width="9" height="16" rx="1.5"/><rect x="7.5" y="4" width="9" height="16" rx="1.5"/><rect x="13" y="4" width="9" height="16" rx="1.5"/>',
        'card-back' => '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h8"/>',
        'card-joker' => '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8.5l1 2.2 2.4.3-1.8 1.6.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.8-1.6 2.4-.3z" fill="currentColor" stroke="none"/>',
    ];
}

function sanitize_preset_icon(string $value): string
{
    return in_array($value, preset_icon_options(), true) ? $value : 'dice';
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
 * 5 kuratierte Akzentfarben-Presets fuer Flip Board (Hell-/Dunkel-Variante,
 * gleiches Prinzip wie accent_color_palette() fuer Bold) - Auswahl ueberschreibt
 * ausschliesslich flip_color_accent_light/_dark, nicht Hintergrund/Flaeche/Text.
 */
function flip_accent_palette(): array
{
    return [
        'amber' => ['#c9761a', '#f2a93b'],
        'petrol' => ['#1f7a6c', '#4fd6bd'],
        'karmesin' => ['#b23a3a', '#ef6a6a'],
        'knallorange' => ['#ea580c', '#fb923c'],
        'violett' => ['#6a4fb2', '#b39ddb'],
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
        } elseif ($key === 'access_enabled') {
            if (!in_array($value, ['0', '1'], true)) {
                continue;
            }
        } elseif ($key === 'access_password_hash') {
            // Darf niemals direkt per PATCH gesetzt werden - nur
            // api/settings.php via password_hash() ueber den eigenen
            // (nicht-generischen) new_password-Weg, siehe dort.
            continue;
        } elseif ($key === 'theme_style') {
            if (!in_array($value, ['classic', 'bold', 'flip'], true)) {
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
        } elseif ($key === 'flip_accent') {
            if (!array_key_exists($value, flip_accent_palette())) {
                continue;
            }
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

/**
 * Setzt ausschliesslich Aussehen/Farben zurueck (Button-Beschriftung "Auf
 * Standardfarben zuruecksetzen", Bestaetigungstext nennt explizit "Farben").
 * Zuvor loeschte diese Funktion die komplette settings-Tabelle inkl.
 * access_enabled/access_password_hash sowie Titel/Sprache/Logo - auf einer
 * oeffentlich zugaenglichen, passwortgeschuetzten Seite haette das den
 * Zugangsschutz unbemerkt deaktiviert. Titel/Sprache/Logo/Zugangsschutz
 * bleiben deshalb jetzt bewusst unberuehrt.
 */
function reset_settings(PDO $pdo): void
{
    $resettableKeys = [
        'theme_style', 'bold_accent', 'bold_background', 'bold_card_style',
        'flip_accent',
        'flip_color_bg_light', 'flip_color_bg_dark',
        'flip_color_surface_light', 'flip_color_surface_dark',
        'flip_color_ink_light', 'flip_color_ink_dark',
        'flip_color_accent_light', 'flip_color_accent_dark',
        'color_bg_light', 'color_bg_dark',
        'color_surface_light', 'color_surface_dark',
        'color_text_light', 'color_text_dark',
        'color_text_muted_light', 'color_text_muted_dark',
        'color_border_light', 'color_border_dark',
        'color_green', 'color_green_strong',
        'color_amber', 'color_amber_strong',
        'color_on_accent', 'color_focus', 'color_danger',
    ];
    $placeholders = implode(',', array_fill(0, count($resettableKeys), '?'));
    $pdo->prepare("DELETE FROM settings WHERE key IN ($placeholders)")->execute($resettableKeys);
}
