/**
 * "Offene Spiele" auf der Startseite - zeigt die letzten paar laufenden
 * (nicht beendeten) Spiele zum direkten Fortsetzen. Bewusst ohne eigenen
 * API-Endpoint: nutzt dieselbe Liste wie history.js (GET /api/games.php),
 * filtert clientseitig auf status !== 'finished' und begrenzt die Anzahl.
 */
const OPEN_GAMES_LIMIT = 5;

const openGamesSection = document.getElementById('open-games-section');
const openGamesList = document.getElementById('open-games-list');

function homeModeInfo() {
  return {
    points_to_target: { title: window.t('modes.pointsToTarget.title'), url: '/modes/points-to-target/game.php', icon: '🎯' },
    points_open: { title: window.t('modes.pointsOpen.title'), url: '/modes/points-open/game.php', icon: '♾️' },
    fixed_rounds: { title: window.t('modes.fixedRounds.title'), url: '/modes/fixed-rounds/game.php', icon: '🔟' },
    rage: { title: window.t('modes.rage.title'), url: '/modes/rage/game.php', icon: '🔥' },
  };
}

function homeFormatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const formatted = date.toLocaleString(window.scoreboardLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return window.t('common.game.dateTime', { date: formatted });
}

async function loadOpenGames() {
  const response = await fetch('/api/games.php');
  const games = await response.json();
  const openGames = games.filter((game) => game.status !== 'finished').slice(0, OPEN_GAMES_LIMIT);

  if (openGames.length === 0) {
    openGamesSection.hidden = true;
    return;
  }

  openGamesSection.hidden = false;
  openGamesList.innerHTML = '';
  const modes = homeModeInfo();

  openGames.forEach((game) => {
    const info = modes[game.mode] || { title: game.mode, url: '#', icon: '' };
    const displayLabel = game.label ? `${game.label} (${info.title})` : info.title;

    const li = document.createElement('li');

    const link = document.createElement('a');
    link.className = 'history-item';
    link.href = `${info.url}?id=${game.id}`;

    const title = document.createElement('div');
    title.className = 'history-item__title';
    const icon = document.createElement('span');
    icon.className = 'history-item__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = info.icon;
    title.appendChild(icon);
    title.appendChild(document.createTextNode(displayLabel));

    const meta = document.createElement('div');
    meta.className = 'history-item__meta';
    const players = game.playerNames.join(', ');
    let metaText = `${homeFormatDateTime(game.startedAt)} · ${players}`;
    if (game.targetScore > 0) {
      metaText += ` · ${window.t('history.meta.target', { score: game.targetScore })}`;
    }
    if (game.totalRounds > 0) {
      metaText += ` · ${window.t('history.meta.rounds', { played: game.roundsPlayed, total: game.totalRounds })}`;
    }
    meta.textContent = metaText;

    link.appendChild(title);
    link.appendChild(meta);
    li.appendChild(link);
    openGamesList.appendChild(li);
  });
}

/**
 * "Meine Spiele" (eigene Presets, siehe Einstellungen -> Reiter "Meine
 * Spiele"): Favoriten in einer eigenen, vorangestellten Reihe (siehe
 * Wunsch "darüber leicht zu erreichen"), alle uebrigen Presets zusammen
 * mit der statischen RAGE-Karte im normalen Raster darunter. Klick fuehrt
 * zur bekannten Einrichten-Seite des jeweiligen Modus mit vorausgefuellten
 * Werten (?presetId=<id>, siehe den jeweiligen setup.js) - die Spielerauswahl
 * bleibt bewusst ein letzter manueller Schritt statt komplett uebersprungen
 * zu werden.
 */
const HOME_PRESET_MODE_PATHS = {
  points_to_target: 'points-to-target',
  points_open: 'points-open',
  fixed_rounds: 'fixed-rounds',
};

const favoritePresetGrid = document.getElementById('favorite-preset-grid');
const myGamesGrid = document.getElementById('my-games-grid');

function presetCardMeta(preset) {
  const modes = homeModeInfo();
  const title = (modes[preset.mode] || {}).title || preset.mode;
  if (preset.mode === 'points_to_target') {
    return `${title} · ${window.t('home.myGames.metaTarget', { score: preset.targetScore })}`;
  }
  if (preset.mode === 'fixed_rounds') {
    return `${title} · ${window.t('home.myGames.metaRounds', { rounds: preset.totalRounds })}`;
  }
  return title;
}

function buildPresetCard(preset) {
  const modePath = HOME_PRESET_MODE_PATHS[preset.mode];
  if (!modePath) return null;

  const link = document.createElement('a');
  link.className = 'mode-card';
  link.href = `/modes/${modePath}/setup.php?presetId=${preset.id}`;

  const icon = document.createElement('span');
  icon.className = 'mode-card__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = preset.isFavorite ? '⭐' : '🎲';

  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('class', 'mode-card__icon-svg');
  iconSvg.setAttribute('aria-hidden', 'true');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', 'currentColor');
  iconSvg.setAttribute('stroke-width', '2');
  iconSvg.innerHTML = preset.isFavorite
    ? '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.4-5.6 3.4 1.4-6.3-4.8-4.3 6.4-.6z" stroke-linejoin="round"/>'
    : '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/>';

  const heading = document.createElement('h2');
  heading.textContent = preset.name;

  const meta = document.createElement('p');
  meta.className = 'mode-card__examples';
  meta.textContent = presetCardMeta(preset);

  link.appendChild(icon);
  link.appendChild(iconSvg);
  link.appendChild(heading);
  link.appendChild(meta);
  return link;
}

async function loadHomePresets() {
  const response = await fetch('/api/game-presets.php');
  const presets = await response.json();

  const favorites = presets.filter((p) => p.isFavorite);
  const rest = presets.filter((p) => !p.isFavorite);

  if (favorites.length > 0) {
    favoritePresetGrid.hidden = false;
    favorites.forEach((preset) => {
      const card = buildPresetCard(preset);
      if (card) favoritePresetGrid.appendChild(card);
    });
  }

  rest.forEach((preset) => {
    const card = buildPresetCard(preset);
    if (card) myGamesGrid.appendChild(card);
  });
}

window.scoreboardI18nReady.then(loadOpenGames);
window.scoreboardI18nReady.then(loadHomePresets);
