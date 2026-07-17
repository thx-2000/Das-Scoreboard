<?php
$page_title = 'pages.home.title';
$active_nav = 'home';
$page_h1 = '<h1 data-i18n="home.heading">Aufschreibhilfe für Spieleabende</h1>';
require __DIR__ . '/includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="home.generalBoards.heading">Allgemeine Scoreboards</h2>
      <p class="hint-text" data-i18n="home.generalBoards.hint">Frei einstellbar — Zielwert, Sieg-Richtung und Punkteschritte legst du beim Einrichten fest.</p>
      <a href="#mode-grid" class="home-start-btn" data-i18n="home.newGame.startButton">Neues Spiel starten</a>

      <div class="mode-grid" id="mode-grid">
        <a href="/modes/points-to-target/setup.php" class="mode-card">
          <span class="mode-card__icon" aria-hidden="true">🎯</span>
          <svg class="mode-card__icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18"/></svg>
          <h2 data-i18n="modes.pointsToTarget.title">Punkte bis Höchstwert</h2>
          <p data-i18n="modes.pointsToTarget.description">Punkte werden rundenweise addiert, bis jemand einen festgelegten Zielwert erreicht oder überschreitet. Wer dann am meisten Punkte hat, gewinnt.</p>
          <p class="mode-card__examples" data-i18n="modes.pointsToTarget.examples">z.B. Flip7, Tutto</p>
        </a>
        <a href="/modes/points-open/setup.php" class="mode-card">
          <span class="mode-card__icon" aria-hidden="true">♾️</span>
          <svg class="mode-card__icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
          <h2 data-i18n="modes.pointsOpen.title">Offene Punkterunde</h2>
          <p data-i18n="modes.pointsOpen.description">Punkte werden rundenweise addiert, ohne festen Zielwert. Ihr entscheidet selbst, wann Schluss ist — höchste oder niedrigste Punktzahl gewinnt, wie ihr es beim Einrichten festlegt.</p>
          <p class="mode-card__examples" data-i18n="modes.pointsOpen.examples">z.B. Doppelkopf</p>
        </a>
        <a href="/modes/fixed-rounds/setup.php" class="mode-card">
          <span class="mode-card__icon" aria-hidden="true">🔟</span>
          <svg class="mode-card__icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/></svg>
          <h2 data-i18n="modes.fixedRounds.title">Punkterunde mit fester Rundenzahl</h2>
          <p data-i18n="modes.fixedRounds.description">Ihr legt beim Einrichten fest, wie viele Runden gespielt werden und ob am Ende die höchste oder niedrigste Punktzahl gewinnt. Nach der letzten Runde fragt das Spiel, ob beendet oder um weitere Runden verlängert werden soll.</p>
        </a>
      </div>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="home.myGames.heading">Meine Spiele</h2>
      <p class="hint-text" data-i18n="home.myGames.hint">RAGE sowie deine eigenen, fertig konfigurierten Spiele (anlegen unter Einstellungen → Meine Spiele).</p>

      <div class="mode-grid" id="favorite-preset-grid" hidden></div>

      <div class="mode-grid" id="my-games-grid">
        <a href="/modes/rage/setup.php" class="mode-card mode-card--rage">
          <span class="mode-card__icon" aria-hidden="true">🔥</span>
          <svg class="mode-card__icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l6-16 4 10 4-6 2 12"/></svg>
          <h2 data-i18n="modes.rage.title">RAGE</h2>
          <p data-i18n="modes.rage.description">Feste 10 Runden mit sinkender Kartenzahl (10 bis 1). Vor jeder Runde sagt ihr eure Stichzahl an, danach tragt ihr die tatsächlichen Stiche ein — Punkte werden automatisch nach den RAGE-Regeln berechnet (inkl. Rage-Bonus/-Rache).</p>
          <p class="mode-card__examples" data-i18n="modes.rage.examples">Kartenspiel RAGE</p>
        </a>
      </div>
    </section>

    <section class="card section-spacing" id="open-games-section" hidden>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
        <h2 style="margin:0;" data-i18n="home.openGames.heading">Offene Spiele</h2>
        <a href="/history.php" data-i18n="home.openGames.viewAll">Alle anzeigen</a>
      </div>
      <ul class="history-list" id="open-games-list"></ul>
    </section>

    <a href="/tools/finger-chooser.php" class="home-quick-action section-spacing">
      <span class="home-quick-action__icon" aria-hidden="true">👆</span>
      <span class="home-quick-action__text">
        <span class="home-quick-action__title" data-i18n="common.nav.chooser">Wer fängt an?</span>
        <span class="home-quick-action__hint" data-i18n="chooser.subtitle">Alle Finger gleichzeitig auf den Bildschirm legen — funktioniert per Multitouch (iPad/iPhone).</span>
      </span>
    </a>

    <section class="card section-spacing" id="pwa-hint-section" hidden>
      <h2 data-i18n="home.pwaHint.heading">Als App nutzen</h2>
      <p class="hint-text" data-i18n="home.pwaHint.text">Auf dem iPad/iPhone: Teilen-Symbol in Safari antippen, dann „Zum Home-Bildschirm“ wählen — die Seite erscheint danach wie eine eigene App, ganz ohne Adressleiste.</p>
    </section>
  </main>

  <a href="https://buymeacoffee.com/thomashageleit" class="support-link" target="_blank" rel="noopener" data-i18n-aria-label="home.support.ariaLabel" aria-label="Unterstütze das Projekt auf Buy Me a Coffee">
    <svg class="support-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/>
      <path d="M16 9h2a3 3 0 0 1 0 6h-2"/>
      <path d="M6 2v2M10 2v2M14 2v2"/>
    </svg>
    <span class="support-link__text" data-i18n="home.support.label">Unterstütze das Projekt</span>
  </a>

<?php
$page_scripts = ['js/pwa-hint.js', 'js/home.js'];
require __DIR__ . '/includes/footer.php';
