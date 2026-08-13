const historyList = document.getElementById('history-list');
const filterTabs = document.getElementById('history-filter-tabs');

let allGames = [];
let currentFilter = 'all';

function modeInfo() {
  return {
    points_to_target: { title: window.t('modes.pointsToTarget.title'), url: '/modes/points-to-target/game.php' },
    points_open: { title: window.t('modes.pointsOpen.title'), url: '/modes/points-open/game.php' },
    fixed_rounds: { title: window.t('modes.fixedRounds.title'), url: '/modes/fixed-rounds/game.php' },
    rage: { title: window.t('modes.rage.title'), url: '/modes/rage/game.php' },
  };
}

function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const formatted = date.toLocaleString(window.scoreboardLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return window.t('common.game.dateTime', { date: formatted });
}

async function loadHistory() {
  const response = await fetch('/api/games.php');
  allGames = await response.json();
  applyFilter();
}

// Filtert clientseitig ohne neuen Fetch, da game.status bereits im geladenen
// Response steckt - reine Anzeige-Umschaltung per Tab-Klick.
function applyFilter() {
  const filtered = allGames.filter((game) => {
    if (currentFilter === 'active') return game.status !== 'finished';
    if (currentFilter === 'finished') return game.status === 'finished';
    return true;
  });
  renderHistory(filtered);
}

if (filterTabs) {
  filterTabs.querySelectorAll('.filter-tabs__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      filterTabs.querySelectorAll('.filter-tabs__btn').forEach((b) => {
        b.setAttribute('aria-selected', String(b === btn));
      });
      applyFilter();
    });
  });
}

async function deleteGame(gameId, label) {
  const confirmed = window.confirm(window.t('history.deleteConfirm', { label }));
  if (!confirmed) return;

  await fetch(`/api/games.php?id=${gameId}`, { method: 'DELETE' });
  loadHistory();
}

function renderHistory(games) {
  historyList.innerHTML = '';

  if (games.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = currentFilter === 'all'
      ? window.t('history.empty')
      : window.t(`history.filterEmpty.${currentFilter}`);
    empty.style.color = 'var(--color-text-muted)';
    historyList.appendChild(empty);
    return;
  }

  const modes = modeInfo();

  games.forEach((game) => {
    const info = modes[game.mode] || { title: game.mode, url: '#' };
    const displayLabel = game.label ? `${game.label} (${info.title})` : info.title;

    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'stretch';
    li.style.gap = '0.5rem';

    const link = document.createElement('a');
    link.className = 'history-item';
    link.style.flex = '1';
    link.href = `${info.url}?id=${game.id}`;

    const title = document.createElement('div');
    title.className = 'history-item__title';
    title.textContent = displayLabel;

    const badge = document.createElement('span');
    badge.className = 'badge ' + (game.status === 'finished' ? 'badge--finished' : 'badge--active');
    badge.textContent = game.status === 'finished' ? window.t('history.badge.finished') : window.t('history.badge.active');
    title.appendChild(document.createTextNode(' '));
    title.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'history-item__meta';
    const players = game.playerNames.join(', ');
    let metaText = `${formatDateTime(game.startedAt)} · ${players}`;
    if (game.targetScore > 0) {
      metaText += ` · ${window.t('history.meta.target', { score: game.targetScore })}`;
    }
    if (game.totalRounds > 0) {
      metaText += ` · ${window.t('history.meta.rounds', { played: game.roundsPlayed, total: game.totalRounds })}`;
    }
    if (game.status === 'finished' && game.winners.length > 0) {
      metaText += ` · ${window.t('history.meta.winners', { names: game.winners.join(' & ') })}`;
    }
    meta.textContent = metaText;

    link.appendChild(title);
    link.appendChild(meta);

    // "Weitere Runde spielen" (Task #156) auch aus dem Verlauf heraus nutzbar,
    // nicht nur direkt nach Spielende - nur bei bereits abgeschlossenen
    // Spielen sinnvoll (setup.php liegt im selben Modus-Ordner wie game.php).
    let rematchBtn = null;
    if (game.status === 'finished' && info.url !== '#') {
      rematchBtn = document.createElement('a');
      rematchBtn.className = 'btn btn--small btn--secondary';
      rematchBtn.textContent = window.t('common.game.rematchButton');
      rematchBtn.style.alignSelf = 'center';
      rematchBtn.href = `${info.url.replace('game.php', 'setup.php')}?fromGame=${game.id}`;
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--small btn--danger';
    deleteBtn.textContent = window.t('common.buttons.delete');
    deleteBtn.style.alignSelf = 'center';
    deleteBtn.addEventListener('click', () => deleteGame(game.id, displayLabel));

    li.appendChild(link);
    if (rematchBtn) li.appendChild(rematchBtn);
    li.appendChild(deleteBtn);
    historyList.appendChild(li);
  });
}

window.scoreboardI18nReady.then(loadHistory);
