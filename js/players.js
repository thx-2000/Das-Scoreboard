const addPlayerForm = document.getElementById('add-player-form');
const newPlayerNameInput = document.getElementById('new-player-name');
const addPlayerError = document.getElementById('add-player-error');
const activeList = document.getElementById('active-player-list');
const inactiveList = document.getElementById('inactive-player-list');

function showError(message) {
  addPlayerError.textContent = message;
  addPlayerError.hidden = false;
}

function clearError() {
  addPlayerError.hidden = true;
  addPlayerError.textContent = '';
}

async function loadPlayers() {
  const response = await fetch('/api/players.php?all=1');
  const players = await response.json();
  renderPlayers(players);
}

async function updatePlayer(id, patch) {
  await fetch(`/api/players.php?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  loadPlayers();
}

function renderPlayers(players) {
  activeList.innerHTML = '';
  inactiveList.innerHTML = '';

  players.forEach((player) => {
    const li = document.createElement('li');

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = player.name;
    nameInput.maxLength = 40;
    nameInput.addEventListener('change', () => {
      const newName = nameInput.value.trim();
      if (newName && newName !== player.name) {
        updatePlayer(player.id, { name: newName });
      } else {
        nameInput.value = player.name;
      }
    });

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '0.4rem';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn--small ' + (player.active ? 'btn--ghost' : 'btn--primary');
    toggleBtn.textContent = player.active ? window.t('common.buttons.remove') : window.t('common.buttons.reactivate');
    toggleBtn.addEventListener('click', () => {
      updatePlayer(player.id, { active: !player.active });
    });

    actions.appendChild(toggleBtn);
    li.appendChild(nameInput);
    li.appendChild(actions);

    if (player.active) {
      activeList.appendChild(li);
    } else {
      inactiveList.appendChild(li);
    }
  });

  if (activeList.children.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = window.t('players.active.empty');
    empty.style.color = 'var(--color-text-muted)';
    activeList.appendChild(empty);
  }
  if (inactiveList.children.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = window.t('players.inactive.empty');
    empty.style.color = 'var(--color-text-muted)';
    inactiveList.appendChild(empty);
  }
}

addPlayerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const name = newPlayerNameInput.value.trim();
  if (!name) return;

  const response = await fetch('/api/players.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = await response.json();
    showError(data.error || window.t('common.errors.createPlayerFailed'));
    return;
  }

  newPlayerNameInput.value = '';
  loadPlayers();
});

window.scoreboardI18nReady.then(loadPlayers);
