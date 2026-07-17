// Reiter sind rein optisch (ein/ausblenden per hidden) - technisch bleibt
// alles EIN Formular im Hintergrund, damit eine Aenderung auf Reiter A
// beim Speichern auf Reiter B nicht verloren geht (der globale Speichern-
// Button unten liest immer den kompletten, aktuellen DOM-Zustand aus,
// unabhaengig davon, welcher Reiter gerade sichtbar ist).
document.querySelectorAll('#settings-tabs .settings-tabs__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#settings-tabs .settings-tabs__btn').forEach((b) => {
      b.setAttribute('aria-selected', String(b === btn));
    });
    document.querySelectorAll('.settings-tab-panel').forEach((panel) => {
      panel.hidden = panel.dataset.tabPanel !== btn.dataset.tab;
    });
  });
});

const appTitleInput = document.getElementById('app-title-input');
document.getElementById('title-form').addEventListener('submit', (event) => event.preventDefault());

const soundEnabledInput = document.getElementById('sound-enabled-input');

const languageSelect = document.getElementById('language-select');
const singleColorFields = document.getElementById('single-color-fields');
const themePairFields = document.getElementById('theme-pair-fields');
const saveBtn = document.getElementById('save-settings-btn');
const resetBtn = document.getElementById('reset-settings-btn');
const statusEl = document.getElementById('settings-status');

const singleColorsSection = document.getElementById('single-colors-section');
const pairColorsSection = document.getElementById('pair-colors-section');
const boldColorsNote = document.getElementById('bold-colors-note');
const boldBackgroundSection = document.getElementById('bold-background-section');
const boldCardStyleSection = document.getElementById('bold-card-style-section');
const sharedAccentSection = document.getElementById('shared-accent-section');
const flipPresetSection = document.getElementById('flip-preset-section');
const flipColorsSection = document.getElementById('flip-colors-section');
const flipColorFields = document.getElementById('flip-color-fields');

// Gespiegelt aus includes/settings.php::flip_accent_palette() - nur hier
// benoetigt (Schnellwahl-Klick ueberschreibt flip_color_accent_light/_dark),
// theme.js braucht die Palette nicht, da es die bereits gespeicherten
// flip_color_accent_*-Felder direkt liest. Eigener Name (nicht
// ACCENT_COLOR_PALETTE) vermeidet eine doppelte Top-Level-const im selben
// globalen Skript-Scope wie theme.js.
const FLIP_ACCENT_PALETTE = {
  amber: ['#c9761a', '#f2a93b'],
  petrol: ['#1f7a6c', '#4fd6bd'],
  karmesin: ['#b23a3a', '#ef6a6a'],
  knallorange: ['#ea580c', '#fb923c'],
  violett: ['#6a4fb2', '#b39ddb'],
};

// Je nach gewaehltem Theme (classic/bold/flip) sind unterschiedliche
// Unterabschnitte relevant: die gemeinsame 5-Punkte-Schnellwahl (Bold +
// Classic-Quickset) und Classic-Hex-Feinjustierung nur bei Classic/Bold,
// Flip Boards eigene Presets/Hex-Felder nur bei Flip, Bold-Hintergrund/
// Kartenstil nur bei Bold.
function updateColorSectionsVisibility() {
  const checked = document.querySelector('input[name="theme-style"]:checked');
  const theme = checked ? checked.value : 'classic';
  const isBold = theme === 'bold';
  const isFlip = theme === 'flip';

  sharedAccentSection.hidden = isFlip;
  singleColorsSection.hidden = isBold || isFlip;
  pairColorsSection.hidden = isBold || isFlip;
  boldColorsNote.hidden = !isBold;
  boldBackgroundSection.hidden = !isBold;
  boldCardStyleSection.hidden = !isBold;

  flipPresetSection.hidden = !isFlip;
  flipColorsSection.hidden = !isFlip;
}

// Event-Delegation auf document statt Listener je Radio-Element - robuster
// gegenueber Timing (Listener greift unabhaengig davon, wann genau die
// Radios im DOM verfuegbar waren, als das Skript geladen wurde).
document.addEventListener('change', (event) => {
  if (event.target.name === 'theme-style') updateColorSectionsVisibility();
});

