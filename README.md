# Das Scoreboard

*English below.*

Aufschreibhilfe für Spieleabende. Reines PHP 8 + PDO/SQLite, kein Node,
keine separate Datenbank nötig — läuft auf normalem Webhosting per FTP-
Upload, Darstellung soll auf iPad und iPhone funktionieren.

## Konzept

- **Startseite**: Übersicht der verfügbaren Aufschreibmöglichkeiten
  ("Modi"), aktuell vier: *Punkte bis Höchstwert* (Beispiele: Flip7, Tutto),
  *Offene Punkterunde* (Beispiel: Doppelkopf), *Punkterunde mit fester
  Rundenzahl* und *RAGE*.
- **Spielerverwaltung** (`players.html`): zentrale Namens-Datenbank, aus der
  bei neuen Spielen ausgewählt werden kann, statt Namen jedes Mal neu zu
  tippen. Entfernen ist eine weiche Löschung (Spieler bleiben in
  vergangenen Spielen sichtbar).
- **Spielverlauf** (`history.html`): alle Spiele (laufend + beendet),
  unterscheidbar über Start-/Endzeit, damit auch mehrere Spiele am selben
  Tag eindeutig auffindbar sind.
- **Modus "Punkte bis Höchstwert"** (`modes/points-to-target/`): Punkte
  werden rundenweise für alle Spieler gemeinsam erfasst (0 ist normal, z.B.
  bei einem Bust). Sobald jemand den Zielwert erreicht/überschreitet, endet
  das Spiel automatisch; wer dann die meisten Punkte hat, gewinnt (bei
  Gleichstand mehrere Sieger möglich). Korrektur ist jederzeit direkt in
  der Rundenverlauf-Tabelle möglich und reaktiviert ein bereits beendetes
  Spiel automatisch, falls der Zielwert dadurch unterschritten wird.
- **Modus "Offene Punkterunde"** (`modes/points-open/`): wie oben, aber ohne
  Zielwert — beim Einrichten wird festgelegt, ob am Ende die höchste oder
  die niedrigste Punktzahl gewinnt. Das Spiel wird manuell per Knopfdruck
  beendet (und kann genauso wieder fortgesetzt werden), es gibt keinen
  automatischen Sieg-Moment.
- **Modus "Punkterunde mit fester Rundenzahl"** (`modes/fixed-rounds/`): wie
  "Offene Punkterunde", aber mit einer beim Einrichten festgelegten
  Rundenzahl (Sieg-Richtung ebenfalls wählbar). Sobald die vereinbarte
  Rundenzahl erreicht ist, erscheint ein Hinweis mit der Wahl "Spiel
  beenden" oder "Weiterspielen, noch X Runden" (verlängert die Zielzahl und
  lässt das Spiel aktiv weiterlaufen, danach erscheint der Hinweis bei
  Bedarf erneut). Optional (Checkbox beim Einrichten, standardmäßig aus)
  zeigt eine schließbare Meldung "Runde X beendet" nach jeder gespeicherten
  Runde.
- **Tool "Wer fängt an?"** (`tools/finger-chooser.html`): Multitouch-
  Fingerauswahl für iPad/iPhone. Wartet auf den ersten Finger, zählt dann
  5 Sekunden runter (weitere Finger können in dieser Zeit dazukommen),
  wählt danach zufällig einen der aufliegenden Finger aus (wird groß/grün),
  die anderen verschwinden. Rein clientseitig über die Touch-Events-API,
  ohne Backend-Anbindung.
- **Startspieler**: Alle Modi bestimmen beim Anlegen eines Spiels
  automatisch zufällig einen Startspieler unter den ausgewählten Spielern.
  Dessen Name trägt im Punktestand einen kleinen Stern (★), der unten links
  im Punktestand-Kasten erklärt wird ("Startspieler (zufällig)"). Bereits
  vor dieser Funktion angelegte Spiele zeigen keinen Stern (kein
  Startspieler nachträglich zugewiesen).
- **Rückgängig**: Alle Modi zeigen neben "Rundenverlauf & Korrektur" einen
  "Letzte Runde rückgängig"-Knopf, sobald mindestens eine Runde gespielt
  wurde — schneller Zugriff für den Fall, dass die letzte Eingabe ein
  Versehen war, ohne dafür in der Korrektur-Tabelle nach unten scrollen zu
  müssen. Löscht technisch dieselbe Runde wie der "Löschen"-Knopf in der
  Tabelle.
