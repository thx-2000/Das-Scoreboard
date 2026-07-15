<?php

/**
 * Zentrale Navigations-Konfiguration + Renderer. Frueher war die Nav in
 * jeder der ~17 Seiten dupliziert (Anpassungen mussten ueberall einzeln
 * nachgezogen werden) - jetzt gibt es genau eine Stelle, die auf jeder
 * Seite dieselben Eintraege zeigt (kein reduziertes Menue je Seitentyp
 * mehr, das war eine Quelle fuer scheinbar "fehlende" Eintraege). Die
 * aktuelle Seite wird nicht hervorgehoben, sondern komplett aus der Nav
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

function render_nav(?string $activeNav): string
{
    $html = '';
    foreach (nav_items() as $item) {
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
