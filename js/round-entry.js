/**
 * Themenunabhaengiges Schritt-Buttons-Feature fuer die Rundenerfassung:
 * Alternative zur Zahleneingabe, global konfigurierbar (Einstellungen ->
 * Rundenerfassung) und pro Geraet umschaltbar (localStorage), auch waehrend
 * eines laufenden Spiels. Genutzt von den 3 Punkte-Modi (nicht RAGE).
 */

const ROUND_ENTRY_MODE_KEY = 'scoreboard_round_entry_mode';
const ROUND_ENTRY_ALLOWED_STEPS = [1, 5, 10, 50, 100, 500, 1000];

function roundEntryGetMode() {
  return window.localStorage.getItem(ROUND_ENTRY_MODE_KEY) === 'buttons' ? 'buttons' : 'type';
}

function roundEntrySetMode(mode) {
  window.localStorage.setItem(ROUND_ENTRY_MODE_KEY, mode === 'buttons' ? 'buttons' : 'type');
}

function roundEntryEnabledSteps() {
  const raw = (window.__scoreboardSettings && window.__scoreboardSettings.round_entry_steps) || '1,5,10';
  const steps = raw.split(',').map(Number).filter((n) => ROUND_ENTRY_ALLOWED_STEPS.includes(n));
  return steps.length ? steps.sort((a, b) => a - b) : [1, 5, 10];
}

function roundEntryBuildStepButtons(input) {
  const wrap = document.createElement('div');
  wrap.className = 'round-steps';

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'round-steps__value';
  valueDisplay.textContent = input.value;

  function adjust(delta) {
    input.value = String((Number(input.value) || 0) + delta);
    valueDisplay.textContent = input.value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const steps = roundEntryEnabledSteps();

  const minusRow = document.createElement('div');
  minusRow.className = 'round-steps__row';
  [...steps].reverse().forEach((step) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'round-steps__btn round-steps__btn--minus';
    btn.textContent = `−${step}`;
    btn.setAttribute('aria-label', window.t('common.stepper.minusValue', { value: step }));
    btn.addEventListener('click', () => adjust(-step));
    minusRow.appendChild(btn);
  });

  const plusRow = document.createElement('div');
  plusRow.className = 'round-steps__row';
  steps.forEach((step) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'round-steps__btn round-steps__btn--plus';
    btn.textContent = `+${step}`;
    btn.setAttribute('aria-label', window.t('common.stepper.plusValue', { value: step }));
    btn.addEventListener('click', () => adjust(step));
    plusRow.appendChild(btn);
  });

  wrap.appendChild(minusRow);
  wrap.appendChild(valueDisplay);
  wrap.appendChild(plusRow);
  return wrap;
}

/**
 * Baut die Eingabefelder der Rundenerfassung - ein Feld je Team-/Spieler-
 * Gruppe (siehe groupPlayersByTeam) - je nach aktuellem Modus entweder als
 * Zahlenfeld (Tippen) oder als Schritt-Buttons. Der Wert steckt in beiden
 * Faellen im selben (bei Buttons ausgeblendeten) Zahlenfeld, damit
 * saveNewRound() unveraendert per data-player-ids ausliest.
 */
function renderRoundEntryFields(container, groups) {
  container.innerHTML = '';
  const mode = roundEntryGetMode();

  groups.forEach((group) => {
    const field = document.createElement('div');
    field.className = 'round-form-field';

    const label = document.createElement('label');
    label.setAttribute('for', `round-input-${group.key}`);
    label.textContent = group.label;
    field.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.pattern = '-?[0-9]*';
    input.id = `round-input-${group.key}`;
    input.dataset.playerIds = group.playerIds.join(',');
    input.value = '0';

    if (mode === 'buttons') {
      input.hidden = true;
      field.appendChild(input);
      field.appendChild(roundEntryBuildStepButtons(input));
    } else {
      field.appendChild(input);
    }

    container.appendChild(field);
  });
}

/**
 * Verbindet den Umschalt-Knopf (Tippen <-> Schritt-Buttons) mit dem
 * gespeicherten Modus. rerender baut die aktuell aktive Runde im neuen Modus
 * neu auf - ohne Server-Roundtrip, da sich nur die Eingabe-UI aendert.
 */