- **Als App installierbar (PWA)**: `manifest.json` + Icons
  (`assets/icons/`) erlauben "Zum Home-Bildschirm hinzufügen" auf
  iPad/iPhone (Safari: Teilen-Symbol → "Zum Home-Bildschirm") sowie auf
  Android/Desktop-Chrome — die Seite öffnet sich danach wie eine eigene
  App, ohne Adressleiste. Kurzer Hinweis dazu steht auch auf der
  Startseite. Name/Icon im Manifest sind aktuell statisch (Standardtitel
  "Das Scoreboard", Stift-Symbol) und folgen einem in den Einstellungen
  geänderten Titel/Logo (noch) nicht automatisch.
- **Ton beim Speichern**: kurzer, per Web-Audio-API synthetisierter Ton
  (keine Audiodatei nötig) beim Speichern einer neuen Runde, in allen 4
  Modi. Zusätzlich Vibration, wo vom Gerät unterstützt — auf iPhone/iPad
  grundsätzlich nicht möglich (Safari implementiert die Vibration-API
  nicht, auch nicht im PWA-Modus), der Ton funktioniert dort aber normal.
  In den Einstellungen abschaltbar (Standard: an).
- **Modus "RAGE"** (`modes/rage/`): Kartenspiel mit Stichansage über feste
  10 Runden (Kartenzahl sinkt von 10 auf 1). Vor jeder Runde werden je
  Spieler Ansage und tatsächliche Stiche eingetragen, dazu optional
  Rage-Bonus- (+5) und Rage-Rache-Karten (−5); die Punkte werden
  automatisch berechnet (+1 pro Stich, +10 bei Treffer, −5 bei Fehlschuss).
  Beim Speichern einer Runde wird gewarnt, falls die Summe der Stiche nicht
  der Kartenzahl entspricht (Speichern bleibt trotzdem möglich). Nach
  Runde 10 endet das Spiel automatisch; ein manuelles Beenden/Fortsetzen
  ist ebenfalls möglich. Löschen einer Runde reduziert die Rundenzahl und
  öffnet ein automatisch beendetes Spiel bei Bedarf wieder.

Weitere Modi (andere Aufschreib-Mechaniken) sollen später als eigene
Unterordner unter `modes/` dazukommen, ohne die bestehenden Teile
anzufassen — Spieler-Datenbank und Spielverlauf sind bewusst modusübergreifend
angelegt.
- **Einstellungen** (`settings.html`): global gespeicherte (serverseitige)
  Konfiguration, gilt für alle, die die Seite nutzen. Vier Bereiche:
  - **Titel**: der angezeigte Name ("Das Scoreboard" als Standard) — erscheint
    im Kopfbereich jeder Seite und im Browser-Tab-Titel, unabhängig von der
    gewählten Sprache identisch (wird nicht übersetzt). Wer die Seite für
    eine eigene Gruppe betreibt, kann hier einen eigenen Namen eintragen.
  - **Logo**: standardmäßig kein eigenes Logo (Stift-Symbol bleibt sichtbar).
    Zwei unabhängige Upload-Slots (Quadrat, Banner) + eine Anzeige-Auswahl
    (kein Logo / Quadrat oben links / Banner über der ganzen Breite) — nur
    der gewählte Modus wird tatsächlich angezeigt. PNG, JPEG oder SVG, max.
    2 MB, empfohlene Pixelmaße stehen jeweils im Hinweistext. Dateien liegen
    in `data/logo-{square,banner}.{ext}` (per `.htaccess` gesperrt) und
    werden über `api/logo.php?type=square|banner` ausgeliefert. "Entfernen"
    löscht Datei + Zuordnung wieder, unabhängig vom gerade aktiven Modus.
  - **Farben**: komplette Palette einzeln per Hex-Eingabe + Farbwähler
    konfigurierbar. Akzent-/Funktionsfarben (Grün, Amber, Fokus, Fehler, …)
    gelten unverändert in Hell- und Dunkelmodus; Basis-Farben (Hintergrund,
    Fläche, Text, Rahmen) je einmal für Hell- und einmal für Dunkelmodus.
    "Auf Standardfarben zurücksetzen" löscht alle Overrides wieder (inkl.
    Titel, Logo-Auswahl und Sprache — hochgeladene Logo-Dateien selbst
    bleiben aber liegen, bis sie explizit entfernt werden).
  - **Sprache**: aktuell Deutsch/Englisch, siehe Abschnitt
    "Mehrsprachigkeit (i18n)" unten.

