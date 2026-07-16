<?php

/**
 * Gemeinsamer Seiten-Header (Head + <header> mit Marke/Logo + Navigation),
 * eingebunden per require in jeder Seite. Erwartet vorher gesetzte
 * Variablen:
 *
 * - $page_title    (string) i18n-Schluessel fuer den <title>-Zusatz
 *                   (z.B. 'pages.home.title')
 * - $active_nav    (string|null) Slug der aktuellen Seite, wird aus der
 *                   Nav ausgeblendet (siehe includes/nav.php) - die Nav
 *                   zeigt sonst auf jeder Seite dieselben Eintraege.
 * - $page_h1        (string) fertiges <h1>...</h1>-Markup
 * - $page_subtitle  (string, optional) fertiges <p>...</p>-Markup direkt
 *                    nach dem <h1>
 * - $header_class   (string, optional) zusaetzliche Klasse fuer <header>
 *                    (z.B. 'no-print' auf der Statistik-Seite)
 * - $viewport_extra  (string, optional) zusaetzlicher Viewport-Zusatz
 *                    (z.B. ", maximum-scale=1.0, user-scalable=no" beim
 *                    Finger-Chooser)
 */

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/nav.php';

$headerClass = 'app-header' . (!empty($header_class) ? ' ' . $header_class : '');
// Cache-Buster ueber die App-Version - ohne das wuerden Browser CSS/JS nach
// einem Release ggf. veraltet aus dem Cache bedienen, obwohl das HTML schon
// neu ist (z.B. neue Funktion in game.js, die von altem gecachtem
// round-entry.js nicht bereitgestellt wird) - siehe auch i18n.js, das
// denselben Mechanismus fuer die Woerterbuecher nutzt.
$appVersion = trim(file_get_contents(__DIR__ . '/../VERSION'));
?><!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0<?= $viewport_extra ?? '' ?>">
  <title data-i18n-title-suffix="<?= htmlspecialchars($page_title, ENT_QUOTES) ?>">Das Scoreboard</title>
  <link rel="stylesheet" href="/css/style.css?v=<?= urlencode($appVersion) ?>">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Das Scoreboard">
  <meta name="theme-color" content="#f1f2f4">
</head>
<body>
  <a href="#main" class="skip-link" data-i18n="common.skipLink">Zum Inhalt springen</a>

  <div id="logo-banner-slot"></div>
  <header class="<?= htmlspecialchars($headerClass, ENT_QUOTES) ?>">
    <div class="app-header__bar">
      <a href="/index.php" class="app-header__brand">
        <svg id="app-header-logo-svg" class="app-header__logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <rect x="5" y="4" width="17" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
          <line x1="9" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="9" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="9" y1="21" x2="14" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M21 8 L27 14 L18.5 22.5 L13.5 23.5 L14.5 18.5 Z" fill="var(--color-green)" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
        <span data-brand-name>Das Scoreboard</span>
      </a>
      <button type="button" class="app-nav-toggle" id="nav-toggle-btn" aria-expanded="false" aria-controls="app-nav" data-i18n-aria-label="common.nav.openMenu" aria-label="Menü öffnen">
        <span class="app-nav-toggle__bar"></span>
        <span class="app-nav-toggle__bar"></span>
        <span class="app-nav-toggle__bar"></span>
      </button>
      <nav class="app-nav" id="app-nav" aria-label="Hauptnavigation">
<?= render_nav($active_nav ?? null) ?>      </nav>
    </div>
    <?= $page_h1 ?? '' ?>

    <?= $page_subtitle ?? '' ?>
    <div class="app-header__accent" aria-hidden="true"></div>
  </header>
