/**
 * Einfarbige Linien-Icons fuer eigene Spiele-Presets - gespiegelt aus
 * includes/settings.php::preset_icon_svg_paths() (dort Quelle fuers
 * Formular, hier fuer Startseite/Einstellungen-Liste). Bewusst kein Emoji
 * (wirkte zu bunt/generisch), stattdessen dieselbe schlichte SVG-Optik wie
 * die eingebauten Modus-Icons. Beide Seiten muessen bei Aenderungen
 * synchron bleiben.
 */
const PRESET_ICON_SVGS = {
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
  star: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.4-5.6 3.4 1.4-6.3-4.8-4.3 6.4-.6z" stroke-linejoin="round"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10.5h16M4 15.5h16M10.5 4v16M15.5 4v16"/>',
  flame: '<path d="M4 20l6-16 4 10 4-6 2 12" stroke-linecap="round" stroke-linejoin="round"/>',
  controller: '<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 11v4M6 13h4" stroke-linecap="round"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
  bolt: '<path d="M13 3 4 14h6l-1 7 9-11h-6z" stroke-linejoin="round"/>',
  clover: '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M12 12v8" stroke-linecap="round"/>',
  gem: '<path d="M12 2l7 7-7 13-7-13z" stroke-linejoin="round"/><path d="M5 9h14"/>',
  crown: '<path d="M4 18h16M4 18l1-8 4 4 3-6 3 6 4-4 1 8" stroke-linejoin="round" stroke-linecap="round"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M6 15l6 5 6-5M5 12h4M15 12h4" stroke-linecap="round" stroke-linejoin="round"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4 12H2M22 12h-2M6 6 4.5 4.5M18 6l1.5-1.5M6 18l-1.5 1.5M18 18l1.5 1.5" stroke-linecap="round"/>',
  flag: '<path d="M6 3v18" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" stroke-linejoin="round"/>',
  medal: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-3 8 6-3 6 3-3-8" stroke-linejoin="round"/>',
  hourglass: '<path d="M6 3h12l-6 9z" stroke-linejoin="round"/><path d="M6 21h12l-6-9z" stroke-linejoin="round"/>',
  key: '<circle cx="7" cy="12" r="4"/><path d="M11 12h10M16 12v3M19 12v3" stroke-linecap="round"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><rect x="9" y="4" width="6" height="4" rx="1"/><circle cx="12" cy="14" r="3.5"/>',
  music: '<circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="16" r="2.5"/><path d="M9.5 18V5l9-2v13" stroke-linecap="round" stroke-linejoin="round"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-1.5 4.5L9 15l1.5-4.5z" stroke-linejoin="round"/>',
  book: '<path d="M2 5l10 2 10-2v14l-10-2-10 2z" stroke-linejoin="round"/><path d="M12 7v14"/>',
  rocket: '<path d="M12 2l3 9-3 4-3-4z" stroke-linejoin="round"/><path d="M9 15l-2 5 3-1M15 15l2 5-3-1" stroke-linejoin="round" stroke-linecap="round"/><circle cx="12" cy="8" r="1.3" fill="currentColor" stroke="none"/>',

  'dice-1': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  'dice-2': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
  'dice-3': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
  'dice-4': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
  'dice-5': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>',
  'dice-6': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="16.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
  'dice-pair': '<rect x="2" y="7" width="9" height="9" rx="2"/><circle cx="4.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><rect x="13" y="8" width="9" height="9" rx="2"/><circle cx="15.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="19.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="19.5" cy="14.5" r="0.8" fill="currentColor" stroke="none"/>',

  'card-diamond': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8l2.5 4-2.5 4-2.5-4z" fill="currentColor" stroke="none"/>',
  'card-heart': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8 12 10.5 15 8 16.5 11 12 17 7.5 11z" fill="currentColor" stroke="none" stroke-linejoin="round"/>',
  'card-spade': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 7 16.5 13 15 16 12 13.5 9 16 7.5 13z" fill="currentColor" stroke="none"/><path d="M11.3 15.3h1.4l.3 2.7h-2z" fill="currentColor" stroke="none"/>',
  'card-club': '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="9" r="1.8" fill="currentColor" stroke="none"/><circle cx="9.7" cy="12.2" r="1.8" fill="currentColor" stroke="none"/><circle cx="14.3" cy="12.2" r="1.8" fill="currentColor" stroke="none"/><path d="M11.3 14h1.4l.4 3h-2.2z" fill="currentColor" stroke="none"/>',
  'cards-stack': '<rect x="3" y="6" width="13" height="16" rx="2"/><rect x="8" y="2" width="13" height="16" rx="2"/>',
  'cards-fan': '<rect x="2" y="4" width="9" height="16" rx="1.5"/><rect x="7.5" y="4" width="9" height="16" rx="1.5"/><rect x="13" y="4" width="9" height="16" rx="1.5"/>',
  'card-back': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h8"/>',
  'card-joker': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8.5l1 2.2 2.4.3-1.8 1.6.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.8-1.6 2.4-.3z" fill="currentColor" stroke="none"/>',
};

function presetIconSvg(key) {
  const inner = PRESET_ICON_SVGS[key] || PRESET_ICON_SVGS.dice;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = inner;
  return svg;
}

window.presetIconSvg = presetIconSvg;