## Mehrsprachigkeit (i18n)

Die komplette Oberfläche (alle Seiten, alle JS-generierten Texte) ist
übersetzbar aufgebaut:

- **Wörterbücher**: `i18n/de.json` und `i18n/en.json`, verschachtelte Keys
  nach Bereich (`common.*` für seitenübergreifend Wiederverwendetes,
  `home.*`, `players.*`, `history.*`, `settings.*`, `pointsToTarget.*`,
  `pointsOpen.*`, `rage.*`, `chooser.*`). Platzhalter in geschweiften
  Klammern (`{name}`) werden von `t()` per Objekt ersetzt.
- **Loader** (`js/i18n.js`): lädt beim Seitenaufruf die in den globalen
  Einstellungen gewählte Sprache, wendet sie auf alle `[data-i18n]`
  (Textinhalt), `[data-i18n-placeholder]` und `[data-i18n-title]`-Elemente
  an und setzt `<html lang="…">`. Stellt global `window.t(key, vars)` für
  JS-generierte Texte sowie `window.scoreboardLocale()` (für
  `toLocaleString()`-Datumsformatierung) bereit.
- **Ladereihenfolge**: jede Seite bindet `js/theme.js` und `js/i18n.js` vor
  ihrem eigenen Skript ein. Eigene Skripte, die `t()` beim Initialisieren
  brauchen, warten auf `window.scoreboardI18nReady` (ein Promise), statt
  direkt beim Laden zu rendern — sonst liefe `t()` ggf. mit leerem
  Wörterbuch.

**Neue Sprache ergänzen:**

1. `i18n/{code}.json` anlegen (z.B. `i18n/fr.json`), Struktur von `de.json`
   1:1 übernehmen und alle Werte übersetzen.
2. In `includes/settings.php::supported_languages()` den neuen Code mit
   Anzeigename ergänzen (z.B. `'fr' => 'Français'`).
3. Fertig — die Sprache erscheint automatisch in der Auswahl auf der
   Einstellungen-Seite. An `js/i18n.js` oder den Seiten muss nichts
   geändert werden.

## Voraussetzungen beim Hoster

- PHP 8.x mit aktivierter `pdo_sqlite`-Extension.
- Schreibrechte für den Ordner `data/`.
- Kein mod_rewrite nötig — die API läuft über einfache Query-Parameter
  (z.B. `/api/games.php?id=5`), keine hübschen URLs, dafür robust auf
  praktisch jedem Hosting ohne `.htaccess`-Feinschliff.

## Deployment

Kompletten Ordnerinhalt per FTP/SFTP ins Webroot hochladen. Die SQLite-Datei
`data/scoreboard.sqlite` wird beim ersten Request automatisch angelegt.

## Upgrade einer bestehenden Installation

Jede eigene Installation lässt sich gefahrlos aktualisieren, ohne
gespeicherte Spiele zu verlieren:

1. Neue Code-Version per FTP/SFTP hochladen und dabei **den `data/`-Ordner
   nicht überschreiben/löschen** (dort liegt die SQLite-Datenbank mit allen
   Spielern, Spielen und Runden).
2. Fertig — beim nächsten Seitenaufruf gleicht `includes/db.php` das
   Datenbankschema automatisch an (versioniertes Migrationssystem über
   `PRAGMA user_version`, siehe Kommentar dort). Migrationen sind rein
   additiv (neue Tabellen/Spalten), bestehende Daten werden nie gelöscht
   oder überschrieben.

Für Entwickler: neue Schema-Änderungen immer als **neue** Migration mit der
nächsthöheren Versionsnummer in `migrations()` ergänzen, niemals eine
bestehende Migration nachträglich verändern — sonst würden bereits
aktualisierte Installationen die Änderung nie ausführen.

## Versionsnummer pflegen

Bei jedem Release die Datei `VERSION` auf den neuen Stand setzen — wird
über `/api/version.php` an alle Seiten ausgeliefert und unten rechts
angezeigt.

