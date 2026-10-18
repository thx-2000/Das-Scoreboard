/**
 * Cascadia (Kosmos, "Im Herzen der Natur"): Rechenhilfen fuer die Wertungsbogen-
 * Zeilen. Die Punktetabellen stammen aus der offiziellen deutschen Anleitung
 * (Seite 11, Wertungskarten A-D je Tierart) bzw. Seite 8/9 (Gebiete, Zapfen).
 *
 * Kennungen (rounds.helper): "cascadia:<tier>:<A-D>" fuer die Tier-Wertungskarten,
 * "cascadia:habitat" fuer die Gebietsgroessen, "cascadia:bonus" fuer die
 * automatisch berechneten Mehrheitsboni.
 *
 * Zwei Kartentypen:
 *  - table: ein Zaehler (z.B. Anzahl Baerenpaare), Punkte aus einer Tabelle,
 *    ab dem letzten Eintrag gilt der letzte Wert ("4+").
 *  - items: je Zeile ein Zaehler (z.B. Lachs-Ketten der Laenge 3), Punkte =
 *    Summe aus Anzahl x Punkte; optional bonusAll, falls jede Zeile mindestens
 *    einmal vorkommt (Baer C).
 */

const CASCADIA_CARDS = {
  bear: {
    A: { type: 'table', unit: 'pairs', table: [4, 11, 19, 27] },
    B: { type: 'items', unit: 'groupSize', items: [['3', 10]] },
    C: { type: 'items', unit: 'groupSize', items: [['1', 2], ['2', 5], ['3', 8]], bonusAll: 3 },
    D: { type: 'items', unit: 'groupSize', items: [['2', 5], ['3', 8], ['4', 13]] },
  },
  elk: {
    A: { type: 'items', unit: 'lineLength', items: [['1', 2], ['2', 5], ['3', 9], ['4', 13]] },
    B: { type: 'items', unit: 'groupSize', items: [['1', 2], ['2', 5], ['3', 9], ['4', 13]] },
    C: { type: 'items', unit: 'groupSize', items: [['1', 2], ['2', 4], ['3', 7], ['4', 10], ['5', 14], ['6', 18], ['7', 23], ['8+', 28]] },
    D: { type: 'items', unit: 'circleSize', items: [['1', 2], ['2', 5], ['3', 8], ['4', 12], ['5', 16], ['6', 21]] },
  },
  salmon: {
    A: { type: 'items', unit: 'chainLength', items: [['1', 2], ['2', 5], ['3', 8], ['4', 12], ['5', 16], ['6', 20], ['7+', 25]] },
    B: { type: 'items', unit: 'chainLength', items: [['1', 2], ['2', 4], ['3', 9], ['4', 11], ['5+', 17]] },
    C: { type: 'items', unit: 'chainLength', items: [['3', 10], ['4', 12], ['5+', 15]] },
    D: { type: 'items', unit: null, items: [['salmonInChain', 1], ['neighborAnimals', 1]], labelsAreKeys: true },
  },
  hawk: {
    A: { type: 'table', unit: 'buzzards', table: [2, 5, 8, 11, 14, 18, 22, 26] },
    B: { type: 'table', unit: 'buzzards', table: [0, 5, 9, 12, 16, 20, 24, 28] },
    C: { type: 'items', unit: null, items: [['sightlines', 3]], labelsAreKeys: true },
    D: { type: 'items', unit: 'species', items: [['1', 4], ['2', 7], ['3+', 9]] },
  },
  fox: {
    A: { type: 'items', unit: 'neighborSpecies', items: [['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5]] },
    B: { type: 'items', unit: 'neighborPairs', items: [['1', 3], ['2', 5], ['3', 7]] },
    C: { type: 'items', unit: 'mostCommon', items: [['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6]] },
    D: { type: 'items', unit: 'neighborPairs', items: [['1', 5], ['2', 7], ['3', 9], ['4', 11]] },
  },
};

/** "cascadia:bear:A" -> Kartendefinition, sonst null (z.B. "cascadia:habitat"). */
function cascadiaCardFor(helper) {
  const parts = String(helper || '').split(':');
  if (parts[0] !== 'cascadia' || parts.length !== 3) return null;
  const card = CASCADIA_CARDS[parts[1]] && CASCADIA_CARDS[parts[1]][parts[2]];
  return card || null;
}

function cascadiaTablePoints(card, count) {
  if (count <= 0) return 0;
  return card.table[Math.min(count, card.table.length) - 1];
}

function cascadiaItemsPoints(card, counts) {
  let total = card.items.reduce((sum, item, i) => sum + counts[i] * item[1], 0);
  if (card.bonusAll && counts.every((c) => c > 0)) total += card.bonusAll;
  return total;
}

/**
 * Mehrheitsboni fuer die Gebiete (Anleitung S. 9): sizesByHabitat ist je
 * Gebietsart eine Map spielerId -> Groesse des groessten Gebiets.
 * Zu zweit: 2 Punkte fuer das groesste Gebiet, bei Gleichstand je 1, nichts fuer
 * das zweitgroesste. Zu dritt/viert: 3 fuer das groesste, 1 fuer das zweitgroesste;
 * teilen sich zwei den ersten Platz je 2, drei oder mehr je 1 - dann gibt es nichts
 * fuer Platz zwei; ein Gleichstand um Platz zwei bringt nie Punkte.
 */
function cascadiaMajorityBonus(sizesByHabitat, playerIds) {
  const bonus = {};
  playerIds.forEach((id) => { bonus[id] = 0; });
  const twoPlayers = playerIds.length === 2;

  sizesByHabitat.forEach((sizes) => {
    const entries = playerIds.map((id) => [id, sizes[id] || 0]).filter(([, size]) => size > 0);
    if (entries.length === 0) return;
    const top = Math.max(...entries.map(([, size]) => size));
    const leaders = entries.filter(([, size]) => size === top).map(([id]) => id);

    if (twoPlayers) {
      leaders.forEach((id) => { bonus[id] += leaders.length === 1 ? 2 : 1; });
      return;
    }
    if (leaders.length === 1) {
      bonus[leaders[0]] += 3;
      const rest = entries.filter(([, size]) => size < top);
      if (rest.length > 0) {
        const second = Math.max(...rest.map(([, size]) => size));
        const seconds = rest.filter(([, size]) => size === second);
        if (seconds.length === 1) bonus[seconds[0][0]] += 1;
      }
    } else {
      leaders.forEach((id) => { bonus[id] += leaders.length === 2 ? 2 : 1; });
    }
  });
  return bonus;
}

/**
 * Dialog zur Berechnung der Punkte einer Tier-Wertungskarte.
 * openCascadiaCard({ card, title, subtitle, onCommit, onManual })
 */
function openCascadiaCard({ card, title, subtitle, onCommit, onManual }) {
  const counts = card.type === 'table' ? [0] : card.items.map(() => 0);

  const dialog = document.createElement('dialog');
  dialog.className = 'score-keypad cascadia-card';

  const heading = document.createElement('h2');
  heading.className = 'score-keypad__title';
  heading.textContent = title;
  const sub = document.createElement('p');
  sub.className = 'score-keypad__subtitle';
  sub.textContent = subtitle || '';
  const hint = document.createElement('p');
  hint.className = 'hint-text';
  hint.textContent = window.t('scoreSheet.helper.countHint');

  const total = document.createElement('div');
  total.className = 'score-keypad__total';
  total.setAttribute('aria-live', 'polite');

  const list = document.createElement('div');
  list.className = 'cascadia-card__rows';

  function points() {
    return card.type === 'table' ? cascadiaTablePoints(card, counts[0]) : cascadiaItemsPoints(card, counts);
  }

  const pointEls = [];
  let bonusValueEl = null;
  function refresh() {
    total.textContent = `= ${points()}`;
    if (card.type === 'items') {
      card.items.forEach((item, i) => { pointEls[i].textContent = String(counts[i] * item[1]); });
    } else {
      pointEls[0].textContent = String(cascadiaTablePoints(card, counts[0]));
    }
    if (bonusValueEl) {
      bonusValueEl.textContent = `+${card.bonusAll}`;
      bonusValueEl.classList.toggle('cascadia-card__bonus--on', counts.every((c) => c > 0));
    }
  }

  function makeRow(labelText, index) {
    const row = document.createElement('div');
    row.className = 'cascadia-card__row';
    const label = document.createElement('span');
    label.className = 'cascadia-card__label';
    label.textContent = labelText;

    const control = document.createElement('div');
    control.className = 'rage-row__control';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'rage-row__btn rage-row__btn--minus';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `${window.t('common.stepper.decrease')}: ${labelText}`);
    const value = document.createElement('span');
    value.className = 'rage-row__value';
    value.textContent = '0';
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'rage-row__btn rage-row__btn--plus';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `${window.t('common.stepper.increase')}: ${labelText}`);
    minus.addEventListener('click', () => { counts[index] = Math.max(0, counts[index] - 1); value.textContent = String(counts[index]); refresh(); });
    plus.addEventListener('click', () => { counts[index] = Math.min(99, counts[index] + 1); value.textContent = String(counts[index]); refresh(); });
    control.append(minus, value, plus);

    const pts = document.createElement('span');
    pts.className = 'cascadia-card__points';
    pointEls[index] = pts;

    row.append(label, control, pts);
    return row;
  }

  if (card.type === 'table') {
    list.appendChild(makeRow(window.t(`scoreSheet.helper.units.${card.unit}`), 0));
  } else {
    card.items.forEach((item, i) => {
      const unitText = card.unit ? `${window.t(`scoreSheet.helper.units.${card.unit}`)} ${item[0]}` : window.t(`scoreSheet.helper.units.${item[0]}`);
      list.appendChild(makeRow(unitText, i));
    });
  }

  if (card.bonusAll) {
    const bonus = document.createElement('p');
    bonus.className = 'cascadia-card__bonus';
    const bonusLabel = document.createElement('span');
    bonusLabel.textContent = window.t('scoreSheet.helper.bonusAll');
    bonusValueEl = document.createElement('strong');
    bonus.append(bonusLabel, bonusValueEl);
    list.appendChild(bonus);
  }

  const actions = document.createElement('div');
  actions.className = 'score-keypad__actions';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn--ghost';
  closeBtn.textContent = window.t('common.buttons.cancel');
  const manualBtn = document.createElement('button');
  manualBtn.type = 'button';
  manualBtn.className = 'btn btn--ghost';
  manualBtn.textContent = window.t('scoreSheet.helper.manual');
  const doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'btn btn--primary';
  doneBtn.textContent = window.t('scoreSheet.keypad.done');

  function closeDialog() {
    if (dialog.open) dialog.close();
    dialog.remove();
  }
  closeBtn.addEventListener('click', closeDialog);
  manualBtn.addEventListener('click', () => { closeDialog(); onManual(); });
  doneBtn.addEventListener('click', () => { onCommit(points()); closeDialog(); });
  actions.append(closeBtn, manualBtn, doneBtn);

  dialog.append(heading, sub, hint, total, list, actions);
  document.body.appendChild(dialog);
  refresh();
  dialog.showModal();
}

window.CASCADIA_CARDS = CASCADIA_CARDS;
window.cascadiaCardFor = cascadiaCardFor;
window.cascadiaMajorityBonus = cascadiaMajorityBonus;
window.openCascadiaCard = openCascadiaCard;
