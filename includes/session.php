<?php

/**
 * Zentraler, gehaerteter Session-Start - von includes/auth.php, login.php
 * und logout.php genutzt (nicht nur auth.php, da login.php/logout.php
 * bewusst kein auth.php einbinden, siehe Kommentar dort). Ohne explizite
 * Cookie-Parameter haengen Secure/HttpOnly/SameSite vom php.ini-Default des
 * jeweiligen Hosters ab - hier stattdessen fest verdrahtet:
 * - httponly: Session-Cookie ist per JS (document.cookie) nicht auslesbar,
 *   schuetzt die Session selbst falls doch einmal eine XSS-Luecke auftritt.
 * - secure: Cookie wird nur ueber HTTPS uebertragen (Seite laeuft ohnehin
 *   nur unter https://, siehe README).
 * - samesite=Lax: Basisschutz gegen CSRF (Cookie wird bei von Fremdseiten
 *   ausgeloesten Cross-Site-Requests nicht mitgeschickt).
 * - use_strict_mode: PHP akzeptiert keine vom Client vorgegebene, nie
 *   initialisierte Session-ID mehr (Schutz gegen Session-Fixation).
 */
function scoreboard_session_start(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}
