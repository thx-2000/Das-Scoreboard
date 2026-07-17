/**
 * "Meine Spiele" (Einstellungen -> Reiter "Meine Spiele"): eigene, fertig
 * konfigurierte Spiele-Presets verwalten (anlegen/bearbeiten/löschen,
 * Favorit markieren, sortieren per Pfeil-Buttons ODER Drag&Drop per
 * Pointer-Events). Ein Formular fuer alle 3 generischen Punkte-Modi,
 * Sichtbarkeit von Zielwert-/Rundenzahl-Feld haengt vom gewaehlten Modus ab
 * (dieselbe Unterscheidung wie die 3 separaten Einrichten-Seiten).
 */

const presetListEl = document.getElementById('preset-list');
const presetAddBtn = document.getElementById('preset-add-btn');
const presetFormCard = document.getElementById('preset-form-card');
const presetFormHeading = document.getElementById('preset-form-heading');
const presetForm = document.getElementById('preset-form');
const presetNameInput = document.getElementById('preset-name');
const presetTargetScoreField = document.getElementById('preset-target-score-field');
const presetTargetScoreInput = document.getElementById('preset-target-score');
const presetTotalRoundsField = document.getElementById('preset-total-rounds-field');
const presetTotalRoundsInput = document.getElementById('preset-total-rounds');
const presetTargetBonusInput = document.getElementById('preset-target-bonus');
const presetAllowNegativeInput = document.getElementById('preset-allow-negative');
const presetRoundEntryStepsField = document.getElementById('preset-round-entry-steps-field');
const presetFormCancelBtn = document.getElementById('preset-form-cancel-btn');

let presets = [];
let editingPresetId = null;

function modeLabel(mode) {
  if (mode === 'points_to_target') return window.t('modes.pointsToTarget.title');
  if (mode === 'points_open') return window.t('modes.pointsOpen.title');
  if (mode === 'fixed_rounds') return window.t('modes.fixedRounds.title');
  return mode;
}

function presetMeta(preset) {
  if (preset.mode === 'points_to_target') {
    return window.t('settings.presets.metaTarget', { target: preset.targetScore });
  }
  if (preset.mode === 'fixed_rounds') {
    return window.t('settings.presets.metaRounds', { rounds: preset.totalRounds });
  }
  return modeLabel(preset.mode);
}

function updatePresetModeFieldVisibility() {
  const mode = document.querySelector('input[name="preset-mode"]:checked').value;
  presetTargetScoreField.hidden = mode !== 'points_to_target';
  presetTotalRoundsField.hidden = mode !== 'fixed_rounds';
}

document.querySelectorAll('input[name="preset-mode"]').forEach((input) => {
  input.addEventListener('change', updatePresetModeFieldVisibility);
});

function resetPresetForm() {
  editingPresetId = null;
  presetFormHeading.textContent = window.t('settings.presets.formHeadingNew');
  presetNameInput.value = '';
  document.querySelector('input[name="preset-mode"][value="points_to_target"]').checked = true;
  presetTargetScoreInput.value = '200';
  presetTotalRoundsInput.value = '10';
  document.querySelector('input[name="preset-win-direction"][value="highest"]').checked = true;
  presetTargetBonusInput.value = '0';
  presetAllowNegativeInput.checked = true;
  window.renderRoundEntryStepsField(presetRoundEntryStepsField, '1,5,10');
  updatePresetModeFieldVisibility();
}

function fillPresetForm(preset) {
  editingPresetId = preset.id;
  presetFormHeading.textContent = window.t('settings.presets.formHeadingEdit', { name: preset.name });
  presetNameInput.value = preset.name;
  document.querySelector(`input[name="preset-mode"][value="${preset.mode}"]`).checked = true;
  presetTargetScoreInput.value = String(preset.targetScore || 200);
  presetTotalRoundsInput.value = String(preset.totalRounds || 10);
  document.querySelector(`input[name="preset-win-direction"][value="${preset.winDirection}"]`).checked = true;
  presetTargetBonusInput.value = String(preset.targetBonus || 0);
  presetAllowNegativeInput.checked = preset.allowNegative;
  window.renderRoundEntryStepsField(presetRoundEntryStepsField, preset.roundEntrySteps);
  updatePresetModeFieldVisibility();
}

function showPresetForm() {
  presetFormCard.hidden = false;
  presetFormCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hidePresetForm() {
  presetFormCard.hidden = true;
}

presetAddBtn.addEventListener('click', () => {
  resetPresetForm();
  showPresetForm();
});

presetFormCancelBtn.addEventListener('click', () => {
  hidePresetForm();
});

presetForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const body = {
    name: presetNameInput.value.trim(),
    mode: document.querySelector('input[name="preset-mode"]:checked').value,
    targetScore: Number(presetTargetScoreInput.value) || 0,
    totalRounds: Number(presetTotalRoundsInput.value) || 0,
    winDirection: document.querySelector('input[name="preset-win-direction"]:checked').value,
    roundEntrySteps: window.collectRoundEntryStepsField(presetRoundEntryStepsField),
    targetBonus: Number(presetTargetBonusInput.value) || 0,
    allowNegative: presetAllowNegativeInput.checked,
  };

  const url = editingPresetId ? `/api/game-presets.php?id=${editingPresetId}` : '/api/game-presets.php';
  const method = editingPresetId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!response.ok) {
    window.alert(data.error || window.t('settings.presets.saveFailed'));
    return;
  }

  presets = data;
  hidePresetForm();
  renderPresetList();
});

