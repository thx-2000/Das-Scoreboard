/**
 * Sitzordnung im Uhrzeigersinn abfragen (Setup): erst antippen, wer irgendwo
 * sitzt, dann jeweils der naechste im Uhrzeigersinn. Antippen eines bereits
 * nummerierten Spielers nimmt ihn und alle danach Eingetragenen wieder zurueck
 * (so ist ein Vertippen schnell korrigiert). Gemeinsam fuer RAGE (immer aktiv)
 * und die optionale Geber-Anzeige der anderen Modi.
 *
 * isActive() entscheidet, ob der Bereich ueberhaupt gezeigt wird.
 */
function initSeatOrder({ section, container, isActive }) {
  let sequence = [];

  function refresh(selectedPlayers) {
    const selectedIds = new Set(selectedPlayers.map((p) => p.id));
    sequence = sequence.filter((id) => selectedIds.has(id));
    section.hidden = !isActive() || selectedPlayers.length < 2;
    container.innerHTML = '';
    if (section.hidden) return;

    selectedPlayers.forEach((player) => {
      const pos = sequence.indexOf(player.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'seat-chip';
      chip.setAttribute('aria-pressed', String(pos !== -1));
      if (pos !== -1) {
        const num = document.createElement('span');
        num.className = 'seat-chip__num';
        num.textContent = String(pos + 1);
        chip.appendChild(num);
      }
      chip.appendChild(document.createTextNode(player.name));
      chip.addEventListener('click', () => {
        if (pos === -1) {
          sequence.push(player.id);
        } else {
          sequence = sequence.slice(0, pos);
        }
        refresh(selectedPlayers);
      });
      container.appendChild(chip);
    });

    if (sequence.length > 0) {
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn btn--small btn--ghost';
      resetBtn.textContent = window.t('common.setup.seatOrderReset');
      resetBtn.addEventListener('click', () => {
        sequence = [];
        refresh(selectedPlayers);
      });
      container.appendChild(resetBtn);
    }
  }

  return {
    refresh,
    getSequence: () => [...sequence],
    setSequence(ids) { sequence = [...ids]; },
  };
}

/**
 * Sitzreihenfolge eines frueheren Spiels fuer "Weitere Runde spielen":
 * nur uebernehmen, wenn von allen wiederkehrenden Spielern bekannt.
 */
function seatSequenceFromGame(returningPlayers) {
  if (!returningPlayers.every((p) => p.seatPosition !== null && p.seatPosition !== undefined)) return [];
  return [...returningPlayers].sort((a, b) => a.seatPosition - b.seatPosition).map((p) => p.id);
}

window.initSeatOrder = initSeatOrder;
window.seatSequenceFromGame = seatSequenceFromGame;
