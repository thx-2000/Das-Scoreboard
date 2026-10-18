/**
 * Zahlentastatur als Dialog fuer den Wertungsbogen: grosse Tasten statt der
 * System-Tastatur (die auf dem iPhone weder "+" noch "-" bequem anbietet),
 * und mehrere Werte lassen sich addieren (z.B. 6 + 6 + 3 fuer die einzelnen
 * Karten eines Spielers) - wichtig fuer Spiele wie Mischwald, bei denen die
 * Punkte erst am Ende aus vielen Karten zusammenkommen.
 *
 * openScoreKeypad({ title, subtitle, initial, hasNext, onCommit, onNext })
 *  - onCommit(wert) wird bei "Fertig" und "Weiter" mit der Summe aufgerufen
 *  - onNext() folgt auf "Weiter" (z.B. naechster Spieler in derselben Zeile)
 */
function openScoreKeypad({ title, subtitle, initial, hasNext, onCommit, onNext }) {
  let terms = initial !== 0 ? [initial] : [];
  let current = '';
  let negative = false;
  // Ein geladener Altwert wird beim ersten Ziffern-Tipp ersetzt, bei "+" dagegen
  // fortgefuehrt (z.B. "15 + ...").
  let replaceOnType = initial !== 0;

  const dialog = document.createElement('dialog');
  dialog.className = 'score-keypad';

  const heading = document.createElement('h2');
  heading.className = 'score-keypad__title';
  heading.textContent = title;
  const sub = document.createElement('p');
  sub.className = 'score-keypad__subtitle';
  sub.textContent = subtitle || '';

  const expression = document.createElement('div');
  expression.className = 'score-keypad__expression';
  const total = document.createElement('div');
  total.className = 'score-keypad__total';
  total.setAttribute('aria-live', 'polite');

  const keys = document.createElement('div');
  keys.className = 'score-keypad__keys';

  function currentSigned() {
    if (current === '') return null;
    return (negative ? -1 : 1) * Number(current);
  }

  function totalValue() {
    const pending = currentSigned();
    return terms.reduce((a, b) => a + b, 0) + (pending === null ? 0 : pending);
  }

  function formatTerm(n, first) {
    if (first) return String(n);
    return n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`;
  }

  function refresh() {
    const parts = terms.map((n, i) => formatTerm(n, i === 0));
    if (current !== '' || negative) {
      // Noch nicht per "+" uebernommener Wert, ggf. nur mit Vorzeichen begonnen.
      const sign = negative ? '−' : '+';
      parts.push(terms.length === 0 ? `${negative ? '−' : ''}${current}` : `${sign} ${current}`);
    }
    expression.textContent = parts.join(' ') || '0';
    total.textContent = `= ${totalValue()}`;
  }

  function digit(d) {
    if (replaceOnType) {
      terms = [];
      replaceOnType = false;
    }
    if (current.length >= 5) return;
    current = current === '0' ? String(d) : current + String(d);
    refresh();
  }

  function addTerm() {
    const pending = currentSigned();
    if (pending !== null) terms.push(pending);
    current = '';
    negative = false;
    replaceOnType = false;
    refresh();
  }

  function backspace() {
    if (current !== '') {
      current = current.slice(0, -1);
    } else if (negative) {
      negative = false;
    } else if (terms.length > 0) {
      terms.pop();
    }
    replaceOnType = false;
    refresh();
  }

  function toggleSign() {
    negative = !negative;
    replaceOnType = false;
    refresh();
  }

  function makeKey(label, className, handler, ariaLabel) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `score-keypad__key ${className || ''}`.trim();
    btn.textContent = label;
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    btn.addEventListener('click', handler);
    return btn;
  }

  [7, 8, 9, 4, 5, 6, 1, 2, 3].forEach((d) => keys.appendChild(makeKey(String(d), '', () => digit(d))));
  keys.appendChild(makeKey('±', '', toggleSign));
  keys.appendChild(makeKey('0', '', () => digit(0)));
  keys.appendChild(makeKey('⌫', '', backspace, window.t('common.buttons.delete')));

  const addBtn = makeKey('+', 'score-keypad__key--add', addTerm, window.t('scoreSheet.keypad.add'));

  const actions = document.createElement('div');
  actions.className = 'score-keypad__actions';

  // Selbst entfernen statt auf das "close"-Ereignis zu warten (das kommt erst
  // spaeter und liesse das alte Dialog-Element kurz neben dem naechsten stehen).
  function closeDialog() {
    if (dialog.open) dialog.close();
    dialog.remove();
  }

  function finish(next) {
    onCommit(totalValue());
    closeDialog();
    if (next && onNext) onNext();
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn--ghost';
  closeBtn.textContent = window.t('common.buttons.cancel');
  closeBtn.addEventListener('click', closeDialog);
  actions.appendChild(closeBtn);

  if (hasNext) {
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn--secondary';
    nextBtn.textContent = window.t('scoreSheet.keypad.next');
    nextBtn.addEventListener('click', () => finish(true));
    actions.appendChild(nextBtn);
  }

  const doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'btn btn--primary';
  doneBtn.textContent = window.t('scoreSheet.keypad.done');
  doneBtn.addEventListener('click', () => finish(false));
  actions.appendChild(doneBtn);

  dialog.appendChild(heading);
  dialog.appendChild(sub);
  dialog.appendChild(expression);
  dialog.appendChild(total);
  dialog.appendChild(keys);
  dialog.appendChild(addBtn);
  dialog.appendChild(actions);
  dialog.addEventListener('close', () => dialog.remove());

  document.body.appendChild(dialog);
  refresh();
  dialog.showModal();
}

window.openScoreKeypad = openScoreKeypad;
