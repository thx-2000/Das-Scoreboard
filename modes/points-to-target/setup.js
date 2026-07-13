const setupForm = document.getElementById('setup-form');
const gameLabelInput = document.getElementById('game-label');
const targetScoreInput = document.getElementById('target-score');
const playerPicker = document.getElementById('player-picker');
const newPlayerInlineInput = document.getElementById('new-player-inline');
const addPlayerInlineBtn = document.getElementById('add-player-inline-btn');
const setupError = document.getElementById('setup-error');
const teamSetup = initTeamSetup(document.getElementById('team-setup'));

const selectedPlayerIds = new Set();
let knownPlayers = [];

function refreshTeamSetup() {
  teamSetup.refresh(knownPlayers.filter((p) => selectedPlayerIds.has(p.id)));
}

function showError(message) {
  setupError.textContent = message;
  setupError.hidden = false;
}

function clearError() {
  setupError.hidden = true;
  setupError.textContent = '';
}

function renderPlayerChip(player) {
  const label = document.createElement('label');
  label.className = 'player-chip';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = player.id;
  checkbox.checked = selectedPlayerIds.has(player.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedPlayerIds.add(player.id);
      label.classList.add('player-chip--checked');
    } else {
      selectedPlayerIds.delete(player.id);
      label.classList.remove('player-chip--checked');
    }
    refreshTeamSetup();
  });

  if (checkbox.checked) label.classList.add('player-chip--checked');

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(player.name));
  return label;
}

async function loadPlayers() {
  const response = await fetch('/api/players.php');
  const players = await response.json();
  knownPlayers = players;
  playerPicker.innerHTML = '';
  if (players.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'hint-text';
    hint.textContent = window.t('common.game.noPlayersHint');
    playerPicker.appendChild(hint);
    refreshTeamSetup();
    return;
  }
  players.forEach((player) => {
    playerPicker.appendChild(renderPlayerChip(player));
  });
  refreshTeamSetup();
}

addPlayerInlineBtn.addEventListener('click', async () => {
  const name = newPlayerInlineInput.value.trim();
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

  const players = await response.json();
  const newPlayer = players.find((p) => p.name === name);
  if (newPlayer) selectedPlayerIds.add(newPlayer.id);

  newPlayerInlineInput.value = '';
  await loadPlayers();
});

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  if (selectedPlayerIds.size < 2) {
    showError(window.t('common.errors.minPlayers'));
    return;
  }

  const winDirection = document.querySelector('input[name="win-direction"]:checked').value;

  const response = await fetch('/api/games.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'points_to_target',
      label: gameLabelInput.value.trim(),
      targetScore: Number(targetScoreInput.value),
      winDirection,
      playerIds: Array.from(selectedPlayerIds),
      teamAssignments: teamSetup.getTeamAssignments(),
      teamNames: teamSetup.getTeamNames(),
      teamScoring: teamSetup.getTeamScoring(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showError(data.error || window.t('common.errors.startGameFailed'));
    return;
  }

  window.location.href = `game.html?id=${data.id}`;
});

window.scoreboardI18nReady.then(loadPlayers);
