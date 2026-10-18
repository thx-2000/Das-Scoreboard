const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const gameTitle = document.getElementById('game-title');
const gameSubtitle = document.getElementById('game-subtitle');
const standingsBody = document.getElementById('standings-body');
const standingsCards = document.getElementById('standings-cards');
const winnerBannerWrap = document.getElementById('winner-banner-wrap');
const sheetHead = document.getElementById('sheet-head');
const sheetBody = document.getElementById('sheet-body');
const sheetFoot = document.getElementById('sheet-foot');
const toggleFinishedBtn = document.getElementById('toggle-finished-btn');
const startingPlayerLegend = document.getElementById('starting-player-legend');

let currentState = null;

async function loadGame() {
  const response = await fetch(`/api/games.php?id=${gameId}`);
  if (!response.ok) {
    gameSubtitle.textContent = window.t('common.game.notFound');
    return;
  }
  currentState = await response.json();
  render(currentState);
  window.initGameEdit(gameId, (newState) => { currentState = newState; render(currentState); }, false);
}

function renderHeader(state) {
  gameTitle.textContent = state.label ? state.label : window.t('modes.scoreSheet.title');
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

function standingRank(state, index, previous) {
  const player = state.standings[index];
  return player.rankValue === previous.value ? previous.rank : index + 1;
}

function renderStandings(state) {
  standingsBody.innerHTML = '';
  const previous = { value: null, rank: 0 };

  state.standings.forEach((player, index) => {
    const rank = standingRank(state, index, previous);
    previous.value = player.rankValue;
    previous.rank = rank;

    const row = document.createElement('tr');
    if (rank === 1) row.className = 'rank-first';
    if (player.withdrawnAt) row.classList.add('standings-row--withdrawn');

    const displayName = window.escapeHtml(player.memberIds.includes(window.scoreboardMarkerPlayerId(state)) ? `${player.name} ★` : player.name);
    const withdrawnBadge = player.withdrawnAt
      ? `<span class="badge badge--withdrawn">${window.t('common.game.standings.withdrawnBadge')}</span>`
      : '';

    row.innerHTML = `
      <td>${rank}</td>
      <td><div class="standings-name">${window.avatarImgHtml(player)}<span>${displayName}</span>${withdrawnBadge}</div></td>
      <td>${player.total}</td>
    `;
    standingsBody.appendChild(row);
  });
}

/** Kartenansicht des Punktestands (nur im Bold-Theme sichtbar), siehe die game.js der anderen Modi. */
function renderStandingsCards(state) {
  standingsCards.innerHTML = '';
  const previous = { value: null, rank: 0 };

  state.standings.forEach((player, index) => {
    const rank = standingRank(state, index, previous);
    previous.value = player.rankValue;
    previous.rank = rank;

    const displayName = window.escapeHtml(player.memberIds.includes(window.scoreboardMarkerPlayerId(state)) ? `${player.name} ★` : player.name);
    const withdrawnBadge = player.withdrawnAt
      ? `<span class="badge badge--withdrawn">${window.t('common.game.standings.withdrawnBadge')}</span>`
      : '';
    const anchorId = player.memberIds && player.memberIds.length ? player.memberIds[0] : player.id;

    const card = document.createElement('div');
    card.className = player.withdrawnAt ? 'standings-card standings-row--withdrawn' : 'standings-card';
    card.dataset.playerColor = window.scoreboardPlayerColorIndex(state.players, anchorId);
    card.innerHTML = `
      <div class="standings-card__rank">${rank}</div>
      <div class="standings-card__info">
        <div class="standings-name">${window.avatarImgHtml(player)}<span>${displayName}</span>${withdrawnBadge}</div>
      </div>
      <div class="standings-card__points">${player.total}</div>
    `;
    standingsCards.appendChild(card);
  });
}

function renderStartingPlayerLegend(state) {
  window.scoreboardRenderMarkerLegend(state, startingPlayerLegend);
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

  const rematchLink = document.createElement('a');
  rematchLink.href = `setup.php?fromGame=${state.id}`;
  rematchLink.className = 'btn btn--secondary';
  rematchLink.textContent = window.t('common.game.rematchButton');
  winnerBannerWrap.appendChild(rematchLink);
}

/** Speichert die Zeile (= Wertung) einer Runde mit einem geaenderten Wert. */
async function saveCell(round, playerId, value) {
  const scores = {};
  currentState.players.forEach((p) => { scores[p.id] = round.scores[p.id] ?? 0; });
  scores[playerId] = value;

  const response = await fetch(`/api/rounds.php?gameId=${gameId}&roundId=${round.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scores }),
  });
  if (!response.ok) return;
  currentState = await response.json();
  render(currentState);
  window.scoreboardPlaySaveFeedback();
}

/**
 * Oeffnet fuer ein Feld die passende Eingabe: bei Zeilen mit Rechenhilfe (z.B.
 * Cascadia-Wertungskarte) erst deren Dialog, sonst die Zahlentastatur; "Weiter"
 * springt zum naechsten aktiven Spieler derselben Zeile.
 */
function editCell(roundId, playerId, forceKeypad = false) {
  const round = currentState.rounds.find((r) => r.id === roundId);
  const active = currentState.players.filter((p) => !p.withdrawnAt);
  const player = active.find((p) => p.id === playerId);
  if (!round || !player) return;
  const nextPlayer = active[active.indexOf(player) + 1];

  const card = forceKeypad ? null : window.cascadiaCardFor(round.helper);
  if (card) {
    window.openCascadiaCard({
      card,
      title: round.label || '',
      subtitle: player.name,
      onCommit: (value) => saveCell(round, player.id, value),
      onManual: () => editCell(roundId, playerId, true),
    });
    return;
  }

  window.openScoreKeypad({
    title: round.label || '',
    subtitle: player.name,
    initial: round.scores[player.id] ?? 0,
    hasNext: Boolean(nextPlayer),
    onCommit: (value) => saveCell(round, player.id, value),
    onNext: () => {
      // Erst nach dem Speichern weitermachen, damit der Wert der naechsten
      // Eingabe auf dem frischen Stand aufbaut.
      setTimeout(() => editCell(roundId, nextPlayer.id), 250);
    },
  });
}

let bonusSyncRunning = false;

/**
 * Cascadia: die Mehrheitsboni der Gebiete (Zeile "cascadia:bonus") ergeben sich
 * aus den Gebietsgroessen aller Spieler und werden deshalb automatisch
 * berechnet und gespeichert, sobald sich eine Groesse aendert (oder ein Spieler
 * dazukommt/ausscheidet).
 */
async function syncCascadiaBonus(state) {
  const bonusRound = state.rounds.find((r) => r.helper === 'cascadia:bonus');
  if (!bonusRound || bonusSyncRunning) return;

  const habitatRounds = state.rounds.filter((r) => r.helper === 'cascadia:habitat');
  const activeIds = state.players.filter((p) => !p.withdrawnAt).map((p) => p.id);
  const bonus = window.cascadiaMajorityBonus(habitatRounds.map((r) => r.scores), activeIds);
  if (activeIds.every((id) => (bonusRound.scores[id] ?? 0) === bonus[id])) return;

  const scores = {};
  state.players.forEach((p) => {
    scores[p.id] = activeIds.includes(p.id) ? bonus[p.id] : (bonusRound.scores[p.id] ?? 0);
  });
  bonusSyncRunning = true;
  try {
    const response = await fetch(`/api/rounds.php?gameId=${gameId}&roundId=${bonusRound.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores }),
    });
    if (response.ok) {
      currentState = await response.json();
      bonusSyncRunning = false;
      render(currentState);
    }
  } finally {
    bonusSyncRunning = false;
  }
}

