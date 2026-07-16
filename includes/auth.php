<?php

/**
 * Einfacher, geteilter Passwort-Schutz fuer die ganze App (kein User-System,
 * ein Passwort fuer alle). Wird als aller-erste Zeile in includes/header.php
 * (normale Seiten) UND in jeder api/*.php-Datei eingebunden, da API-Endpunkte
 * header.php nicht einbinden und sonst ungeschuetzt blieben.
 *
 * Reset ohne Passwort/E-Mail: existiert data/reset-password.txt (z.B. per
 * FTP hochgeladen), wird der Schutz deaktiviert und die Datei automatisch
 * geloescht - data/ ist per .htaccess vollstaendig vom Web aus gesperrt,
 * so eine Datei kann also nur anlegen, wer ohnehin Datei-Zugriff auf den
 * Server hat (FTP/SFTP/SSH), nie ein normaler Website-Besucher.
 */

require_once __DIR__ . '/settings.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function auth_check(): void
{
    $pdo = get_db();

    $resetFile = __DIR__ . '/../data/reset-password.txt';
    if (is_file($resetFile)) {
        save_settings($pdo, ['access_enabled' => '0']);
        $pdo->prepare('DELETE FROM settings WHERE key = ?')->execute(['access_password_hash']);
        @unlink($resetFile);
        $_SESSION = [];
    }

    $settings = get_settings($pdo);
    $required = ($settings['access_enabled'] ?? '0') === '1' && $settings['access_password_hash'] !== '';

    if (!$required || !empty($_SESSION['scoreboard_authenticated'])) {
        return;
    }

    $isApi = str_starts_with($_SERVER['SCRIPT_NAME'] ?? '', '/api/');
    if ($isApi) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Nicht angemeldet.']);
        exit;
    }

    $redirect = urlencode($_SERVER['REQUEST_URI'] ?? '/index.php');
    header('Location: /login.php?redirect=' . $redirect);
    exit;
}

auth_check();
