/**
 * Verwaltet die Team-Zuordnung im "Erweiterte Optionen"-Bereich der 3
 * Punkte-Modi-Setup-Seiten (RAGE hat keinen Team-Modus). Ein Container wird
 * per initTeamSetup() einmalig verdrahtet; refresh(players) zeigt/aktualisiert
 * die Zuordnungs-Zeilen fuer die aktuell ausgewaehlten Spieler - wird bei
 * jeder Aenderung der Spielerauswahl vom aufrufenden setup.js erneut gerufen.
 */
function initTeamSetup(container) {
  const enableCheckbox = container.querySelector('[data-team-enable]');
  const scoringWrap = container.querySelector('[data-team-scoring]');
  const assignmentsWrap = container.querySelector('[data-team-assignments]');
  const namesWrap = container.querySelector('[data-team-names]');

  let currentPlayers = [];
  const assignments = {}; // playerId -> teamNumber|null
  const names = {}; // teamNumber -> Name

  function usedTeamNumbers() {
    const set = new Set();
    Object.values(assignments).forEach((n) => { if (n !== null) set.add(n); });
    return Array.from(set).sort((a, b) => a - b);
  }

  function renderNames() {
    namesWrap.innerHTML = '';
    usedTeamNumbers().forEach((teamNumber) => {
      const field = document.createElement('div');
      field.className = 'team-setup__name-field';

      const label = document.createElement('label');
      label.setAttribute('for', `team-name-${teamNumber}`);
      label.textContent = window.t('common.setup.teamNameLabel', { number: teamNumber });

      const input = document.createElement('input');
      input.type = 'text';
      input.id = `team-name-${teamNumber}`;
      input.maxLength = 40;
      input.placeholder = window.t('common.setup.teamNamePlaceholder');
      input.value = names[teamNumber] || '';
      input.addEventListener('input', () => { names[teamNumber] = input.value; });

      field.appendChild(label);
      field.appendChild(input);
      namesWrap.appendChild(field);
    });
  }

  function renderAssignments() {
    assignmentsWrap.innerHTML = '';
    currentPlayers.forEach((player) => {
      const row = document.createElement('div');
      row.className = 'team-setup__row';

      const label = document.createElement('span');
      label.textContent = player.name;

      const select = document.createElement('select');
      const noneOption = document.createElement('option');
      noneOption.value = '';
      noneOption.textContent = window.t('common.setup.teamNone');
      select.appendChild(noneOption);
      for (let i = 1; i <= currentPlayers.length; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = window.t('common.setup.teamNumber', { number: i });
        select.appendChild(opt);
      }
      select.value = assignments[player.id] != null ? String(assignments[player.id]) : '';
      select.addEventListener('change', () => {
        assignments[player.id] = select.value === '' ? null : Number(select.value);
        renderNames();
      });

      row.appendChild(label);
      row.appendChild(select);
      assignmentsWrap.appendChild(row);
    });
    renderNames();
  }

  function refresh(players) {
    // Abgewaehlte Spieler aus der Zuordnung entfernen, damit sie nicht als
    // "Geisterspieler" in usedTeamNumbers() haengen bleiben.
    const ids = new Set(players.map((p) => p.id));
    Object.keys(assignments).forEach((id) => {
      if (!ids.has(Number(id))) delete assignments[Number(id)];
    });
    currentPlayers = players;
    renderAssignments();
  }

  enableCheckbox.addEventListener('change', () => {
    scoringWrap.hidden = !enableCheckbox.checked;
    assignmentsWrap.hidden = !enableCheckbox.checked;
    namesWrap.hidden = !enableCheckbox.checked;
  });

  return {
    refresh,
    getTeamAssignments() {
      if (!enableCheckbox.checked) return {};
      const out = {};
      Object.entries(assignments).forEach(([playerId, teamNumber]) => {
        if (teamNumber !== null) out[playerId] = teamNumber;
      });
      return out;
    },
    getTeamNames() {
      if (!enableCheckbox.checked) return {};
      return { ...names };
    },
    getTeamScoring() {
      if (!enableCheckbox.checked) return 'shared';
      const checked = scoringWrap.querySelector('input[name="team-scoring"]:checked');
      return checked ? checked.value : 'shared';
    },
  };
}

window.initTeamSetup = initTeamSetup;
