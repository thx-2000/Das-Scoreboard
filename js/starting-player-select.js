/**
 * Startspieler im Setup: standardmaessig "Zufaellig" (wie bisher), alternativ
 * ein bestimmter Mitspieler. Mit Geber-Anzeige (Migration 18, bei RAGE immer)
 * ist der Startspieler der erste Geber - die Beschriftung wechselt dann.
 * Die Auswahl zeigt immer nur die gerade angehakten Spieler.
 */
function initStartingPlayerSelect({ field, select, label, isDealerMode }) {
  function refresh(selectedPlayers) {
    const previous = select.value;
    field.hidden = selectedPlayers.length < 2;
    label.textContent = window.t(isDealerMode() ? 'common.setup.firstDealerLabel' : 'common.setup.startingPlayerLabel');

    select.innerHTML = '';
    const randomOpt = document.createElement('option');
    randomOpt.value = '';
    randomOpt.textContent = window.t('common.setup.startingPlayerRandom');
    select.appendChild(randomOpt);
    selectedPlayers.forEach((player) => {
      const opt = document.createElement('option');
      opt.value = String(player.id);
      opt.textContent = player.name;
      select.appendChild(opt);
    });
    select.value = selectedPlayers.some((p) => String(p.id) === previous) ? previous : '';
  }

  return {
    refresh,
    /** Gewaehlte Spieler-ID, oder null fuer "Zufaellig". */
    getValue: () => (select.value ? Number(select.value) : null),
  };
}

window.initStartingPlayerSelect = initStartingPlayerSelect;
