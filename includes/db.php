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

        // Team-Modus (nur die 3 Punkte-Modi, nicht RAGE): team_number
        // gruppiert Spieler eines Spiels zu Teams (NULL = kein Team, spielt
        // solo - unveraendertes Verhalten fuer alle bisherigen Spiele).
        // team_name ist ein optionaler manueller Name, der den automatisch
        // aus den Mitgliedsnamen gebildeten Anzeigenamen ueberschreibt.
        // Rundenwerte werden bewusst weiterhin pro Spieler in round_scores
        // gespeichert (identisch fuer alle Team-Mitglieder) - dadurch
        // bleiben get_totals()/recompute_game_status() unveraendert
        // nutzbar, die Team-Logik lebt ausschliesslich im Frontend
        // (ein Eingabefeld pro Team, Wert wird auf alle Mitglieder dupliziert).
        7 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(game_players)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            $toAdd = [
                'team_number' => 'ALTER TABLE game_players ADD COLUMN team_number INTEGER',
                'team_name' => 'ALTER TABLE game_players ADD COLUMN team_name TEXT',
            ];
            foreach ($toAdd as $columnName => $sql) {
                if (!in_array($columnName, $existing, true)) {
                    $pdo->exec($sql);
                }
            }
        },

        // Spieler-Avatar (Passfoto-Ausschnitt, siehe api/player-avatar.php):
        // avatar_ext haelt nur die Dateiendung (png/jpg) fest, analog zum
        // Logo-Upload - NULL bedeutet kein Avatar gesetzt.
        8 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(players)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            if (!in_array('avatar_ext', $existing, true)) {
                $pdo->exec('ALTER TABLE players ADD COLUMN avatar_ext TEXT');
            }
        },

        // Zweite Team-Modus-Variante (nur die 3 Punkte-Modi, nicht RAGE):
        // team_scoring legt je Spiel fest, wie Team-Punkte erfasst werden.
        // "shared" (Standard, unveraendertes bisheriges Verhalten): Team-
        // Mitglieder tragen gemeinsam einen Punktwert pro Runde ein.
        // "individual": jeder Spieler traegt eigene Punkte ein, das Team-
        // Ergebnis ist die Summe der Mitglieder - siehe build_game_state()
        // in state.php fuer die Standings-Berechnung je nach Modus.
        9 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(games)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            if (!in_array('team_scoring', $existing, true)) {
                $pdo->exec('ALTER TABLE games ADD COLUMN team_scoring TEXT NOT NULL DEFAULT "shared"');
            }
        },

        // Echtes Loeschen eines Spielers (zusaetzlich zum bisherigen weichen
        // Aktiv/Inaktiv-Umschalten): deleted_at = NULL bedeutet nicht
        // geloescht. Die Zeile bleibt bewusst in der Tabelle erhalten (wegen
        // der Fremdschluessel aus game_players/round_scores/games), damit
        // vergangene Spiele weiterhin den Namen anzeigen koennen - keine der
        // bestehenden Namens-Joins in state.php/stats.php filtert nach
        // active/deleted_at, das gilt ausschliesslich fuer die Listen in
        // api/players.php (Schnellauswahl-Verwaltung).
        10 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(players)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            if (!in_array('deleted_at', $existing, true)) {
                $pdo->exec('ALTER TABLE players ADD COLUMN deleted_at TEXT');
            }
        },

        // Spielergruppen: Spieler lassen sich zu wiederverwendbaren Gruppen
        // zusammenfassen (z.B. "Familie", "Stammtisch"), eine Person kann in
        // mehreren Gruppen sein. player_group_members ist eine reine n:m-
        // Zuordnungstabelle, ON DELETE CASCADE raeumt sie automatisch mit auf
        // (PRAGMA foreign_keys ist bereits in get_db() aktiv). Gruppen haben
        // anders als Spieler keine Historie-Verknuepfung zu Spielen - ein
        // echtes Loeschen ist deshalb unproblematisch, kein deleted_at noetig.
        11 => function (PDO $pdo) {
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS player_groups (
                    id     INTEGER PRIMARY KEY AUTOINCREMENT,
                    name   TEXT NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1
                )
            ');
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS player_group_members (
                    group_id  INTEGER NOT NULL REFERENCES player_groups(id) ON DELETE CASCADE,
                    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
                    PRIMARY KEY (group_id, player_id)
                )
            ');
        },

        // Drei neue Setup-Optionen (Mockup-Abgleich): target_bonus (nur
        // "Punkte bis Hoechstwert", Bonuspunkte bei Zielerreichung, wird
        // on-the-fly in get_effective_totals() addiert statt in rounds
        // gespeichert - bleibt so automatisch korrektursicher). allow_negative
        // (3 Punkte-Modi, nicht RAGE) sperrt bei false negative Rundenwerte
        // serverseitig in api/rounds.php - Default 1, damit sich am bisher
        // bereits unbeschraenkt moeglichen Verhalten fuer laufende Spiele
        // nichts aendert. rage_show_bonus_malus ist eine reine Anzeige-
        // Einstellung fuer die RAGE-Mini-Stepper-Karten, keine Rechenlogik
        // (Bonus/Rache werden unabhaengig davon immer verrechnet).
        12 => function (PDO $pdo) {
            $columns = $pdo->query('PRAGMA table_info(games)')->fetchAll(PDO::FETCH_ASSOC);
            $existing = array_column($columns, 'name');

            $toAdd = [
                'target_bonus' => 'ALTER TABLE games ADD COLUMN target_bonus INTEGER NOT NULL DEFAULT 0',
                'allow_negative' => 'ALTER TABLE games ADD COLUMN allow_negative INTEGER NOT NULL DEFAULT 1',
                'rage_show_bonus_malus' => 'ALTER TABLE games ADD COLUMN rage_show_bonus_malus INTEGER NOT NULL DEFAULT 1',
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
