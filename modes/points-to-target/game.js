const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const gameTitle = document.getElementById('game-title');
const gameSubtitle = document.getElementById('game-subtitle');
const standingsBody = document.getElementById('standings-body');
const winnerBannerWrap = document.getElementById('winner-banner-wrap');
const roundEntryCard = document.getElementById('round-entry-card');
const roundFormGrid = document.getElementById('round-form-grid');
const saveRoundBtn = document.getElementById('save-round-btn');
const roundsTableHead = document.getElementById('rounds-table-head');
const roundsTableBody = document.getElementById('rounds-table-body');
const toggleFinishedBtn = document.getElementById('toggle-finished-btn');
const startingPlayerLegend = document.getElementById('starting-player-legend');
const undoLastRoundBtn = document.getElementById('undo-last-round-btn');

let currentState = null;

async function loadGame() {
  const response = await fetch(`/api/games.php?id=${gameId}`);
  if (!response.ok) {
    gameSubtitle.textContent = window.t('common.game.notFound');
    return;
  }
  currentState = await response.json();
  render(currentState);
}

function renderHeader(state) {
  const title = state.label ? `${state.label}` : window.t('modes.pointsToTarget.title');
  gameTitle.textContent = title;
  const startedAt = new Date(state.startedAt).toLocaleString(window.scoreboardLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const started = window.t('common.game.startedSuffix', { date: startedAt });
  gameSubtitle.textContent = window.t('pointsToTarget.game.subtitle', { target: state.targetScore, started });

  toggleFinishedBtn.textContent = state.status === 'finished' ? window.t('common.buttons.resume') : window.t('common.buttons.finish');
}

function renderStandings(state) {
  standingsBody.innerHTML = '';
  let previousTotal = null;
  let previousRank = 0;

  state.standings.forEach((player, index) => {
    const rank = player.total === previousTotal ? previousRank : index + 1;
    previousTotal = player.total;
    previousRank = rank;

    const row = document.createElement('tr');
    if (rank === 1 && player.total > 0) row.className = 'rank-first';

    const percent = Math.max(0, Math.min(100, Math.round((player.total / state.targetScore) * 100)));
    const displayName = player.id === state.startingPlayerId ? `${player.name} ★` : player.name;

    row.innerHTML = `
      <td>${rank}</td>
      <td>${displayName}</td>
      <td>${player.total}</td>
      <td class="progress-cell">
        <div class="mini-progress">
          <div class="mini-progress__fill ${percent >= 100 ? 'mini-progress__fill--done' : ''}" style="width:${percent}%"></div>
        </div>
      </td>
    `;
    standingsBody.appendChild(row);
  });
}

function renderWinnerBanner(state) {
  winnerBannerWrap.innerHTML = '';
  if (state.status !== 'finished') return;

  const names = state.winners.map((w) => w.name).join(' & ');
  const banner = document.createElement('div');
  banner.className = 'winner-banner section-spacing';
  banner.textContent = state.winners.length > 1
    ? window.t('common.game.winnerBanner.multi', { names, points: state.winners[0].total })
    : window.t('common.game.winnerBanner.single', { names, points: state.winners[0].total });
  winnerBannerWrap.appendChild(banner);
}

function renderRoundEntryForm(state) {
  roundEntryCard.hidden = state.status === 'finished';
  roundFormGrid.innerHTML = '';

  state.players.forEach((player) => {
    const field = document.createElement('div');
    field.className = 'round-form-field';

    const label = document.createElement('label');
    label.setAttribute('for', `round-input-${player.id}`);
    label.textContent = player.name;

    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '-?[0-9]*';
    input.id = `round-input-${player.id}`;
    input.dataset.playerId = player.id;
    input.value = '0';

    field.appendChild(label);
    field.appendChild(input);
    roundFormGrid.appendChild(field);
  });
}

function renderRoundsTable(state) {
  roundsTableHead.innerHTML = `<th scope="col">${window.t('common.table.round')}</th>`;
  state.players.forEach((player) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = player.name;
    roundsTableHead.appendChild(th);
  });
  const actionsTh = document.createElement('th');
  actionsTh.scope = 'col';
  actionsTh.textContent = window.t('common.table.actions');
  roundsTableHead.appendChild(actionsTh);

  roundsTableBody.innerHTML = '';

  if (state.rounds.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = state.players.length + 2;
    cell.textContent = window.t('common.game.roundsTable.empty');
    cell.style.color = 'var(--color-text-muted)';
    cell.style.textAlign = 'left';
    row.appendChild(cell);
    roundsTableBody.appendChild(row);
    return;
  }

  state.rounds.forEach((round) => {
    const row = document.createElement('tr');

    const roundCell = document.createElement('td');
    roundCell.textContent = round.roundNumber;
    row.appendChild(roundCell);

    state.players.forEach((player) => {
      const cell = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.pattern = '-?[0-9]*';
      input.value = round.scores[player.id] ?? 0;
      input.dataset.playerId = player.id;
      input.addEventListener('change', () => correctRound(round.id, row));
      cell.appendChild(input);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    actionsCell.className = 'rounds-table__row-actions';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--small btn--danger';
    deleteBtn.textContent = window.t('common.buttons.delete');
    deleteBtn.addEventListener('click', () => deleteRound(round.id));
    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);

    roundsTableBody.appendChild(row);
  });
}

function renderStartingPlayerLegend(state) {
  startingPlayerLegend.hidden = state.startingPlayerId === null || state.startingPlayerId === undefined;
}

function renderUndoButton(state) {
  undoLastRoundBtn.hidden = state.rounds.length === 0;
}

function render(state) {
  renderHeader(state);
  renderStandings(state);
  renderStartingPlayerLegend(state);
  renderWinnerBanner(state);
  renderRoundEntryForm(state);
  renderRoundsTable(state);
  renderUndoButton(state);
}

function undoLastRound() {
  if (!currentState || currentState.rounds.length === 0) return;
  const lastRound = currentState.rounds[currentState.rounds.length - 1];
  deleteRound(lastRound.id);
}

async function saveNewRound() {
  const scores = {};
  roundFormGrid.querySelectorAll('input[data-player-id]').forEach((input) => {
    scores[input.dataset.playerId] = Number(input.value) || 0;
  });

  const response = await fetch(`/api/rounds.php?gameId=${gameId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scores }),
  });

  currentState = await response.json();
  render(currentState);
  window.scoreboardPlaySaveFeedback();
}

async function correctRound(roundId, rowEl) {
  const scores = {};
  rowEl.querySelectorAll('input[data-player-id]').forEach((input) => {
    scores[input.dataset.playerId] = Number(input.value) || 0;
  });

  const response = await fetch(`/api/rounds.php?gameId=${gameId}&roundId=${roundId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scores }),
  });

  currentState = await response.json();
  render(currentState);
}

async function deleteRound(roundId) {
  const confirmed = window.confirm(window.t('common.game.roundsTable.deleteConfirm'));
  if (!confirmed) return;

  const response = await fetch(`/api/rounds.php?gameId=${gameId}&roundId=${roundId}`, {
    method: 'DELETE',
  });

  currentState = await response.json();
  render(currentState);
}

async function toggleFinished() {
  const wantFinished = currentState.status !== 'finished';
  const response = await fetch(`/api/games.php?id=${gameId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finished: wantFinished }),
  });

  currentState = await response.json();
  render(currentState);
}

saveRoundBtn.addEventListener('click', saveNewRound);
toggleFinishedBtn.addEventListener('click', toggleFinished);
undoLastRoundBtn.addEventListener('click', undoLastRound);

window.scoreboardI18nReady.then(loadGame);
