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
 * Spiele"): Favoriten in einer eigenen, vorangestellten Reihe mit manueller
 * Reihenfolge (siehe Wunsch "darüber leicht zu erreichen", Pfeile/Drag&Drop
 * in den Einstellungen). Darunter "Alle Spiele": die komplette, alphabetisch
 * sortierte Liste inkl. RAGE UND der Favoriten selbst - damit jedes Spiel
 * unabhaengig vom Favoriten-Status ueber die Gesamtliste auffindbar bleibt.
 * Klick fuehrt zur bekannten Einrichten-Seite des jeweiligen Modus mit
 * vorausgefuellten Werten (?presetId=<id>, siehe den jeweiligen setup.js) -
 * die Spielerauswahl bleibt bewusst ein letzter manueller Schritt statt
 * komplett uebersprungen zu werden.
 */
const HOME_PRESET_MODE_PATHS = {
  points_to_target: 'points-to-target',
  points_open: 'points-open',
  fixed_rounds: 'fixed-rounds',
};

const favoritePresetHeading = document.getElementById('favorite-preset-heading');
const favoritePresetGrid = document.getElementById('favorite-preset-grid');
const myGamesGrid = document.getElementById('my-games-grid');

/** Nur die kurze Tatsache statt "Modus-Titel · Tatsache" - manche Modus-
 * Titel sind lang genug, um die Karte unschoen zu strecken (siehe
 * "Punkterunde mit fester Rundenzahl"), das eigene Icon zeigt den Modus
 * bereits visuell an. */
function presetCardMeta(preset) {
  if (preset.mode === 'points_to_target') {
    return window.t('home.myGames.metaTarget', { score: preset.targetScore });
  }
  if (preset.mode === 'fixed_rounds') {
    return window.t('home.myGames.metaRounds', { rounds: preset.totalRounds });
  }
  return preset.winDirection === 'lowest'
    ? window.t('pointsOpen.game.direction.lowest')
    : window.t('pointsOpen.game.direction.highest');
}

function buildPresetCard(preset) {
  const modePath = HOME_PRESET_MODE_PATHS[preset.mode];
  if (!modePath) return null;

  const link = document.createElement('a');
  link.className = 'mode-card mode-card--preset';
  link.href = `/modes/${modePath}/setup.php?presetId=${preset.id}`;

  const icon = window.presetIconSvg(preset.icon);
  icon.classList.add('mode-card__icon-svg');

  const heading = document.createElement('h2');
  heading.textContent = preset.name;

  const meta = document.createElement('p');
  meta.className = 'mode-card__examples';
  meta.textContent = presetCardMeta(preset);

  link.appendChild(icon);
  link.appendChild(heading);
  link.appendChild(meta);
  return link;
}

/** Sortiert die Kind-Elemente eines Rasters alphabetisch nach ihrer <h2> -
 * so reiht sich die statische RAGE-Karte automatisch korrekt zwischen die
 * per JS ergaenzten Preset-Karten ein, ohne dass RAGE ein Preset waere. */
function sortModeGridAlphabetically(grid) {
  const nodes = Array.from(grid.children);
  nodes.sort((a, b) => {
    const nameA = a.querySelector('h2').textContent;
    const nameB = b.querySelector('h2').textContent;
    return nameA.localeCompare(nameB, window.scoreboardLocale());
  });
  nodes.forEach((node) => grid.appendChild(node));
}

async function loadHomePresets() {
  const response = await fetch('/api/game-presets.php');
  const presets = await response.json();

  const favorites = presets.filter((p) => p.isFavorite);
  if (favorites.length > 0) {
    favoritePresetHeading.hidden = false;
    favoritePresetGrid.hidden = false;
    favorites.forEach((preset) => {
      const card = buildPresetCard(preset);
      if (card) favoritePresetGrid.appendChild(card);
    });
  }

  presets.forEach((preset) => {
    const card = buildPresetCard(preset);
    if (card) myGamesGrid.appendChild(card);
  });
  sortModeGridAlphabetically(myGamesGrid);
}

window.scoreboardI18nReady.then(loadOpenGames);
window.scoreboardI18nReady.then(loadHomePresets);
