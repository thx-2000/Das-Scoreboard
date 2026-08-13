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
  const response = await fetch('/api/players.php');
  if (!response.ok) return;
  const allActivePlayers = await response.json();
  const inGameIds = new Set(activePlayers.map((p) => p.id));
  const available = allActivePlayers.filter((p) => !inGameIds.has(p.id));

  addSelect.innerHTML = '';
  if (available.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = window.t('common.game.edit.noPlayersAvailable');
    opt.disabled = true;
    addSelect.appendChild(opt);
    addBtn.disabled = true;
    return;
  }
  addBtn.disabled = false;
  available.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    addSelect.appendChild(opt);
  });
}

window.initGameEdit = initGameEdit;
window.renderGameEditPanel = renderGameEditPanel;
