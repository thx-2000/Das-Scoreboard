/**
 * Checkbox-Feld fuer die Punkteschritte-Auswahl (±1/5/10/50/100/500/1000) -
 * wird beim Einrichten eines Spiels (3 generische Punkte-Modi) UND beim
 * Anlegen/Bearbeiten eines Spiele-Presets (Einstellungen -> Meine Spiele)
 * gebraucht, daher hier als gemeinsamer Baustein statt dreifach dupliziert.
 * Seit Migration 13 pro Spiel/Preset statt eine globale Einstellung.
 */
const ROUND_ENTRY_STEPS_FIELD_VALUES = [1, 5, 10, 50, 100, 500, 1000];

function renderRoundEntryStepsField(container, value) {
  const enabled = String(value || '1,5,10').split(',').map(Number);
  container.innerHTML = '';
  ROUND_ENTRY_STEPS_FIELD_VALUES.forEach((step) => {
    const label = document.createElement('label');
    label.className = 'player-chip';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.stepValue = String(step);
    input.checked = enabled.includes(step);
    const span = document.createElement('span');
    span.textContent = `±${step}`;
    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
  });
}

function collectRoundEntryStepsField(container) {
  const checked = Array.from(container.querySelectorAll('input[data-step-value]'))
    .filter((input) => input.checked)
    .map((input) => input.dataset.stepValue);
  return checked.length ? checked.join(',') : '1,5,10';
}

window.renderRoundEntryStepsField = renderRoundEntryStepsField;
window.collectRoundEntryStepsField = collectRoundEntryStepsField;
