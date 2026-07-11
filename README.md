# Scoreboard

Aufschreibhilfe für Spieleabende. Reines PHP 8 + PDO/SQLite, kein Node,
keine separate Datenbank nötig — läuft auf normalem Webhosting per FTP-
Upload, genau wie die PHP-Variante von PingPongGewinnt.

## Konzept

- **Startseite**: Übersicht der verfügbaren Aufschreibmöglichkeiten
  ("Modi"), aktuell zwei: *Punkte bis Höchstwert* (Beispiel: Flip7) und
  *Offene Punkterunde* (Beispiel: Doppelkopf).
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
│   └── points-open/
│       ├── setup.html        # neues Spiel einrichten (Sieg-Richtung)
│       ├── setup.js
│       ├── game.html         # aktives/beendetes Spiel, manuelles Beenden
│       └── game.js
├── api/
│   ├── players.php           # GET/POST/PATCH Spieler-Roster
│   ├── games.php              # GET/POST Spiele (Liste + Detail + Anlegen)
│   ├── rounds.php              # POST/PATCH/DELETE Runden
│   └── version.php
├── includes/
│   ├── db.php                 # PDO-SQLite-Verbindung + Schema
│   └── state.php               # buildState(), Sieg-Erkennung, JSON-Helper
├── css/style.css
├── js/version.js
├── data/                      # SQLite-Datei, per .htaccess geschützt
├── .htaccess
└── VERSION
```
