const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const gameTitle = document.getElementById('game-title');
const gameSubtitle = document.getElementById('game-subtitle');
const standingsBody = document.getElementById('standings-body');
const standingsCards = document.getElementById('standings-cards');
const winnerBannerWrap = document.getElementById('winner-banner-wrap');
const roundEntryCard = document.getElementById('round-entry-card');
const roundEntryModeBtn = document.getElementById('round-entry-mode-btn');
const roundFormGrid = document.getElementById('round-form-grid');
const roundEntrySequence = document.getElementById('round-entry-sequence');
const roundEntryFlip = document.getElementById('round-entry-flip');
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
  const title = state.label ? `${state.label}` : window.t('modes.pointsOpen.title');
  gameTitle.textContent = title;
  const startedAt = new Date(state.startedAt).toLocaleString(window.scoreboardLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const directionText = state.winDirection === 'lowest'
    ? window.t('pointsOpen.game.direction.lowest')
    : window.t('pointsOpen.game.direction.highest');
  const started = window.t('common.game.startedSuffix', { date: startedAt });
  gameSubtitle.textContent = window.t('pointsOpen.game.subtitle', { direction: directionText, started });

  toggleFinishedBtn.textContent = state.status === 'finished' ? window.t('common.buttons.resume') : window.t('common.buttons.finish');
}

function renderStandings(state) {
  standingsBody.innerHTML = '';
  let previousRankValue = null;
  let previousRank = 0;

  state.standings.forEach((player, index) => {
    const rank = player.rankValue === previousRankValue ? previousRank : index + 1;
    previousRankValue = player.rankValue;
    previousRank = rank;

    const row = document.createElement('tr');
    if (rank === 1) row.className = 'rank-first';

    const displayName = player.memberIds.includes(state.startingPlayerId) ? `${player.name} ★` : player.name;
    // teamLabel/teamTotal gibt es nur im team_scoring "individual" (Migration
    // 9) - dort bleibt jeder Spieler eine eigene Zeile, zeigt aber zusaetzlich
    // die Team-Zugehoerigkeit und -Summe an.
    const teamHint = player.teamLabel
      ? `<div class="hint-text standings-team-hint">${player.teamLabel} · ${player.teamTotal} ${window.t('common.game.standings.teamTotalSuffix')}</div>`
      : '';

    row.innerHTML = `
      <td>${rank}</td>
      <td><div class="standings-name">${window.avatarImgHtml(player)}<span>${displayName}</span></div>${teamHint}</td>
      <td>${player.total}</td>
    `;
    standingsBody.appendChild(row);
  });
}

/**
 * Kartenansicht des Punktestands - nur im Bold-Theme sichtbar (siehe
 * css/style.css), parallel zur Tabelle aus renderStandings() aufgebaut.
 * Farbe haengt an der Spieler-Position in state.players (stabil ueber
 * Rangwechsel hinweg), nicht am aktuellen Rang.
 */
function renderStandingsCards(state) {
  standingsCards.innerHTML = '';
  let previousRankValue = null;
  let previousRank = 0;

  state.standings.forEach((player, index) => {
    const rank = player.rankValue === previousRankValue ? previousRank : index + 1;
    previousRankValue = player.rankValue;
    previousRank = rank;

    const displayName = player.memberIds.includes(state.startingPlayerId) ? `${player.name} ★` : player.name;
    const teamHint = player.teamLabel
      ? `<div class="hint-text standings-team-hint">${player.teamLabel} · ${player.teamTotal} ${window.t('common.game.standings.teamTotalSuffix')}</div>`
      : '';
    const anchorId = player.memberIds && player.memberIds.length ? player.memberIds[0] : player.id;
    const colorIndex = window.scoreboardPlayerColorIndex(state.players, anchorId);

    const card = document.createElement('div');
    card.className = 'standings-card';
    card.dataset.playerColor = colorIndex;
    card.innerHTML = `
      <div class="standings-card__rank">${rank}</div>
      <div class="standings-card__info">
        <div class="standings-name">${window.avatarImgHtml(player)}<span>${displayName}</span></div>
        ${teamHint}
      </div>
      <div class="standings-card__points">${player.total}</div>
    `;
    standingsCards.appendChild(card);
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
  window.renderRoundEntryFields(roundFormGrid, window.groupPlayersByTeam(state.players, state.teamScoring), state.allowNegative);
}

/**
 * Bold-Theme: Rundenerfassung als frei anwaehlbarer Spieler-Picker statt
 * Eingabe-Raster (siehe js/round-entry.js) - schreibt in dieselben Felder
 * wie renderRoundEntryForm(), "Runde speichern" bleibt der gemeinsame
 * Speichern-Weg fuer beide Themes.
 */
function renderRoundEntrySequence(state) {
  if (state.status === 'finished') {
    roundEntrySequence.innerHTML = '';
    return;
  }
  window.buildRoundEntryPicker(roundEntrySequence, window.groupPlayersByTeam(state.players, state.teamScoring), state.players, state.allowNegative);
}

/**
 * Flip Board: Tipp-Feld + Schritt-Buttons gleichzeitig statt Sequenz-Picker
 * (siehe js/round-entry.js buildFlipRoundEntry()).
 */
function renderRoundEntryFlip(state) {
  if (state.status === 'finished') {
    roundEntryFlip.innerHTML = '';
    return;
  }
  window.buildFlipRoundEntry(roundEntryFlip, window.groupPlayersByTeam(state.players, state.teamScoring), state.allowNegative);
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
      // Der Korrektur-Sync gilt nur im team_scoring "shared" - im
      // "individual"-Modus traegt jeder Spieler unabhaengige Punkte ein,
      // daher hier bewusst kein dataset.teamNumber gesetzt.
      if (state.teamScoring !== 'individual' && player.teamNumber !== null && player.teamNumber !== undefined) {
        input.dataset.teamNumber = player.teamNumber;
      }
      input.addEventListener('change', () => {
        // Team-Mitglieder teilen sich einen Punktwert - bei Korrektur eines
        // Mitglieds die anderen Eingabefelder derselben Runde mit angleichen,
        // bevor correctRound() alle Werte der Zeile sammelt und sendet.
        if (input.dataset.teamNumber) {
          row.querySelectorAll(`input[data-team-number="${input.dataset.teamNumber}"]`).forEach((sibling) => {
            sibling.value = input.value;
          });
        }
        correctRound(round.id, row);
      });
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
  renderStandingsCards(state);
  renderStartingPlayerLegend(state);
  renderWinnerBanner(state);
  renderRoundEntryForm(state);
  renderRoundEntrySequence(state);
  renderRoundEntryFlip(state);
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
  roundFormGrid.querySelectorAll('input[data-player-ids]').forEach((input) => {
    const value = Number(input.value) || 0;
    input.dataset.playerIds.split(',').forEach((playerId) => { scores[playerId] = value; });
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

window.scoreboardI18nReady.then(() => {
  window.wireRoundEntryModeToggle(
    roundEntryModeBtn,
    () => renderRoundEntryForm(currentState),
    () => renderRoundEntrySequence(currentState),
  );
  loadGame();
});
