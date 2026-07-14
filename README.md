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
- **Header/Navigation**: gemeinsam für alle Seiten aus `includes/header.php`
  + `includes/nav.php` gerendert (PHP-Includes statt Markup-Duplikat je
  Seite) — ein neuer/geänderter Nav-Eintrag wird nur an einer Stelle
  gepflegt. Auf schmalen Bildschirmen (Smartphone) klappt die Navigation
  hinter ein Burger-Menü zusammen (`js/nav.js`); auf iPad Portrait bleibt
  sie in einer Zeile sichtbar. Eine `.htaccess`-Weiterleitung hält alte
  `*.html`-Lesezeichen und bereits installierte PWA-Homescreen-Icons
  funktionsfähig (Seiten liefen früher als statisches HTML, jetzt als
  `.php` mit den gemeinsamen Includes).
- **Spielerverwaltung** (`players.php`): zentrale Namens-Datenbank, aus der
  bei neuen Spielen ausgewählt werden kann, statt Namen jedes Mal neu zu
  tippen. Zwei unterschiedliche Stufen zum Entfernen:
  - **Entfernen** (weiche Löschung): Spieler verschwindet aus der
    Schnellauswahl, bleibt aber in der Spielerverwaltung (unter
    "Deaktivierte Spieler") sichtbar und jederzeit per "Reaktivieren"
    rückgängig machbar.
  - **Löschen** (echte Löschung): Spieler verschwindet komplett aus der
    Spielerverwaltung (weder Aktiv- noch Deaktiviert-Liste) — dafür gibt
    es keinen Weg zurück in der Oberfläche. Vergangene Spiele/Verlauf/
    Statistik zeigen den Namen trotzdem weiterhin an, da der Datensatz
    selbst (wegen der Fremdschlüssel aus Spielen/Runden) erhalten bleibt,
    nur mit `deleted_at` markiert. Ein erneut angelegter Spieler mit
    gleichem Namen wird bewusst ohne Abgleich als komplett neuer,
    unabhängiger Datensatz angelegt (keine Zusammenführungslogik) — im
    Zweifel hilft die Datensicherung (siehe unten) beim Wiederherstellen.
- **Spielverlauf** (`history.php`): alle Spiele (laufend + beendet),
  unterscheidbar über Start-/Endzeit, damit auch mehrere Spiele am selben
  Tag eindeutig auffindbar sind.
- **Modus "Punkte bis Höchstwert"** (`modes/points-to-target/`): Punkte
  werden rundenweise für alle Spieler gemeinsam erfasst (0 ist normal, z.B.
  bei einem Bust). Sobald jemand den Zielwert erreicht/überschreitet, endet
  das Spiel automatisch — diese Ziel-Erreichung ist unabhängig von der
  Sieg-Richtung. Beim Einrichten wird festgelegt, ob dann die höchste
  (Standard, z.B. Flip7, Tutto) oder die niedrigste Punktzahl gewinnt (z.B.
  Skyjo — bei Gleichstand mehrere Sieger möglich). Korrektur ist jederzeit
  direkt in der Rundenverlauf-Tabelle möglich und reaktiviert ein bereits
  beendetes Spiel automatisch, falls der Zielwert dadurch unterschritten
  wird.
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
- **Tool "Wer fängt an?"** (`tools/finger-chooser.php`): Multitouch-
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
  App, ohne Adressleiste. Ein Hinweis dazu erscheint auf der Startseite,
  aber nur, wenn eine Installation dort auch tatsächlich möglich ist (auf
  iOS/iPadOS Safari immer, auf Chrome/Edge/Android nur wenn der Browser
  das `beforeinstallprompt`-Event auslöst) — auf einem Desktop-Browser
  ohne Installationsunterstützung bleibt er unsichtbar. Name/Icon im
  Manifest sind aktuell statisch (Standardtitel "Das Scoreboard",
  Stift-Symbol) und folgen einem in den Einstellungen geänderten
  Titel/Logo (noch) nicht automatisch.
