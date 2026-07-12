# Scoreboard

Aufschreibhilfe für Spieleabende. Reines PHP 8 + PDO/SQLite, kein Node,
keine separate Datenbank nötig — läuft auf normalem Webhosting per FTP-
Upload, Darstellung soll auf iPad und iPhone funktionieren.

## Konzept

- **Startseite**: Übersicht der verfügbaren Aufschreibmöglichkeiten
  ("Modi"), aktuell drei: *Punkte bis Höchstwert* (Beispiele: Flip7, Tutto),
  *Offene Punkterunde* (Beispiel: Doppelkopf) und *RAGE*.
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

## Struktur

```
Scoreboard/
├── index.html               # Startseite: Modi-Auswahl
├── players.html             # Spielerverwaltung
├── history.html              # Spielverlauf
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
│   └── version.php
├── includes/
│   ├── db.php                 # PDO-SQLite-Verbindung + Schema
│   ├── state.php               # buildState(), Sieg-Erkennung, JSON-Helper
│   └── rage.php                 # RAGE-Punkteformel
├── css/style.css
├── js/version.js
├── data/                      # SQLite-Datei, per .htaccess geschützt
├── .htaccess
└── VERSION
```