`js/version.js` prüft zusätzlich clientseitig gegen die GitHub-API
(`releases/latest` des in `UPDATE_CHECK_REPO` hinterlegten Repos), ob eine
neuere Version existiert, und zeigt dann unten rechts einen roten Link
darauf an. Ergebnis wird 1 Tag pro Browser in `localStorage` gecacht.
Solange das Repo privat ist, schlägt die Anfrage (404) einfach lautlos fehl
— sobald es öffentlich geschaltet wird, funktioniert der Hinweis ohne
Codeänderung.

## Struktur

```
Das-Scoreboard/
├── index.html               # Startseite: Modi-Auswahl
├── players.html             # Spielerverwaltung
├── history.html              # Spielverlauf
├── settings.html              # globale Einstellungen (Farben, Sprache)
├── modes/
│   ├── points-to-target/
│   │   ├── setup.html        # neues Spiel einrichten (Zielwert)
│   │   ├── setup.js
│   │   ├── game.html         # aktives/beendetes Spiel
│   │   └── game.js
│   ├── points-open/
│   │   ├── setup.html        # neues Spiel einrichten (Sieg-Richtung)
│   │   ├── setup.js
│   │   ├── game.html         # aktives/beendetes Spiel, manuelles Beenden
│   │   └── game.js
│   ├── fixed-rounds/
│   │   ├── setup.html        # neues Spiel einrichten (Rundenzahl, Sieg-Richtung)
│   │   ├── setup.js
│   │   ├── game.html         # Runde X von Y, Zielerreicht-Hinweis (beenden/verlaengern)
│   │   └── game.js
│   └── rage/
│       ├── setup.html        # neues Spiel einrichten (nur Spielerauswahl)
│       ├── setup.js
│       ├── game.html         # Runde X von 10, Ansage/Stiche/Sonderkarten
│       └── game.js
├── tools/
│   ├── finger-chooser.html   # "Wer fängt an?" Multitouch-Auswahl
│   └── finger-chooser.js
├── api/
│   ├── players.php           # GET/POST/PATCH Spieler-Roster
│   ├── games.php              # GET/POST/PATCH/DELETE Spiele
│   ├── rounds.php              # POST/PATCH/DELETE Runden (einfache Punkte)
│   ├── rage-rounds.php         # POST/PATCH/DELETE Runden (RAGE: Ansage/Stiche/Sonderkarten)
│   ├── settings.php            # GET/PATCH globale Einstellungen (Titel, Logo, Farben, Sprache)
│   ├── logo.php                 # GET/POST/DELETE Logo-Upload (Quadrat/Banner)
│   └── version.php
├── includes/
│   ├── db.php                 # PDO-SQLite-Verbindung + Schema
│   ├── state.php               # buildState(), Sieg-Erkennung, JSON-Helper
│   ├── rage.php                 # RAGE-Punkteformel
│   └── settings.php             # Defaults, Validierung, get/save/reset
├── i18n/
│   ├── de.json                 # deutsches Wörterbuch
│   └── en.json                 # englisches Wörterbuch
├── css/style.css
├── js/
│   ├── version.js              # Versionsanzeige unten rechts
│   ├── theme.js                # wendet Farbeinstellungen als CSS-Variablen an
│   ├── i18n.js                  # laedt Sprachwoerterbuch, stellt t() bereit
│   ├── settings.js              # Logik der Einstellungen-Seite
│   ├── players.js               # Logik der Spielerverwaltung
│   ├── history.js                # Logik des Spielverlaufs
│   └── feedback.js               # Ton/Vibration beim Rundenspeichern (nur Spielansichten)
├── data/                      # SQLite-Datei + Logo-Uploads, per .htaccess geschützt
├── assets/
│   └── icons/                 # PWA-Icons (icon-192.png, icon-512.png, apple-touch-icon.png)
├── manifest.json               # PWA-Manifest ("Zum Home-Bildschirm hinzufügen")
├── .htaccess
└── VERSION
```

---

# Das Scoreboard (English)

Scorekeeping helper for game nights. Pure PHP 8 + PDO/SQLite, no Node, no
separate database needed — runs on plain webhosting via FTP upload, meant
to work on iPad and iPhone.

## Concept

- **Home page**: overview of the available scorekeeping modes, currently
  four: *Points to target* (examples: Flip7, Tutto), *Open point round*
  (example: Doppelkopf), *Points round with fixed round count*, and
  *RAGE*.
- **Player management** (`players.html`): central name database to pick
  from when starting new games instead of typing names every time.
  Removing is a soft delete (players stay visible in past games).
