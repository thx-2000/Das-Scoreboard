/**
 * Themenunabhaengiges Schritt-Buttons-Feature fuer die Rundenerfassung:
 * Alternative zur Zahleneingabe, pro Spiel festgelegt (Einrichten-Formular,
 * seit Migration 13 - vorher eine globale Einstellung) und pro Geraet
 * umschaltbar (localStorage), auch waehrend eines laufenden Spiels. Genutzt
 * von den 3 Punkte-Modi (nicht RAGE).
 */

const ROUND_ENTRY_MODE_KEY = 'scoreboard_round_entry_mode';
const ROUND_ENTRY_ALLOWED_STEPS = [1, 5, 10, 50, 100, 500, 1000];

function roundEntryGetMode() {
  return window.localStorage.getItem(ROUND_ENTRY_MODE_KEY) === 'buttons' ? 'buttons' : 'type';
}

function roundEntrySetMode(mode) {
  window.localStorage.setItem(ROUND_ENTRY_MODE_KEY, mode === 'buttons' ? 'buttons' : 'type');
}

/**
 * Parst eine kommagetrennte Schrittweiten-Liste (z.B. aus state.roundEntrySteps
 * eines Spiels) - reine Funktion ohne globalen Zustand, damit jeder Aufrufer
 * (Eingabe-Raster, Bold-Picker, Flip-Kombifeld) dieselben Werte fuer dasselbe
 * Spiel sieht, unabhaengig von globalen Einstellungen.
 */
function roundEntryParseSteps(raw) {
  const steps = String(raw || '1,5,10').split(',').map(Number).filter((n) => ROUND_ENTRY_ALLOWED_STEPS.includes(n));
  return steps.length ? steps.sort((a, b) => a - b) : [1, 5, 10];
}

function roundEntryBuildStepButtons(input, allowNegative, steps) {
  const wrap = document.createElement('div');
  wrap.className = 'round-steps';

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'round-steps__value';
  valueDisplay.textContent = input.value;

  function adjust(delta) {
    const next = (Number(input.value) || 0) + delta;
    input.value = String(allowNegative ? next : Math.max(0, next));
    valueDisplay.textContent = input.value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

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
function renderRoundEntryFields(container, groups, allowNegative = true, roundEntrySteps = '1,5,10') {
  container.innerHTML = '';
  const mode = roundEntryGetMode();
  const steps = roundEntryParseSteps(roundEntrySteps);

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
    input.pattern = allowNegative ? '-?[0-9]*' : '[0-9]*';
    input.id = `round-input-${group.key}`;
    input.dataset.playerIds = group.playerIds.join(',');
    input.value = '0';

    if (mode === 'buttons') {
      input.hidden = true;
      field.appendChild(input);
      field.appendChild(roundEntryBuildStepButtons(input, allowNegative, steps));
    } else {
      field.appendChild(input);
    }

    container.appendChild(field);
  });
}

/**
 * Verbindet den Umschalt-Knopf (Tippen <-> Schritt-Buttons) mit dem
 * gespeicherten Modus. rerenderGrid/rerenderPicker bauen die aktuell aktive
 * Runde im neuen Modus neu auf - ohne Server-Roundtrip, da sich nur die
 * Eingabe-UI aendert. Bereits eingetragene Werte bleiben dabei bewusst
 * erhalten (nur der Neuaufbau nach dem Speichern einer Runde soll wieder
 * bei 0 starten, nicht das blosse Umschalten der Eingabeart) - dazu werden
 * die aktuellen Werte vor dem Neuaufbau des Rasters gesichert und danach
 * in die frischen Felder zurueckgeschrieben, bevor der Picker (falls
 * vorhanden) sie ausliest.
 */
