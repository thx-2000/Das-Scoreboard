const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const gameTitle = document.getElementById('game-title');
const gameSubtitle = document.getElementById('game-subtitle');
const standingsBody = document.getElementById('standings-body');
const standingsCards = document.getElementById('standings-cards');
const winnerBannerWrap = document.getElementById('winner-banner-wrap');
const roundEntryCard = document.getElementById('round-entry-card');
const roundEntryTitle = document.getElementById('round-entry-title');
const roundEntryHint = document.getElementById('round-entry-hint');
const rageDealerLine = document.getElementById('rage-dealer-line');
const rageFlow = document.getElementById('rage-flow');
const roundsTableHead = document.getElementById('rounds-table-head');
const roundsTableBody = document.getElementById('rounds-table-body');
const toggleFinishedBtn = document.getElementById('toggle-finished-btn');
const startingPlayerLegend = document.getElementById('starting-player-legend');
const undoLastRoundBtn = document.getElementById('undo-last-round-btn');

let currentState = null;
// Ansagen der laufenden Runde: lokal sofort aktuell, verzoegert per
// api/rage-bids.php gespeichert (bidSaveTimer != null = Speichern steht aus).
let bidDraft = {};
let bidSaveTimer = null;
// Ergebnisse der laufenden Runde (Phase 2) - nur im Speicher, wird mit
// "Runde abschliessen" als echte Runde gespeichert.
let resultDraft = {};
let resultDraftRound = 0;

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
  window.initGameEdit(gameId, (newState) => { currentState = newState; render(currentState); }, false);
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
    if (player.withdrawnAt) row.classList.add('standings-row--withdrawn');

    const displayName = window.escapeHtml(player.id === currentDealerId(state) ? `${player.name} ★` : player.name);
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

/**
 * Kartenansicht des Punktestands - nur im Bold-Theme sichtbar (siehe
 * css/style.css), parallel zur Tabelle aus renderStandings() aufgebaut.
 * Farbe haengt an der Spieler-Position in state.players (stabil ueber
 * Rangwechsel hinweg), nicht am aktuellen Rang.
 */
