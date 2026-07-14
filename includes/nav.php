<?php

/**
 * Zentrale Navigations-Konfiguration + Renderer. Frueher war die Nav in
 * jeder der ~17 Seiten dupliziert (Anpassungen mussten ueberall einzeln
 * nachgezogen werden) - jetzt gibt es genau eine Stelle. Die aktuelle Seite
 * wird nicht hervorgehoben, sondern (wie schon immer) komplett aus der Nav
 * ausgeblendet.
 */
function nav_items(): array
{
    return [
        ['slug' => 'home', 'href' => '/index.php', 'i18n' => 'common.nav.home', 'label' => 'Startseite'],
        ['slug' => 'players', 'href' => '/players.php', 'i18n' => 'common.nav.players', 'label' => 'Spieler'],
        ['slug' => 'history', 'href' => '/history.php', 'i18n' => 'common.nav.history', 'label' => 'Verlauf'],
        ['slug' => 'stats', 'href' => '/stats.php', 'i18n' => 'common.nav.stats', 'label' => 'Statistiken'],
        ['slug' => 'chooser', 'href' => '/tools/finger-chooser.php', 'i18n' => 'common.nav.chooser', 'label' => 'Wer fängt an?'],
        ['slug' => 'settings', 'href' => '/settings.php', 'i18n' => 'common.nav.settings', 'label' => 'Einstellungen'],
    ];
}

/**
 * Welche Slugs je Seiten-Typ ueberhaupt infrage kommen (unabhaengig von der
 * zusaetzlichen Ausblendung der aktuellen Seite selbst) - Setup-Seiten und
 * Spielansichten brauchten schon vor diesem Refactor bewusst eine kuerzere
 * Nav als die Hauptseiten.
 */
function nav_variant_slugs(string $variant): array
{
    return match ($variant) {
        'setup' => ['home'],
        'game' => ['home', 'history'],
        'chooser' => ['home', 'players', 'history', 'settings'],
        default => ['home', 'players', 'history', 'stats', 'chooser', 'settings'],
    };
}

function render_nav(?string $activeNav, string $variant = 'full'): string
{
    $allowed = nav_variant_slugs($variant);
    $html = '';
    foreach (nav_items() as $item) {
        if (!in_array($item['slug'], $allowed, true)) {
            continue;
        }
        if ($item['slug'] === $activeNav) {
            continue;
        }
        $html .= sprintf(
            "        <a href=\"%s\" class=\"btn btn--ghost\" data-i18n=\"%s\">%s</a>\n",
            htmlspecialchars($item['href'], ENT_QUOTES),
            htmlspecialchars($item['i18n'], ENT_QUOTES),
            htmlspecialchars($item['label'], ENT_QUOTES)
        );
    }
    return $html;
}
