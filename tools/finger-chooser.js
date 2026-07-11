const chooserArea = document.getElementById('chooser-area');
const hintEl = document.getElementById('chooser-hint');

const COUNTDOWN_START = 4;

// activeTouches: Touch-Identifier -> { el: Kreis-Element }
const activeTouches = new Map();
let state = 'idle'; // 'idle' | 'counting' | 'selected'
let countdownValue = COUNTDOWN_START;
let countdownTimer = null;
let countdownEl = null;
let resultEl = null;

function positionCircle(el, clientX, clientY) {
  const rect = chooserArea.getBoundingClientRect();
  el.style.left = `${clientX - rect.left}px`;
  el.style.top = `${clientY - rect.top}px`;
}

function createCircle(clientX, clientY) {
  const el = document.createElement('div');
  // "--pop" gibt beim Auflegen kurz einen deutlich groesseren Kreis, damit
  // sofort sichtbar ist, dass der Finger erkannt wurde.
  el.className = 'finger-circle finger-circle--pop';
  positionCircle(el, clientX, clientY);
  chooserArea.appendChild(el);
  el.addEventListener('animationend', () => el.classList.remove('finger-circle--pop'), { once: true });
  return el;
}

function updateHint() {
  hintEl.hidden = state !== 'idle';
}

// Wird bei jedem neuen Finger erneut aufgerufen und setzt den Countdown
// wieder auf den Startwert zurueck - so bleibt immer genug Zeit, damit noch
// eine weitere Person dazukommen kann, solange noch neue Finger auflegen.
function resetCountdown() {
  countdownValue = COUNTDOWN_START;

  if (!countdownEl) {
    countdownEl = document.createElement('div');
    countdownEl.className = 'chooser-countdown';
    chooserArea.appendChild(countdownEl);
  }
  countdownEl.textContent = String(countdownValue);

  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    if (activeTouches.size === 0) {
      resetAll();
      return;
    }
    countdownValue -= 1;
    if (countdownValue <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countdownEl.remove();
      countdownEl = null;
      pickWinner();
      return;
    }
    countdownEl.textContent = String(countdownValue);
  }, 1000);
}

function pickWinner() {
  const ids = Array.from(activeTouches.keys());
  if (ids.length === 0) {
    resetAll();
    return;
  }

  state = 'selected';
  const winnerId = ids[Math.floor(Math.random() * ids.length)];

  activeTouches.forEach(({ el }, id) => {
    if (id === winnerId) {
      el.classList.add('finger-circle--selected');
    } else {
      el.classList.add('finger-circle--faded');
    }
  });

  resultEl = document.createElement('p');
  resultEl.className = 'chooser-hint chooser-hint--result';
  resultEl.textContent = 'Diese Person fängt an! Für eine neue Runde erneut Finger auflegen.';
  chooserArea.appendChild(resultEl);
}

function resetAll() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (countdownEl) {
    countdownEl.remove();
    countdownEl = null;
  }
  if (resultEl) {
    resultEl.remove();
    resultEl = null;
  }
  activeTouches.forEach(({ el }) => el.remove());
  activeTouches.clear();
  state = 'idle';
  updateHint();
}

function handleTouchStart(event) {
  event.preventDefault();

  if (state === 'selected') {
    resetAll();
  }

  for (const touch of event.changedTouches) {
    const el = createCircle(touch.clientX, touch.clientY);
    activeTouches.set(touch.identifier, { el });
  }

  if (activeTouches.size > 0) {
    if (state !== 'counting') {
      state = 'counting';
      updateHint();
    }
    // Jeder neue Finger (auch der erste) setzt den Countdown auf den
    // Startwert zurueck.
    resetCountdown();
  }
}

function handleTouchMove(event) {
  event.preventDefault();
  for (const touch of event.changedTouches) {
    const entry = activeTouches.get(touch.identifier);
    if (entry) {
      positionCircle(entry.el, touch.clientX, touch.clientY);
    }
  }
}

function handleTouchEnd(event) {
  event.preventDefault();
  if (state === 'selected') return;

  for (const touch of event.changedTouches) {
    const entry = activeTouches.get(touch.identifier);
    if (entry) {
      entry.el.remove();
      activeTouches.delete(touch.identifier);
    }
  }

  if (state === 'counting' && activeTouches.size === 0) {
    resetAll();
  }
}

chooserArea.addEventListener('touchstart', handleTouchStart, { passive: false });
chooserArea.addEventListener('touchmove', handleTouchMove, { passive: false });
chooserArea.addEventListener('touchend', handleTouchEnd, { passive: false });
chooserArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
