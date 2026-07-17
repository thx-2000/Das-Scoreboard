const UPDATE_CHECK_REPO = 'thx-2000/Das-Scoreboard';
const UPDATE_CHECK_CACHE_KEY = 'scoreboard_update_check';
const UPDATE_CHECK_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 Tag

function parseVersionParts(version) {
  return String(version).replace(/^v/, '').split('.').map(Number);
}

// Simpler Zahlen-fuer-Zahlen-Vergleich reicht fuer unser x.y.z-Schema.
function isNewerVersion(remote, local) {
  const r = parseVersionParts(remote);
  const l = parseVersionParts(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

// Fragt die GitHub-API nach dem neuesten Release. Solange das Repo privat
// ist, liefert das ein 404 - wird bewusst still geschluckt (kein Fehler
// sichtbar). Sobald das Repo oeffentlich ist, faengt das ohne Codeaenderung
// an zu funktionieren. Ergebnis wird pro Browser 1 Tag gecacht, ein
// fehlgeschlagener Versuch wird NICHT gecacht (damit es sofort anspringt,
// sobald das Repo oeffentlich geschaltet wird).
async function fetchLatestRelease() {
  try {
    const cached = JSON.parse(localStorage.getItem(UPDATE_CHECK_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.checkedAt < UPDATE_CHECK_CACHE_TTL_MS) {
      return cached;
    }
  } catch (err) {
    // Kaputter Cache-Eintrag - einfach neu pruefen.
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${UPDATE_CHECK_REPO}/releases/latest`);
    if (!response.ok) return null;
    const data = await response.json();
    const result = { checkedAt: Date.now(), version: data.tag_name, url: data.html_url };
    localStorage.setItem(UPDATE_CHECK_CACHE_KEY, JSON.stringify(result));
    return result;
  } catch (err) {
    return null;
  }
}

async function showUpdateHintIfNewer(currentVersion, el) {
  const latest = await fetchLatestRelease();
  if (!latest || !latest.version || !isNewerVersion(latest.version, currentVersion)) return;

  if (window.scoreboardI18nReady) {
    try { await window.scoreboardI18nReady; } catch (err) { /* Fallback-Text reicht */ }
  }

  const label = window.t
    ? window.t('common.updateAvailable', { version: latest.version })
    : `Update verfügbar (${latest.version})`;

  el.appendChild(document.createElement('br'));
  const link = document.createElement('a');
  link.className = 'app-version__update';
  link.href = latest.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = label;
  el.appendChild(link);
}

(async function loadVersion() {
  const el = document.getElementById('app-version');
  if (!el) return;
  let currentVersion = null;
  try {
    const response = await fetch('/api/version.php');
    const data = await response.json();
    currentVersion = data.version;
  } catch (err) {
    // Fallback-Text bleibt stehen, falls Anfrage fehlschlaegt.
  }

  let brandName = 'Das Scoreboard';
  if (window.scoreboardThemeReady) {
    try {
      const settings = await window.scoreboardThemeReady;
      if (settings && settings.app_title) brandName = settings.app_title;
    } catch (err) {
      // Fallback-Markenname reicht
    }
  }

  if (currentVersion) {
    el.textContent = `${brandName} – v${currentVersion}`;
    showUpdateHintIfNewer(currentVersion, el);
  }
})();