- **Game history** (`history.html`): all games (ongoing + finished),
  distinguishable by start/end time, so multiple games on the same day
  stay uniquely identifiable.
- **Mode "Points to target"** (`modes/points-to-target/`): points are
  entered round by round for all players together (0 is normal, e.g. on a
  bust). As soon as someone reaches/exceeds the target value, the game
  ends automatically; whoever has the most points then wins (ties allow
  multiple winners). Correction is always possible directly in the round
  history table and automatically reactivates an already-finished game if
  the target is no longer reached as a result.
- **Mode "Open point round"** (`modes/points-open/`): like above, but
  without a target value — during setup you decide whether the highest or
  lowest score wins at the end. The game is finished manually via a
  button (and can be resumed the same way); there is no automatic win
  moment.
- **Mode "Points round with fixed round count"** (`modes/fixed-rounds/`):
  like "Open point round", but with a round count fixed during setup (win
  direction also selectable). Once the agreed round count is reached, a
  prompt appears with the choice "Finish game" or "Keep playing, X more
  rounds" (extends the target and keeps the game active; the prompt
  reappears later if needed). Optionally (checkbox during setup, off by
  default) a dismissible "Round X finished" notice appears after every
  saved round.
- **Tool "Who starts?"** (`tools/finger-chooser.html`): multitouch finger
  picker for iPad/iPhone. Waits for the first finger, then counts down 5
  seconds (more fingers can join during that time), then randomly picks
  one of the fingers on screen (grows/turns green), the others disappear.
  Purely client-side via the Touch Events API, no backend involved.
- **Starting player**: every mode automatically picks a random starting
  player among the selected players when a game is created. Their name
  carries a small star (★) in the standings, explained at the bottom left
  of the standings box ("Starting player (random)"). Games created before
  this feature show no star (no starting player assigned retroactively).
- **Undo**: every mode shows an "Undo last round" button next to "Round
  history & correction" as soon as at least one round has been played —
  quick access for when the last entry was a mistake, without having to
  scroll down to the correction table. Technically deletes the same round
  as the "Delete" button in the table.
- **Installable as an app (PWA)**: `manifest.json` + icons
  (`assets/icons/`) enable "Add to Home Screen" on iPad/iPhone (Safari:
  Share icon → "Add to Home Screen") as well as on Android/desktop
  Chrome — the page then opens like its own app, without the address
  bar. A short hint about this is also shown on the home page. Name/icon
  in the manifest are currently static (default title "Das Scoreboard",
  pen icon) and don't (yet) automatically follow a title/logo changed in
  settings.
- **Sound on save**: short tone synthesized via the Web Audio API (no
  audio file needed) when saving a new round, in all 4 modes. Also
  triggers vibration where supported by the device — not possible on
  iPhone/iPad at all (Safari doesn't implement the Vibration API, even in
  PWA mode), but the sound works there normally. Toggleable in settings
  (default: on).
- **Mode "RAGE"** (`modes/rage/`): trick-taking card game with bidding
  over a fixed 10 rounds (card count decreases from 10 to 1). Before each
  round, each player's bid and actual tricks are entered, plus optional
  Rage bonus (+5) and Rage revenge cards (−5); points are calculated
  automatically (+1 per trick, +10 on a hit, −5 on a miss). Saving a round
  warns if the sum of tricks doesn't match the card count (saving remains
  possible anyway). After round 10 the game ends automatically; manual
  finish/resume is also possible. Deleting a round reduces the round
  count and reopens an automatically finished game if needed.

Further modes (other scorekeeping mechanics) are meant to be added later
as their own subfolders under `modes/`, without touching existing parts —
the player database and game history are deliberately mode-agnostic.
- **Settings** (`settings.html`): globally stored (server-side)
  configuration, applies to everyone using the page. Four areas:
  - **Title**: the displayed name ("Das Scoreboard" by default) —
    appears in the header of every page and in the browser tab title,
    identical regardless of the selected language (not translated).
    Anyone running the page for their own group can enter a custom name
    here.
  - **Logo**: no custom logo by default (the pen icon stays visible). Two
    independent upload slots (square, banner) plus a display selector (no
    logo / square top left / banner across the full width) — only the
    selected mode is actually shown. PNG, JPEG, or SVG, max. 2 MB,
    recommended pixel dimensions are shown in the hint text for each.
    Files live at `data/logo-{square,banner}.{ext}` (blocked by
    `.htaccess`) and are served via `api/logo.php?type=square|banner`.
    "Remove" deletes the file and its reference regardless of which mode
    is currently active.
  - **Colors**: the complete palette individually configurable via hex
    input + color picker. Accent/function colors (green, amber, focus,
    error, …) stay the same in light and dark mode; base colors
    (background, surface, text, border) once each for light and dark
    mode. "Reset to default colors" clears all overrides again (incl.
    title, logo selection, and language — uploaded logo files themselves
    stay in place until explicitly removed).
  - **Language**: currently German/English, see the "Multi-language
    support (i18n)" section below.

