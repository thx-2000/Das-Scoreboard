<?php

/**
 * Gemeinsamer Seiten-Abschluss: Versionsanzeige + auf jeder Seite gleiche
 * Basis-Skripte, danach optionale Seiten-spezifische Skripte ueber
 * $page_scripts (Pfade relativ zum Projekt-Root, z.B. 'js/players.js').
 * $footer_class erlaubt Zusatzklassen an der Versionsanzeige (z.B.
 * 'no-print' auf der Statistik-Seite).
 */

$footerClass = 'app-version' . (!empty($footer_class) ? ' ' . $footer_class : '');
// Gleicher Cache-Buster wie in includes/header.php (siehe Kommentar dort) -
// hier separat eingelesen, da footer.php unabhaengig von header.php
// eingebunden wird.
$appVersion = trim(file_get_contents(__DIR__ . '/../VERSION'));
?>
  <p class="<?= htmlspecialchars($footerClass, ENT_QUOTES) ?>" id="app-version">Das Scoreboard</p>

  <script src="/js/version.js?v=<?= urlencode($appVersion) ?>"></script>
  <script src="/js/theme.js?v=<?= urlencode($appVersion) ?>"></script>
  <script src="/js/i18n.js?v=<?= urlencode($appVersion) ?>"></script>
  <script src="/js/input-helpers.js?v=<?= urlencode($appVersion) ?>"></script>
  <script src="/js/nav.js?v=<?= urlencode($appVersion) ?>"></script>
<?php foreach ($page_scripts ?? [] as $script): ?>
  <script src="/<?= htmlspecialchars($script, ENT_QUOTES) ?>?v=<?= urlencode($appVersion) ?>"></script>
<?php endforeach; ?>
</body>
</html>
