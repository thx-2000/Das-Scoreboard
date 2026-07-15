<?php
$page_title = 'pages.rageSetup.title';
$active_nav = null;
$page_h1 = '<h1 data-i18n="modes.rage.title">RAGE</h1>';
$page_subtitle = '<p class="app-header__subtitle" data-i18n="rage.setup.subtitle">Neues Spiel einrichten — 10 Runden, Stichansage</p>';
require __DIR__ . '/../../includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="common.setup.heading">Spiel einrichten</h2>
      <p class="hint-text setup-callout" data-i18n="rage.setup.hint">Feste 10 Runden (10 bis 1 Karte), am Ende gewinnt die höchste Punktzahl.</p>

      <form id="setup-form" class="form">
        <label for="game-label" data-i18n="common.setup.labelOptional">Bezeichnung (optional)</label>
        <input type="text" id="game-label" placeholder="z.B. RAGE-Abend" data-i18n-placeholder="rage.setup.labelPlaceholder" maxlength="60" autocomplete="off">

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
            <input type="checkbox" id="rage-show-bonus-malus" checked>
            <span data-i18n="rage.setup.showBonusMalusLabel">Bonus/Malus anzeigen</span>
          </label>
          <p class="hint-text" data-i18n="rage.setup.showBonusMalusHint">+5/−5-Felder für Sonderkarten in der Rundenerfassung ein-/ausblenden.</p>
        </details>

        <button type="submit" class="btn btn--primary" data-i18n="common.buttons.start">Spiel starten</button>
      </form>

      <p id="setup-error" class="error-text" role="alert" hidden></p>
    </section>
  </main>

<?php
$page_scripts = ['js/group-picker.js', 'modes/rage/setup.js'];
require __DIR__ . '/../../includes/footer.php';
