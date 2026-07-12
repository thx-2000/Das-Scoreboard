const languageSelect = document.getElementById('language-select');
const singleColorFields = document.getElementById('single-color-fields');
const themePairFields = document.getElementById('theme-pair-fields');
const saveBtn = document.getElementById('save-settings-btn');
const resetBtn = document.getElementById('reset-settings-btn');
const statusEl = document.getElementById('settings-status');

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

async function loadSettings() {
  const response = await fetch('/api/settings.php');
  const data = await response.json();
  currentSettings = data.settings;
  renderLanguages(data.settings, data.languages);
  renderColorFields(data.settings);
}

function collectFormValues() {
  const values = { language: languageSelect.value };
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
  renderLanguages(data.settings, data.languages);
  renderColorFields(data.settings);
  showStatus(window.t('settings.resetStatus'));
});

window.scoreboardI18nReady.then(loadSettings);
