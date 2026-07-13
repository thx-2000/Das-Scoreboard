<?php

/**
 * Migrationssystem fuer Upgrade-Sicherheit
 * ==========================================
 * Jede Schema-Aenderung ist ein nummerierter Eintrag in migrations().
 * PRAGMA user_version (in der SQLite-Datei selbst gespeichert) merkt sich,
 * welche Migrationen bereits gelaufen sind. Bei jedem Request werden nur
 * die noch fehlenden Migrationen nachgefahren.
 *
 * Das ist die Grundlage fuer den Upgrade-Pfad: wer eine eigene Installation
 * betreibt, laedt beim Update einfach die neuen Code-Dateien hoch (ohne den
 * data/-Ordner anzufassen) - die SQLite-Datenbank samt aller gespeicherten
 * Spiele bleibt erhalten, das Schema wird beim naechsten Aufruf automatisch
 * und ohne Datenverlust auf den neuen Stand gebracht. Migrationen sind
 * additiv (CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN) und werden
 * nie rueckwirkend geaendert - eine bestehende Migration im Nachhinein zu
 * bearbeiten wuerde den Upgrade-Pfad fuer bereits aktualisierte Installationen
 * brechen. Fuer neue Schema-Aenderungen immer eine NEUE Migration mit der
 * naechsthoeheren Versionsnummer ergaenzen.
 *
 * @return array<int, callable(PDO): void>
 */
function migrations(): array
{
    return [
        1 => function (PDO $pdo) {
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS players (
                    id     INTEGER PRIMARY KEY AUTOINCREMENT,
                    name   TEXT NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1
                )
            ');

            // target_score = 0 bedeutet "kein Zielwert" (Modus "Offene
            // Punkterunde"), damit muss die Spalte selbst nicht NULL-faehig sein.
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS games (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    mode          TEXT NOT NULL,
                    label         TEXT,
                    target_score  INTEGER NOT NULL DEFAULT 0,
                    win_direction TEXT NOT NULL DEFAULT "highest",
                    status        TEXT NOT NULL DEFAULT "active",
                    started_at    TEXT NOT NULL,
                    ended_at      TEXT
                )
            ');

            $pdo->exec('
                CREATE TABLE IF NOT EXISTS game_players (
                    game_id   INTEGER NOT NULL REFERENCES games(id),
                    player_id INTEGER NOT NULL REFERENCES players(id),
                    PRIMARY KEY (game_id, player_id)
                )
            ');

            $pdo->exec('
                CREATE TABLE IF NOT EXISTS rounds (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id      INTEGER NOT NULL REFERENCES games(id),
                    round_number INTEGER NOT NULL,
                    created_at   TEXT NOT NULL
                )
            ');

            $pdo->exec('
                CREATE TABLE IF NOT EXISTS round_scores (
                    round_id  INTEGER NOT NULL REFERENCES rounds(id),
                    player_id INTEGER NOT NULL REFERENCES players(id),
                    points    INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (round_id, player_id)
                )
            ');
        },

        // Sieg-Richtung fuer den Modus "Offene Punkterunde" (highest/lowest).
        // Bei Installationen, die migrations() erst ab hier kennenlernen
        // (Tabellen existieren schon aus Migration 1), wird die Spalte
        // nachtraeglich ergaenzt statt die Tabelle neu anzulegen.
        2 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(games)')->fetchAll(PDO::FETCH_ASSOC);
            $hasColumn = false;
            foreach ($columns as $col) {
                if ($col['name'] === 'win_direction') {
                    $hasColumn = true;
                    break;
                }
            }
            if (!$hasColumn) {
                $pdo->exec('ALTER TABLE games ADD COLUMN win_direction TEXT NOT NULL DEFAULT "highest"');
            }
        },

        // Zufaellig bestimmter Startspieler pro Spiel (wird beim Anlegen
        // in games.php gesetzt, NULL fuer bereits laufende Altspiele).
        3 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(games)')->fetchAll(PDO::FETCH_ASSOC);
            $hasColumn = false;
            foreach ($columns as $col) {
                if ($col['name'] === 'starting_player_id') {
                    $hasColumn = true;
                    break;
                }
            }
            if (!$hasColumn) {
                $pdo->exec('ALTER TABLE games ADD COLUMN starting_player_id INTEGER REFERENCES players(id)');
            }
        },

        // Detailwerte fuer den Modus "RAGE": Ansage, tatsaechliche Stiche
        // und Sonderkarten-Zaehler je Spieler und Runde. "points" bleibt der
        // daraus berechnete Gesamtwert und macht get_totals()/Standings
        // weiterhin modusuebergreifend nutzbar, ohne sie anzufassen.
        4 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(round_scores)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            $toAdd = [
                'bid' => 'ALTER TABLE round_scores ADD COLUMN bid INTEGER',
                'actual_tricks' => 'ALTER TABLE round_scores ADD COLUMN actual_tricks INTEGER',
                'rage_bonus_count' => 'ALTER TABLE round_scores ADD COLUMN rage_bonus_count INTEGER NOT NULL DEFAULT 0',
                'rage_rache_count' => 'ALTER TABLE round_scores ADD COLUMN rage_rache_count INTEGER NOT NULL DEFAULT 0',
            ];
            foreach ($toAdd as $columnName => $sql) {
                if (!in_array($columnName, $existing, true)) {
                    $pdo->exec($sql);
                }
            }
        },

        // Globale Einstellungen (Farbpalette, Sprache) als einfacher
        // Key-Value-Speicher - bewusst generisch, damit sich spaeter weitere
        // Einstellungen ergaenzen lassen, ohne das Schema erneut zu aendern.
        5 => function (PDO $pdo) {
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS settings (
                    key   TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
            ');
        },

        // Modus "Punkterunde mit fester Rundenzahl": total_rounds ist die
        // vereinbarte (verlaengerbare) Zielrundenzahl, 0 = nicht relevant
        // fuer andere Modi. announce_round_end ist ein Opt-in je Spiel fuer
        // die "Runde X beendet"-Meldung nach jeder Runde (Default aus).
        6 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(games)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            $toAdd = [
                'total_rounds' => 'ALTER TABLE games ADD COLUMN total_rounds INTEGER NOT NULL DEFAULT 0',
                'announce_round_end' => 'ALTER TABLE games ADD COLUMN announce_round_end INTEGER NOT NULL DEFAULT 0',
            ];
            foreach ($toAdd as $columnName => $sql) {
                if (!in_array($columnName, $existing, true)) {
                    $pdo->exec($sql);
                }
            }
        },
    ];
}

function run_migrations(PDO $pdo): void
{
    $currentVersion = (int) $pdo->query('PRAGMA user_version')->fetchColumn();

    foreach (migrations() as $version => $migrate) {
        if ($version <= $currentVersion) {
            continue;
        }
        $migrate($pdo);
        $pdo->exec('PRAGMA user_version = ' . (int) $version);
    }
}

function get_db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbPath = __DIR__ . '/../data/scoreboard.sqlite';
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA foreign_keys = ON');
    // Ohne busy_timeout schlaegt ein Schreibzugriff bei gleichzeitigen
    // Requests (z.B. zwei Browsertabs speichern kurz hintereinander) sofort
    // mit "database is locked" fehl, statt kurz zu warten und es erneut zu
    // versuchen.
    $pdo->exec('PRAGMA busy_timeout = 5000');

    run_migrations($pdo);

    return $pdo;
}
