const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const gameTitle = document.getElementById('game-title');
const gameSubtitle = document.getElementById('game-subtitle');
const standingsBody = document.getElementById('standings-body');
const winnerBannerWrap = document.getElementById('winner-banner-wrap');
const roundEntryCard = document.getElementById('round-entry-card');
const roundEntryTitle = document.getElementById('round-entry-title');
const roundEntryHint = document.getElementById('round-entry-hint');
const roundEntryBody = document.getElementById('round-entry-body');
const saveRoundBtn = document.getElementById('save-round-btn');
const roundsTableHead = document.getElementById('rounds-table-head');
const roundsTableBody = document.getElementById('rounds-table-body');
const toggleFinishedBtn = document.getElementById('toggle-finished-btn');
const startingPlayerLegend = document.getElementById('starting-player-legend');
const undoLastRoundBtn = document.getElementById('undo-last-round-btn');

let currentState = null;

function cardsForRound(roundNumber) {
  return Math.max(0, 11 - roundNumber);
}

function computeRagePoints(bid, actualTricks, bonus, rache) {
  let points = actualTricks;
  points += bid === actualTricks ? 10 : -5;
  points += 5 * bonus;
  points -= 5 * rache;
  return points;
}

function cardWord(cards) {
  return cards === 1 ? window.t('rage.game.cardSingular') : window.t('rage.game.cardPlural');
}

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
  gameTitle.textContent = state.label ? state.label : window.t('modes.rage.title');
  const startedAt = new Date(state.startedAt).toLocaleString(window.scoreboardLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const started = window.t('common.game.startedSuffix', { date: startedAt });

  const playedRounds = state.rounds.length;
  if (state.status === 'finished') {
    gameSubtitle.textContent = window.t('rage.game.subtitleFinished', { played: playedRounds, started });
  } else {
    const nextRoundNumber = playedRounds + 1;
    const cards = cardsForRound(nextRoundNumber);
    gameSubtitle.textContent = window.t('rage.game.subtitleOngoing', {
      round: nextRoundNumber, cards, cardWord: cardWord(cards), started,
    });
  }

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
    if (rank === 1) row.className = 'rank-first';

    const displayName = player.id === state.startingPlayerId ? `${player.name} ★` : player.name;

    row.innerHTML = `
      <td>${rank}</td>
      <td>${displayName}</td>
      <td>${player.total}</td>
    `;
    standingsBody.appendChild(row);
  });
}

function renderStartingPlayerLegend(state) {
  startingPlayerLegend.hidden = state.startingPlayerId === null || state.startingPlayerId === undefined;
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

function updateEntryRowPreview(row) {
  const bid = Number(row.querySelector('.field-bid').value) || 0;
  const actual = Number(row.querySelector('.field-actual').value) || 0;
  const bonus = Number(row.querySelector('.field-bonus').value) || 0;
  const rache = Number(row.querySelector('.field-rache').value) || 0;
  row.querySelector('.field-preview').textContent = computeRagePoints(bid, actual, bonus, rache);
}

function renderRoundEntry(state) {
  const playedRounds = state.rounds.length;
  const finishedOrDone = state.status === 'finished' || playedRounds >= 10;
  roundEntryCard.hidden = finishedOrDone;
  if (finishedOrDone) return;

  const nextRoundNumber = playedRounds + 1;
  const cards = cardsForRound(nextRoundNumber);
  roundEntryTitle.textContent = window.t('rage.game.roundEntry.heading', { round: nextRoundNumber, cards, cardWord: cardWord(cards) });
  roundEntryHint.textContent = window.t('rage.game.roundEntry.hint', { cards });

  roundEntryBody.innerHTML = '';
  state.players.forEach((player) => {
    const row = document.createElement('tr');
    row.dataset.playerId = player.id;
    row.innerHTML = `
      <td style="text-align:left;">${player.name}</td>
      <td><input type="number" class="field-bid" min="0" max="${cards}" value="0"></td>
      <td><input type="number" class="field-actual" min="0" max="${cards}" value="0"></td>
      <td><input type="number" class="field-bonus" min="0" max="3" value="0"></td>
      <td><input type="number" class="field-rache" min="0" max="3" value="0"></td>
      <td class="field-preview">0</td>
    `;
    row.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => updateEntryRowPreview(row));
    });
    roundEntryBody.appendChild(row);
  });
}

