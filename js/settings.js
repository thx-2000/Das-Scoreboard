const appTitleInput = document.getElementById('app-title-input');
document.getElementById('title-form').addEventListener('submit', (event) => event.preventDefault());

const languageSelect = document.getElementById('language-select');
const singleColorFields = document.getElementById('single-color-fields');
const themePairFields = document.getElementById('theme-pair-fields');
const saveBtn = document.getElementById('save-settings-btn');
const resetBtn = document.getElementById('reset-settings-btn');
const statusEl = document.getElementById('settings-status');

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
  renderLanguages(data.settings, data.languages);
  renderColorFields(data.settings);
  renderLogoPreviews(data.settings);
}

function collectFormValues() {
  const logoModeInput = document.querySelector('input[name="logo-mode"]:checked');
  const values = {
    language: languageSelect.value,
    app_title: appTitleInput.value.trim(),
    logo_mode: logoModeInput ? logoModeInput.value : 'none',
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
  renderLanguages(data.settings, data.languages);
  renderColorFields(data.settings);
  renderLogoPreviews(data.settings);
  showStatus(window.t('settings.resetStatus'));
});

window.scoreboardI18nReady.then(loadSettings);
