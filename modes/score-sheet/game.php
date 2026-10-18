<?php
$page_title = 'pages.scoreSheetGame.title';
$active_nav = null;
$page_h1 = '<h1 id="game-title">Wertungsbogen</h1>';
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
              </tr>
            </thead>
            <tbody id="standings-body"></tbody>
          </table>
          <div class="standings-cards" id="standings-cards"></div>
          <p class="hint-text starting-player-legend" id="starting-player-legend" data-i18n="common.game.startingPlayerLegend" hidden>★ Startspieler</p>
        </div>
      </section>
    </div>
  </div>

  <main id="main" style="padding-top: 0;">
    <div id="winner-banner-wrap"></div>

    <section class="card section-spacing" id="sheet-card">
      <h2 data-i18n="scoreSheet.game.heading">Wertungsbogen</h2>
      <p class="hint-text" data-i18n="scoreSheet.game.hint">Auf ein Feld tippen, um die Punkte einzugeben. Mehrere Werte lassen sich mit + addieren, z.B. 6 + 6 + 3.</p>
      <div class="rounds-table-wrap">
        <table class="rounds-table sheet-table" id="sheet-table">
          <thead><tr id="sheet-head"></tr></thead>
          <tbody id="sheet-body"></tbody>
          <tfoot><tr id="sheet-foot"></tr></tfoot>
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
        <div class="game-edit__add-player" id="game-edit-seat-row" hidden>
          <label for="game-edit-seat-after" data-i18n="common.game.edit.seatAfterLabel">Sitzt links von</label>
          <select id="game-edit-seat-after"></select>
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
    'js/game-edit.js',
    'js/score-keypad.js',
    'modes/score-sheet/game.js',
];
require __DIR__ . '/../../includes/footer.php';
