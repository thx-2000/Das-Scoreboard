<?php
$page_title = 'pages.settings.title';
$active_nav = 'settings';
$page_h1 = '<h1 data-i18n="settings.heading">Einstellungen</h1>';
$page_subtitle = '<p class="app-header__subtitle" data-i18n="settings.subtitle">Gilt für alle, die diese Seite nutzen (global gespeichert).</p>';
require __DIR__ . '/includes/header.php';
?>

  <main id="main">
    <section class="card">
      <h2 data-i18n="settings.theme.heading">Aussehen</h2>
      <p class="hint-text" data-i18n="settings.theme.hint">Zwei eigenständige Optiken zur Wahl. "Bold Scorekeeper" wird schrittweise auf allen Seiten ausgebaut — bereits gewählte Farben unten gelten nur für "Classic".</p>
      <div class="player-picker">
        <label class="player-chip">
          <input type="radio" name="theme-style" value="classic" checked>
          <span data-i18n="settings.theme.classic">Classic</span>
        </label>
        <label class="player-chip">
          <input type="radio" name="theme-style" value="bold">
          <span data-i18n="settings.theme.bold">Bold Scorekeeper</span>
        </label>
      </div>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="settings.title.heading">Titel</h2>
      <p class="hint-text" data-i18n="settings.title.hint">Wird im Kopfbereich und im Browser-Tab-Titel angezeigt.</p>
      <form id="title-form" class="form">
        <label for="app-title-input" data-i18n="settings.title.label">Titel</label>
        <input type="text" id="app-title-input" maxlength="60">
      </form>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="settings.feedback.heading">Rückmeldung beim Speichern</h2>
      <p class="hint-text" data-i18n="settings.feedback.hint">Kurzer Ton (und Vibration, falls vom Gerät unterstützt) beim Speichern einer Runde. Auf iPhone/iPad ist Vibration aus technischen Gründen (Safari) nicht möglich, der Ton funktioniert aber.</p>
      <label class="player-chip">
        <input type="checkbox" id="sound-enabled-input">
        <span data-i18n="settings.feedback.label">Ton beim Speichern</span>
      </label>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="settings.roundEntry.heading">Rundenerfassung</h2>
      <p class="hint-text" data-i18n="settings.roundEntry.hint">Schritt-Buttons als Alternative zur Zahleneingabe bei der Rundenerfassung (Punkte bis Höchstwert, Offene Punkterunde, Feste Rundenzahl). Zwischen Tippen und Schritt-Buttons kann direkt im laufenden Spiel umgeschaltet werden.</p>
      <div class="player-picker" id="round-entry-steps-fields"></div>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="settings.logo.heading">Logo</h2>
      <p class="hint-text" data-i18n="settings.logo.hint">Standardmäßig ist kein eigenes Logo aktiv, dann bleibt das Stift-Symbol sichtbar.</p>

      <div class="form" style="margin-bottom:1rem;">
        <label data-i18n="settings.logo.modeLabel">Anzeige</label>
        <div class="player-picker">
          <label class="player-chip">
            <input type="radio" name="logo-mode" value="none" checked>
            <span data-i18n="settings.logo.modeNone">Kein Logo</span>
          </label>
          <label class="player-chip">
            <input type="radio" name="logo-mode" value="square">
            <span data-i18n="settings.logo.modeSquare">Quadrat oben links</span>
          </label>
          <label class="player-chip">
            <input type="radio" name="logo-mode" value="banner">
            <span data-i18n="settings.logo.modeBanner">Banner über der ganzen Breite</span>
          </label>
        </div>
      </div>

      <div class="logo-upload-field">
        <h3 data-i18n="settings.logo.squareHeading">Quadratisches Logo</h3>
        <p class="hint-text" data-i18n="settings.logo.squareHint">Empfohlen: 160×160 Pixel (quadratisch). PNG, JPEG oder SVG, max. 2 MB.</p>
        <div class="logo-upload-field__controls">
          <div class="logo-preview logo-preview--empty" id="logo-square-preview"></div>
          <input type="file" id="logo-square-file" accept="image/png,image/jpeg,image/svg+xml">
          <button type="button" id="logo-square-upload-btn" class="btn btn--ghost" data-i18n="settings.logo.uploadButton">Hochladen</button>
          <button type="button" id="logo-square-remove-btn" class="btn btn--small btn--danger" data-i18n="common.buttons.remove" hidden>Entfernen</button>
        </div>
      </div>

      <div class="logo-upload-field">
        <h3 data-i18n="settings.logo.bannerHeading">Banner-Logo</h3>
        <p class="hint-text" data-i18n="settings.logo.bannerHint">Empfohlen: ca. 1400×160 Pixel (breit, nicht zu hoch). PNG, JPEG oder SVG, max. 2 MB.</p>
        <div class="logo-upload-field__controls">
          <div class="logo-preview logo-preview--empty" id="logo-banner-preview"></div>
          <input type="file" id="logo-banner-file" accept="image/png,image/jpeg,image/svg+xml">
          <button type="button" id="logo-banner-upload-btn" class="btn btn--ghost" data-i18n="settings.logo.uploadButton">Hochladen</button>
          <button type="button" id="logo-banner-remove-btn" class="btn btn--small btn--danger" data-i18n="common.buttons.remove" hidden>Entfernen</button>
        </div>
      </div>

      <p id="logo-status" class="hint-text" style="text-align:center;" role="status" aria-live="polite"></p>
    </section>

    <section class="card section-spacing">
      <h2 data-i18n="settings.language.heading">Sprache</h2>
      <p class="hint-text" data-i18n="settings.language.hint">Weitere Sprachen können später ergänzt werden.</p>
      <form id="language-form" class="form">
        <label for="language-select" data-i18n="settings.language.label">Sprache</label>
        <select id="language-select"></select>
      </form>
    </section>

    <section class="card section-spacing" id="single-colors-section">
      <h2 data-i18n="settings.colors.single.heading">Akzent- und Funktionsfarben</h2>
      <p class="hint-text" data-i18n="settings.colors.single.hint">Gelten unverändert in Hell- und Dunkelmodus.</p>
      <div class="color-field-grid" id="single-color-fields"></div>
    </section>

    <section class="card section-spacing" id="pair-colors-section">
      <h2 data-i18n="settings.colors.pairs.heading">Basis-Farben (Hell- / Dunkelmodus getrennt)</h2>
      <p class="hint-text" data-i18n="settings.colors.pairs.hint">Hintergrund, Fläche, Text und Rahmen — je einmal für Hell- und einmal für Dunkelmodus.</p>
      <div id="theme-pair-fields"></div>
    </section>

    <div class="dashboard-footer">
      <button type="button" id="save-settings-btn" class="btn btn--primary" data-i18n="common.buttons.save">Speichern</button>
      <button type="button" id="reset-settings-btn" class="btn btn--ghost" data-i18n="settings.resetButton">Auf Standardfarben zurücksetzen</button>
    </div>
    <p id="settings-status" class="hint-text" style="text-align:center;" role="status" aria-live="polite"></p>

    <section class="card section-spacing">
      <h2 data-i18n="settings.backup.heading">Daten-Sicherung</h2>
      <p class="hint-text" data-i18n="settings.backup.hint">Vollständiges Backup aller Spieler, Spiele, Avatare und Logos als ZIP-Datei — z.B. um bei einem Server-Umzug sicherzugehen, dass nichts verloren geht.</p>

      <h3 data-i18n="settings.backup.exportHeading">Backup herunterladen</h3>
      <p class="hint-text" data-i18n="settings.backup.exportHint">Enthält die komplette Datenbank sowie alle Avatar-Bilder und das Logo.</p>
      <a href="/api/backup.php" class="btn btn--ghost" data-i18n="settings.backup.exportButton">Backup herunterladen</a>

      <h3 class="section-spacing" data-i18n="settings.backup.importHeading">Backup wiederherstellen</h3>
      <p class="hint-text" data-i18n="settings.backup.importWarning">Achtung: Ein Import ersetzt alle aktuellen Spieler, Spiele, Avatare und Logos unwiderruflich durch den Inhalt der Backup-Datei.</p>
      <div class="form">
        <label for="backup-file-input" data-i18n="settings.backup.fileLabel">Backup-Datei (.zip)</label>
        <input type="file" id="backup-file-input" accept=".zip,application/zip">
      </div>
      <button type="button" id="backup-import-reveal-btn" class="btn btn--danger" data-i18n="settings.backup.importButton">Backup importieren</button>

      <div id="backup-import-confirm" class="form" hidden>
        <p class="hint-text" data-i18n="settings.backup.confirmHint">Zum Bestätigen unten genau ERSETZEN eingeben.</p>
        <label for="backup-confirm-input" data-i18n="settings.backup.confirmLabel">Bestätigung</label>
        <input type="text" id="backup-confirm-input" autocomplete="off">
        <div class="dashboard-footer">
          <button type="button" id="backup-import-submit-btn" class="btn btn--danger" disabled data-i18n="settings.backup.confirmButton">Jetzt endgültig ersetzen</button>
          <button type="button" id="backup-import-cancel-btn" class="btn btn--ghost" data-i18n="common.buttons.cancel">Abbrechen</button>
        </div>
      </div>

      <p id="backup-status" class="hint-text" role="status" aria-live="polite"></p>
    </section>
  </main>

<?php
$page_scripts = ['js/settings.js'];
require __DIR__ . '/includes/footer.php';
