/**
 * Gruppen-Chips + "Alle auswaehlen/abwaehlen" oberhalb der Spielerauswahl
 * beim Spiel-Einrichten - gilt fuer alle 4 Modi (auch RAGE), da reine
 * Auswahl-Hilfe unabhaengig vom Punkte-Mechanismus. Ein Klick auf eine
 * Gruppe ERGAENZT die bestehende Auswahl (haengt zusaetzliche Haken an,
 * nimmt keine bestehenden zurueck) - "Alle auswaehlen" markiert dagegen
 * wirklich alle. selectedPlayerIds wird direkt mutiert (Set by reference),
 * onChange baut danach die Spieler-Checkboxen neu auf.
 */
async function initGroupPicker(container, selectedPlayerIds, onChange) {
  container.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'group-picker__toolbar';

  const selectAllBtn = document.createElement('button');
  selectAllBtn.type = 'button';
  selectAllBtn.className = 'btn btn--small btn--ghost';
  toolbar.appendChild(selectAllBtn);

  const chipsWrap = document.createElement('div');
  chipsWrap.className = 'group-picker__chips';

  container.appendChild(toolbar);
  container.appendChild(chipsWrap);

  let allIds = [];

  function updateSelectAllLabel() {
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedPlayerIds.has(id));
    selectAllBtn.textContent = allSelected
      ? window.t('common.setup.selectNone')
      : window.t('common.setup.selectAll');
    selectAllBtn.dataset.mode = allSelected ? 'deselect' : 'select';
  }

  selectAllBtn.addEventListener('click', () => {
    if (selectAllBtn.dataset.mode === 'select') {
      allIds.forEach((id) => selectedPlayerIds.add(id));
    } else {
      selectedPlayerIds.clear();
    }
    onChange();
  });

  const response = await fetch('/api/player-groups.php');
  const groups = await response.json();
  const activeGroups = groups.filter((g) => g.active && g.playerIds.length > 0);

  chipsWrap.hidden = activeGroups.length === 0;
  activeGroups.forEach((group) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'group-chip';
    chip.textContent = group.name;
    chip.title = group.players.map((p) => p.name).join(', ');
    chip.addEventListener('click', () => {
      group.playerIds.forEach((id) => selectedPlayerIds.add(id));
      onChange();
    });
    chipsWrap.appendChild(chip);
  });

  return {
    refreshLabel(newAllIds) {
      allIds = newAllIds;
      updateSelectAllLabel();
    },
  };
}

window.initGroupPicker = initGroupPicker;
