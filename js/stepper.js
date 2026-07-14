/**
 * Plus/Minus-Stepper fuer Zahlenfelder (Zielpunkte, Rundenzahl). Die
 * Buttons sind nur im Bold-Theme sichtbar (siehe css/style.css) - im
 * Classic-Theme bleibt das Eingabefeld unveraendert, dieses Skript greift
 * dann einfach nicht ein (keine sichtbaren Buttons zum Klicken).
 */
(function initSteppers() {
  document.querySelectorAll('[data-stepper]').forEach((wrap) => {
    const input = wrap.querySelector('input');
    const minusBtn = wrap.querySelector('.stepper__btn--minus');
    const plusBtn = wrap.querySelector('.stepper__btn--plus');
    if (!input || !minusBtn || !plusBtn) return;

    const step = Number(wrap.dataset.step) || 1;
    const min = wrap.dataset.min !== undefined ? Number(wrap.dataset.min) : 0;

    function adjust(delta) {
      const current = Number(input.value) || 0;
      const next = Math.max(min, current + delta);
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    minusBtn.addEventListener('click', () => adjust(-step));
    plusBtn.addEventListener('click', () => adjust(step));
  });
})();
