/**
 * Kurzes Ton-/Vibrations-Feedback beim Speichern einer Runde. Wird nur auf
 * den Spielansicht-Seiten eingebunden (nicht global). Steuerbar ueber die
 * globale Einstellung "sound_enabled" (Default an).
 *
 * Vibration (navigator.vibrate) wird von Safari auf iPhone/iPad grundsaetzlich
 * nicht unterstuetzt, auch nicht im PWA-Modus - der Aufruf ist deshalb per
 * Feature-Check abgesichert und laeuft dort einfach ins Leere, waehrend der
 * Ton unabhaengig davon funktioniert.
 */
function playSaveSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
  } catch (err) {
    // Kein Audio verfuegbar - einfach stumm bleiben.
  }
}

function triggerHaptic() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(30);
    } catch (err) {
      // Manche Browser werfen bei fehlender Nutzerinteraktion o.ae. - egal.
    }
  }
}

window.scoreboardPlaySaveFeedback = function scoreboardPlaySaveFeedback() {
  const settings = window.__scoreboardSettings;
  if (settings && settings.sound_enabled === '0') return;
  playSaveSound();
  triggerHaptic();
};
