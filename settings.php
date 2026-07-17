<?php
$page_title = 'pages.settings.title';
$active_nav = 'settings';
$page_h1 = '<h1 data-i18n="settings.heading">Einstellungen</h1>';
$page_subtitle = '<p class="app-header__subtitle" data-i18n="settings.subtitle">Gilt für alle, die diese Seite nutzen (global gespeichert).</p>';
require __DIR__ . '/includes/header.php';
?>

  <main id="main">
    <nav class="settings-tabs" role="tablist" aria-label="Einstellungs-Bereiche" id="settings-tabs">
      <button type="button" class="settings-tabs__btn" data-tab="aussehen" role="tab" aria-selected="true" data-i18n="settings.tabs.aussehen">Aussehen</button>
      <button type="button" class="settings-tabs__btn" data-tab="allgemein" role="tab" aria-selected="false" data-i18n="settings.tabs.allgemein">Allgemein</button>
      <button type="button" class="settings-tabs__btn" data-tab="spiele" role="tab" aria-selected="false" data-i18n="settings.tabs.spiele">Meine Spiele</button>
      <button type="button" class="settings-tabs__btn" data-tab="zugang" role="tab" aria-selected="false" data-i18n="settings.tabs.zugang">Zugangsschutz</button>
      <button type="button" class="settings-tabs__btn" data-tab="backup" role="tab" aria-selected="false" data-i18n="settings.tabs.backup">Backup</button>
    </nav>

    <div class="settings-tab-panel" data-tab-panel="aussehen">
      <section class="card">
        <h2 data-i18n="settings.theme.heading">Aussehen</h2>
        <p class="hint-text" data-i18n="settings.theme.hint">Drei eigenständige Optiken zur Wahl. Feinjustierung der Farben findet sich weiter unten im Bereich "Farben im Detail".</p>
        <div class="player-picker">
          <label class="player-chip winner-card">
            <input type="radio" name="theme-style" value="flip" checked>
            <span data-i18n="settings.theme.flip">Flip Board</span>
          </label>
          <label class="player-chip winner-card">
            <input type="radio" name="theme-style" value="classic">
            <span data-i18n="settings.theme.classic">Classic</span>
          </label>
          <label class="player-chip winner-card">
            <input type="radio" name="theme-style" value="bold">
            <span data-i18n="settings.theme.bold">Bold Scorekeeper</span>
          </label>
        </div>

        <div class="settings-subsection" id="shared-accent-section">
          <label data-i18n="settings.theme.accentLabel">Akzentfarbe</label>
          <div class="accent-color-picker" id="accent-color-picker">
            <label class="accent-color-dot" style="--dot-color:#b6ff1a">
              <input type="radio" name="bold-accent" value="green" checked>
              <span class="visually-hidden" data-i18n="settings.theme.accent.green">Grün</span>
            </label>
            <label class="accent-color-dot" style="--dot-color:#ff8a3d">
              <input type="radio" name="bold-accent" value="orange">
              <span class="visually-hidden" data-i18n="settings.theme.accent.orange">Orange</span>
            </label>
            <label class="accent-color-dot" style="--dot-color:#ff3daa">
              <input type="radio" name="bold-accent" value="pink">
              <span class="visually-hidden" data-i18n="settings.theme.accent.pink">Pink</span>
            </label>
            <label class="accent-color-dot" style="--dot-color:#b088ff">
              <input type="radio" name="bold-accent" value="violet">
              <span class="visually-hidden" data-i18n="settings.theme.accent.violet">Violett</span>
            </label>
            <label class="accent-color-dot" style="--dot-color:#22d3ee">
              <input type="radio" name="bold-accent" value="cyan">
              <span class="visually-hidden" data-i18n="settings.theme.accent.cyan">Cyan</span>
            </label>
          </div>
        </div>

        <div class="settings-subsection" id="flip-preset-section" hidden>
          <label data-i18n="settings.theme.flipPresetLabel">Farbvorschlag</label>
          <div class="flip-preset-grid" id="flip-preset-picker">
            <label class="flip-preset-card" style="--flip-preset-color:#c9761a">
              <input type="radio" name="flip-accent" value="amber" checked>
              <span class="flip-preset-card__swatch" aria-hidden="true"></span>
              <span class="flip-preset-card__label" data-i18n="settings.theme.flipPreset.amber">Bernstein</span>
            </label>
            <label class="flip-preset-card" style="--flip-preset-color:#1f7a6c">
              <input type="radio" name="flip-accent" value="petrol">
              <span class="flip-preset-card__swatch" aria-hidden="true"></span>
              <span class="flip-preset-card__label" data-i18n="settings.theme.flipPreset.petrol">Petrol</span>
            </label>
            <label class="flip-preset-card" style="--flip-preset-color:#b23a3a">
              <input type="radio" name="flip-accent" value="karmesin">
              <span class="flip-preset-card__swatch" aria-hidden="true"></span>
              <span class="flip-preset-card__label" data-i18n="settings.theme.flipPreset.karmesin">Karmesin</span>
            </label>
            <label class="flip-preset-card" style="--flip-preset-color:#ea580c">
              <input type="radio" name="flip-accent" value="knallorange">
              <span class="flip-preset-card__swatch" aria-hidden="true"></span>
              <span class="flip-preset-card__label" data-i18n="settings.theme.flipPreset.knallorange">Knallorange</span>
            </label>
            <label class="flip-preset-card" style="--flip-preset-color:#6a4fb2">
              <input type="radio" name="flip-accent" value="violett">
              <span class="flip-preset-card__swatch" aria-hidden="true"></span>
              <span class="flip-preset-card__label" data-i18n="settings.theme.flipPreset.violett">Violett</span>
            </label>
          </div>
        </div>

        <div class="settings-subsection" id="bold-background-section" hidden>
          <label data-i18n="settings.theme.backgroundLabel">Hintergrund</label>
          <div class="player-picker">
            <label class="player-chip winner-card">
              <input type="radio" name="bold-background" value="dark" checked>
              <span data-i18n="settings.theme.background.dark">Dunkel</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="bold-background" value="dark_blue">
              <span data-i18n="settings.theme.background.darkBlue">Dunkel Blau</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="bold-background" value="black">
              <span data-i18n="settings.theme.background.black">Schwarz</span>
            </label>
          </div>
        </div>

        <div class="settings-subsection" id="bold-card-style-section" hidden>
          <label data-i18n="settings.theme.cardStyleLabel">Kartenstil</label>
          <div class="player-picker">
            <label class="player-chip winner-card">
              <input type="radio" name="bold-card-style" value="classic" checked>
              <span data-i18n="settings.theme.cardStyle.classic">Klassisch</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="bold-card-style" value="modern">
              <span data-i18n="settings.theme.cardStyle.modern">Modern</span>
            </label>
          </div>
        </div>
      </section>

      <section class="card section-spacing">
        <h2 data-i18n="settings.colors.advancedHeading">Farben im Detail</h2>
        <details class="advanced-options">
          <summary data-i18n="settings.colors.advancedSummary">Erweitert öffnen</summary>

          <p id="bold-colors-note" class="hint-text" hidden data-i18n="settings.colors.boldNote">Gilt nur für Classic — Bold nutzt die Voreinstellungen oben.</p>

          <div id="single-colors-section">
            <h3 data-i18n="settings.colors.single.heading">Akzent- und Funktionsfarben</h3>
            <p class="hint-text" data-i18n="settings.colors.single.hint">Gelten unverändert in Hell- und Dunkelmodus.</p>
            <div class="color-field-grid" id="single-color-fields"></div>
          </div>

          <div id="pair-colors-section" class="section-spacing">
            <h3 data-i18n="settings.colors.pairs.heading">Basis-Farben (Hell- / Dunkelmodus getrennt)</h3>
            <p class="hint-text" data-i18n="settings.colors.pairs.hint">Hintergrund, Fläche, Text und Rahmen — je einmal für Hell- und einmal für Dunkelmodus.</p>
            <div id="theme-pair-fields"></div>
          </div>

          <div id="flip-colors-section" hidden>
            <h3 data-i18n="settings.colors.flip.heading">Flip-Board-Farben</h3>
            <p class="hint-text" data-i18n="settings.colors.flip.hint">Überschreibt den gewählten Farbvorschlag oben — je einmal für Hell- und einmal für Dunkelmodus.</p>
            <div class="color-field-grid" id="flip-color-fields"></div>
          </div>
        </details>
      </section>
    </div>

    <div class="settings-tab-panel" data-tab-panel="allgemein" hidden>
      <section class="card">
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
        <h2 data-i18n="settings.logo.heading">Logo</h2>
        <p class="hint-text" data-i18n="settings.logo.hint">Standardmäßig ist kein eigenes Logo aktiv, dann bleibt das Stift-Symbol sichtbar.</p>

        <div class="form" style="margin-bottom:1rem;">
          <label data-i18n="settings.logo.modeLabel">Anzeige</label>
          <div class="player-picker">
            <label class="player-chip winner-card">
              <input type="radio" name="logo-mode" value="none" checked>
              <span data-i18n="settings.logo.modeNone">Kein Logo</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="logo-mode" value="square">
              <span data-i18n="settings.logo.modeSquare">Quadrat oben links</span>
            </label>
            <label class="player-chip winner-card">
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
    </div>

    <div class="settings-tab-panel" data-tab-panel="spiele" hidden>
      <section class="card">
        <h2 data-i18n="settings.presets.heading">Meine Spiele</h2>
        <p class="hint-text" data-i18n="settings.presets.hint">Eigene, fertig konfigurierte Spiele (z.B. "Flip7" mit Zielwert 200) — erscheinen auf der Startseite unter "Meine Spiele" und füllen beim Anklicken das Einrichten-Formular vorab aus.</p>

        <div id="preset-list"></div>

        <button type="button" id="preset-add-btn" class="btn btn--ghost section-spacing" data-i18n="settings.presets.addButton">Neues Spiel anlegen</button>
      </section>

      <section class="card section-spacing" id="preset-form-card" hidden>
        <h2 id="preset-form-heading" data-i18n="settings.presets.formHeadingNew">Neues Spiel</h2>
        <form id="preset-form" class="form">
          <label for="preset-name" data-i18n="settings.presets.nameLabel">Name</label>
          <input type="text" id="preset-name" placeholder="z.B. Flip7" maxlength="40" autocomplete="off" required>

          <label data-i18n="settings.presets.modeLabel">Modus</label>
          <div class="player-picker">
            <label class="player-chip winner-card">
              <input type="radio" name="preset-mode" value="points_to_target" checked>
              <span data-i18n="modes.pointsToTarget.title">Punkte bis Höchstwert</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="preset-mode" value="points_open">
              <span data-i18n="modes.pointsOpen.title">Offene Punkterunde</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="preset-mode" value="fixed_rounds">
              <span data-i18n="modes.fixedRounds.title">Punkterunde mit fester Rundenzahl</span>
            </label>
          </div>

          <div id="preset-target-score-field">
            <label for="preset-target-score" data-i18n="pointsToTarget.setup.targetLabel">Bis zu welchem Punktewert wird gespielt?</label>
            <input type="text" id="preset-target-score" value="200" inputmode="numeric" pattern="[0-9]*">
          </div>

          <div id="preset-total-rounds-field" hidden>
            <label for="preset-total-rounds" data-i18n="fixedRounds.setup.roundsLabel">Wie viele Runden werden gespielt?</label>
            <input type="text" id="preset-total-rounds" value="10" inputmode="numeric" pattern="[0-9]*">
          </div>

          <label data-i18n="common.winDirection.heading">Wer gewinnt am Ende?</label>
          <div class="player-picker">
            <label class="player-chip winner-card">
              <input type="radio" name="preset-win-direction" value="highest" checked>
              <span data-i18n="common.winDirection.highest">Höchste Punktzahl</span>
            </label>
            <label class="player-chip winner-card">
              <input type="radio" name="preset-win-direction" value="lowest">
              <span data-i18n="common.winDirection.lowest">Niedrigste Punktzahl</span>
            </label>
          </div>

          <label data-i18n="common.setup.roundEntryStepsLabel">Punkteschritte für die Rundenerfassung</label>
          <div class="player-picker" id="preset-round-entry-steps-field"></div>

          <details class="advanced-options">
            <summary data-i18n="common.setup.advancedOptions">Erweiterte Optionen</summary>

            <label for="preset-target-bonus" data-i18n="pointsToTarget.setup.targetBonusLabel">Bonus bei Zielerreichung</label>
            <input type="text" id="preset-target-bonus" value="0" inputmode="numeric" pattern="[0-9]*">

            <label class="player-chip">
              <input type="checkbox" id="preset-allow-negative" checked>
              <span data-i18n="common.setup.allowNegativeLabel">Negativpunkte erlauben</span>
            </label>
          </details>

          <div class="dashboard-footer">
            <button type="submit" class="btn btn--primary" data-i18n="common.buttons.save">Speichern</button>
            <button type="button" id="preset-form-cancel-btn" class="btn btn--ghost" data-i18n="common.buttons.cancel">Abbrechen</button>
          </div>
        </form>
      </section>
    </div>

    <div class="settings-tab-panel" data-tab-panel="zugang" hidden>
      <section class="card">
        <h2 data-i18n="settings.access.heading">Zugangsschutz</h2>
        <p class="hint-text" data-i18n="settings.access.hint">Schützt die ganze Seite mit einem gemeinsamen Passwort für alle, die den Link kennen. Ohne aktiven Schutz ist die Seite für jeden mit dem Link nutzbar.</p>

        <label class="player-chip">
          <input type="checkbox" id="access-enabled-input">
          <span data-i18n="settings.access.enableLabel">Zugangsschutz aktivieren</span>
        </label>
        <p id="access-password-status" class="hint-text" data-i18n="settings.access.noPasswordSet">Es ist noch kein Passwort hinterlegt — der Schutz bleibt bis dahin wirkungslos.</p>

        <div class="form section-spacing">
          <label for="access-password-input" data-i18n="settings.access.passwordLabel">Neues Passwort</label>
          <input type="password" id="access-password-input" autocomplete="new-password">
          <label for="access-password-confirm-input" data-i18n="settings.access.passwordConfirmLabel">Passwort wiederholen</label>
          <input type="password" id="access-password-confirm-input" autocomplete="new-password">
          <p class="hint-text" data-i18n="settings.access.passwordHint">Leer lassen, um das aktuell gespeicherte Passwort beizubehalten. Passwort vergessen? Siehe README für die Reset-Anleitung per Datei-Zugriff.</p>
        </div>

        <button type="button" id="access-save-btn" class="btn btn--primary" data-i18n="common.buttons.save">Speichern</button>
        <p id="access-status" class="hint-text" style="text-align:center;" role="status" aria-live="polite"></p>

        <a href="/logout.php" class="btn btn--ghost section-spacing" data-i18n="settings.access.logoutButton">Auf diesem Gerät abmelden</a>
      </section>
    </div>

    <div class="settings-tab-panel" data-tab-panel="backup" hidden>
      <section class="card">
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
    </div>

    <div class="settings-save-bar" id="settings-save-bar">
      <button type="button" id="save-settings-btn" class="btn btn--primary" data-i18n="common.buttons.save">Speichern</button>
      <button type="button" id="reset-settings-btn" class="btn btn--ghost" data-i18n="settings.resetButton">Auf Standardfarben zurücksetzen</button>
    </div>
    <p id="settings-status" class="hint-text" style="text-align:center;" role="status" aria-live="polite"></p>
  </main>

<?php
$page_scripts = ['js/round-entry-steps-field.js', 'js/settings.js', 'js/settings-presets.js'];
require __DIR__ . '/includes/footer.php';