function renderSheet(state) {
  sheetHead.innerHTML = '';
  sheetBody.innerHTML = '';
  sheetFoot.innerHTML = '';

  const labelTh = document.createElement('th');
  labelTh.scope = 'col';
  labelTh.textContent = window.t('scoreSheet.game.categoryColumn');
  sheetHead.appendChild(labelTh);
  state.players.forEach((player) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = player.name;
    if (player.withdrawnAt) th.classList.add('sheet-col--withdrawn');
    sheetHead.appendChild(th);
  });

  state.rounds.forEach((round) => {
    const row = document.createElement('tr');
    const labelCell = document.createElement('th');
    labelCell.scope = 'row';
    labelCell.textContent = round.label || String(round.roundNumber);
    row.appendChild(labelCell);

    state.players.forEach((player) => {
      const cell = document.createElement('td');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sheet-cell';
      btn.textContent = String(round.scores[player.id] ?? 0);
      btn.setAttribute('aria-label', `${round.label || ''} · ${player.name}: ${round.scores[player.id] ?? 0}`);
      if (round.helper === 'cascadia:bonus') {
        // Wird aus den Gebietsgroessen berechnet (siehe syncCascadiaBonus).
        btn.disabled = true;
        btn.classList.add('sheet-cell--auto');
        btn.title = window.t('scoreSheet.helper.auto');
      } else if (player.withdrawnAt) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => editCell(round.id, player.id));
      }
      if (player.withdrawnAt) cell.classList.add('sheet-col--withdrawn');
      cell.appendChild(btn);
      row.appendChild(cell);
    });
    sheetBody.appendChild(row);
  });

  const sumLabel = document.createElement('th');
  sumLabel.scope = 'row';
  sumLabel.textContent = window.t('scoreSheet.game.totalRow');
  sheetFoot.appendChild(sumLabel);
  state.players.forEach((player) => {
    const standing = state.standings.find((s) => s.memberIds.includes(player.id));
    const cell = document.createElement('td');
    cell.className = 'sheet-total';
    cell.textContent = String(standing ? standing.total : 0);
    if (player.withdrawnAt) cell.classList.add('sheet-col--withdrawn');
    sheetFoot.appendChild(cell);
  });
}

function render(state) {
  renderHeader(state);
  renderStandings(state);
  renderStandingsCards(state);
  renderStartingPlayerLegend(state);
  renderWinnerBanner(state);
  renderSheet(state);
  window.renderGameEditPanel(state);
  syncCascadiaBonus(state);
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

toggleFinishedBtn.addEventListener('click', toggleFinished);

window.scoreboardI18nReady.then(loadGame);
