# Das Scoreboard

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
  Konfiguration, gilt für alle, die die Seite nutzen. Drei Bereiche:
  - **Titel**: der angezeigte Name ("Das Scoreboard" als Standard) — erscheint
    im Kopfbereich jeder Seite und im Browser-Tab-Titel, unabhängig von der
    gewählten Sprache identisch (wird nicht übersetzt). Wer die Seite für
    eine eigene Gruppe betreibt, kann hier einen eigenen Namen eintragen.
  - **Farben**: komplette Palette einzeln per Hex-Eingabe + Farbwähler
    konfigurierbar. Akzent-/Funktionsfarben (Grün, Amber, Fokus, Fehler, …)
    gelten unverändert in Hell- und Dunkelmodus; Basis-Farben (Hintergrund,
    Fläche, Text, Rahmen) je einmal für Hell- und einmal für Dunkelmodus.
    "Auf Standardfarben zurücksetzen" löscht alle Overrides wieder (inkl.
    Titel und Sprache).
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
│   ├── settings.php            # GET/PATCH globale Einstellungen (Farben, Sprache)
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
│   └── history.js                # Logik des Spielverlaufs
├── data/                      # SQLite-Datei, per .htaccess geschützt
├── .htaccess
└── VERSION
```
