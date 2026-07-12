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

window.t = function t(key, vars) {
  const value = getNested(dictionary, key);
  if (value === undefined) return key;
  return interpolate(value, vars);
};

window.scoreboardLocale = function scoreboardLocale() {
  return currentLang === 'en' ? 'en-US' : 'de-DE';
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

  try {
    const dictResponse = await fetch(`/i18n/${lang}.json`);
    dictionary = await dictResponse.json();
    currentLang = lang;
  } catch (err) {
    dictionary = {};
  }

  document.documentElement.lang = currentLang;
  applyDataI18n();
  return currentLang;
}

window.scoreboardI18nReady = initI18n();
