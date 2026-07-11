const historyList = document.getElementById('history-list');

const modeInfo = {
  points_to_target: { title: 'Punkte bis Höchstwert', url: 'modes/points-to-target/game.html' },
  points_open: { title: 'Offene Punkterunde', url: 'modes/points-open/game.html' },
  rage: { title: 'RAGE', url: 'modes/rage/game.html' },
};

function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' Uhr';
}

async function loadHistory() {
  const response = await fetch('/api/games.php');
  const games = await response.json();
  renderHistory(games);
}

async function deleteGame(gameId, label) {
  const confirmed = window.confirm(`"${label}" wirklich unwiderruflich aus dem Spielverlauf löschen?`);
  if (!confirmed) return;

  await fetch(`/api/games.php?id=${gameId}`, { method: 'DELETE' });
  loadHistory();
}

function renderHistory(games) {
  historyList.innerHTML = '';

  if (games.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Noch keine Spiele gespielt.';
    empty.style.color = 'var(--color-text-muted)';
    historyList.appendChild(empty);
    return;
  }

  games.forEach((game) => {
    const info = modeInfo[game.mode] || { title: game.mode, url: '#' };
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
    badge.textContent = game.status === 'finished' ? 'Beendet' : 'Läuft';
    title.appendChild(document.createTextNode(' '));
    title.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'history-item__meta';
    const players = game.playerNames.join(', ');
    let metaText = `${formatDateTime(game.startedAt)} · ${players}`;
    if (game.targetScore > 0) {
      metaText += ` · Ziel: ${game.targetScore} Punkte`;
    }
    if (game.status === 'finished' && game.winners.length > 0) {
      metaText += ` · Sieger: ${game.winners.join(' & ')}`;
    }
    meta.textContent = metaText;

    link.appendChild(title);
    link.appendChild(meta);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--small btn--danger';
    deleteBtn.textContent = 'Löschen';
    deleteBtn.style.alignSelf = 'center';
    deleteBtn.addEventListener('click', () => deleteGame(game.id, displayLabel));

    li.appendChild(link);
    li.appendChild(deleteBtn);
    historyList.appendChild(li);
  });
}

loadHistory();