function applyBoldPresetChecks(settings) {
  document.querySelectorAll('input[name="bold-accent"]').forEach((input) => {
    input.checked = input.value === (settings.bold_accent || 'green');
  });
  document.querySelectorAll('input[name="bold-background"]').forEach((input) => {
    input.checked = input.value === (settings.bold_background || 'dark');
  });
  document.querySelectorAll('input[name="bold-card-style"]').forEach((input) => {
    input.checked = input.value === (settings.bold_card_style || 'classic');
  });
  document.querySelectorAll('input[name="flip-accent"]').forEach((input) => {
    input.checked = input.value === (settings.flip_accent || 'amber');
  });
}

// Flip-Board-Presetwahl ueberschreibt flip_color_accent_light/_dark direkt -
// gleiches Schnellwahl-Prinzip wie der bold-accent-Listener unten fuer
// Classic, nur fuer Flip Boards eigenen Feldsatz.
document.addEventListener('change', (event) => {
  if (event.target.name !== 'flip-accent') return;
  const pair = FLIP_ACCENT_PALETTE[event.target.value];
  if (!pair) return;
  ['flip_color_accent_light', 'flip_color_accent_dark'].forEach((key, index) => {
    const hexInput = document.querySelector(`.color-field__hex[data-setting-key="${key}"]`);
    if (hexInput) {
      hexInput.value = pair[index];
      hexInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
});

// Nutzt die in js/theme.js bereits deklarierte ACCENT_COLOR_PALETTE (dort
// vor settings.js eingebunden, siehe includes/footer.php) - unter Classic
// dient der Akzentfarben-Picker als Schnellwahl, die direkt die bestehenden
// Hex-Felder color_green/color_green_strong ueberschreibt (die Feinjustierung
// im Erweitert-Bereich bleibt danach weiterhin moeglich). Eigene Kopie der
// Palette hier wuerde als doppelte Top-Level-const im selben globalen Scope
// wie theme.js einen SyntaxError verursachen und das ganze Skript lahmlegen.
document.addEventListener('change', (event) => {
  if (event.target.name !== 'bold-accent') return;
  const input = event.target;

  const themeStyleInput = document.querySelector('input[name="theme-style"]:checked');
  if (themeStyleInput && themeStyleInput.value === 'bold') return;

  const pair = ACCENT_COLOR_PALETTE[input.value];
  if (!pair) return;
  ['color_green', 'color_green_strong'].forEach((key, index) => {
    const hexInput = document.querySelector(`.color-field__hex[data-setting-key="${key}"]`);
    if (hexInput) {
      hexInput.value = pair[index];
      hexInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
});

const logoStatusEl = document.getElementById('logo-status');
const logoSlots = {
  square: {
    preview: document.getElementById('logo-square-preview'),
    fileInput: document.getElementById('logo-square-file'),
    uploadBtn: document.getElementById('logo-square-upload-btn'),
    removeBtn: document.getElementById('logo-square-remove-btn'),
  },
  banner: {
    preview: document.getElementById('logo-banner-preview'),
    fileInput: document.getElementById('logo-banner-file'),
    uploadBtn: document.getElementById('logo-banner-upload-btn'),
    removeBtn: document.getElementById('logo-banner-remove-btn'),
  },
};

function singleColors() {
  return [
    { key: 'color_green', label: window.t('settings.colorLabels.green') },
    { key: 'color_green_strong', label: window.t('settings.colorLabels.greenStrong') },
    { key: 'color_amber', label: window.t('settings.colorLabels.amber') },
    { key: 'color_amber_strong', label: window.t('settings.colorLabels.amberStrong') },
    { key: 'color_on_accent', label: window.t('settings.colorLabels.onAccent') },
    { key: 'color_focus', label: window.t('settings.colorLabels.focus') },
    { key: 'color_danger', label: window.t('settings.colorLabels.danger') },
  ];
}

function themePairs() {
  return [
    { key: 'color_bg', label: window.t('settings.colorLabels.bg') },
    { key: 'color_surface', label: window.t('settings.colorLabels.surface') },
    { key: 'color_text', label: window.t('settings.colorLabels.text') },
    { key: 'color_text_muted', label: window.t('settings.colorLabels.textMuted') },
    { key: 'color_border', label: window.t('settings.colorLabels.border') },
  ];
}

function flipColorPairs() {
  return [
    { key: 'flip_color_bg', label: window.t('settings.colorLabels.bg') },
    { key: 'flip_color_surface', label: window.t('settings.colorLabels.surface') },
    { key: 'flip_color_ink', label: window.t('settings.colorLabels.text') },
    { key: 'flip_color_accent', label: window.t('settings.theme.accentLabel') },
  ];
}

let currentSettings = null;

function createColorField(settingKey, label, value) {
  const wrap = document.createElement('div');
  wrap.className = 'color-field';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.setAttribute('for', `field-${settingKey}`);

  const inputsWrap = document.createElement('div');
  inputsWrap.className = 'color-field__inputs';

  const picker = document.createElement('input');
  picker.type = 'color';
  picker.value = value;
  picker.dataset.settingKey = settingKey;
  picker.className = 'color-field__picker';

  const hexInput = document.createElement('input');
  hexInput.type = 'text';
  hexInput.id = `field-${settingKey}`;
  hexInput.className = 'color-field__hex';
  hexInput.value = value;
  hexInput.maxLength = 7;
  hexInput.dataset.settingKey = settingKey;
  hexInput.autocomplete = 'off';

  picker.addEventListener('input', () => {
    hexInput.value = picker.value;
  });
  hexInput.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
      picker.value = hexInput.value;
    }
  });

  inputsWrap.appendChild(picker);
  inputsWrap.appendChild(hexInput);
  wrap.appendChild(labelEl);
  wrap.appendChild(inputsWrap);
  return wrap;
}

function renderLanguages(settings, languages) {
  languageSelect.innerHTML = '';
  Object.entries(languages).forEach(([code, name]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    if (code === settings.language) option.selected = true;
    languageSelect.appendChild(option);
  });
}

function renderColorFields(settings) {
  singleColorFields.innerHTML = '';
  singleColors().forEach(({ key, label }) => {
    singleColorFields.appendChild(createColorField(key, label, settings[key]));
  });

  themePairFields.innerHTML = '';
  themePairs().forEach(({ key, label }) => {
    const group = document.createElement('div');
    group.className = 'theme-pair-field';

    const heading = document.createElement('h3');
    heading.textContent = label;
    group.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'theme-pair-field__row';
    row.appendChild(createColorField(`${key}_light`, window.t('settings.colors.pairs.light'), settings[`${key}_light`]));
    row.appendChild(createColorField(`${key}_dark`, window.t('settings.colors.pairs.dark'), settings[`${key}_dark`]));
    group.appendChild(row);

    themePairFields.appendChild(group);
  });
}

function renderFlipColorFields(settings) {
  flipColorFields.innerHTML = '';
  flipColorPairs().forEach(({ key, label }) => {
    flipColorFields.appendChild(createColorField(`${key}_light`, `${label} (${window.t('settings.colors.pairs.light')})`, settings[`${key}_light`]));
    flipColorFields.appendChild(createColorField(`${key}_dark`, `${label} (${window.t('settings.colors.pairs.dark')})`, settings[`${key}_dark`]));
  });
}

function renderLogoPreviews(settings) {
  ['square', 'banner'].forEach((type) => {
    const slot = logoSlots[type];
    const hasLogo = Boolean(settings[`logo_${type}_ext`]);

    slot.preview.innerHTML = '';
    slot.preview.classList.toggle('logo-preview--empty', !hasLogo);
    slot.removeBtn.hidden = !hasLogo;

    if (hasLogo) {
      const img = document.createElement('img');
      img.src = `/api/logo.php?type=${type}&t=${Date.now()}`;
      img.alt = '';
      slot.preview.appendChild(img);
    }
  });

  document.querySelectorAll('input[name="logo-mode"]').forEach((radio) => {
    radio.checked = radio.value === (settings.logo_mode || 'none');
  });
}

function showLogoStatus(message) {
  logoStatusEl.textContent = message;
  setTimeout(() => {
    if (logoStatusEl.textContent === message) logoStatusEl.textContent = '';
  }, 3000);
}

async function uploadLogo(type) {
  const slot = logoSlots[type];
  const file = slot.fileInput.files[0];
  if (!file) {
    showLogoStatus(window.t('settings.logo.noFileSelected'));
    return;
  }

  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch(`/api/logo.php?type=${type}`, { method: 'POST', body: formData });
  const data = await response.json();

  if (!response.ok) {
    showLogoStatus(data.error || window.t('settings.logo.uploadFailed'));
    return;
  }

  slot.fileInput.value = '';
  currentSettings[`logo_${type}_ext`] = data.ext;
  renderLogoPreviews(currentSettings);
  showLogoStatus(window.t('settings.logo.uploadSuccess'));
}

async function removeLogo(type) {
  const confirmed = window.confirm(window.t('settings.logo.removeConfirm'));
  if (!confirmed) return;

  await fetch(`/api/logo.php?type=${type}`, { method: 'DELETE' });
  currentSettings[`logo_${type}_ext`] = '';
  renderLogoPreviews(currentSettings);
  showLogoStatus(window.t('settings.logo.removeSuccess'));
}

logoSlots.square.uploadBtn.addEventListener('click', () => uploadLogo('square'));
logoSlots.square.removeBtn.addEventListener('click', () => removeLogo('square'));
logoSlots.banner.uploadBtn.addEventListener('click', () => uploadLogo('banner'));
logoSlots.banner.removeBtn.addEventListener('click', () => removeLogo('banner'));

async function loadSettings() {
  const response = await fetch('/api/settings.php');
  const data = await response.json();
  currentSettings = data.settings;
  appTitleInput.value = data.settings.app_title || '';
  soundEnabledInput.checked = data.settings.sound_enabled !== '0';
  document.querySelectorAll('input[name="theme-style"]').forEach((input) => {
    input.checked = input.value === (data.settings.theme_style || 'classic');
  });
  applyBoldPresetChecks(data.settings);
  updateColorSectionsVisibility();
  renderLanguages(data.settings, data.languages);
  renderColorFields(data.settings);
  renderFlipColorFields(data.settings);
  renderLogoPreviews(data.settings);
  renderAccessSettings(data.settings);
}

function collectFormValues() {
  const logoModeInput = document.querySelector('input[name="logo-mode"]:checked');
  const themeStyleInput = document.querySelector('input[name="theme-style"]:checked');
  const boldAccentInput = document.querySelector('input[name="bold-accent"]:checked');
  const boldBackgroundInput = document.querySelector('input[name="bold-background"]:checked');
  const boldCardStyleInput = document.querySelector('input[name="bold-card-style"]:checked');
  const flipAccentInput = document.querySelector('input[name="flip-accent"]:checked');
  const values = {
    language: languageSelect.value,
    app_title: appTitleInput.value.trim(),
    sound_enabled: soundEnabledInput.checked ? '1' : '0',
    logo_mode: logoModeInput ? logoModeInput.value : 'none',
    theme_style: themeStyleInput ? themeStyleInput.value : 'classic',
    bold_accent: boldAccentInput ? boldAccentInput.value : 'green',
    bold_background: boldBackgroundInput ? boldBackgroundInput.value : 'dark',
    bold_card_style: boldCardStyleInput ? boldCardStyleInput.value : 'classic',
    flip_accent: flipAccentInput ? flipAccentInput.value : 'amber',
  };
  document.querySelectorAll('.color-field__hex').forEach((input) => {
    values[input.dataset.settingKey] = input.value;
  });
  return values;
}

function showStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    if (statusEl.textContent === message) statusEl.textContent = '';
  }, 3000);
}

