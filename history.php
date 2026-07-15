<?php
$page_title = 'pages.history.title';
$active_nav = 'history';
$page_h1 = '<h1 data-i18n="history.heading">Spielverlauf</h1>';
require __DIR__ . '/includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="history.all.heading">Alle Spiele</h2>
      <p class="hint-text" data-i18n="history.all.hint">Neueste zuerst. Laufende Spiele können fortgesetzt werden, abgeschlossene zeigen das Ergebnis.</p>
      <div class="filter-tabs" id="history-filter-tabs" role="tablist">
        <button type="button" class="filter-tabs__btn" data-filter="all" aria-selected="true" data-i18n="history.filter.all">Alle</button>
        <button type="button" class="filter-tabs__btn" data-filter="active" aria-selected="false" data-i18n="history.filter.active">Laufend</button>
        <button type="button" class="filter-tabs__btn" data-filter="finished" aria-selected="false" data-i18n="history.filter.finished">Beendet</button>
      </div>
      <ul class="history-list" id="history-list"></ul>
    </section>
  </main>

<?php
$page_scripts = ['js/history.js'];
require __DIR__ . '/includes/footer.php';