- **Ton beim Speichern**: kurzer, per Web-Audio-API synthetisierter Ton
  (keine Audiodatei nötig) beim Speichern einer neuen Runde, in allen 4
  Modi. Zusätzlich Vibration, wo vom Gerät unterstützt — auf iPhone/iPad
  grundsätzlich nicht möglich (Safari implementiert die Vibration-API
  nicht, auch nicht im PWA-Modus), der Ton funktioniert dort aber normal.
  In den Einstellungen abschaltbar (Standard: an).
- **Zahlenfelder-UX**: Alle Punkte-/Zahleneingabefelder (Rundenerfassung,
  Korrektur-Tabelle, Einrichten-Formulare) markieren ihren Inhalt
  automatisch beim Fokussieren — direkt lostippen überschreibt den
  bisherigen Wert, ohne ihn erst manuell markieren oder löschen zu müssen.
  Auf Mobilgeräten öffnet sich dabei die numerische Tastatur
  (`inputmode="numeric"`).
- **Ein-/ausklappbarer Punktestand**: Der sticky Punktestand oben in der
  Spielansicht lässt sich per Knopf einklappen (zeigt dann nur die
  Überschrift) und wieder anzeigen — wichtig auf kleinen Bildschirmen
  (z.B. iPhone Hochformat), wo die volle Tabelle sonst zu viel Platz für
  die Rundenerfassung darunter wegnimmt. Zustand wird pro Gerät in
  `localStorage` gemerkt, gilt modusübergreifend.
- **Kompaktere Rundentabelle auf schmalen Bildschirmen**: Innenabstand,
  Schrift und Eingabefeld-Breite in der Rundenverlauf-Tabelle schrumpfen
  unterhalb 480px Breite, zusätzlich reicht die Tabelle bis an den
  Kartenrand — reduziert bzw. vermeidet seitliches Scrollen bei den
  ueblichen 2-4 Spielern in den 3 Punkte-Modi. Bei RAGE (5 Spalten pro
  Spieler in der Korrektur-Tabelle) bleibt seitliches Scrollen je nach
  Spielerzahl weiterhin nötig — das ist strukturell bedingt und wurde
  nicht extra behoben.
