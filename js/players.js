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

async function deletePlayer(id, name) {
  const confirmed = window.confirm(window.t('players.deleteConfirm', { name }));
  if (!confirmed) return;

  await fetch(`/api/players.php?id=${id}`, { method: 'DELETE' });
  loadPlayers();
}

async function uploadAvatar(playerId, blob) {
  const formData = new FormData();
  formData.append('avatar', blob, 'avatar.jpg');

  const response = await fetch(`/api/player-avatar.php?id=${playerId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    showError(data.error || window.t('players.avatar.uploadFailed'));
    return;
  }

  loadPlayers();
}

async function removeAvatar(playerId) {
  const confirmed = window.confirm(window.t('players.avatar.removeConfirm'));
  if (!confirmed) return;

  await fetch(`/api/player-avatar.php?id=${playerId}`, { method: 'DELETE' });
  loadPlayers();
}

function renderAvatarField(player) {
  const wrap = document.createElement('div');
  wrap.className = 'player-avatar-field';

  const avatarBox = document.createElement('div');
  avatarBox.className = 'player-avatar';
  if (player.avatarExt) {
    const img = document.createElement('img');
    img.src = `/api/player-avatar.php?id=${player.id}&t=${Date.now()}`;
    img.alt = '';
    avatarBox.appendChild(img);
  } else {
    avatarBox.textContent = player.name.charAt(0).toUpperCase();
  }

  const buttons = document.createElement('div');
  buttons.className = 'player-avatar-field__buttons';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png,image/jpeg';
  fileInput.hidden = true;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    window.openAvatarCropper(file, {
      onCrop: (blob) => uploadAvatar(player.id, blob),
      onCancel: () => {},
    });
    fileInput.value = '';
  });

  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'btn btn--small btn--ghost';
  uploadBtn.textContent = player.avatarExt
    ? window.t('players.avatar.changeLabel')
    : window.t('players.avatar.uploadLabel');
  uploadBtn.addEventListener('click', () => fileInput.click());
  buttons.appendChild(uploadBtn);

  if (player.avatarExt) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn--small btn--danger';
    removeBtn.textContent = window.t('players.avatar.removeLabel');
    removeBtn.addEventListener('click', () => removeAvatar(player.id));
    buttons.appendChild(removeBtn);
  }

  wrap.appendChild(avatarBox);
  wrap.appendChild(fileInput);
  wrap.appendChild(buttons);
  return wrap;
}

function renderPlayers(players) {
  activeList.innerHTML = '';
  inactiveList.innerHTML = '';

  players.forEach((player) => {
    const li = document.createElement('li');
    li.appendChild(renderAvatarField(player));

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

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--small btn--danger';
    deleteBtn.textContent = window.t('common.buttons.delete');
    deleteBtn.addEventListener('click', () => deletePlayer(player.id, player.name));

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
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
