const setupForm = document.getElementById('setup-form');
const gameLabelInput = document.getElementById('game-label');
const groupPickerContainer = document.getElementById('group-picker');
const playerPicker = document.getElementById('player-picker');
const newPlayerInlineInput = document.getElementById('new-player-inline');
const addPlayerInlineBtn = document.getElementById('add-player-inline-btn');
const setupError = document.getElementById('setup-error');

const seatOrderSection = document.getElementById('seat-order-section');
const seatOrderEl = document.getElementById('seat-order');

const selectedPlayerIds = new Set();
// Sitzordnung im Uhrzeigersinn: Spieler-IDs in der Reihenfolge, in der sie
// angetippt wurden (siehe refreshSeatOrder).
let seatSequence = [];
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

/**
 * Sitzordnung abfragen: erst antippen, wer irgendwo sitzt, dann jeweils der
 * naechste im Uhrzeigersinn. Antippen eines bereits nummerierten Spielers
 * nimmt ihn und alle danach Eingetragenen wieder zurueck (so ist ein
 * Vertippen schnell korrigiert).
 */
function refreshSeatOrder() {
  seatSequence = seatSequence.filter((id) => selectedPlayerIds.has(id));
  const selected = knownPlayers.filter((p) => selectedPlayerIds.has(p.id));
  seatOrderSection.hidden = selected.length < 2;
  seatOrderEl.innerHTML = '';

  selected.forEach((player) => {
    const pos = seatSequence.indexOf(player.id);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'rage-seat-chip';
    chip.setAttribute('aria-pressed', String(pos !== -1));
    if (pos !== -1) {
      const num = document.createElement('span');
      num.className = 'rage-seat-chip__num';
      num.textContent = String(pos + 1);
      chip.appendChild(num);
    }
    chip.appendChild(document.createTextNode(player.name));
    chip.addEventListener('click', () => {
      if (pos === -1) {
        seatSequence.push(player.id);
      } else {
        seatSequence = seatSequence.slice(0, pos);
      }
      refreshSeatOrder();
    });
    seatOrderEl.appendChild(chip);
  });

  if (seatSequence.length > 0) {
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn--small btn--ghost';
    resetBtn.textContent = window.t('rage.setup.seatOrderReset');
    resetBtn.addEventListener('click', () => {
      seatSequence = [];
      refreshSeatOrder();
    });
    seatOrderEl.appendChild(resetBtn);
  }
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
    refreshSeatOrder();
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
  refreshSeatOrder();
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

  if (seatSequence.length !== selectedPlayerIds.size) {
    showError(window.t('rage.setup.seatOrderIncomplete'));
    return;
  }

  const response = await fetch('/api/games.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'rage',
      label: gameLabelInput.value.trim(),
      // Reihenfolge = Sitzordnung im Uhrzeigersinn (siehe api/games.php).
      playerIds: seatSequence,
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
  if (returning.every((p) => p.seatPosition !== null && p.seatPosition !== undefined)) {
    seatSequence = [...returning].sort((a, b) => a.seatPosition - b.seatPosition).map((p) => p.id);
  }
  refreshPlayerPicker();
}

window.scoreboardI18nReady.then(loadPlayers).then(prefillFromGame);