saveBtn.addEventListener('click', async () => {
  const values = collectFormValues();
  const response = await fetch('/api/settings.php', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  const data = await response.json();
  currentSettings = data.settings;
  renderColorFields(data.settings);
  renderFlipColorFields(data.settings);
  renderLogoPreviews(data.settings);
  showStatus(window.t('settings.savedStatus'));
});

resetBtn.addEventListener('click', async () => {
  const confirmed = window.confirm(window.t('settings.resetConfirm'));
  if (!confirmed) return;

  const response = await fetch('/api/settings.php', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset: true }),
  });
  const data = await response.json();
  currentSettings = data.settings;
  appTitleInput.value = data.settings.app_title || '';
  soundEnabledInput.checked = data.settings.sound_enabled !== '0';
  document.querySelectorAll('input[name="theme-style"]').forEach((input) => {
    input.checked = input.value === (data.settings.theme_style || 'classic');
  });
  applyBoldPresetChecks(data.settings);
  updateColorSectionsVisibility();
  renderLanguages(data.settings, data.languages);
  renderColorFields(data.settings);
  renderFlipColorFields(data.settings);
  renderLogoPreviews(data.settings);
  renderAccessSettings(data.settings);
  showStatus(window.t('settings.resetStatus'));
});

const accessEnabledInput = document.getElementById('access-enabled-input');
const accessPasswordInput = document.getElementById('access-password-input');
const accessPasswordConfirmInput = document.getElementById('access-password-confirm-input');
const accessPasswordStatus = document.getElementById('access-password-status');
const accessSaveBtn = document.getElementById('access-save-btn');
const accessStatusEl = document.getElementById('access-status');

