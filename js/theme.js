/**
 * Wendet die global gespeicherten Farbeinstellungen als CSS-Variablen an.
 * Wird auf jeder Seite eingebunden (wie version.js). Basis-Farben (Hell/
 * Dunkel getrennt) reagieren auf einen Wechsel des Systemfarbschemas zur
 * Laufzeit; Akzent-/Funktionsfarben gelten unveraendert in beiden Modi.
 */
(async function applyTheme() {
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

  let settings;
  try {
    const response = await fetch('/api/settings.php');
    const data = await response.json();
    settings = data.settings;
  } catch (err) {
    return; // Standardfarben aus style.css bleiben aktiv
  }

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
})();