function renderStandingsCards(state) {
  standingsCards.innerHTML = '';
  let previousTotal = null;
  let previousRank = 0;

  state.standings.forEach((player, index) => {
    const rank = player.total === previousTotal ? previousRank : index + 1;
    previousTotal = player.total;
    previousRank = rank;

    const displayName = window.escapeHtml(player.id === currentDealerId(state) ? `${player.name} ★` : player.name);
    const withdrawnBadge = player.withdrawnAt
      ? `<span class="badge badge--withdrawn">${window.t('common.game.standings.withdrawnBadge')}</span>`
      : '';
    const colorIndex = window.scoreboardPlayerColorIndex(state.players, player.id);

    const card = document.createElement('div');
    card.className = player.withdrawnAt ? 'standings-card standings-row--withdrawn' : 'standings-card';
    card.dataset.playerColor = colorIndex;
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

/** Geber der laufenden Runde - nach Spielende bzw. Runde 10 gibt es keinen mehr. */
function currentDealerId(state) {
  if (state.status === 'finished' || state.rounds.length >= 10 || !state.rage) return null;
  return state.rage.dealerId;
}

function renderStartingPlayerLegend(state) {
  startingPlayerLegend.hidden = currentDealerId(state) === null;
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

/** Aktive Spieler in Ansagereihenfolge: links vom Geber beginnend, der Geber zuletzt. */
function ragePlayersInBidOrder(state) {
  const byId = new Map(state.players.map((p) => [p.id, p]));
  const active = state.rage.seatOrder.map((id) => byId.get(id)).filter((p) => p && !p.withdrawnAt);
  const startIdx = active.findIndex((p) => p.id === state.rage.bidStartId);
  return startIdx > 0 ? [...active.slice(startIdx), ...active.slice(0, startIdx)] : active;
}

/**
 * Grosser Minus/Wert/Plus-Stepper. onChange bekommt den neuen Wert; das
 * Element bleibt bestehen (kein Neuaufbau pro Klick), damit schnelles
 * Mehrfach-Antippen nichts verschluckt.
 */
function buildRageStepper(name, value, max, onChange) {
  const control = document.createElement('div');
  control.className = 'rage-row__control';

  const minusBtn = document.createElement('button');
  minusBtn.type = 'button';
  minusBtn.className = 'rage-row__btn rage-row__btn--minus';
  minusBtn.textContent = '−';
  minusBtn.setAttribute('aria-label', `${window.t('common.stepper.decrease')}: ${name}`);

  const valueEl = document.createElement('span');
  valueEl.className = 'rage-row__value';
  valueEl.textContent = String(value);

  const plusBtn = document.createElement('button');
  plusBtn.type = 'button';
  plusBtn.className = 'rage-row__btn rage-row__btn--plus';
  plusBtn.textContent = '+';
  plusBtn.setAttribute('aria-label', `${window.t('common.stepper.increase')}: ${name}`);

  let current = value;
  function set(next) {
    const clamped = Math.max(0, Math.min(max, next));
    if (clamped === current) return;
    current = clamped;
    valueEl.textContent = String(clamped);
    onChange(clamped);
  }
  minusBtn.addEventListener('click', () => set(current - 1));
  plusBtn.addEventListener('click', () => set(current + 1));

  control.appendChild(minusBtn);
  control.appendChild(valueEl);
  control.appendChild(plusBtn);
  return control;
}

function buildRageRow(state, player, metaText) {
  const row = document.createElement('div');
  row.className = 'rage-row';
  row.dataset.playerColor = window.scoreboardPlayerColorIndex(state.players, player.id);

  const who = document.createElement('div');
  who.className = 'rage-row__who';
  const nameEl = document.createElement('span');
  nameEl.className = 'rage-row__name';
  nameEl.textContent = player.id === state.rage.dealerId ? `${player.name} ★` : player.name;
  const head = document.createElement('div');
  head.className = 'rage-row__head';
  head.appendChild(nameEl);
  who.appendChild(head);
  if (metaText) {
    const metaEl = document.createElement('span');
    metaEl.className = 'rage-row__meta';
    metaEl.textContent = metaText;
    who.appendChild(metaEl);
  }
  row.appendChild(who);
  return row;
}

async function flushBids() {
  clearTimeout(bidSaveTimer);
  bidSaveTimer = null;
  await fetch('/api/rage-bids.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId: Number(gameId), bids: bidDraft }),
  });
}

function scheduleBidSave() {
  clearTimeout(bidSaveTimer);
  bidSaveTimer = setTimeout(flushBids, 350);
}

async function setBidsLocked(locked) {
  if (locked) {
    clearTimeout(bidSaveTimer);
    bidSaveTimer = null;
  } else if (!window.confirm(window.t('rage.game.bids.unlockConfirm'))) {
    return;
  }
  const body = { gameId: Number(gameId), locked };
  if (locked) body.bids = bidDraft;
  const response = await fetch('/api/rage-bids.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    window.alert(data.error || window.t('rage.game.saveFailed'));
    return;
  }
  currentState = data;
  render(currentState);
}

/** Phase 1: nur die angesagten Stiche je Spieler, mit Live-Summe gegen die Kartenzahl. */
function renderBidPhase(state, players) {
  const { nextRound, cards } = state.rage;
  roundEntryTitle.textContent = window.t('rage.game.bids.heading', { round: nextRound, cards, cardWord: cardWord(cards) });
  roundEntryHint.textContent = window.t('rage.game.bids.hint');

  if (bidSaveTimer === null) bidDraft = { ...state.rage.bids };

  rageFlow.innerHTML = '';
  const sumEl = document.createElement('p');
  sumEl.className = 'rage-flow__sum';
  sumEl.setAttribute('aria-live', 'polite');
  rageFlow.appendChild(sumEl);

  const updateSum = () => {
    const sum = players.reduce((acc, p) => acc + (Number(bidDraft[p.id]) || 0), 0);
    sumEl.textContent = window.t('rage.game.bids.sumLabel', { sum, cards });
  };

  players.forEach((player) => {
    const row = buildRageRow(state, player, '');
    row.appendChild(buildRageStepper(player.name, Number(bidDraft[player.id]) || 0, cards, (next) => {
      bidDraft[player.id] = next;
      updateSum();
      scheduleBidSave();
    }));
    rageFlow.appendChild(row);
  });
  updateSum();

  const actions = document.createElement('div');
  actions.className = 'rage-flow__actions';
  const lockBtn = document.createElement('button');
  lockBtn.type = 'button';
  lockBtn.className = 'btn btn--primary';
  lockBtn.textContent = window.t('rage.game.bids.lockButton');
  lockBtn.addEventListener('click', () => {
    lockBtn.disabled = true;
    setBidsLocked(true).finally(() => { lockBtn.disabled = false; });
  });
  actions.appendChild(lockBtn);
  rageFlow.appendChild(actions);
}

/** Phase 2: Ansagen stehen fest und sind sichtbar, jetzt die tatsaechlichen Stiche (und Sonderkarten) eintragen. */
function renderResultPhase(state, players) {
  const { nextRound, cards } = state.rage;
  roundEntryTitle.textContent = window.t('rage.game.results.heading', { round: nextRound, cards, cardWord: cardWord(cards) });
  roundEntryHint.textContent = window.t('rage.game.results.hint');

  if (resultDraftRound !== nextRound) {
    resultDraft = {};
    resultDraftRound = nextRound;
  }
  const showBonusMalus = state.rageShowBonusMalus !== false;
  const bidOf = (player) => Number(state.rage.bids[player.id]) || 0;

  rageFlow.innerHTML = '';
  const sumEl = document.createElement('p');
  sumEl.className = 'rage-flow__sum';
  sumEl.setAttribute('aria-live', 'polite');
  rageFlow.appendChild(sumEl);

  const updateSum = () => {
    const sum = players.reduce((acc, p) => acc + resultDraft[p.id].tricks, 0);
    sumEl.textContent = window.t('rage.game.results.tricksSum', { sum, cards });
  };

  players.forEach((player) => {
    const entry = resultDraft[player.id] || (resultDraft[player.id] = { tricks: 0, bonus: 0, rache: 0 });
    const row = buildRageRow(state, player, window.t('rage.game.results.bidLabel', { bid: bidOf(player) }));

    const pointsEl = document.createElement('span');
    pointsEl.className = 'rage-row__points';
    const pointsLabel = window.t('rage.game.roundEntry.table.points');
    pointsEl.title = pointsLabel;
    const updatePoints = () => {
      const points = computeRagePoints(bidOf(player), entry.tricks, entry.bonus, entry.rache);
      pointsEl.textContent = String(points);
      pointsEl.setAttribute('aria-label', `${pointsLabel}: ${points}`);
    };

    const control = buildRageStepper(player.name, entry.tricks, cards, (next) => {
      entry.tricks = next;
      updatePoints();
      updateSum();
    });
    // Punktevorschau rechts neben dem Namen, Ansage darunter.
    row.querySelector('.rage-row__head').appendChild(pointsEl);
    row.appendChild(control);

    if (showBonusMalus) {
      const extras = document.createElement('div');
      extras.className = 'rage-row__extras';
      [['bonus', 'rage.game.roundEntry.table.plus5'], ['rache', 'rage.game.roundEntry.table.minus5']].forEach(([field, labelKey]) => {
        const label = window.t(labelKey);
        const extra = document.createElement('div');
        extra.className = 'rage-row__extra';
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        extra.appendChild(labelEl);
        extra.appendChild(buildRageStepper(`${player.name} ${label}`, entry[field], 99, (next) => {
          entry[field] = next;
          updatePoints();
        }));
        extras.appendChild(extra);
      });
      row.appendChild(extras);
    }

    updatePoints();
    rageFlow.appendChild(row);
  });
  updateSum();

  const actions = document.createElement('div');
  actions.className = 'rage-flow__actions';
  const unlockBtn = document.createElement('button');
  unlockBtn.type = 'button';
  unlockBtn.className = 'btn btn--ghost';
  unlockBtn.textContent = window.t('rage.game.bids.unlockButton');
  unlockBtn.addEventListener('click', () => setBidsLocked(false));
  const finishBtn = document.createElement('button');
  finishBtn.type = 'button';
  finishBtn.className = 'btn btn--primary';
  finishBtn.textContent = window.t('rage.game.results.finishButton');
  finishBtn.addEventListener('click', () => {
    finishBtn.disabled = true;
    saveNewRound(players).finally(() => { finishBtn.disabled = false; });
  });
  actions.appendChild(unlockBtn);
  actions.appendChild(finishBtn);
  rageFlow.appendChild(actions);
}

function renderRoundEntry(state) {
  const finishedOrDone = state.status === 'finished' || state.rounds.length >= 10;
  roundEntryCard.hidden = finishedOrDone;
  if (finishedOrDone) return;

  const players = ragePlayersInBidOrder(state);
  const nameOf = (id) => (state.players.find((p) => p.id === id) || {}).name || '';
  rageDealerLine.textContent = window.t('rage.game.round.dealerLine', {
    dealer: nameOf(state.rage.dealerId),
    first: nameOf(state.rage.bidStartId),
  });

  if (state.rage.bidsLocked) {
    renderResultPhase(state, players);
  } else {
    renderBidPhase(state, players);
  }
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

  const showBonusMalus = state.rageShowBonusMalus !== false;
  const columnsPerPlayer = showBonusMalus ? 5 : 3;

  // Kopfzeile 1: Rundenspalte + Spielername ueber je Unterspalten (5, oder 3
  // wenn Bonus/Malus in den Setup-Optionen ausgeblendet wurde).
  const headRow1 = document.createElement('tr');
  const roundTh = document.createElement('th');
  roundTh.scope = 'col';
  roundTh.rowSpan = 2;
  roundTh.textContent = window.t('common.table.round');
  headRow1.appendChild(roundTh);
  state.players.forEach((player) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.colSpan = columnsPerPlayer;
    th.textContent = player.name;
    headRow1.appendChild(th);
  });
  roundsTableHead.appendChild(headRow1);

  // Kopfzeile 2: Feldbezeichnungen je Spieler.
  const headRow2 = document.createElement('tr');
  const fieldLabels = [
    window.t('rage.game.roundEntry.table.bid'),
    window.t('rage.game.roundEntry.table.tricks'),
    ...(showBonusMalus ? [window.t('rage.game.roundEntry.table.plus5'), window.t('rage.game.roundEntry.table.minus5')] : []),
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
      bidInput.type = 'text';
      bidInput.inputMode = 'numeric';
      bidInput.pattern = '[0-9]*';
      bidInput.className = 'field-bid';
      bidInput.dataset.playerId = player.id;
      bidInput.value = details.bid ?? 0;

      const actualInput = document.createElement('input');
      actualInput.type = 'text';
      actualInput.inputMode = 'numeric';
      actualInput.pattern = '[0-9]*';
      actualInput.className = 'field-actual';
      actualInput.dataset.playerId = player.id;
      actualInput.value = details.actualTricks ?? 0;

      const bonusInput = document.createElement('input');
      bonusInput.type = 'text';
      bonusInput.inputMode = 'numeric';
      bonusInput.pattern = '[0-9]*';
      bonusInput.className = 'field-bonus';
      bonusInput.dataset.playerId = player.id;
      bonusInput.value = details.rageBonusCount ?? 0;

      const racheInput = document.createElement('input');
      racheInput.type = 'text';
      racheInput.inputMode = 'numeric';
      racheInput.pattern = '[0-9]*';
      racheInput.className = 'field-rache';
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

      // Bonus/Rache-Zellen bleiben immer im DOM (nur per hidden versteckt),
      // damit collectEntriesFromRoundRow() ihre Werte per querySelector()
      // weiterhin findet - sonst wuerden bereits gespeicherte Bonus/Rache-
      // Werte beim naechsten Speichern stillschweigend auf 0 zurueckfallen.
      [
        [bidInput, false],
        [actualInput, false],
        [bonusInput, !showBonusMalus],
        [racheInput, !showBonusMalus],
      ].forEach(([input, cellHidden]) => {
        input.addEventListener('change', onChange);
        const cell = document.createElement('td');
        cell.hidden = cellHidden;
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
    cell.colSpan = columnsPerPlayer;
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
  renderStandingsCards(state);
  renderStartingPlayerLegend(state);
  renderWinnerBanner(state);
  renderRoundEntry(state);
  renderRoundsTable(state);
  renderUndoButton(state);
  window.renderGameEditPanel(state);
}

function undoLastRound() {
  if (!currentState || currentState.rounds.length === 0) return;
  const lastRound = currentState.rounds[currentState.rounds.length - 1];
  deleteRound(lastRound.id);
}

async function saveNewRound(players) {
  const entries = {};
  players.forEach((player) => {
    const e = resultDraft[player.id];
    entries[player.id] = {
      bid: Number(currentState.rage.bids[player.id]) || 0,
      actualTricks: e.tricks,
      rageBonusCount: e.bonus,
      rageRacheCount: e.rache,
    };
  });

  const expectedCards = currentState.rage.cards;
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

  resultDraft = {};
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

toggleFinishedBtn.addEventListener('click', toggleFinished);
undoLastRoundBtn.addEventListener('click', undoLastRound);

window.scoreboardI18nReady.then(loadGame);
