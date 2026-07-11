(async function loadVersion() {
  const el = document.getElementById('app-version');
  if (!el) return;
  try {
    const response = await fetch('/api/version.php');
    const data = await response.json();
    el.textContent = `Scoreboard – v${data.version}`;
  } catch (err) {
    // Fallback-Text bleibt stehen, falls Anfrage fehlschlaegt.
  }
})();
