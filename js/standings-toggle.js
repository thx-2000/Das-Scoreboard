/**
 * Erlaubt das Ein-/Ausklappen des sticky Punktestands in der Spielansicht -
 * auf schmalen Bildschirmen (z.B. iPhone Hochformat) nimmt die Tabelle sonst
 * zu viel Platz ein und laesst zu wenig Raum fuer die Rundenerfassung
 * darunter. Zustand wird pro Geraet in localStorage gemerkt (gilt fuer alle
 * Modi gemeinsam), damit er nicht bei jedem Spiel neu gesetzt werden muss.
 */
(function () {
  const STORAGE_KEY = 'scoreboard_standings_collapsed';
  const btn = document.getElementById('toggle-standings-btn');
  const content = document.getElementById('standings-collapsible');
  if (!btn || !content) return;

  function applyState(collapsed) {
    content.hidden = collapsed;
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.textContent = collapsed
      ? window.t('common.game.standings.expand')
      : window.t('common.game.standings.collapse');
  }

  let collapsed = window.localStorage.getItem(STORAGE_KEY) === '1';

  window.scoreboardI18nReady.then(() => applyState(collapsed));

  btn.addEventListener('click', () => {
    collapsed = !collapsed;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    applyState(collapsed);
  });
})();