function wireRoundEntryModeToggle(buttonEl, rerender) {
  function updateLabel() {
    const mode = roundEntryGetMode();
    buttonEl.textContent = mode === 'buttons'
      ? window.t('common.game.roundEntry.switchToType')
      : window.t('common.game.roundEntry.switchToButtons');
  }
  updateLabel();
  buttonEl.addEventListener('click', () => {
    roundEntrySetMode(roundEntryGetMode() === 'buttons' ? 'type' : 'buttons');
    updateLabel();
    rerender();
  });
}

/**
 * Bold-Theme: Rundenerfassung als frei anwaehlbarer Spieler-Picker statt
 * fester Reihenfolge - die Spielreihenfolge am Tisch stimmt oft nicht mit
 * der Spielerliste ueberein, daher KEINE automatische Weiterschaltung.
 * Jeder Spieler bleibt als Chip mit seinem aktuellen Wert sichtbar, per
 * Klick beliebig oft anwaehlbar (auch zur nachtraeglichen Korrektur vor dem
 * Speichern). Respektiert denselben Tippen/Schritt-Buttons-Modus wie das
 * Eingabe-Raster (roundEntryGetMode()) - der Umschalt-Knopf ist in Bold
 * ebenfalls sichtbar. Die Chips/Stepper/Zahlenfelder schreiben direkt in
 * die vom Eingabe-Raster (renderRoundEntryFields) bereits angelegten
 * Felder - dieselben Felder, die auch "Runde speichern" (saveNewRound)
 * ausliest. Muss deshalb nach renderRoundEntryFields() aufgerufen werden.
 */
function buildRoundEntryPicker(container, groups, players) {
  container.innerHTML = '';
  if (groups.length === 0) return;

  function inputFor(key) {
    return document.getElementById(`round-input-${key}`);
  }

  const chipRow = document.createElement('div');
  chipRow.className = 'round-picker__chips';

  const detail = document.createElement('div');
  detail.className = 'round-picker__detail';

  const chipEls = {};
  let activeKey = groups[0].key;

  function renderDetail() {
    detail.innerHTML = '';
    const group = groups.find((g) => g.key === activeKey);
    const input = inputFor(group.key);
    if (!input) return;

    const name = document.createElement('div');
    name.className = 'round-sequence__name';
    name.textContent = group.label;
    detail.appendChild(name);

    if (roundEntryGetMode() === 'buttons') {
      input.hidden = true;
      const stepper = roundEntryBuildStepButtons(input);
      stepper.classList.add('round-sequence__stepper');
      detail.appendChild(stepper);
    } else {
      input.hidden = false;
      input.classList.add('round-picker__type-input');
      detail.appendChild(input);
    }
  }

  function setActive(key) {
    activeKey = key;
    Object.entries(chipEls).forEach(([k, el]) => {
      el.button.classList.toggle('round-picker__chip--active', k === key);
    });
    renderDetail();
  }

  groups.forEach((group) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'round-picker__chip';
    const anchorId = group.playerIds[0];
    chip.dataset.playerColor = window.scoreboardPlayerColorIndex(players, anchorId);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'round-picker__chip-name';
    nameSpan.textContent = group.label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'round-picker__chip-value';
    const existingInput = inputFor(group.key);
    valueSpan.textContent = existingInput ? existingInput.value : '0';

    chip.appendChild(nameSpan);
    chip.appendChild(valueSpan);
    chip.addEventListener('click', () => setActive(group.key));

    if (existingInput) {
      existingInput.addEventListener('input', () => {
        valueSpan.textContent = existingInput.value || '0';
      });
    }

    chipEls[group.key] = { button: chip, value: valueSpan };
    chipRow.appendChild(chip);
  });

  container.appendChild(chipRow);
  container.appendChild(detail);

  setActive(activeKey);
}

window.renderRoundEntryFields = renderRoundEntryFields;
window.wireRoundEntryModeToggle = wireRoundEntryModeToggle;
window.buildRoundEntryPicker = buildRoundEntryPicker;
