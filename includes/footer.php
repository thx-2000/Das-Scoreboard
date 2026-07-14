<?php

/**
 * Gemeinsamer Seiten-Abschluss: Versionsanzeige + auf jeder Seite gleiche
 * Basis-Skripte, danach optionale Seiten-spezifische Skripte ueber
 * $page_scripts (Pfade relativ zum Projekt-Root, z.B. 'js/players.js').
 * $footer_class erlaubt Zusatzklassen an der Versionsanzeige (z.B.
 * 'no-print' auf der Statistik-Seite).
 */

$footerClass = 'app-version' . (!empty($footer_class) ? ' ' . $footer_class : '');
?>
  <p class="<?= htmlspecialchars($footerClass, ENT_QUOTES) ?>" id="app-version">Das Scoreboard</p>

  <script src="/js/version.js"></script>
  <script src="/js/theme.js"></script>
  <script src="/js/i18n.js"></script>
  <script src="/js/input-helpers.js"></script>
  <script src="/js/nav.js"></script>
<?php foreach ($page_scripts ?? [] as $script): ?>
  <script src="/<?= htmlspecialchars($script, ENT_QUOTES) ?>"></script>
<?php endforeach; ?>
</body>
</html>
