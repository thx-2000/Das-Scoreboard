<?php

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

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS players (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            name   TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1
        )
    ');

    // Weiche Loeschung ueber "active", damit Namen in vergangenen Spielen
    // erhalten bleiben, auch wenn ein Spieler aus der Schnellauswahl entfernt wird.

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS games (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            mode         TEXT NOT NULL,
            label        TEXT,
            target_score INTEGER NOT NULL,
            status       TEXT NOT NULL DEFAULT "active",
            started_at   TEXT NOT NULL,
            ended_at     TEXT
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

    return $pdo;
}