function wireRoundEntryModeToggle(buttonEl, rerenderGrid, rerenderPicker) {
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

    const preserved = {};
    document.querySelectorAll('#round-form-grid input[data-player-ids]').forEach((input) => {
      preserved[input.id] = input.value;
    });

    rerenderGrid();

    Object.entries(preserved).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });

    if (rerenderPicker) rerenderPicker();
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
function buildRoundEntryPicker(container, groups, players, allowNegative = true, roundEntrySteps = '1,5,10') {
  container.innerHTML = '';
  if (groups.length === 0) return;

  const steps = roundEntryParseSteps(roundEntrySteps);

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

    input.hidden = true;

    if (roundEntryGetMode() === 'buttons') {
      const stepper = roundEntryBuildStepButtons(input, allowNegative, steps);
      stepper.classList.add('round-sequence__stepper');
      detail.appendChild(stepper);
    } else {
      // Eigenes sichtbares Feld statt das echte input zu verschieben (siehe
      // roundEntryBuildStepButtons oben) - haelt #round-input-<key> immer
      // im Eingabe-Raster, damit saveNewRound() und der Werte-Erhalt beim
      // Umschalten (wireRoundEntryModeToggle) es zuverlaessig wiederfinden.
      const typeInput = document.createElement('input');
      typeInput.type = 'text';
      typeInput.inputMode = 'numeric';
      typeInput.pattern = allowNegative ? '-?[0-9]*' : '[0-9]*';
      typeInput.className = 'round-picker__type-input';
      typeInput.value = input.value;
      typeInput.addEventListener('input', () => {
        input.value = typeInput.value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      detail.appendChild(typeInput);
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

/**
 * Flip Board: Tipp-Feld UND Schritt-Buttons gleichzeitig sichtbar statt
 * umschaltbar (kein roundEntryGetMode()-Zweig noetig, ignoriert den
 * Umschalt-Knopf bewusst - der bleibt per CSS ausgeblendet). Nutzt dieselbe
 * Schrittweiten-Konfiguration wie die anderen Themes (state.roundEntrySteps,
 * beim Einrichten des Spiels festgelegt): kleinste aktivierte Schrittweite als
 * immer sichtbares Plus/Minus-Paar neben dem Zahlenfeld, weitere aktivierte
 * Schrittweiten als Chip-Reihe darunter. Schreibt wie buildRoundEntryPicker()
 * direkt in die von renderRoundEntryFields() angelegten #round-input-<key>-
 * Felder, damit saveNewRound() unveraendert funktioniert.
 */
function buildFlipRoundEntry(container, groups, allowNegative = true, roundEntrySteps = '1,5,10') {
  container.innerHTML = '';

  function inputFor(key) {
    return document.getElementById(`round-input-${key}`);
  }

  const steps = roundEntryParseSteps(roundEntrySteps);
  const primaryStep = steps[0];
  const chipSteps = steps.slice(1);

  groups.forEach((group) => {
    const input = inputFor(group.key);
    if (!input) return;
    input.hidden = true;

    function adjust(delta) {
      const next = (Number(input.value) || 0) + delta;
      input.value = String(allowNegative ? next : Math.max(0, next));
      typeInput.value = input.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const row = document.createElement('div');
    row.className = 'entry-row';

    const main = document.createElement('div');
    main.className = 'entry-row__main';

    const name = document.createElement('span');
    name.className = 'entry-row__name';
    name.textContent = group.label;

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'entry-row__step entry-row__step--minus';
    minusBtn.textContent = '−';
    minusBtn.setAttribute('aria-label', window.t('common.stepper.minusValue', { value: primaryStep }));
    minusBtn.addEventListener('click', () => adjust(-primaryStep));

    const typeInput = document.createElement('input');
    typeInput.type = 'text';
    typeInput.inputMode = 'numeric';
    typeInput.pattern = allowNegative ? '-?[0-9]*' : '[0-9]*';
    typeInput.className = 'entry-row__value';
    typeInput.value = input.value;
    typeInput.addEventListener('input', () => {
      input.value = typeInput.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'entry-row__step entry-row__step--plus';
    plusBtn.textContent = '+';
    plusBtn.setAttribute('aria-label', window.t('common.stepper.plusValue', { value: primaryStep }));
    plusBtn.addEventListener('click', () => adjust(primaryStep));

    main.appendChild(name);
    main.appendChild(minusBtn);
    main.appendChild(typeInput);
    main.appendChild(plusBtn);
    row.appendChild(main);

    // Minus-Chips links (naeher am −1-Knopf), Plus-Chips rechts (naeher am
    // +1-Knopf, da Plus haeufiger genutzt wird) - spiegelt die Anordnung
    // der primaeren +/- Knoepfe. Der Zwischenraum (justify-content:
    // space-between, siehe CSS) dient zugleich als Trenner zwischen den
    // beiden Gruppen.
    if (chipSteps.length > 0) {
      const chips = document.createElement('div');
      chips.className = 'entry-row__chips';

      const minusGroup = document.createElement('div');
      minusGroup.className = 'entry-row__chips-group entry-row__chips-group--minus';
      [...chipSteps].reverse().forEach((step) => {
        const minusChip = document.createElement('button');
        minusChip.type = 'button';
        minusChip.className = 'entry-row__chip entry-row__chip--minus';
        minusChip.textContent = `−${step}`;
        minusChip.setAttribute('aria-label', window.t('common.stepper.minusValue', { value: step }));
        minusChip.addEventListener('click', () => adjust(-step));
        minusGroup.appendChild(minusChip);
      });

      const plusGroup = document.createElement('div');
      plusGroup.className = 'entry-row__chips-group entry-row__chips-group--plus';
      chipSteps.forEach((step) => {
        const plusChip = document.createElement('button');
        plusChip.type = 'button';
        plusChip.className = 'entry-row__chip entry-row__chip--plus';
        plusChip.textContent = `+${step}`;
        plusChip.setAttribute('aria-label', window.t('common.stepper.plusValue', { value: step }));
        plusChip.addEventListener('click', () => adjust(step));
        plusGroup.appendChild(plusChip);
      });

      chips.appendChild(minusGroup);
      chips.appendChild(plusGroup);
      row.appendChild(chips);
    }

    container.appendChild(row);
  });
}

window.renderRoundEntryFields = renderRoundEntryFields;
window.wireRoundEntryModeToggle = wireRoundEntryModeToggle;
window.buildRoundEntryPicker = buildRoundEntryPicker;
window.buildFlipRoundEntry = buildFlipRoundEntry;
