<?php
$page_title = 'pages.stats.title';
$active_nav = 'stats';
$header_class = 'no-print';
$page_h1 = '<h1 data-i18n="stats.heading">Statistiken</h1>';
require __DIR__ . '/includes/header.php';
?>

  <main id="main">
    <p class="print-only stats-print-heading" id="stats-print-heading"></p>

    <section class="card no-print">
      <h2 data-i18n="stats.filter.heading">Zeitraum</h2>
      <p class="hint-text" data-i18n="stats.filter.hint">Leer lassen für die Statistik über alle Spiele. Für einen Spieleabend, der über Mitternacht geht, z.B. 18:00 bis 03:00 des Folgetags eintragen.</p>
      <form id="filter-form" class="form">
        <label for="filter-from" data-i18n="stats.filter.fromLabel">Von</label>
        <input type="datetime-local" id="filter-from">

        <label for="filter-to" data-i18n="stats.filter.toLabel">Bis</label>
        <input type="datetime-local" id="filter-to">

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="submit" class="btn btn--primary" data-i18n="stats.filter.apply">Anwenden</button>
          <button type="button" id="reset-filter-btn" class="btn btn--ghost" data-i18n="stats.filter.reset">Zurücksetzen</button>
          <button type="button" id="print-btn" class="btn btn--ghost" data-i18n="stats.print">Drucken / PDF</button>
        </div>
      </form>
    </section>

    <section class="card section-spacing">
      <div class="kpi-row">
        <div class="kpi-tile">
          <span class="kpi-tile__value" id="kpi-total-games">–</span>
          <span class="kpi-tile__label" data-i18n="stats.kpi.games">Spiele</span>
        </div>
        <div class="kpi-tile">
          <span class="kpi-tile__value" id="kpi-finished-games">–</span>
          <span class="kpi-tile__label" data-i18n="stats.kpi.finished">Beendet</span>
        </div>
        <div class="kpi-tile">
          <span class="kpi-tile__value" id="kpi-win-rate">–</span>
          <span class="kpi-tile__label" data-i18n="stats.kpi.winRate">Anteil beendet</span>
        </div>
        <div class="kpi-tile">
          <span class="kpi-tile__value" id="kpi-avg-score">–</span>
          <span class="kpi-tile__label" data-i18n="stats.kpi.avgScore">Ø Punkte</span>
        </div>
      </div>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="stats.overall.heading">Gesamt</h2>
      <div class="table-scroll">
        <table class="stats-table" id="overall-table">
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="hint-text" id="overall-empty" data-i18n="stats.overall.empty" hidden>Keine Spiele in diesem Zeitraum.</p>
    </section>

    <section class="card section-spacing" id="by-mode-section">
      <h2 data-i18n="stats.byMode.heading">Nach Modus</h2>
      <div id="by-mode-tables"></div>
    </section>

    <section class="card section-spacing" id="mode-distribution-section">
      <h2 data-i18n="stats.modeDistribution.heading">Modus-Verteilung</h2>
      <div class="donut-row">
        <div class="donut-chart" id="mode-donut"></div>
        <ul class="donut-legend" id="mode-donut-legend"></ul>
      </div>
      <p class="hint-text" id="mode-distribution-empty" data-i18n="stats.modeDistribution.empty" hidden>Keine Spiele in diesem Zeitraum.</p>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="stats.headToHead.heading">Kopf an Kopf</h2>
      <div class="table-scroll">
        <table class="stats-table h2h-matrix" id="h2h-matrix-table">
          <thead></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="hint-text" id="h2h-empty" data-i18n="stats.headToHead.empty" hidden>Noch keine zwei Spieler mit gemeinsamen beendeten Spielen in diesem Zeitraum.</p>
      <details class="advanced-options section-spacing" id="h2h-list-details" hidden>
        <summary data-i18n="stats.headToHead.listSummary">Als Liste anzeigen</summary>
        <ul class="h2h-list" id="h2h-list"></ul>
      </details>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="stats.games.heading">Spiele in diesem Zeitraum</h2>
      <ul class="history-list" id="games-list"></ul>
      <p class="hint-text" id="games-empty" data-i18n="stats.games.empty" hidden>Keine Spiele in diesem Zeitraum.</p>
    </section>
  </main>

<?php
$footer_class = 'no-print';
$page_scripts = ['js/stats.js'];
require __DIR__ . '/includes/footer.php';
