const setupForm = document.getElementById('setup-form');
const gameLabelInput = document.getElementById('game-label');
const targetScoreInput = document.getElementById('target-score');
const groupPickerContainer = document.getElementById('group-picker');
const playerPicker = document.getElementById('player-picker');
const newPlayerInlineInput = document.getElementById('new-player-inline');
const addPlayerInlineBtn = document.getElementById('add-player-inline-btn');
const setupError = document.getElementById('setup-error');
const teamSetup = initTeamSetup(document.getElementById('team-setup'));
const roundEntryStepsField = document.getElementById('round-entry-steps-field');
window.renderRoundEntryStepsField(roundEntryStepsField, '1,5,10');

const selectedPlayerIds = new Set();
let knownPlayers = [];
let groupPicker = null;

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

function renderPlayerChip(player, index) {
  const label = document.createElement('label');
  label.className = 'player-chip';
  label.dataset.playerColor = (index % 4) + 1;

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

function refreshPlayerPicker() {
  playerPicker.innerHTML = '';
  if (knownPlayers.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'hint-text';
    hint.textContent = window.t('common.game.noPlayersHint');
    playerPicker.appendChild(hint);
  } else {
    knownPlayers.forEach((player, index) => {
      playerPicker.appendChild(renderPlayerChip(player, index));
    });
  }
  if (groupPicker) groupPicker.refreshLabel(knownPlayers.map((p) => p.id));
  refreshTeamSetup();
}

async function loadPlayers() {
  const response = await fetch('/api/players.php');
  knownPlayers = await response.json();
  if (!groupPicker) {
    groupPicker = await window.initGroupPicker(groupPickerContainer, selectedPlayerIds, refreshPlayerPicker);
  }
  refreshPlayerPicker();
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
      targetBonus: Number(document.getElementById('target-bonus').value) || 0,
      allowNegative: document.getElementById('allow-negative').checked,
      roundEntrySteps: window.collectRoundEntryStepsField(roundEntryStepsField),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showError(data.error || window.t('common.errors.startGameFailed'));
    return;
  }

  window.location.href = `game.php?id=${data.id}`;
});

/**
 * Startseite "Meine Spiele" -> Klick auf ein Preset uebergibt ?presetId=<id>
 * und fuellt hier die passenden Felder vor - die Spielerauswahl bleibt
 * bewusst ein eigener, manueller Schritt (siehe den jeweiligen setup.js insgesamt).
 */
async function prefillFromPreset() {
  const presetId = Number(new URLSearchParams(window.location.search).get('presetId'));
  if (!presetId) return;

  const response = await fetch('/api/game-presets.php');
  const presets = await response.json();
  const preset = presets.find((p) => p.id === presetId && p.mode === 'points_to_target');
  if (!preset) return;

  gameLabelInput.value = preset.name;
  targetScoreInput.value = String(preset.targetScore);
  document.querySelector(`input[name="win-direction"][value="${preset.winDirection}"]`).checked = true;
  document.getElementById('target-bonus').value = String(preset.targetBonus);
  document.getElementById('allow-negative').checked = preset.allowNegative;
  window.renderRoundEntryStepsField(roundEntryStepsField, preset.roundEntrySteps);
}

/**
 * "Weitere Runde spielen" (Task #156): ?fromGame=<id> uebergibt ein
 * bestehendes Spiel, dessen Rahmenbedingungen UND Teilnehmer vorausgefuellt
 * werden - anders als bei der Preset-Vorbelegung oben werden hier bewusst
 * auch die Spieler vorausgewaehlt (genau das ist der Zweck des Knopfes, ein
 * weiterer Tap bleibt trotzdem noetig, z.B. um vorher jemanden abzuwaehlen).
 * Nur noch aktive Spieler aus dem alten Spiel werden uebernommen (nicht
 * ausgeschieden, nicht inzwischen deaktiviert/geloescht). Team-Zuordnung wird
 * bewusst NICHT wiederhergestellt (bleibt wie bei einem neuen Spiel ein
 * eigener, manueller Schritt - siehe js/team-setup.js).
 */
async function prefillFromGame() {
  const fromGameId = Number(new URLSearchParams(window.location.search).get('fromGame'));
  if (!fromGameId) return;

  const response = await fetch(`/api/games.php?id=${fromGameId}`);
  if (!response.ok) return;
  const game = await response.json();
  if (game.mode !== 'points_to_target') return;

  gameLabelInput.value = game.label || '';
  targetScoreInput.value = String(game.targetScore);
  document.querySelector(`input[name="win-direction"][value="${game.winDirection}"]`).checked = true;
  document.getElementById('target-bonus').value = String(game.targetBonus);
  document.getElementById('allow-negative').checked = game.allowNegative;
  window.renderRoundEntryStepsField(roundEntryStepsField, game.roundEntrySteps);

  const knownIds = new Set(knownPlayers.map((p) => p.id));
  game.players
    .filter((p) => !p.withdrawnAt && knownIds.has(p.id))
    .forEach((p) => selectedPlayerIds.add(p.id));
  refreshPlayerPicker();
}

window.scoreboardI18nReady.then(loadPlayers).then(prefillFromGame);
window.scoreboardI18nReady.then(prefillFromPreset);
