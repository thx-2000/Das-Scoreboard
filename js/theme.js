/**
 * Wendet den konfigurierbaren Titel als Markennamen sowie ein optionales
 * Logo an. Die eigentliche Theme-Auswahl (Farben, data-theme-style) wird
 * seit VERSION 0.29.6 serverseitig gerendert (siehe includes/header.php +
 * includes/settings.php::resolve_theme_style()) - vorher fuehrte das
 * clientseitige Nachladen hier zu einem sichtbaren Wechsel vom
 * Classic-Standardlook zum eigentlich eingestellten Theme, sobald die
 * Einstellungen nach dem Seitenaufbau eintrafen.
 *
 * window.scoreboardThemeReady ist ein Promise, das mit dem geladenen
 * Settings-Objekt aufloest (oder mit null bei Fehler) - andere Skripte
 * (i18n.js, version.js) warten weiterhin darauf, um z.B. Sprache/Markennamen
 * zu lesen.
 */

// Ersetzt bei logo_mode "square" das Standard-Icon durch das hochgeladene
// Quadrat-Logo, oder fuegt bei "banner" ein Bild oberhalb des Headers ein.
// Bei "none" (Standard) oder fehlendem Upload passiert nichts - Icon/Header
// bleiben wie gehabt.
function applyLogo(settings) {
  if (settings.logo_mode === 'square' && settings.logo_square_ext) {
    const svg = document.getElementById('app-header-logo-svg');
    if (svg) {
      const img = document.createElement('img');
      img.src = '/api/logo.php?type=square';
      img.alt = '';
      img.className = 'app-header__logo app-header__logo--custom';
      svg.replaceWith(img);
    }
  } else if (settings.logo_mode === 'banner' && settings.logo_banner_ext) {
    const slot = document.getElementById('logo-banner-slot');
    if (slot) {
      const img = document.createElement('img');
      img.src = '/api/logo.php?type=banner';
      img.alt = '';
      slot.appendChild(img);
    }
  }
}

window.scoreboardThemeReady = (async function applyTheme() {
  let settings = null;
  try {
    const response = await fetch('/api/settings.php');
    const data = await response.json();
    if (!response.ok || !data.settings) {
      return null; // z.B. 401 auf login.php (nicht angemeldet)
    }
    settings = data.settings;
  } catch (err) {
    return null; // Standardtitel bleibt aktiv
  }

  document.querySelectorAll('[data-brand-name]').forEach((el) => {
    el.textContent = settings.app_title || 'Das Scoreboard';
  });

  applyLogo(settings);

  window.__scoreboardSettings = settings;
  return settings;
})();
