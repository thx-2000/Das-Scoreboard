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

window.scoreboardI18nReady.then(loadOpenGames);
