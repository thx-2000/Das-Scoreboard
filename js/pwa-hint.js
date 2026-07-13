/**
 * Blendet den "Als App nutzen"-Hinweis auf der Startseite nur ein, wenn eine
 * Installation ueberhaupt moeglich ist - bleibt z.B. auf einem Desktop-
 * Browser ohne Installationsunterstuetzung ausgeblendet. navigator.standalone
 * existiert ausschliesslich in iOS/iPadOS Safari (dort gibt es kein
 * beforeinstallprompt-Event, "Zum Home-Bildschirm" ist aber immer manuell
 * ueber das Teilen-Menue moeglich). Auf Chrome/Edge/Android ist das
 * beforeinstallprompt-Event das verlaesslichste Signal, dass der Browser eine
 * Installation aktiv anbietet.
 */
(function () {
  const section = document.getElementById('pwa-hint-section');
  if (!section) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (isStandalone) return;

  if (typeof window.navigator.standalone === 'boolean') {
    section.hidden = false;
    return;
  }

  window.addEventListener('beforeinstallprompt', () => {
    section.hidden = false;
  });
})();