/** Liest die 4 Eingabefelder EINER Spieler-Zeile (Rundenerfassung). */
function collectEntryFromPlayerRow(row) {
  return {
    bid: Number(row.querySelector('.field-bid').value) || 0,
    actualTricks: Number(row.querySelector('.field-actual').value) || 0,
    rageBonusCount: Number(row.querySelector('.field-bonus').value) || 0,
    rageRacheCount: Number(row.querySelector('.field-rache').value) || 0,
  };
}

/** Liest alle Spieler-Eingabefelder EINER Runden-Zeile (Korrektur-Tabelle). */
function collectEntriesFromRoundRow(row) {
  const entries = {};
  row.querySelectorAll('.field-bid').forEach((bidInput) => {
    const playerId = bidInput.dataset.playerId;
    const cellsRoot = row;
    entries[playerId] = {
      bid: Number(bidInput.value) || 0,
      actualTricks: Number(cellsRoot.querySelector(`.field-actual[data-player-id="${playerId}"]`).value) || 0,
      rageBonusCount: Number(cellsRoot.querySelector(`.field-bonus[data-player-id="${playerId}"]`).value) || 0,
      rageRacheCount: Number(cellsRoot.querySelector(`.field-rache[data-player-id="${playerId}"]`).value) || 0,
    };
  });
  return entries;
}

function renderRoundsTable(state) {
  roundsTableHead.innerHTML = '';
  roundsTableBody.innerHTML = '';

  if (state.rounds.length === 0) {
    roundsTableHead.innerHTML = `<tr><th scope="col">${window.t('common.table.round')}</th></tr>`;
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 1;
    cell.textContent = window.t('common.game.roundsTable.empty');
    cell.style.color = 'var(--color-text-muted)';
    cell.style.textAlign = 'left';
    row.appendChild(cell);
    roundsTableBody.appendChild(row);
    return;
  }

  // Kopfzeile 1: Rundenspalte + Spielername ueber je 5 Unterspalten.
  const headRow1 = document.createElement('tr');
  const roundTh = document.createElement('th');
  roundTh.scope = 'col';
  roundTh.rowSpan = 2;
  roundTh.textContent = window.t('common.table.round');
  headRow1.appendChild(roundTh);
  state.players.forEach((player) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.colSpan = 5;
    th.textContent = player.name;
    headRow1.appendChild(th);
  });
  roundsTableHead.appendChild(headRow1);

  // Kopfzeile 2: Feldbezeichnungen je Spieler.
  const headRow2 = document.createElement('tr');
  const fieldLabels = [
    window.t('rage.game.roundEntry.table.bid'),
    window.t('rage.game.roundEntry.table.tricks'),
    window.t('rage.game.roundEntry.table.plus5'),
    window.t('rage.game.roundEntry.table.minus5'),
    window.t('rage.game.roundEntry.table.points'),
  ];
  state.players.forEach(() => {
    fieldLabels.forEach((label) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      th.style.fontSize = '0.72rem';
      headRow2.appendChild(th);
    });
  });
  roundsTableHead.appendChild(headRow2);

  state.rounds.forEach((round) => {
    const row = document.createElement('tr');
    row.dataset.roundId = round.id;

    const roundCell = document.createElement('td');
    roundCell.textContent = round.roundNumber;
    row.appendChild(roundCell);

    state.players.forEach((player) => {
      const details = round.rageDetails[player.id] || { bid: 0, actualTricks: 0, rageBonusCount: 0, rageRacheCount: 0 };

      const bidInput = document.createElement('input');
      bidInput.type = 'number';
      bidInput.className = 'field-bid';
      bidInput.min = '0';
      bidInput.dataset.playerId = player.id;
      bidInput.value = details.bid ?? 0;

      const actualInput = document.createElement('input');
      actualInput.type = 'number';
      actualInput.className = 'field-actual';
      actualInput.min = '0';
      actualInput.dataset.playerId = player.id;
      actualInput.value = details.actualTricks ?? 0;

      const bonusInput = document.createElement('input');
      bonusInput.type = 'number';
      bonusInput.className = 'field-bonus';
      bonusInput.min = '0';
      bonusInput.max = '3';
      bonusInput.dataset.playerId = player.id;
      bonusInput.value = details.rageBonusCount ?? 0;

      const racheInput = document.createElement('input');
      racheInput.type = 'number';
      racheInput.className = 'field-rache';
      racheInput.min = '0';
      racheInput.max = '3';
      racheInput.dataset.playerId = player.id;
      racheInput.value = details.rageRacheCount ?? 0;

      const previewCell = document.createElement('td');
      previewCell.className = 'field-preview';
      previewCell.dataset.playerId = player.id;
      previewCell.textContent = round.scores[player.id] ?? 0;

      const onChange = () => {
        previewCell.textContent = computeRagePoints(
          Number(bidInput.value) || 0,
          Number(actualInput.value) || 0,
          Number(bonusInput.value) || 0,
          Number(racheInput.value) || 0,
        );
        correctRound(round.id, row);
      };

      [bidInput, actualInput, bonusInput, racheInput].forEach((input) => {
        input.addEventListener('change', onChange);
        const cell = document.createElement('td');
        cell.appendChild(input);
        row.appendChild(cell);
      });
      row.appendChild(previewCell);
    });

    roundsTableBody.appendChild(row);
  });

  // Eigene Zeile fuer Loeschen-Buttons, statt jede Zeile zu verbreitern.
  const deleteRow = document.createElement('tr');
  const deleteLabelCell = document.createElement('td');
  deleteLabelCell.textContent = '';
  deleteRow.appendChild(deleteLabelCell);
  state.rounds.forEach((round) => {
    const cell = document.createElement('td');
    cell.colSpan = 5;
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--small btn--danger';
    deleteBtn.textContent = window.t('rage.game.deleteRoundButton', { round: round.roundNumber });
    deleteBtn.addEventListener('click', () => deleteRound(round.id));
    cell.appendChild(deleteBtn);
    deleteRow.appendChild(cell);
  });
  roundsTableBody.appendChild(deleteRow);
}

