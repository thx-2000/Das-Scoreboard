<?php

/**
 * Eigenstaendige Login-Seite - bindet bewusst NICHT includes/header.php ein
 * (das wuerde ueber auth.php sofort wieder hierher zurueckleiten). Prueft
 * das Passwort direkt gegen access_password_hash und setzt bei Erfolg die
 * Session, bevor auf die urspruenglich angeforderte Seite zurueckgeleitet wird.
 */

require_once __DIR__ . '/includes/settings.php';
require_once __DIR__ . '/includes/session.php';

scoreboard_session_start();

$pdo = get_db();
$settings = get_settings($pdo);
$redirect = $_GET['redirect'] ?? '/index.php';
if (!str_starts_with($redirect, '/') || str_starts_with($redirect, '//')) {
    $redirect = '/index.php';
}

// Bereits angemeldet oder Zugangsschutz gar nicht aktiv - Login-Seite hier
// nicht noetig, direkt weiterleiten.
if (!empty($_SESSION['scoreboard_authenticated']) || $settings['access_enabled'] !== '1' || $settings['access_password_hash'] === '') {
    header('Location: ' . $redirect);
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string) ($_POST['password'] ?? '');
    if (password_verify($password, $settings['access_password_hash'])) {
        // Session-ID nach dem Rechte-Wechsel (nicht angemeldet -> angemeldet)
        // neu erzeugen - verhindert Session-Fixation (eine vorher vom
        // Angreifer bekannte Session-ID wuerde sonst nach dem Login gueltig).
        session_regenerate_id(true);
        $_SESSION['scoreboard_authenticated'] = true;
        header('Location: ' . $redirect);
        exit;
    }
    // Kuenstliche Verzoegerung bei falschem Passwort - bremst automatisiertes
    // Durchprobieren spuerbar aus (kein vollstaendiges Rate-Limiting, aber
    // fuer den Bedrohungsgrad dieser Single-Passwort-Loesung angemessen).
    usleep(500000);
    $error = 'Falsches Passwort.';
}

$appVersion = trim(file_get_contents(__DIR__ . '/VERSION'));

// Theme serverseitig aufloesen, siehe includes/header.php und
// includes/settings.php::resolve_theme_style() fuer die Begruendung.
$themeData = resolve_theme_style($settings);
$htmlThemeAttrs = ' data-theme-style="' . htmlspecialchars($themeData['themeStyle'], ENT_QUOTES) . '"';
if ($themeData['cardStyle']) {
    $htmlThemeAttrs .= ' data-card-style="' . htmlspecialchars($themeData['cardStyle'], ENT_QUOTES) . '"';
}
?><!DOCTYPE html>
<html lang="de"<?= $htmlThemeAttrs ?>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n-title-suffix="pages.login.title">Das Scoreboard</title>
  <link rel="stylesheet" href="/css/style.css?v=<?= urlencode($appVersion) ?>">
  <style><?= render_theme_style_css($themeData) ?></style>
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <meta name="theme-color" content="#f1f2f4">
</head>
<body>
  <a href="#main" class="skip-link" data-i18n="common.skipLink">Zum Inhalt springen</a>

  <main id="main" class="login-page">
    <section class="card login-card">
      <svg class="login-card__logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <rect x="5" y="4" width="17" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
        <line x1="9" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="9" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="9" y1="21" x2="14" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M21 8 L27 14 L18.5 22.5 L13.5 23.5 L14.5 18.5 Z" fill="var(--color-green)" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
      <h1 data-i18n="login.heading">Anmelden</h1>
      <p class="hint-text" data-i18n="login.hint">Diese Seite ist passwortgeschützt.</p>

      <?php if ($error !== ''): ?>
        <p class="login-card__error" role="alert" data-i18n="login.error">Falsches Passwort.</p>
      <?php endif; ?>

      <form method="post" class="form">
        <label for="login-password" data-i18n="login.passwordLabel">Passwort</label>
        <input type="password" id="login-password" name="password" autocomplete="current-password" autofocus required>
        <button type="submit" class="btn btn--primary" data-i18n="login.submitButton">Anmelden</button>
      </form>
    </section>
  </main>

  <p class="app-version" id="app-version">Das Scoreboard</p>

  <script src="/js/version.js?v=<?= urlencode($appVersion) ?>" defer></script>
  <script src="/js/theme.js?v=<?= urlencode($appVersion) ?>" defer></script>
  <script src="/js/i18n.js?v=<?= urlencode($appVersion) ?>" defer></script>
</body>
</html>
