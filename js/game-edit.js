/**
 * "Spiel bearbeiten": Live-Aenderung eines laufenden Spiels (Migration 16) -
 * Spieler ausscheiden lassen/hinzufuegen, optional Zielwert anpassen. Fuer
 * alle 4 Modi identisch (siehe modes/<mode>/game.php), nur das Zielwert-Feld wird
 * je nach Modus ein-/ausgeblendet (initGameEdit-Aufruf mit showTargetScore).
 */

function gameEditShowError(message) {
  const errorEl = document.getElementById('game-edit-error');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function gameEditClearError() {
  const errorEl = document.getElementById('game-edit-error');
  if (!errorEl) return;
  errorEl.hidden = true;
  errorEl.textContent = '';
}

function initGameEdit(gameId, onUpdated, showTargetScore) {
  const details = document.getElementById('game-edit-details');
  if (!details) return;

  const targetScoreWrap = document.getElementById('game-edit-target-score');
  const targetScoreInput = document.getElementById('game-edit-target-input');
  const targetScoreSaveBtn = document.getElementById('game-edit-target-save-btn');
  const playerList = document.getElementById('game-edit-player-list');
  const addSelect = document.getElementById('game-edit-add-select');
  const addStartingScoreInput = document.getElementById('game-edit-add-starting-score');
  const addBtn = document.getElementById('game-edit-add-btn');

  if (showTargetScore && targetScoreWrap) targetScoreWrap.hidden = false;

  if (targetScoreSaveBtn) {
    targetScoreSaveBtn.addEventListener('click', async () => {
      const value = Math.max(0, parseInt(targetScoreInput.value, 10) || 0);
      if (!window.confirm(window.t('common.game.edit.confirmTargetScore', { value }))) return;
      gameEditClearError();
      const response = await fetch(`/api/games.php?id=${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetScore: value }),
      });
      const data = await response.json();
      if (!response.ok) { gameEditShowError(data.error); return; }
      onUpdated(data);
    });
  }

  addBtn.addEventListener('click', async () => {
    const playerId = parseInt(addSelect.value, 10);
    if (!playerId) return;
    const startingScore = parseInt(addStartingScoreInput.value, 10) || 0;
    const playerName = addSelect.options[addSelect.selectedIndex].textContent;
    if (!window.confirm(window.t('common.game.edit.confirmAddPlayer', { name: playerName }))) return;
    gameEditClearError();
    const response = await fetch('/api/game-players.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, playerId, startingScore }),
    });
    const data = await response.json();
    if (!response.ok) { gameEditShowError(data.error); return; }
    addStartingScoreInput.value = '';
    onUpdated(data);
  });

  // Neuen Spieler direkt aus dem laufenden Spiel heraus anlegen, statt erst
  // ueber die Spielerverwaltung gehen zu muessen (gleiches Muster wie
  // addPlayerInlineBtn in den setup.js-Dateien) - nutzt denselben
  // Startpunkte-Wert wie die Auswahl oben.
  const newPlayerNameInput = document.getElementById('game-edit-new-player-name');
  const newPlayerBtn = document.getElementById('game-edit-new-player-btn');
  newPlayerBtn.addEventListener('click', async () => {
    const name = newPlayerNameInput.value.trim();
    if (!name) return;
    if (!window.confirm(window.t('common.game.edit.confirmAddPlayer', { name }))) return;
    gameEditClearError();

    const createResponse = await fetch('/api/players.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const createData = await createResponse.json();
    if (!createResponse.ok) { gameEditShowError(createData.error); return; }
    const newPlayer = createData.find((p) => p.name === name);
    if (!newPlayer) return;

    const startingScore = parseInt(addStartingScoreInput.value, 10) || 0;
    const response = await fetch('/api/game-players.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, playerId: newPlayer.id, startingScore }),
    });
    const data = await response.json();
    if (!response.ok) { gameEditShowError(data.error); return; }
    newPlayerNameInput.value = '';
    addStartingScoreInput.value = '';
    onUpdated(data);
  });

  playerList.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-withdraw-player-id]');
    if (!btn) return;
    const playerId = parseInt(btn.dataset.withdrawPlayerId, 10);
    const playerName = btn.dataset.withdrawPlayerName;
    if (!window.confirm(window.t('common.game.edit.confirmWithdraw', { name: playerName }))) return;
    gameEditClearError();
    const response = await fetch('/api/game-players.php', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, playerId }),
    });
    const data = await response.json();
    if (!response.ok) { gameEditShowError(data.error); return; }
    onUpdated(data);
  });
}

/**
 * Rendert Teilnehmerliste + Hinzufuegen-Auswahl neu (nach jedem State-Update
 * aus render() heraus aufgerufen, siehe modes/<mode>/game.js). Das Zielwert-Feld
 * wird nur aktualisiert, wenn es nicht gerade fokussiert ist (kein
 * Ueberschreiben waehrend der Eingabe).
 */
async function renderGameEditPanel(state) {
  const details = document.getElementById('game-edit-details');
  const playerList = document.getElementById('game-edit-player-list');
  if (!details || !playerList) return;

  details.hidden = state.status === 'finished';
  if (details.hidden) return;

  const targetScoreInput = document.getElementById('game-edit-target-input');
  if (targetScoreInput && document.activeElement !== targetScoreInput) {
    targetScoreInput.value = state.targetScore;
  }

  const activePlayers = state.players.filter((p) => !p.withdrawnAt);

  playerList.innerHTML = '';
  activePlayers.forEach((player) => {
    const li = document.createElement('li');
    li.className = 'game-edit__player-row';
    const name = document.createElement('span');
    name.textContent = player.name;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--small btn--danger';
    btn.textContent = window.t('common.game.edit.withdrawButton');
    btn.dataset.withdrawPlayerId = player.id;
    btn.dataset.withdrawPlayerName = player.name;
    li.appendChild(name);
    li.appendChild(btn);
    playerList.appendChild(li);
  });

  const addSelect = document.getElementById('game-edit-add-select');
  const addBtn = document.getElementById('game-edit-add-btn');
  // ?all=1 liefert auch deaktivierte Spieler mit (siehe api/players.php) -
  // die duerfen mitspielen (Backend prueft beim Hinzufuegen nur deleted_at,
  // nicht active), erscheinen aber in einer eigenen Gruppe unten, damit klar
  // bleibt, dass sie regulaer nicht in der Schnellauswahl auftauchen.
  const response = await fetch('/api/players.php?all=1');
  if (!response.ok) return;
  const allPlayers = await response.json();
  const inGameIds = new Set(activePlayers.map((p) => p.id));
  const availableActive = allPlayers.filter((p) => p.active && !inGameIds.has(p.id));
  const availableInactive = allPlayers.filter((p) => !p.active && !inGameIds.has(p.id));

  addSelect.innerHTML = '';
  if (availableActive.length === 0 && availableInactive.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = window.t('common.game.edit.noPlayersAvailable');
    opt.disabled = true;
    addSelect.appendChild(opt);
    addBtn.disabled = true;
    return;
  }
  addBtn.disabled = false;

  function appendGroup(players, labelKey) {
    if (players.length === 0) return;
    const group = document.createElement('optgroup');
    group.label = window.t(labelKey);
    players.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      group.appendChild(opt);
    });
    addSelect.appendChild(group);
  }
  appendGroup(availableActive, 'players.active.heading');
  appendGroup(availableInactive, 'players.inactive.heading');
}

window.initGameEdit = initGameEdit;
window.renderGameEditPanel = renderGameEditPanel;
