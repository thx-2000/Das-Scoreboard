/**
 * i18n-Loader: laedt das Woerterbuch fuer die aktuell in den globalen
 * Einstellungen gewaehlte Sprache und wendet es auf [data-i18n]-Elemente an.
 * Neue Sprache hinzufuegen: i18n/{code}.json anlegen und in
 * includes/settings.php::supported_languages() eintragen - hier ist nichts
 * zu aendern.
 *
 * window.t(key, vars) steht global fuer JS-generierte Texte zur Verfuegung.
 * window.scoreboardI18nReady ist ein Promise, auf das jede Seite vor eigener
 * Initialisierung warten sollte (sonst laeuft t() ggf. mit leerem Woerterbuch).
 */
const FALLBACK_LANG = 'de';
let dictionary = {};
let currentLang = FALLBACK_LANG;

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => (vars[key] !== undefined ? String(vars[key]) : match));
}

/**
 * HTML-Escaping fuer nutzergenerierte Texte (Spieler-/Team-/Gruppennamen),
 * die per innerHTML-Template in DOM eingefuegt werden - .textContent ist
 * meist die bessere Wahl, aber wo ganze Zeilen als Template-String gebaut
 * werden, muss jeder eingebettete Wert einzeln escaped werden. Hier
 * platziert, da i18n.js auf jeder Seite geladen wird (siehe footer.php).
 */
window.escapeHtml = function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
};

window.t = function t(key, vars) {
  const value = getNested(dictionary, key);
  if (value === undefined) return key;
  return interpolate(value, vars);
};

// BCP-47-Locale je unterstuetzter Sprache, fuer toLocaleString()/localeCompare()
// (Datumsformatierung, alphabetische Sortierung) - siehe supported_languages()
// in includes/settings.php fuer die Sprachliste selbst.
const LOCALE_BY_LANG = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  it: 'it-IT',
  es: 'es-ES',
  pt: 'pt-PT',
  nl: 'nl-NL',
  sv: 'sv-SE',
  nb: 'nb-NO',
  da: 'da-DK',
  fi: 'fi-FI',
  is: 'is-IS',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  sk: 'sk-SK',
  hu: 'hu-HU',
  ro: 'ro-RO',
  bg: 'bg-BG',
  el: 'el-GR',
  hr: 'hr-HR',
  sl: 'sl-SI',
  et: 'et-EE',
  lv: 'lv-LV',
  lt: 'lt-LT',
  uk: 'uk-UA',
  sr: 'sr-RS',
  bs: 'bs-BA',
  mk: 'mk-MK',
  be: 'be-BY',
  sq: 'sq-AL',
  ga: 'ga-IE',
  mt: 'mt-MT',
};

window.scoreboardLocale = function scoreboardLocale() {
  return LOCALE_BY_LANG[currentLang] || 'de-DE';
};

function applyDataI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = window.t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = window.t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = window.t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', window.t(el.getAttribute('data-i18n-aria-label')));
  });
}

/**
 * <title data-i18n-title-suffix="..."> bekommt nicht den reinen Wörterbuch-
 * Text, sondern "{Markenname} — {Text}" - der Markenname kommt aus den
 * globalen Einstellungen (theme.js), nicht aus dem Sprach-Wörterbuch, da er
 * in jeder Sprache gleich bleiben soll.
 */
async function applyTitleWithBrand() {
  let brandName = 'Das Scoreboard';
  if (window.scoreboardThemeReady) {
    try {
      const settings = await window.scoreboardThemeReady;
      if (settings && settings.app_title) brandName = settings.app_title;
    } catch (err) {
      // Fallback-Markenname reicht
    }
  }
  document.querySelectorAll('[data-i18n-title-suffix]').forEach((el) => {
    const suffix = window.t(el.getAttribute('data-i18n-title-suffix'));
    el.textContent = `${brandName} — ${suffix}`;
  });
}

async function initI18n() {
  let lang = FALLBACK_LANG;
  try {
    const response = await fetch('/api/settings.php');
    const data = await response.json();
    lang = data.settings.language || FALLBACK_LANG;
  } catch (err) {
    // Fallback bleibt Deutsch
  }

  // Cache-Buster ueber die App-Version: i18n/{lang}.json ist eine statische
  // Datei, die der Browser sonst ueber ein Update hinweg im Cache behalten
  // kann (neue Keys wuerden dann als roher Schluessel angezeigt, bis
  // jemand hart neu laedt). Mit ?v=<version> zaehlt jede neue Version als
  // eigene URL, der Cache wird automatisch bei jedem Release ungueltig.
  let version = '';
  try {
    const versionResponse = await fetch('/api/version.php');
    const versionData = await versionResponse.json();
    version = versionData.version || '';
  } catch (err) {
    // Ohne Versionsnummer wird einfach ohne Cache-Buster geladen.
  }

  try {
    const dictResponse = await fetch(`/i18n/${lang}.json${version ? `?v=${version}` : ''}`);
    dictionary = await dictResponse.json();
    currentLang = lang;
  } catch (err) {
    dictionary = {};
  }

  document.documentElement.lang = currentLang;
  applyDataI18n();
  await applyTitleWithBrand();
  return currentLang;
}

window.scoreboardI18nReady = initI18n();