function renderAccessSettings(settings) {
  accessEnabledInput.checked = settings.access_enabled === '1';
  accessPasswordStatus.hidden = settings.access_password_set === '1';
}

function showAccessStatus(message) {
  accessStatusEl.textContent = message;
  setTimeout(() => {
    if (accessStatusEl.textContent === message) accessStatusEl.textContent = '';
  }, 3000);
}

accessSaveBtn.addEventListener('click', async () => {
  const password = accessPasswordInput.value;
  const confirmPassword = accessPasswordConfirmInput.value;

  if (password !== confirmPassword) {
    showAccessStatus(window.t('settings.access.mismatchError'));
    return;
  }

  if (password !== '' && password.length < 8) {
    showAccessStatus(window.t('settings.access.tooShortError'));
    return;
  }

  const values = { access_enabled: accessEnabledInput.checked ? '1' : '0' };
  if (password !== '') {
    values.new_password = password;
  }

  const response = await fetch('/api/settings.php', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  const data = await response.json();

  if (!response.ok) {
    showAccessStatus(data.error || window.t('settings.access.saveFailed'));
    return;
  }

  currentSettings = data.settings;
  renderAccessSettings(data.settings);
  accessPasswordInput.value = '';
  accessPasswordConfirmInput.value = '';
  showAccessStatus(window.t('settings.savedStatus'));
});

const backupFileInput = document.getElementById('backup-file-input');
const backupImportRevealBtn = document.getElementById('backup-import-reveal-btn');
const backupImportConfirm = document.getElementById('backup-import-confirm');
const backupConfirmInput = document.getElementById('backup-confirm-input');
const backupImportSubmitBtn = document.getElementById('backup-import-submit-btn');
const backupImportCancelBtn = document.getElementById('backup-import-cancel-btn');
const backupStatusEl = document.getElementById('backup-status');

const BACKUP_CONFIRM_PHRASE = 'ERSETZEN';

function showBackupStatus(message) {
  backupStatusEl.textContent = message;
}

function resetBackupImportConfirm() {
  backupImportConfirm.hidden = true;
  backupConfirmInput.value = '';
  backupImportSubmitBtn.disabled = true;
}

backupImportRevealBtn.addEventListener('click', () => {
  if (!backupFileInput.files[0]) {
    showBackupStatus(window.t('settings.backup.noFileSelected'));
    return;
  }
  backupImportConfirm.hidden = false;
  backupConfirmInput.focus();
});

backupImportCancelBtn.addEventListener('click', () => {
  resetBackupImportConfirm();
});

backupConfirmInput.addEventListener('input', () => {
  backupImportSubmitBtn.disabled = backupConfirmInput.value !== BACKUP_CONFIRM_PHRASE;
});

backupImportSubmitBtn.addEventListener('click', async () => {
  const file = backupFileInput.files[0];
  if (!file) {
    showBackupStatus(window.t('settings.backup.noFileSelected'));
    return;
  }

  const confirmed = window.confirm(window.t('settings.backup.finalConfirm'));
  if (!confirmed) return;

  backupImportSubmitBtn.disabled = true;
  showBackupStatus(window.t('settings.backup.importInProgress'));

  const formData = new FormData();
  formData.append('backup', file);
  formData.append('confirm', backupConfirmInput.value);

  try {
    const response = await fetch('api/backup.php', { method: 'POST', body: formData });
    const data = await response.json();

    if (!response.ok) {
      showBackupStatus(data.error || window.t('settings.backup.importFailed'));
      backupImportSubmitBtn.disabled = false;
      return;
    }

    showBackupStatus(window.t('settings.backup.importSuccess', { games: data.games, players: data.players }));
    resetBackupImportConfirm();
    backupFileInput.value = '';
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    showBackupStatus(window.t('settings.backup.importFailed'));
    backupImportSubmitBtn.disabled = false;
  }
});

window.scoreboardI18nReady.then(loadSettings);