async function toggleFavorite(preset) {
  const response = await fetch(`/api/game-presets.php?id=${preset.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isFavorite: !preset.isFavorite }),
  });
  presets = await response.json();
  renderPresetList();
}

async function deletePreset(preset) {
  const confirmed = window.confirm(window.t('settings.presets.deleteConfirm', { name: preset.name }));
  if (!confirmed) return;

  const response = await fetch(`/api/game-presets.php?id=${preset.id}`, { method: 'DELETE' });
  presets = await response.json();
  renderPresetList();
}

async function sendReorder(order) {
  const response = await fetch('/api/game-presets.php?reorder=1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  });
  presets = await response.json();
}

function movePreset(preset, direction) {
  const index = presets.findIndex((p) => p.id === preset.id);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= presets.length) return;

  const order = presets.map((p) => p.id);
  [order[index], order[swapWith]] = [order[swapWith], order[index]];
  sendReorder(order).then(renderPresetList);
}

/**
 * Drag&Drop per Pointer-Events (kein externes Paket, wie der Rest der App) -
 * die Pfeile oben bleiben als zuverlaessige Grundfunktion parallel bestehen
 * (auch per Tastatur/Screenreader bedienbar), Drag ist ein Zusatzangebot
 * fuer Touch-Geraete. Waehrend des Ziehens wird die Liste rein visuell im
 * DOM umsortiert, die tatsaechliche Sortierposition wird erst beim Loslassen
 * (pointerup) an den Server geschickt.
 */
function wireDragHandle(handle, item) {
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    item.classList.add('preset-item--dragging');

    function onMove(moveEvent) {
      const afterEl = Array.from(presetListEl.querySelectorAll('.preset-item:not(.preset-item--dragging)'))
        .find((sibling) => {
          const rect = sibling.getBoundingClientRect();
          return moveEvent.clientY < rect.top + rect.height / 2;
        });
      if (afterEl) {
        presetListEl.insertBefore(item, afterEl);
      } else {
        presetListEl.appendChild(item);
      }
    }

    function onUp() {
      item.classList.remove('preset-item--dragging');
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);

      const order = Array.from(presetListEl.querySelectorAll('.preset-item')).map((el) => Number(el.dataset.presetId));
      sendReorder(order).then(renderPresetList);
    }

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

function renderPresetList() {
  presetListEl.innerHTML = '';

  if (presets.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'hint-text';
    empty.textContent = window.t('settings.presets.empty');
    presetListEl.appendChild(empty);
    return;
  }

  presets.forEach((preset, index) => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.dataset.presetId = preset.id;

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'preset-item__drag-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.tabIndex = -1;
    handle.textContent = '⠿';
    wireDragHandle(handle, item);

    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'preset-item__favorite';
    favoriteBtn.setAttribute('aria-label', window.t('settings.presets.favoriteLabel'));
    favoriteBtn.setAttribute('aria-pressed', String(preset.isFavorite));
    favoriteBtn.textContent = preset.isFavorite ? '★' : '☆';
    favoriteBtn.addEventListener('click', () => toggleFavorite(preset));

    const info = document.createElement('div');
    info.className = 'preset-item__info';
    const name = document.createElement('span');
    name.className = 'preset-item__name';
    name.textContent = preset.name;
    const meta = document.createElement('span');
    meta.className = 'preset-item__meta';
    meta.textContent = presetMeta(preset);
    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'preset-item__actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'preset-item__move';
    upBtn.setAttribute('aria-label', window.t('settings.presets.moveUp'));
    upBtn.textContent = '↑';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => movePreset(preset, 'up'));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'preset-item__move';
    downBtn.setAttribute('aria-label', window.t('settings.presets.moveDown'));
    downBtn.textContent = '↓';
    downBtn.disabled = index === presets.length - 1;
    downBtn.addEventListener('click', () => movePreset(preset, 'down'));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn--ghost btn--small';
    editBtn.textContent = window.t('settings.presets.editButton');
    editBtn.addEventListener('click', () => {
      fillPresetForm(preset);
      showPresetForm();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--small btn--danger';
    deleteBtn.textContent = window.t('common.buttons.delete');
    deleteBtn.addEventListener('click', () => deletePreset(preset));

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(handle);
    item.appendChild(favoriteBtn);
    item.appendChild(info);
    item.appendChild(actions);
    presetListEl.appendChild(item);
  });
}

async function loadPresets() {
  const response = await fetch('/api/game-presets.php');
  presets = await response.json();
  renderPresetList();
}

window.scoreboardI18nReady.then(loadPresets);
