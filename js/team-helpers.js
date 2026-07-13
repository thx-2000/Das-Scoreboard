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

window.groupPlayersByTeam = groupPlayersByTeam;
