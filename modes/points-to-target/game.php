<?php
$page_title = 'pages.pointsToTargetGame.title';
$active_nav = null;
$page_h1 = '<h1 id="game-title">Punkte bis Höchstwert</h1>';
$page_subtitle = '<p class="app-header__subtitle" id="game-subtitle" data-i18n="common.game.loading">Lädt …</p>';
require __DIR__ . '/../../includes/header.php';
?>

  <div class="scoreboard">
    <div style="max-width:1100px; margin:0 auto; padding:0 1.5rem;">
      <section class="card scoreboard-card">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
          <h2 style="margin:0;" data-i18n="common.game.standingsHeading">Punktestand</h2>
          <div style="display:flex; gap:0.5rem;">
            <button type="button" id="toggle-standings-btn" class="btn btn--small btn--ghost" aria-expanded="true" aria-controls="standings-collapsible" data-i18n="common.game.standings.collapse">Einklappen</button>
            <button type="button" id="toggle-finished-btn" class="btn btn--small btn--ghost"></button>
          </div>
        </div>
        <div id="standings-collapsible">
          <table class="standings-table">
            <thead>
              <tr>
                <th scope="col" data-i18n="common.table.rank">Platz</th>
                <th scope="col" data-i18n="common.table.name">Name</th>
                <th scope="col" data-i18n="common.table.points">Punkte</th>
                <th scope="col" class="progress-cell" data-i18n="common.table.progress">Fortschritt</th>
              </tr>
            </thead>
            <tbody id="standings-body"></tbody>
          </table>
          <div class="standings-cards" id="standings-cards"></div>
          <p class="hint-text starting-player-legend" id="starting-player-legend" data-i18n="common.game.startingPlayerLegend" hidden>★ Startspieler (zufällig)</p>
        </div>
      </section>
    </div>
  </div>

  <main id="main" style="padding-top: 0;">
    <div id="winner-banner-wrap"></div>

    <section class="card section-spacing" id="round-entry-card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap;">
        <h2 style="margin:0;" data-i18n="common.game.roundEntry.heading">Neue Runde eintragen</h2>
        <button type="button" id="round-entry-mode-btn" class="btn btn--small btn--ghost"></button>
      </div>
      <p class="hint-text" data-i18n="pointsToTarget.game.roundEntryHint">Punkte der aktuellen Runde je Spieler eingeben (0 ist normal, z.B. bei Bust).</p>
      <div class="round-form-grid" id="round-form-grid"></div>
      <div class="round-entry-sequence" id="round-entry-sequence"></div>
      <div class="entry-list" id="round-entry-flip"></div>
      <button type="button" id="save-round-btn" class="btn btn--primary" data-i18n="common.game.roundEntry.saveButton">Runde speichern</button>
    </section>

    <section class="card section-spacing">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
        <h2 data-i18n="common.game.roundsTable.heading">Rundenverlauf &amp; Korrektur</h2>
        <button type="button" id="undo-last-round-btn" class="btn btn--small btn--ghost" data-i18n="common.game.roundsTable.undoButton" hidden>Letzte Runde rückgängig</button>
      </div>
      <p class="hint-text" data-i18n="common.game.roundsTable.hint">Werte direkt anpassen, um Eintragungsfehler zu korrigieren.</p>
      <div class="rounds-table-wrap">
        <table class="rounds-table" id="rounds-table">
          <thead><tr id="rounds-table-head"></tr></thead>
          <tbody id="rounds-table-body"></tbody>
        </table>
      </div>
    </section>

    <section class="card section-spacing">
      <details class="advanced-options" id="game-edit-details">
        <summary data-i18n="common.game.edit.summary">Spiel bearbeiten</summary>
        <div class="game-edit__target-score" id="game-edit-target-score" hidden>
          <label for="game-edit-target-input" data-i18n="common.game.edit.targetScoreLabel">Zielwert</label>
          <input type="text" inputmode="numeric" pattern="[0-9]*" id="game-edit-target-input">
          <button type="button" id="game-edit-target-save-btn" class="btn btn--small" data-i18n="common.buttons.save">Speichern</button>
        </div>
        <h3 data-i18n="common.game.edit.playersHeading">Teilnehmer</h3>
        <ul class="game-edit__player-list" id="game-edit-player-list"></ul>
        <div class="game-edit__add-player">
          <label for="game-edit-add-select" data-i18n="common.game.edit.addPlayerLabel">Spieler hinzufügen</label>
          <select id="game-edit-add-select"></select>
          <button type="button" id="game-edit-add-btn" class="btn btn--small" data-i18n="common.buttons.add">Hinzufügen</button>
        </div>
        <div class="game-edit__add-player">
          <label for="game-edit-new-player-name" data-i18n="common.game.edit.newPlayerLabel">Oder neuen Spieler anlegen</label>
          <input type="text" id="game-edit-new-player-name" placeholder="Name eingeben" data-i18n-placeholder="common.setup.addPlayerPlaceholder" maxlength="40" autocomplete="off">
          <button type="button" id="game-edit-new-player-btn" class="btn btn--small" data-i18n="common.buttons.add">Hinzufügen</button>
        </div>
        <div class="game-edit__target-score">
          <label for="game-edit-add-starting-score" data-i18n="common.game.edit.startingScoreLabel">Startpunkte</label>
          <input type="text" inputmode="numeric" pattern="-?[0-9]*" id="game-edit-add-starting-score" data-i18n-placeholder="common.game.edit.startingScorePlaceholder" placeholder="Startpunkte (optional)">
        </div>
        <p class="error-text" id="game-edit-error" hidden></p>
      </details>
    </section>
  </main>

<?php
$page_scripts = [
    'js/feedback.js',
    'js/standings-toggle.js',
    'js/avatar-helpers.js',
    'js/team-helpers.js',
    'js/round-entry.js',
    'js/game-edit.js',
    'modes/points-to-target/game.js',
];
require __DIR__ . '/../../includes/footer.php';
