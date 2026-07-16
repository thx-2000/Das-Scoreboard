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

// Gespiegelt aus includes/settings.php::accent_color_palette() /
// bold_background_palette() - dort ist die eigentliche Quelle (auch fuer
// die Server-Validierung), hier nur fuers Anwenden der CSS-Variablen.
const ACCENT_COLOR_PALETTE = {
  green: ['#b6ff1a', '#8fd400'],
  orange: ['#ff8a3d', '#e0451c'],
  pink: ['#ff3daa', '#d4008a'],
  violet: ['#b088ff', '#8a5cf0'],
  cyan: ['#22d3ee', '#0ea5c4'],
};
const BOLD_BACKGROUND_PALETTE = {
  dark: ['#0b0d10', '#16191e', '#262b32'],
  dark_blue: ['#0a0e1a', '#141a2b', '#232c42'],
  black: ['#000000', '#121212', '#2a2a2a'],
};

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
    if (!response.ok || !data.settings) {
      return null; // z.B. 401 auf login.php (nicht angemeldet) - Standardfarben bleiben aktiv
    }
    settings = data.settings;
  } catch (err) {
    return null; // Standardfarben aus style.css und Standardtitel bleiben aktiv
  }

  document.querySelectorAll('[data-brand-name]').forEach((el) => {
    el.textContent = settings.app_title || 'Das Scoreboard';
  });

  applyLogo(settings);

  // "Bold Scorekeeper" und "Flip Board" sind komplett eigenstaendige Aussehen
  // mit eigenen Farb-Tokens (siehe css/style.css [data-theme-style="bold"]
  // bzw. [data-theme-style="flip"]) - die hier folgende individuelle
  // Hell/Dunkel-Farbanwendung fuer "classic" gilt bewusst nur dort, sonst
  // wuerden Inline-Styles (hoehere Spezifitaet als CSS-Selektoren) die
  // Bold-/Flip-Tokens ueberschreiben.
  const themeStyle = settings.theme_style === 'bold' || settings.theme_style === 'flip'
    ? settings.theme_style
    : 'classic';
  root.dataset.themeStyle = themeStyle;

  if (themeStyle === 'classic') {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const suffix = media.matches ? '_dark' : '_light';
      Object.entries(themePairs).forEach(([key, cssVar]) => {
        const value = settings[key + suffix];
        if (value) root.style.setProperty(cssVar, value);
      });
      Object.entries(singleValues).forEach(([key, cssVar]) => {
        const value = settings[key];
        if (value) root.style.setProperty(cssVar, value);
      });
    };

    apply();
    media.addEventListener('change', apply);
  } else if (themeStyle === 'bold') {
    // Bold: eigene, kuratierte Presets statt freier Hex-Eingabe (siehe
    // accent_color_picker in settings.php). Inline-Styles ueberschreiben
    // gezielt die festen Bold-Tokens aus css/style.css
    // [data-theme-style="bold"] - bei den jeweiligen Standardwerten
    // (green/dark) ist das wirkungsgleich zum bisherigen reinen CSS-Verhalten.
    const accent = ACCENT_COLOR_PALETTE[settings.bold_accent] || ACCENT_COLOR_PALETTE.green;
    root.style.setProperty('--color-green', accent[0]);
    root.style.setProperty('--color-green-strong', accent[1]);

    const background = BOLD_BACKGROUND_PALETTE[settings.bold_background] || BOLD_BACKGROUND_PALETTE.dark;
    root.style.setProperty('--color-bg', background[0]);
    root.style.setProperty('--color-surface', background[1]);
    root.style.setProperty('--color-border', background[2]);

    root.dataset.cardStyle = settings.bold_card_style === 'modern' ? 'modern' : 'classic';
  } else {
    // Flip Board: eigener, kleinerer Feldsatz (bg/surface/ink/akzent je
    // hell/dunkel, siehe includes/settings.php default_settings()) - folgt
    // wie Classic dem System-Farbschema, nicht fest auf dunkel wie Bold.
    // Die "-strong"-Variante des Akzents wird rein per CSS abgeleitet
    // (siehe css/style.css [data-theme-style="flip"]), keine eigene
    // Einstellung noetig.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const flipPairs = {
      flip_color_bg: '--color-bg',
      flip_color_surface: '--color-surface',
      flip_color_ink: '--color-text',
      flip_color_accent: '--color-green',
    };

    const apply = () => {
      const suffix = media.matches ? '_dark' : '_light';
      Object.entries(flipPairs).forEach(([key, cssVar]) => {
        const value = settings[key + suffix];
        if (value) root.style.setProperty(cssVar, value);
      });
    };

    apply();
    media.addEventListener('change', apply);
  }

  window.__scoreboardSettings = settings;
  return settings;
})();
