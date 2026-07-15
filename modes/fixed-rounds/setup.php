<?php
$page_title = 'pages.fixedRoundsSetup.title';
$active_nav = null;
$page_h1 = '<h1 data-i18n="modes.fixedRounds.title">Punkterunde mit fester Rundenzahl</h1>';
$page_subtitle = '<p class="app-header__subtitle" data-i18n="fixedRounds.setup.subtitle">Neues Spiel einrichten</p>';
require __DIR__ . '/../../includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="common.setup.heading">Spiel einrichten</h2>

      <form id="setup-form" class="form">
        <label for="game-label" data-i18n="common.setup.labelOptional">Bezeichnung (optional)</label>
        <input type="text" id="game-label" maxlength="60" autocomplete="off">

        <label for="total-rounds" data-i18n="fixedRounds.setup.roundsLabel">Wie viele Runden sollen gespielt werden?</label>
        <div class="stepper" data-stepper data-step="1" data-min="1">
          <button type="button" class="stepper__btn stepper__btn--minus" data-i18n-aria-label="common.stepper.decrease" aria-label="Verringern">−</button>
          <input type="text" id="total-rounds" value="10" inputmode="numeric" pattern="[0-9]*" required>
          <button type="button" class="stepper__btn stepper__btn--plus" data-i18n-aria-label="common.stepper.increase" aria-label="Erhöhen">+</button>
        </div>

        <label data-i18n="common.winDirection.heading">Wer gewinnt am Ende?</label>
        <div class="player-picker">
          <label class="player-chip winner-card">
            <input type="radio" name="win-direction" value="highest" checked>
            <span data-i18n="common.winDirection.highest">Höchste Punktzahl</span>
          </label>
          <label class="player-chip winner-card">
            <input type="radio" name="win-direction" value="lowest">
            <span data-i18n="common.winDirection.lowest">Niedrigste Punktzahl</span>
          </label>
        </div>

        <label class="player-chip">
          <input type="checkbox" id="announce-round-end">
          <span data-i18n="fixedRounds.setup.announceLabel">Nach jeder Runde ansagen, dass sie beendet ist</span>
        </label>
        <p class="hint-text" data-i18n="fixedRounds.setup.announceHint">Zeigt nach jeder gespeicherten Runde einen kurzen, schließbaren Hinweis.</p>

        <label data-i18n="common.setup.whoPlays">Wer spielt mit?</label>
        <div class="group-picker" id="group-picker"></div>
        <div class="player-picker" id="player-picker"></div>

        <label for="new-player-inline" data-i18n="common.setup.addPlayerLabel">Neuen Spieler hinzufügen</label>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="new-player-inline" placeholder="Name eingeben" data-i18n-placeholder="common.setup.addPlayerPlaceholder" maxlength="40" autocomplete="off" style="flex:1; padding:0.6rem 0.75rem; border-radius:8px; border:1px solid var(--color-border); background:var(--color-bg); color:var(--color-text);">
          <button type="button" id="add-player-inline-btn" class="btn btn--ghost" data-i18n="common.buttons.add">Hinzufügen</button>
        </div>

        <details class="advanced-options">
          <summary data-i18n="common.setup.advancedOptions">Erweiterte Optionen</summary>

          <label class="player-chip">
            <input type="checkbox" id="allow-negative" checked>
            <span data-i18n="common.setup.allowNegativeLabel">Negativpunkte erlauben</span>
          </label>
          <p class="hint-text" data-i18n="common.setup.allowNegativeHint">Wenn deaktiviert, werden negative Rundeneingaben auf 0 begrenzt.</p>

          <div class="team-setup" id="team-setup">
            <label class="player-chip">
              <input type="checkbox" data-team-enable>
              <span data-i18n="common.setup.teamModeLabel">Team-Modus aktivieren</span>
            </label>
            <p class="hint-text" data-i18n="common.setup.teamModeHint">Spieler lassen sich zu Teams gruppieren, deren Punkte gemeinsam zählen.</p>
            <div class="team-setup__scoring" data-team-scoring hidden>
              <label data-i18n="common.setup.teamScoringHeading">Punkte-Erfassung für Teams</label>
              <label class="player-chip">
                <input type="radio" name="team-scoring" value="shared" checked>
                <span data-i18n="common.setup.teamScoringShared">Gemeinsamer Punktwert</span>
              </label>
              <p class="hint-text" data-i18n="common.setup.teamScoringSharedHint">Team-Mitglieder tragen zusammen einen Punktwert pro Runde ein.</p>
              <label class="player-chip">
                <input type="radio" name="team-scoring" value="individual">
                <span data-i18n="common.setup.teamScoringIndividual">Einzelne Punkte, gemeinsame Summe</span>
              </label>
              <p class="hint-text" data-i18n="common.setup.teamScoringIndividualHint">Jeder Spieler trägt eigene Punkte ein — angezeigt werden sowohl die Einzelpunkte als auch die Team-Summe.</p>
            </div>
            <div class="team-setup__assignments" data-team-assignments hidden></div>
            <div class="team-setup__names" data-team-names hidden></div>
          </div>
        </details>

        <button type="submit" class="btn btn--primary" data-i18n="common.buttons.start">Spiel starten</button>
      </form>

      <p id="setup-error" class="error-text" role="alert" hidden></p>
    </section>
  </main>

<?php
$page_scripts = ['js/team-setup.js', 'js/stepper.js', 'js/group-picker.js', 'modes/fixed-rounds/setup.js'];
require __DIR__ . '/../../includes/footer.php';
