/**
 * Markiert den Inhalt von Zahlenfeldern automatisch, sobald sie fokussiert
 * werden (Klick oder Tab) - direkt lostippen ueberschreibt den alten Wert,
 * ohne ihn erst manuell markieren/loeschen zu muessen. Ueber Event-Delegation
 * im Capturing-Modus, da "focus" nicht bubbelt - deckt automatisch auch
 * dynamisch erzeugte Felder ab, ohne pro Feld einen eigenen Listener zu
 * brauchen.
 */
document.addEventListener('focus', (event) => {
  if (event.target.matches && event.target.matches('input[type="number"], input[inputmode="numeric"]')) {
    event.target.select();
  }
}, true);
