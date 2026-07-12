/**
 * Wendet die global gespeicherten Farbeinstellungen als CSS-Variablen und den
 * konfigurierbaren Titel als Markennamen an. Wird auf jeder Seite eingebunden
 * (wie version.js). Basis-Farben (Hell/Dunkel getrennt) reagieren auf einen
 * Wechsel des Systemfarbschemas zur Laufzeit; Akzent-/Funktionsfarben gelten
 * unveraendert in beiden Modi.
 *
 * window.scoreboardThemeReady ist ein Promise, das mit dem geladenen
 * Settings-Objekt aufloest (oder mit null bei Fehler) - andere Skripte
 * (i18n.js, version.js) warten darauf, um z.B. den Markennamen zu lesen.
 */
window.scoreboardThemeReady = (async function applyTheme() {
  const root = document.documentElement;

  // Theme-Paare: Settings-Schluessel (ohne _light/_dark) -> CSS-Variable.
  const themePairs = {
    color_bg: '--color-bg',
    color_surface: '--color-surface',
    color_text: '--color-text',
    color_text_muted: '--color-text-muted',
    color_border: '--color-border',
  };

  // Einzelwerte, identisch in Hell und Dunkel.
  const singleValues = {
    color_green: '--color-green',
    color_green_strong: '--color-green-strong',
    color_amber: '--color-amber',
    color_amber_strong: '--color-amber-strong',
    color_on_accent: '--color-on-accent',
    color_focus: '--color-focus',
    color_danger: '--color-danger',
  };

  let settings = null;
  try {
    const response = await fetch('/api/settings.php');
    const data = await response.json();
    settings = data.settings;
  } catch (err) {
    return null; // Standardfarben aus style.css und Standardtitel bleiben aktiv
  }

  document.querySelectorAll('[data-brand-name]').forEach((el) => {
    el.textContent = settings.app_title || 'Das Scoreboard';
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function apply() {
    const suffix = media.matches ? '_dark' : '_light';
    Object.entries(themePairs).forEach(([key, cssVar]) => {
      const value = settings[key + suffix];
      if (value) root.style.setProperty(cssVar, value);
    });
    Object.entries(singleValues).forEach(([key, cssVar]) => {
      const value = settings[key];
      if (value) root.style.setProperty(cssVar, value);
    });
  }

  apply();
  media.addEventListener('change', apply);

  window.__scoreboardSettings = settings;
  return settings;
})();
