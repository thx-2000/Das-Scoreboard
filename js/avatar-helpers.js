/**
 * Liefert das <img>-Markup fuer den Spieler-Avatar im Punktestand, oder einen
 * leeren String, wenn kein Avatar gesetzt ist. Nur bei Solo-Standings-Zeilen
 * gesetzt (avatarExt fehlt bei Team-Zeilen bewusst, siehe includes/state.php)
 * - unklar, wessen Foto bei einem Team stellvertretend gezeigt werden sollte.
 */
function avatarImgHtml(standingsEntry) {
  if (!standingsEntry.avatarExt) return '';
  return `<img src="/api/player-avatar.php?id=${standingsEntry.id}" alt="" class="standings-avatar">`;
}

window.avatarImgHtml = avatarImgHtml;