## Multi-language support (i18n)

The entire interface (all pages, all JS-generated text) is built to be
translatable:

- **Dictionaries**: `i18n/de.json` and `i18n/en.json`, nested keys by
  area (`common.*` for cross-page reuse, `home.*`, `players.*`,
  `history.*`, `settings.*`, `pointsToTarget.*`, `pointsOpen.*`,
  `fixedRounds.*`, `rage.*`, `chooser.*`). Placeholders in curly braces
  (`{name}`) are replaced by `t()` via an object.
- **Loader** (`js/i18n.js`): loads the language selected in the global
  settings on page load, applies it to all `[data-i18n]` (text content),
  `[data-i18n-placeholder]`, `[data-i18n-title]`, and
  `[data-i18n-title-suffix]` (browser tab title, composed as "{brand
  name} — {text}") elements, and sets `<html lang="…">`. Provides
  `window.t(key, vars)` globally for JS-generated text as well as
  `window.scoreboardLocale()` (for `toLocaleString()` date formatting).
- **Load order**: every page includes `js/theme.js` and `js/i18n.js`
  before its own script. Page scripts that need `t()` during
  initialization wait on `window.scoreboardI18nReady` (a promise) instead
  of rendering immediately on load — otherwise `t()` might run with an
  empty dictionary.

**Adding a new language:**

1. Create `i18n/{code}.json` (e.g. `i18n/fr.json`), copy the structure of
   `de.json` 1:1 and translate every value.
2. Add the new code with a display name in
   `includes/settings.php::supported_languages()` (e.g.
   `'fr' => 'Français'`).
3. Done — the language automatically appears in the dropdown on the
   settings page. Nothing needs to change in `js/i18n.js` or the pages.
4. Also add a translated copy of this README as a new section below,
   following the "English below" pattern (e.g. "## Das Scoreboard
   (Français)"), so the docs cover every language the app supports.

## Hosting requirements

- PHP 8.x with the `pdo_sqlite` extension enabled.
- Write permissions for the `data/` folder.
- No mod_rewrite needed — the API runs on simple query parameters (e.g.
  `/api/games.php?id=5`), no pretty URLs, but robust on practically any
  hosting without `.htaccess` fine-tuning.

## Deployment

Upload the entire folder contents via FTP/SFTP to the webroot. The
SQLite file `data/scoreboard.sqlite` is created automatically on the
first request.

## Upgrading an existing installation

Every self-hosted installation can be safely updated without losing
saved games:

1. Upload the new code version via FTP/SFTP, making sure **not to
   overwrite/delete the `data/` folder** (that's where the SQLite
   database with all players, games, and rounds lives).
2. Done — on the next page load, `includes/db.php` automatically aligns
   the database schema (versioned migration system via `PRAGMA
   user_version`, see the comment there). Migrations are purely additive
   (new tables/columns), existing data is never deleted or overwritten.

For developers: always add new schema changes as a **new** migration
with the next-higher version number in `migrations()`, never modify an
existing migration afterwards — otherwise already-updated installations
would never run the change.

## Maintaining the version number

Set the `VERSION` file to the new value on every release — it's served
to every page via `/api/version.php` and shown in the bottom right
corner.

`js/version.js` additionally checks client-side against the GitHub API
(`releases/latest` of the repo configured in `UPDATE_CHECK_REPO`) for a
newer version, and shows a red link in the bottom right if one exists.
Results are cached per browser in `localStorage` for 1 day. As long as
the repo is private, the request (404) simply fails silently — once it's
made public, the notice works without any code change.

## Structure

See the tree above (folder layout is identical, only the code comments
in this README are in English/German respectively).