function renderUndoButton(state) {
  undoLastRoundBtn.hidden = state.rounds.length === 0;
}

function render(state) {
  renderHeader(state);
  renderStandings(state);
  renderStartingPlayerLegend(state);
  renderWinnerBanner(state);
  renderRoundEntry(state);
  renderRoundsTable(state);
  renderUndoButton(state);
}

function undoLastRound() {
  if (!currentState || currentState.rounds.length === 0) return;
  const lastRound = currentState.rounds[currentState.rounds.length - 1];
  deleteRound(lastRound.id);
}

async function saveNewRound() {
  const rows = Array.from(roundEntryBody.querySelectorAll('tr'));
  const entries = {};
  rows.forEach((row) => {
    entries[row.dataset.playerId] = collectEntryFromPlayerRow(row);
  });

  const nextRoundNumber = currentState.rounds.length + 1;
  const expectedCards = cardsForRound(nextRoundNumber);
  const actualSum = Object.values(entries).reduce((sum, e) => sum + e.actualTricks, 0);

  if (actualSum !== expectedCards) {
    const proceed = window.confirm(
      window.t('rage.game.mismatchConfirm', { actual: actualSum, expected: expectedCards })
    );
    if (!proceed) return;
  }

  const response = await fetch(`/api/rage-rounds.php?gameId=${gameId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });

  const data = await response.json();
  if (!response.ok) {
    window.alert(data.error || window.t('rage.game.saveFailed'));
    return;
  }

  currentState = data;
  render(currentState);
  window.scoreboardPlaySaveFeedback();
}

async function correctRound(roundId, rowEl) {
  const entries = collectEntriesFromRoundRow(rowEl);

  const response = await fetch(`/api/rage-rounds.php?gameId=${gameId}&roundId=${roundId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });

  currentState = await response.json();
  render(currentState);
}

async function deleteRound(roundId) {
  const confirmed = window.confirm(window.t('common.game.roundsTable.deleteConfirm'));
  if (!confirmed) return;

  const response = await fetch(`/api/rage-rounds.php?gameId=${gameId}&roundId=${roundId}`, {
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
