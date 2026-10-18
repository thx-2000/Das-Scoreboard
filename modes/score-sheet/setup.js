const setupForm = document.getElementById('setup-form');
const gameLabelInput = document.getElementById('game-label');
const templatePicker = document.getElementById('template-picker');
const categoriesInput = document.getElementById('categories');
const groupPickerContainer = document.getElementById('group-picker');
const playerPicker = document.getElementById('player-picker');
const newPlayerInlineInput = document.getElementById('new-player-inline');
const addPlayerInlineBtn = document.getElementById('add-player-inline-btn');
const setupError = document.getElementById('setup-error');

const selectedPlayerIds = new Set();
let knownPlayers = [];
let groupPicker = null;

/**
 * Vorlagen fuer bekannte Spiele: die Zeilen des Wertungsbogens. Die Namen sind
 * bewusst nur auf Deutsch und Englisch hinterlegt (andere Sprachen bekommen
 * die englische Fassung) - sie sind Spielbegriffe, keine Oberflaechentexte,
 * und lassen sich im Textfeld ohnehin frei aendern.
 */
const TEMPLATES = [
  {
    key: 'mischwald',
    name: 'Mischwald',
    categories: {
      de: ['Bäume', 'Tiere', 'Pflanzen & Pilze', 'Höhle (1 Punkt je Karte)', 'Sonstiges'],
      en: ['Trees', 'Animals', 'Plants & mushrooms', 'Cave (1 point per card)', 'Other'],
    },
  },
  {
    key: 'cascadia',
    name: 'Cascadia',
    categories: {
      de: ['Bär', 'Wapiti', 'Lachs', 'Bussard', 'Fuchs', 'Berge', 'Wälder', 'Prärien', 'Feuchtgebiete', 'Flüsse', 'Mehrheitsboni (Lebensräume)', 'Naturmarker'],
      en: ['Bear', 'Elk', 'Salmon', 'Hawk', 'Fox', 'Mountains', 'Forests', 'Prairies', 'Wetlands', 'Rivers', 'Habitat majority bonuses', 'Nature tokens'],
    },
  },
];

function templateLines(template) {
  const lang = document.documentElement.lang;
  return template.categories[lang] || template.categories.en;
}

function showError(message) {
  setupError.textContent = message;
  setupError.hidden = false;
}

function clearError() {
  setupError.hidden = true;
  setupError.textContent = '';
}

function renderTemplatePicker() {
  templatePicker.innerHTML = '';
  const options = [...TEMPLATES.map((t) => ({ key: t.key, label: t.name })), { key: 'custom', label: window.t('scoreSheet.setup.templateCustom') }];
  options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'player-chip winner-card';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'template';
    radio.value = option.key;
    radio.checked = index === options.length - 1;
    radio.addEventListener('change', () => applyTemplate(option.key));
    const span = document.createElement('span');
    span.textContent = option.label;
    label.appendChild(radio);
    label.appendChild(span);
    templatePicker.appendChild(label);
  });
}

function applyTemplate(key) {
  const template = TEMPLATES.find((t) => t.key === key);
  if (!template) return;
  categoriesInput.value = templateLines(template).join('\n');
  if (!gameLabelInput.value.trim()) gameLabelInput.placeholder = template.name;
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

  const categories = categoriesInput.value.split('\n').map((line) => line.trim()).filter(Boolean);
  if (categories.length === 0) {
    showError(window.t('scoreSheet.setup.categoriesRequired'));
    return;
  }
  if (selectedPlayerIds.size < 2) {
    showError(window.t('common.errors.minPlayers'));
    return;
  }

  const response = await fetch('/api/games.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'score_sheet',
      label: gameLabelInput.value.trim(),
      winDirection: document.querySelector('input[name="win-direction"]:checked').value,
      playerIds: Array.from(selectedPlayerIds),
      categories,
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
 * "Weitere Runde spielen": Wertungen, Sieg-Richtung und Spieler eines frueheren
 * Bogens uebernehmen (siehe die setup.js der anderen Modi).
 */
async function prefillFromGame() {
  const fromGameId = Number(new URLSearchParams(window.location.search).get('fromGame'));
  if (!fromGameId) return;

  const response = await fetch(`/api/games.php?id=${fromGameId}`);
  if (!response.ok) return;
  const game = await response.json();
  if (game.mode !== 'score_sheet') return;

  gameLabelInput.value = game.label || '';
  categoriesInput.value = game.rounds.map((round) => round.label || '').filter(Boolean).join('\n');
  document.querySelector(`input[name="win-direction"][value="${game.winDirection}"]`).checked = true;

  const knownIds = new Set(knownPlayers.map((p) => p.id));
  game.players
    .filter((p) => !p.withdrawnAt && knownIds.has(p.id))
    .forEach((p) => selectedPlayerIds.add(p.id));
  refreshPlayerPicker();
}

window.scoreboardI18nReady.then(() => {
  renderTemplatePicker();
  return loadPlayers();
}).then(prefillFromGame);