- **Team-Modus** (nur in den 3 Punkte-Modi, nicht bei RAGE): Beim Einrichten
  lassen sich Spieler unter "Erweiterte Optionen" zu Teams gruppieren.
  Teamname wird automatisch aus den Mitgliedsnamen gebildet ("Alice &
  Bob") oder lässt sich beim Einrichten frei vergeben. Zwei Varianten der
  Punkte-Erfassung stehen zur Wahl:
  - **Gemeinsamer Punktwert** (Standard): Team-Mitglieder tragen pro
    Runde nur noch einen gemeinsamen Punktwert ein (ein Eingabefeld statt
    eines pro Spieler), der beim Speichern für alle Mitglieder übernommen
    wird. In der Korrektur-Tabelle bleibt jeder Spieler einzeln sichtbar
    (Transparenz), Korrekturen werden aber automatisch an alle
    Team-Mitglieder der Runde angeglichen, damit die Werte nicht
    auseinanderlaufen.
  - **Einzelne Punkte, gemeinsame Summe**: jeder Spieler trägt weiterhin
    eigene Punkte ein wie ohne Team-Modus (ein Eingabefeld pro Spieler,
    unabhängige Werte, kein Korrektur-Sync). Im Punktestand bleibt jeder
    Spieler eine eigene Zeile, zeigt zusätzlich die Team-Zugehörigkeit und
    die Team-Summe an — Rang und Sieg werden anhand der Team-Summe
    ermittelt, auch für die automatische Ziel-Erreichung bei "Punkte bis
    Höchstwert".

  Bestehende Spiele ohne Teams sind unverändert (jeder spielt weiterhin
  solo).
- **Spieler-Avatar**: In der Spielerverwaltung lässt sich pro Spieler ein
  Foto hochladen (PNG/JPEG, max. 2 MB) — nur im Passfoto-Hochformat 2:3
  möglich. Ein Ausschnitts-Auswahl-Dialog (Ziehen zum Verschieben, Regler
  zum Zoomen, reines Canvas ohne externe Bibliothek) erzwingt das
  Seitenverhältnis direkt beim Upload. Das Foto erscheint danach in der
  Spielerverwaltung sowie im Punktestand aller 4 Modi (bei Team-Zeilen im
  Team-Modus bewusst nicht, da unklar wäre, wessen Foto stellvertretend
  gezeigt werden sollte). Ohne Foto bleibt es beim bisherigen Verhalten.
- **Statistiken** (`stats.php`): modusübergreifende Auswertung aller
  Spiele — Spiele/Siege/Siegquote/aktuelle und längste Sieges-Serie pro
  Spieler, dieselbe Auswertung zusätzlich pro Modus (inkl.
  Punkteschnitt, da die Punkteskalen der Modi nicht direkt vergleichbar
  sind), Kopf-an-Kopf-Vergleich aller Spielerpaare mit gemeinsamen
  Spielen, sowie eine Liste der Spiele im gewählten Zeitraum. Optionaler
  Von/Bis-Zeitraumfilter (Datum + Uhrzeit) erlaubt eine Auswertung nur
  für einen bestimmten Spieleabend — auch wenn dieser über die
  Mitternachtsgrenze hinausgeht (z.B. 18:00 bis 03:00 des Folgetags),
  da der Filter auf echten Zeitstempeln statt auf Kalendertagen
  arbeitet. Ein "Drucken / PDF"-Knopf nutzt den normalen Browser-Druck
  (eigenes Druck-Stylesheet blendet Navigation/Formulare aus) — direkter
  Weg zu einem PDF-Ausdruck ohne zusätzliche Abhängigkeit.
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
- **Einstellungen** (`settings.php`): global gespeicherte (serverseitige)
  Konfiguration, gilt für alle, die die Seite nutzen. Mehrere Bereiche:
  - **Aussehen**: Wahl zwischen zwei eigenständigen Themes — "Classic"
    (Standard, der bisherige Look, individuell per Hex-Farben anpassbar) und
    "Bold Scorekeeper" (zweites, dunkles, hochkontrastiges Theme mit fest
    vorgegebener Neon-Lime/Cyan/Purple/Orange-Palette, nicht per Hex
    anpassbar). Technisch teilen sich beide Themes dieselbe HTML/JS-Struktur
    je Seite — das Theme setzt nur `[data-theme-style]` auf `<html>`
    (`js/theme.js`) und schaltet darüber CSS-Tokens um (`css/style.css`,
    Abschnitt "Bold Scorekeeper Theme"); Classic bleibt dabei unverändert.
    Layout-/Bedienungs-Umbauten je Seite (grosse Touch-Ziele, Karten statt
    Tabellen, Stepper-Eingaben, …) für Bold Scorekeeper folgen schrittweise
    in eigenen Releases — aktuell recolort das Theme nur die bestehende
    Seiten-Struktur.
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
  - **Farben** (nur für "Classic", bei aktivem "Bold Scorekeeper" ausgeblendet):
    komplette Palette einzeln per Hex-Eingabe + Farbwähler konfigurierbar.
    Akzent-/Funktionsfarben (Grün, Amber, Fokus, Fehler, …) gelten
    unverändert in Hell- und Dunkelmodus; Basis-Farben (Hintergrund, Fläche,
    Text, Rahmen) je einmal für Hell- und einmal für Dunkelmodus.
    "Auf Standardfarben zurücksetzen" löscht alle Overrides wieder (inkl.
    Titel, Logo-Auswahl, Sprache und Theme-Wahl — hochgeladene Logo-Dateien
    selbst bleiben aber liegen, bis sie explizit entfernt werden).
  - **Sprache**: aktuell Deutsch/Englisch, siehe Abschnitt
    "Mehrsprachigkeit (i18n)" unten.
  - **Daten-Sicherung** (`api/backup.php`): "Backup herunterladen" erzeugt
    eine ZIP-Datei mit einem konsistenten Snapshot der SQLite-Datenbank
    (`VACUUM INTO`, respektiert den WAL-Mode statt die Datei roh zu
    kopieren) sowie allen Avatar-Bildern und Logo-Dateien — gedacht für
    einen Server-Umzug oder einfach als Sicherheitsnetz. "Backup
    importieren" ERSETZT beim Hochladen einer solchen ZIP-Datei die
    komplette aktuelle Datenbank samt Bildern; wegen dieser Tragweite ist
    eine serverseitig geprüfte Textbestätigung (Eingabe von "ERSETZEN")
    zusätzlich zur Bestätigung im Browser nötig. Vor dem Ersetzen wird der
    bisherige Stand automatisch lokal unter
    `data/pre-import-backup-{Zeitstempel}/` weggesichert (kein UI-Zugriff
    darauf, rein als zusätzliches Sicherheitsnetz). Die hochgeladene Datei
    wird auf Integrität geprüft (`PRAGMA integrity_check` + erwartete
    Kern-Tabellen), bevor irgendetwas ersetzt wird; nach dem Import laufen
    automatisch alle noch fehlenden Migrationen, falls das Backup von einer
    älteren Version stammt.

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
├── index.php                 # Startseite: Modi-Auswahl
├── players.php               # Spielerverwaltung
├── history.php                # Spielverlauf
├── stats.php                  # Statistiken (Zeitraumfilter, Kopf-an-Kopf, Drucken/PDF)
├── settings.php                # globale Einstellungen (Aussehen, Farben, Sprache, Backup)
├── modes/
│   ├── points-to-target/
│   │   ├── setup.php         # neues Spiel einrichten (Zielwert)
│   │   ├── setup.js
│   │   ├── game.php          # aktives/beendetes Spiel
│   │   └── game.js
│   ├── points-open/
│   │   ├── setup.php         # neues Spiel einrichten (Sieg-Richtung)
│   │   ├── setup.js
│   │   ├── game.php          # aktives/beendetes Spiel, manuelles Beenden
│   │   └── game.js
│   ├── fixed-rounds/
│   │   ├── setup.php         # neues Spiel einrichten (Rundenzahl, Sieg-Richtung)
│   │   ├── setup.js
│   │   ├── game.php          # Runde X von Y, Zielerreicht-Hinweis (beenden/verlaengern)
│   │   └── game.js
│   └── rage/
│       ├── setup.php         # neues Spiel einrichten (nur Spielerauswahl)
│       ├── setup.js
│       ├── game.php          # Runde X von 10, Ansage/Stiche/Sonderkarten
│       └── game.js
├── tools/
│   ├── finger-chooser.php    # "Wer fängt an?" Multitouch-Auswahl
│   └── finger-chooser.js
├── api/
│   ├── players.php           # GET/POST/PATCH Spieler-Roster
│   ├── games.php              # GET/POST/PATCH/DELETE Spiele
│   ├── rounds.php              # POST/PATCH/DELETE Runden (einfache Punkte)
│   ├── rage-rounds.php         # POST/PATCH/DELETE Runden (RAGE: Ansage/Stiche/Sonderkarten)
│   ├── settings.php            # GET/PATCH globale Einstellungen (Titel, Logo, Farben, Sprache)
│   ├── logo.php                 # GET/POST/DELETE Logo-Upload (Quadrat/Banner)
│   ├── player-avatar.php         # GET/POST/DELETE Spieler-Avatar (Passfoto 2:3)
│   ├── backup.php                 # GET Backup-ZIP-Export, POST Backup-Import (ersetzend)
│   ├── stats.php                   # GET Statistiken (optionaler from/to-Zeitfilter)
│   └── version.php
├── includes/
│   ├── db.php                 # PDO-SQLite-Verbindung + Schema
│   ├── state.php               # buildState(), Sieg-Erkennung, JSON-Helper
│   ├── rage.php                 # RAGE-Punkteformel
│   ├── settings.php              # Defaults, Validierung, get/save/reset
│   ├── nav.php                    # zentrale Nav-Konfiguration + render_nav()
│   ├── header.php                  # gemeinsamer Head + <header> (Marke, Nav) fuer alle Seiten
│   └── footer.php                   # gemeinsamer Seitenabschluss (Basis-Skripte, Versionsanzeige)
├── i18n/
│   ├── de.json                 # deutsches Wörterbuch
│   └── en.json                 # englisches Wörterbuch
├── css/style.css
├── js/
│   ├── version.js              # Versionsanzeige unten rechts
│   ├── theme.js                # wendet Aussehen (Classic/Bold) + Farbeinstellungen als CSS-Variablen an
│   ├── i18n.js                  # laedt Sprachwoerterbuch, stellt t() bereit
│   ├── nav.js                    # Burger-Menue-Toggle fuer schmale Bildschirme
│   ├── settings.js              # Logik der Einstellungen-Seite
│   ├── players.js               # Logik der Spielerverwaltung
│   ├── history.js                # Logik des Spielverlaufs
│   ├── stats.js                   # Logik der Statistik-Seite
│   ├── feedback.js               # Ton/Vibration beim Rundenspeichern (nur Spielansichten)
│   ├── input-helpers.js          # Auto-Select in Zahlenfeldern beim Fokussieren
│   ├── pwa-hint.js                # Blendet PWA-Hinweis nur bei moeglicher Installation ein (nur Startseite)
│   ├── standings-toggle.js        # Ein-/Ausklappen des Punktestands (nur Spielansichten)
│   ├── team-setup.js              # Team-Zuordnung im Setup (nur 3 Punkte-Modi, nicht RAGE)
│   ├── team-helpers.js            # Spieler zu Team-Gruppen buendeln (nur 3 Punkte-Modi, nicht RAGE)
│   ├── avatar-cropper.js          # Pan/Zoom-Crop-Modal fuer Avatar-Upload (2:3)
│   └── avatar-helpers.js          # Avatar-<img>-Markup fuer den Punktestand (alle 4 Modi)
├── data/                      # SQLite-Datei + Logo-/Avatar-Uploads, per .htaccess geschützt
├── assets/
│   └── icons/                 # PWA-Icons (icon-192.png, icon-512.png, apple-touch-icon.png)
├── manifest.json               # PWA-Manifest ("Zum Home-Bildschirm hinzufügen")
├── .htaccess                   # Sicherheits-Blocks + .html→.php-Weiterleitung (alte Lesezeichen/PWA-Icons)
└── VERSION
```

Seiten liegen als `.php` vor (nicht statisches HTML): gemeinsamer Header/Nav via
`includes/header.php`/`includes/nav.php`/`includes/footer.php`, damit
Navigations-Änderungen nur an einer Stelle gepflegt werden müssen statt in
jeder Seite dupliziert zu sein. Eine `.htaccess`-Weiterleitung leitet alte
`*.html`-Aufrufe (Lesezeichen, bereits installierte PWA-Icons) transparent
auf die passende `.php`-Datei um.

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
- **Header/navigation**: rendered for every page from `includes/header.php`
  + `includes/nav.php` (PHP includes instead of duplicated markup per
  page) — a new/changed nav entry only needs to be maintained in one
  place. On narrow screens (phone) the navigation collapses behind a
  burger menu (`js/nav.js`); on iPad portrait it stays visible in one row.
  An `.htaccess` rewrite keeps old `*.html` bookmarks and already-installed
  PWA home-screen icons working (pages used to be static HTML, now they're
  `.php` with the shared includes).
- **Player management** (`players.php`): central name database to pick
  from when starting new games instead of typing names every time. Two
  different removal levels:
  - **Remove** (soft delete): player disappears from quick selection but
    stays visible in player management (under "Deactivated players") and
    can be undone anytime via "Reactivate".
  - **Delete** (hard delete): player disappears entirely from player
    management (neither the active nor deactivated list) — there is no
    way back in the UI. Past games/history/stats still show the name,
    since the row itself is kept (due to foreign keys from games/rounds),
    just marked with `deleted_at`. A newly added player with the same
    name is deliberately created as a completely new, independent record
    with no matching logic — if needed, the backup feature (see below)
    helps restore a mistake.
- **Game history** (`history.php`): all games (ongoing + finished),
  distinguishable by start/end time, so multiple games on the same day
  stay uniquely identifiable.
- **Mode "Points to target"** (`modes/points-to-target/`): points are
  entered round by round for all players together (0 is normal, e.g. on a
  bust). As soon as someone reaches/exceeds the target value, the game
  ends automatically — this trigger is independent of the win direction.
  During setup you decide whether the highest (default, e.g. Flip7, Tutto)
  or the lowest score then wins (e.g. Skyjo — ties allow multiple
  winners). Correction is always possible directly in the round history
  table and automatically reactivates an already-finished game if the
  target is no longer reached as a result.
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
- **Tool "Who starts?"** (`tools/finger-chooser.php`): multitouch finger
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
  bar. A hint about this is shown on the home page, but only when
  installation is actually possible there (always on iOS/iPadOS Safari,
  on Chrome/Edge/Android only once the browser fires the
  `beforeinstallprompt` event) — stays hidden on a desktop browser
  without install support. Name/icon in the manifest are currently
  static (default title "Das Scoreboard", pen icon) and don't (yet)
  automatically follow a title/logo changed in settings.
- **Sound on save**: short tone synthesized via the Web Audio API (no
  audio file needed) when saving a new round, in all 4 modes. Also
  triggers vibration where supported by the device — not possible on
  iPhone/iPad at all (Safari doesn't implement the Vibration API, even in
  PWA mode), but the sound works there normally. Toggleable in settings
  (default: on).
- **Number field UX**: all point/number entry fields (round entry,
  correction table, setup forms) auto-select their content on focus —
  typing immediately overwrites the previous value without having to
  select or delete it manually first. On mobile devices this also brings
  up the numeric keyboard (`inputmode="numeric"`).
- **Collapsible standings**: the sticky standings card at the top of the
  game view can be collapsed to just its heading and expanded again via a
  button — useful on small screens (e.g. iPhone portrait), where the full
  table otherwise leaves too little room for round entry below. State is
  remembered per device in `localStorage`, shared across all modes.
- **More compact round history table on narrow screens**: padding, font
  size and input width in the round history/correction table shrink below
  480px width, and the table also bleeds to the card edge — reduces or
  avoids horizontal scrolling for the usual 2-4 players in the 3
  point-based modes. RAGE (5 columns per player in the correction table)
  still needs horizontal scrolling depending on player count — that's a
  structural limitation and wasn't specifically addressed.
- **Team mode** (only in the 3 point-based modes, not RAGE): during setup,
  players can be grouped into teams under "Advanced options". The team
  name is auto-generated from member names ("Alice & Bob") or can be set
  freely during setup. Two team-scoring variants are available:
  - **Combined score** (default): team members enter just one combined
    score per round (one input field instead of one per player), which
    gets applied to every member on save. The correction table still
    shows every player individually (for transparency), but correcting
    one team member's score automatically syncs it to their teammates for
    that round so the values can't drift apart.
  - **Individual scores, combined total**: each player still enters their
    own score, just like without team mode (one input field per player,
    independent values, no correction sync). In the standings, every
    player keeps their own row but additionally shows their team
    affiliation and the team's combined total — rank and winning are
    determined by the team total, including the automatic target
    detection in "Points to target".

  Existing games without teams are unaffected (everyone still plays
  solo).
- **Player avatar**: player management lets you upload a photo per player
  (PNG/JPEG, max. 2 MB) — only allowed in passport-photo portrait format
  2:3. A crop-selection dialog (drag to pan, slider to zoom, plain canvas,
  no external library) enforces that aspect ratio right at upload time.
  The photo then shows up in player management and in the standings of
  all 4 modes (deliberately not on team rows in team mode, since it's
  unclear whose photo should represent the team). Without a photo,
  behavior is unchanged from before.
- **Statistics** (`stats.php`): cross-mode evaluation of all games —
  games/wins/win rate/current and longest win streak per player, the
  same breakdown per mode as well (including average score, since score
  scales aren't directly comparable across modes), head-to-head records
  for every pair of players with shared games, and a list of the games
  in the selected time range. An optional from/to time range filter
  (date + time) lets you evaluate just one specific game night — even if
  it crosses midnight (e.g. 18:00 to 03:00 the next day), since the
  filter compares actual timestamps rather than calendar days. A "Print
  / PDF" button uses the browser's normal print dialog (a dedicated
  print stylesheet hides navigation/forms) — a direct path to a PDF
  printout without an extra dependency.
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
- **Settings** (`settings.php`): globally stored (server-side)
  configuration, applies to everyone using the page. Several areas:
  - **Appearance**: choice between two independent themes — "Classic"
    (default, the existing look, individually customizable via hex colors)
    and "Bold Scorekeeper" (a second, dark, high-contrast theme with a
    fixed neon-lime/cyan/purple/orange palette, not hex-customizable).
    Technically both themes share the same HTML/JS structure per page — the
    theme only sets `[data-theme-style]` on `<html>` (`js/theme.js`), which
    switches CSS tokens (`css/style.css`, "Bold Scorekeeper Theme" section);
    Classic stays unchanged. Layout/usability rework per page (large touch
    targets, cards instead of tables, stepper inputs, …) for Bold
    Scorekeeper follows step by step in its own releases — for now the
    theme only recolors the existing page structure.
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
  - **Colors** (only for "Classic", hidden while "Bold Scorekeeper" is
    active): the complete palette individually configurable via hex input +
    color picker. Accent/function colors (green, amber, focus, error, …)
    stay the same in light and dark mode; base colors (background, surface,
    text, border) once each for light and dark mode. "Reset to default
    colors" clears all overrides again (incl. title, logo selection,
    language, and theme choice — uploaded logo files themselves stay in
    place until explicitly removed).
  - **Language**: currently German/English, see the "Multi-language
    support (i18n)" section below.
  - **Data backup** (`api/backup.php`): "Download backup" produces a ZIP
    file with a consistent snapshot of the SQLite database (`VACUUM INTO`,
    respects WAL mode instead of copying the raw file) plus all avatar
    images and logo files — meant for moving to a new server or simply as
    a safety net. "Import backup" REPLACES the entire current database
    and its images with the contents of an uploaded ZIP file; given the
    impact, a server-checked text confirmation (typing "ERSETZEN") is
    required in addition to the browser confirmation. Before replacing
    anything, the previous state is automatically backed up locally under
    `data/pre-import-backup-{timestamp}/` (not exposed in the UI, purely
    an extra safety net). The uploaded file is validated for integrity
    (`PRAGMA integrity_check` plus the expected core tables) before
    anything is replaced; any still-missing migrations run automatically
    after the import in case the backup came from an older version.

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
