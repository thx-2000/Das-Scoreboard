<?php
$page_title = 'pages.scoreSheetSetup.title';
$active_nav = null;
$page_h1 = '<h1 data-i18n="modes.scoreSheet.title">Wertungsbogen</h1>';
$page_subtitle = '<p class="app-header__subtitle" data-i18n="scoreSheet.setup.subtitle">Neues Spiel einrichten (z.B. Mischwald, Cascadia)</p>';
require __DIR__ . '/../../includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="common.setup.heading">Spiel einrichten</h2>

      <form id="setup-form" class="form">
        <label for="game-label" data-i18n="common.setup.labelOptional">Bezeichnung (optional)</label>
        <input type="text" id="game-label" placeholder="z.B. Mischwald" data-i18n-placeholder="scoreSheet.setup.labelPlaceholder" maxlength="60" autocomplete="off">

        <label data-i18n="scoreSheet.setup.templateLabel">Vorlage</label>
        <div class="player-picker" id="template-picker"></div>

        <div id="cascadia-options" hidden>
          <label data-i18n="scoreSheet.setup.cascadiaCards">Wertungskarten (Variante je Tier)</label>
          <div class="cascadia-variants" id="cascadia-variants"></div>
        </div>

        <label for="categories" data-i18n="scoreSheet.setup.categoriesLabel">Wertungen (eine pro Zeile)</label>
        <textarea id="categories" rows="8" maxlength="2000" spellcheck="false"></textarea>
        <p class="hint-text" data-i18n="scoreSheet.setup.categoriesHint">Jede Zeile wird eine Zeile im Wertungsbogen. Die Vorlagen lassen sich frei ändern.</p>

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

        <label data-i18n="common.setup.whoPlays">Wer spielt mit?</label>
        <div class="group-picker" id="group-picker"></div>
        <div class="player-picker" id="player-picker"></div>

        <label for="new-player-inline" data-i18n="common.setup.addPlayerLabel">Neuen Spieler hinzufügen</label>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="new-player-inline" placeholder="Name eingeben" data-i18n-placeholder="common.setup.addPlayerPlaceholder" maxlength="40" autocomplete="off" style="flex:1; padding:0.6rem 0.75rem; border-radius:8px; border:1px solid var(--color-border); background:var(--color-bg); color:var(--color-text);">
          <button type="button" id="add-player-inline-btn" class="btn btn--ghost" data-i18n="common.buttons.add">Hinzufügen</button>
        </div>

        <button type="submit" class="btn btn--primary" data-i18n="common.buttons.start">Spiel starten</button>
      </form>

      <p id="setup-error" class="error-text" role="alert" hidden></p>
    </section>
  </main>

<?php
$page_scripts = ['js/group-picker.js', 'modes/score-sheet/setup.js'];
require __DIR__ . '/../../includes/footer.php';
