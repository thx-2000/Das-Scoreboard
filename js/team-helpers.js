/**
 * Gruppiert Spieler eines Spiels fuer die Rundenerfassung: Team-Mitglieder
 * (identisches teamNumber, siehe includes/state.php::resolve_team_labels())
 * bekommen ein gemeinsames Eingabefeld statt eines pro Spieler - der dort
 * eingetragene Wert wird beim Speichern fuer alle Mitglieder uebernommen.
 * Nur in den 3 Punkte-Modi relevant, RAGE hat keinen Team-Modus.
 *
 * Gilt nur fuer team_scoring "shared" (Migration 9). Im "individual"-Modus
 * traegt jeder Spieler eigene Punkte ein (wie ohne Team-Modus) - hier wird
 * deshalb NICHT gruppiert, jeder Spieler bekommt sein eigenes Feld; die
 * Team-Zugehoerigkeit wirkt sich dort nur auf die Standings-Anzeige aus,
 * nicht auf die Rundenerfassung.
 */
function groupPlayersByTeam(players, teamScoring) {
  if (teamScoring === 'individual') {
    return players.map((player) => ({ key: String(player.id), label: player.name, playerIds: [player.id] }));
  }

  const groups = [];
  const seenTeams = new Set();

  players.forEach((player) => {
    if (player.teamNumber !== null && player.teamNumber !== undefined) {
      if (seenTeams.has(player.teamNumber)) return;
      seenTeams.add(player.teamNumber);
      const memberIds = players.filter((p) => p.teamNumber === player.teamNumber).map((p) => p.id);
      groups.push({ key: `team-${player.teamNumber}`, label: player.teamLabel, playerIds: memberIds });
    } else {
      groups.push({ key: String(player.id), label: player.name, playerIds: [player.id] });
    }
  });

  return groups;
}

/**
 * Liefert eine Zahl 1-4 fuer die zyklische Spielerfarbe (--player-color-1..4,
 * siehe css/style.css Bold-Theme), basierend auf der Position von playerId
 * in der players-Liste des Spiels - bleibt so ueber Rangwechsel in den
 * Standings hinweg stabil (haengt nicht am aktuellen Platz).
 */
function scoreboardPlayerColorIndex(players, playerId) {
  const idx = players.findIndex((p) => p.id === playerId);
  return ((idx >= 0 ? idx : 0) % 4) + 1;
}

/**
 * Ausgeschiedene Spieler (withdrawnAt gesetzt, siehe Migration 16) duerfen
 * keine neuen Rundenwerte mehr bekommen, bleiben aber ueberall sonst
 * (Punktestand, Korrektur-Tabelle, Farbindex) sichtbar - deshalb wird NICHT
 * state.players selbst gefiltert, sondern nur an den Stellen, die eine neue
 * Runde aufbauen, diese Filterfunktion zwischengeschaltet.
 */
function activeGamePlayers(players) {
  return players.filter((p) => !p.withdrawnAt);
}

/**
 * Spieler, der im Punktestand mit ★ markiert wird: mit Geber-Anzeige
 * (Migration 18) der Geber der naechsten Runde, sonst der zufaellig gezogene
 * Startspieler. Nach Spielende gibt es keinen Geber mehr.
 */
function scoreboardMarkerPlayerId(state) {
  if (state.showDealer) {
    return state.status === 'finished' || !state.dealer ? null : state.dealer.dealerId;
  }
  return state.startingPlayerId;
}

/** Legende unter dem Punktestand: "★ Startspieler (zufaellig)" bzw. mit Geber-Anzeige "★ Geber dieser Runde". */
function scoreboardRenderMarkerLegend(state, legendEl) {
  if (state.showDealer) {
    legendEl.textContent = window.t('common.game.dealerLegend');
  }
  const markerId = scoreboardMarkerPlayerId(state);
  legendEl.hidden = markerId === null || markerId === undefined;
}

/** Zeile "Geber: X" ueber der Rundeneingabe (nur mit Geber-Anzeige). */
function scoreboardRenderDealerLine(state, lineEl) {
  if (!lineEl) return;
  const dealer = state.showDealer && state.status !== 'finished' && state.dealer
    ? state.players.find((p) => p.id === state.dealer.dealerId)
    : null;
  lineEl.hidden = !dealer;
  if (dealer) lineEl.textContent = window.t('common.game.dealerLine', { dealer: dealer.name });
}

window.scoreboardMarkerPlayerId = scoreboardMarkerPlayerId;
window.scoreboardRenderMarkerLegend = scoreboardRenderMarkerLegend;
window.scoreboardRenderDealerLine = scoreboardRenderDealerLine;

window.groupPlayersByTeam = groupPlayersByTeam;
window.activeGamePlayers = activeGamePlayers;
window.scoreboardPlayerColorIndex = scoreboardPlayerColorIndex;
