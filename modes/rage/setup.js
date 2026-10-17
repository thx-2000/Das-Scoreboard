const setupForm = document.getElementById('setup-form');
const gameLabelInput = document.getElementById('game-label');
const groupPickerContainer = document.getElementById('group-picker');
const playerPicker = document.getElementById('player-picker');
const newPlayerInlineInput = document.getElementById('new-player-inline');
const addPlayerInlineBtn = document.getElementById('add-player-inline-btn');
const setupError = document.getElementById('setup-error');

// Sitzordnung im Uhrzeigersinn (js/seat-order.js), bei RAGE immer aktiv.
const seatOrder = window.initSeatOrder({
  section: document.getElementById('seat-order-section'),
  container: document.getElementById('seat-order'),
  isActive: () => true,
});

// Startspieler: "Zufaellig" oder ein bestimmter Mitspieler (bei Geber-Anzeige:
// der erste Geber), siehe js/starting-player-select.js.
const startingPlayer = window.initStartingPlayerSelect({
  field: document.getElementById('starting-player-field'),
  select: document.getElementById('starting-player'),
  label: document.getElementById('starting-player-label'),
  isDealerMode: () => true,
});

const selectedPlayerIds = new Set();
let knownPlayers = [];
let groupPicker = null;

function showError(message) {
  setupError.textContent = message;
  setupError.hidden = false;
}

function clearError() {
  setupError.hidden = true;
  setupError.textContent = '';
}

function refreshPlayerDependentFields() {
  const selected = knownPlayers.filter((p) => selectedPlayerIds.has(p.id));
  seatOrder.refresh(selected);
  startingPlayer.refresh(selected);
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
    refreshPlayerDependentFields();
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
  refreshPlayerDependentFields();
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

  if (seatOrder.getSequence().length !== selectedPlayerIds.size) {
    showError(window.t('common.setup.seatOrderIncomplete'));
    return;
  }

  const response = await fetch('/api/games.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'rage',
      label: gameLabelInput.value.trim(),
      // Reihenfolge = Sitzordnung im Uhrzeigersinn (siehe api/games.php).
      playerIds: seatOrder.getSequence(),
      startingPlayerId: startingPlayer.getValue(),
      rageShowBonusMalus: document.getElementById('rage-show-bonus-malus').checked,
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
 * "Weitere Runde spielen" (Task #156): ?fromGame=<id> uebergibt ein
 * bestehendes RAGE-Spiel, dessen Rahmenbedingungen UND Teilnehmer
 * vorausgefuellt werden (ein weiterer Tap bleibt trotzdem noetig, z.B. um
 * vorher jemanden abzuwaehlen). Nur noch aktive Spieler aus dem alten Spiel
 * werden uebernommen (nicht ausgeschieden, nicht inzwischen deaktiviert/
 * geloescht).
 */
async function prefillFromGame() {
  const fromGameId = Number(new URLSearchParams(window.location.search).get('fromGame'));
  if (!fromGameId) return;

  const response = await fetch(`/api/games.php?id=${fromGameId}`);
  if (!response.ok) return;
  const game = await response.json();
  if (game.mode !== 'rage') return;

  gameLabelInput.value = game.label || '';
  document.getElementById('rage-show-bonus-malus').checked = game.rageShowBonusMalus;

  const knownIds = new Set(knownPlayers.map((p) => p.id));
  const returning = game.players.filter((p) => !p.withdrawnAt && knownIds.has(p.id));
  returning.forEach((p) => selectedPlayerIds.add(p.id));
  // Sitzordnung vom letzten Spiel uebernehmen, solange sie vollstaendig bekannt ist.
  seatOrder.setSequence(window.seatSequenceFromGame(returning));
  refreshPlayerPicker();
}

window.scoreboardI18nReady.then(loadPlayers).then(prefillFromGame);
