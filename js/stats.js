const filterForm = document.getElementById('filter-form');
const filterFromInput = document.getElementById('filter-from');
const filterToInput = document.getElementById('filter-to');
const resetFilterBtn = document.getElementById('reset-filter-btn');
const printBtn = document.getElementById('print-btn');
const printHeading = document.getElementById('stats-print-heading');

const overallTable = document.getElementById('overall-table');
const overallEmpty = document.getElementById('overall-empty');
const byModeTables = document.getElementById('by-mode-tables');
const h2hList = document.getElementById('h2h-list');
const h2hEmpty = document.getElementById('h2h-empty');
const gamesList = document.getElementById('games-list');
const gamesEmpty = document.getElementById('games-empty');

function modeInfo() {
  return {
    points_to_target: { title: window.t('modes.pointsToTarget.title'), url: '/modes/points-to-target/game.php' },
    points_open: { title: window.t('modes.pointsOpen.title'), url: '/modes/points-open/game.php' },
    fixed_rounds: { title: window.t('modes.fixedRounds.title'), url: '/modes/fixed-rounds/game.php' },
    rage: { title: window.t('modes.rage.title'), url: '/modes/rage/game.php' },
  };
}

function modeTitle(mode) {
  return (modeInfo()[mode] || { title: mode }).title;
}

function formatPercent(value) {
  return value === null || value === undefined ? '–' : `${Math.round(value * 100)}%`;
}

function formatScore(value) {
  return value === null || value === undefined ? '–' : String(Math.round(value * 10) / 10);
}

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(window.scoreboardLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function renderOverall(rows) {
  const thead = overallTable.querySelector('thead');
  const tbody = overallTable.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  overallEmpty.hidden = rows.length > 0;
  overallTable.hidden = rows.length === 0;
  if (rows.length === 0) return;

  const headRow = document.createElement('tr');
  [
    window.t('stats.table.player'),
    window.t('stats.table.gamesPlayed'),
    window.t('stats.table.gamesFinished'),
    window.t('stats.table.wins'),
    window.t('stats.table.winRate'),
    window.t('stats.table.currentStreak'),
    window.t('stats.table.longestStreak'),
  ].forEach((text) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    // Tabelle ist serverseitig nach Siegen absteigend sortiert (siehe
    // includes/state.php) - die erste Zeile mit mindestens einem Sieg ist
    // also die/der Fuehrende.
    if (index === 0 && row.wins > 0) tr.className = 'rank-first';
    [
      row.name,
      row.gamesPlayed,
      row.gamesFinished,
      row.wins,
      formatPercent(row.winRate),
      row.currentStreak,
      row.longestStreak,
    ].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function renderByMode(byMode) {
  byModeTables.innerHTML = '';
  const modes = Object.keys(byMode);
  if (modes.length === 0) return;

  modes.forEach((mode) => {
    const rows = byMode[mode];
    if (rows.length === 0) return;

    const wrap = document.createElement('div');
    wrap.className = 'section-spacing';

    const heading = document.createElement('h3');
    heading.textContent = modeTitle(mode);
    wrap.appendChild(heading);

    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'table-scroll';

    const table = document.createElement('table');
    table.className = 'stats-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    [
      window.t('stats.table.player'),
      window.t('stats.table.gamesPlayed'),
      window.t('stats.table.gamesFinished'),
      window.t('stats.table.wins'),
      window.t('stats.table.winRate'),
      window.t('stats.table.avgScore'),
    ].forEach((text) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = text;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      if (index === 0 && row.wins > 0) tr.className = 'rank-first';
      [
        row.name,
        row.gamesPlayed,
        row.gamesFinished,
        row.wins,
        formatPercent(row.winRate),
        formatScore(row.avgScore),
      ].forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    scrollWrap.appendChild(table);
    wrap.appendChild(scrollWrap);
    byModeTables.appendChild(wrap);
  });
}

function renderHeadToHead(rows) {
  h2hList.innerHTML = '';
  h2hEmpty.hidden = rows.length > 0;
  if (rows.length === 0) return;

  rows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'h2h-row';

    const names = document.createElement('div');
    names.className = 'h2h-row__names';
    names.textContent = `${row.aName} – ${row.bName}`;

    const meta = document.createElement('div');
    meta.className = 'hint-text';
    meta.textContent = `${row.aWins}:${row.bWins} (${row.draws} ${window.t('stats.headToHead.draws')}) · ${row.games} ${window.t('stats.headToHead.gamesSuffix')}`;

    li.appendChild(names);
    li.appendChild(meta);
    h2hList.appendChild(li);
  });
}

function renderGames(games) {
  gamesList.innerHTML = '';
  gamesEmpty.hidden = games.length > 0;
  if (games.length === 0) return;

  const modes = modeInfo();

  // Neueste zuerst, konsistent mit dem Spielverlauf.
  [...games].reverse().forEach((game) => {
    const li = document.createElement('li');

    const info = modes[game.mode] || { title: game.mode, url: '#' };
    const item = document.createElement('a');
    item.className = 'history-item';
    item.href = `${info.url}?id=${game.id}`;

    const title = document.createElement('div');
    title.className = 'history-item__title';
    title.textContent = game.label ? `${game.label} (${modeTitle(game.mode)})` : modeTitle(game.mode);

    const meta = document.createElement('div');
    meta.className = 'history-item__meta';
    let metaText = `${formatDateTime(game.startedAt)} · ${game.playerNames.join(', ')}`;
    if (game.status === 'finished' && game.winnerNames.length > 0) {
      metaText += ` · ${window.t('history.meta.winners', { names: game.winnerNames.join(' & ') })}`;
    }
    meta.textContent = metaText;

    item.appendChild(title);
    item.appendChild(meta);
    li.appendChild(item);
    gamesList.appendChild(li);
  });
}

function renderPrintHeading(range) {
  if (!range.from && !range.to) {
    printHeading.textContent = '';
    return;
  }
  const from = range.from ? new Date(range.from).toLocaleString(window.scoreboardLocale()) : '…';
  const to = range.to ? new Date(range.to).toLocaleString(window.scoreboardLocale()) : '…';
  printHeading.textContent = `${window.t('stats.filter.heading')}: ${from} – ${to}`;
}

async function loadStats() {
  const params = new URLSearchParams();
  if (filterFromInput.value) params.set('from', filterFromInput.value);
  if (filterToInput.value) params.set('to', filterToInput.value);

  const response = await fetch(`/api/stats.php?${params.toString()}`);
  const data = await response.json();

  renderPrintHeading(data.range);
  renderOverall(data.overall);
  renderByMode(data.byMode);
  renderHeadToHead(data.headToHead);
  renderGames(data.games);
}

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadStats();
});

resetFilterBtn.addEventListener('click', () => {
  filterFromInput.value = '';
  filterToInput.value = '';
  loadStats();
});

printBtn.addEventListener('click', () => {
  window.print();
});

window.scoreboardI18nReady.then(loadStats);
