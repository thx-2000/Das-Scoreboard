/**
 * Spielergruppen-Verwaltung (players.php): Gruppen anlegen, umbenennen,
 * Mitglieder bearbeiten, (de)aktivieren und loeschen. Eine Person kann in
 * mehreren Gruppen sein - Mitgliedschaft ist eine reine n:m-Zuordnung
 * (siehe api/player-groups.php), unabhaengig vom Aktiv-Status der Gruppe
 * selbst. Aktive Gruppen erscheinen als Auswahl-Chips beim Spiel-Einrichten
 * (js/group-picker.js).
 */
const addGroupForm = document.getElementById('add-group-form');
const newGroupNameInput = document.getElementById('new-group-name');
const newGroupMembers = document.getElementById('new-group-members');
const addGroupError = document.getElementById('add-group-error');
const activeGroupList = document.getElementById('active-group-list');
const inactiveGroupList = document.getElementById('inactive-group-list');

let knownActivePlayers = [];
const newGroupSelectedIds = new Set();

function showGroupError(message) {
  addGroupError.textContent = message;
  addGroupError.hidden = false;
}

function clearGroupError() {
  addGroupError.hidden = true;
  addGroupError.textContent = '';
}

function renderMemberCheckbox(player, index, selectedIds) {
  const label = document.createElement('label');
  label.className = 'player-chip';
  label.dataset.playerColor = (index % 4) + 1;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = player.id;
  checkbox.checked = selectedIds.has(player.id);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      selectedIds.add(player.id);
      label.classList.add('player-chip--checked');
    } else {
      selectedIds.delete(player.id);
      label.classList.remove('player-chip--checked');
    }
  });

  if (checkbox.checked) label.classList.add('player-chip--checked');

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(player.name));
  return label;
}

function renderNewGroupMembers() {
  newGroupMembers.innerHTML = '';
  knownActivePlayers.forEach((player, index) => {
    newGroupMembers.appendChild(renderMemberCheckbox(player, index, newGroupSelectedIds));
  });
}

function memberPreviewHtml(group) {
  if (group.players.length === 0) {
    return `<span>${window.t('groups.empty')}</span>`;
  }
  return group.players.map((player) => {
    const avatar = player.avatarExt
      ? `<img src="/api/player-avatar.php?id=${player.id}" alt="" class="group-member-preview__avatar">`
      : '';
    return `<span class="group-member-preview__item">${avatar}${window.escapeHtml(player.name)}</span>`;
  }).join('');
}

async function loadGroups() {
  const playersResponse = await fetch('/api/players.php');
  knownActivePlayers = await playersResponse.json();
  renderNewGroupMembers();

  const response = await fetch('/api/player-groups.php');
  const groups = await response.json();
  renderGroups(groups);
}

async function updateGroup(id, patch) {
  await fetch(`/api/player-groups.php?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  loadGroups();
}

async function deleteGroup(id, name) {
  const confirmed = window.confirm(window.t('groups.deleteConfirm', { name }));
  if (!confirmed) return;

  await fetch(`/api/player-groups.php?id=${id}`, { method: 'DELETE' });
  loadGroups();
}

function buildEditForm(container, group) {
  container.innerHTML = '';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = group.name;
  nameInput.maxLength = 40;

  const memberIds = new Set(group.playerIds);
  const membersWrap = document.createElement('div');
  membersWrap.className = 'player-picker';
  knownActivePlayers.forEach((player, index) => {
    membersWrap.appendChild(renderMemberCheckbox(player, index, memberIds));
  });

  const actions = document.createElement('div');
  actions.className = 'group-list__edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn--small btn--primary';
  saveBtn.textContent = window.t('groups.saveButton');
  saveBtn.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    if (!newName) return;
    updateGroup(group.id, { name: newName, playerIds: Array.from(memberIds) });
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn--small btn--ghost';
  cancelBtn.textContent = window.t('groups.cancelButton');
  cancelBtn.addEventListener('click', () => {
    container.hidden = true;
    container.innerHTML = '';
  });

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  container.appendChild(nameInput);
  container.appendChild(membersWrap);
  container.appendChild(actions);
}

function renderGroupRow(group) {
  const li = document.createElement('li');
  li.className = 'group-list__item';

  const header = document.createElement('div');
  header.className = 'group-list__header';

  const name = document.createElement('div');
  name.className = 'group-list__name';
  name.textContent = group.name;
  header.appendChild(name);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '0.4rem';

  const editArea = document.createElement('div');
  editArea.className = 'group-list__edit';
  editArea.hidden = true;

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn--small btn--ghost';
  editBtn.textContent = window.t('groups.editButton');
  editBtn.addEventListener('click', () => {
    editArea.hidden = !editArea.hidden;
    if (!editArea.hidden) buildEditForm(editArea, group);
  });

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn btn--small ' + (group.active ? 'btn--ghost' : 'btn--primary');
  toggleBtn.textContent = group.active ? window.t('common.buttons.remove') : window.t('common.buttons.reactivate');
  toggleBtn.addEventListener('click', () => updateGroup(group.id, { active: !group.active }));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn--small btn--danger';
  deleteBtn.textContent = window.t('common.buttons.delete');
  deleteBtn.addEventListener('click', () => deleteGroup(group.id, group.name));

  actions.appendChild(editBtn);
  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);
  header.appendChild(actions);

  const preview = document.createElement('div');
  preview.className = 'group-member-preview';
  preview.innerHTML = memberPreviewHtml(group);

  li.appendChild(header);
  li.appendChild(preview);
  li.appendChild(editArea);
  return li;
}

function renderGroups(groups) {
  activeGroupList.innerHTML = '';
  inactiveGroupList.innerHTML = '';

  groups.forEach((group) => {
    const li = renderGroupRow(group);
    (group.active ? activeGroupList : inactiveGroupList).appendChild(li);
  });

  if (activeGroupList.children.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = window.t('groups.active.empty');
    empty.style.color = 'var(--color-text-muted)';
    activeGroupList.appendChild(empty);
  }
  if (inactiveGroupList.children.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = window.t('groups.inactive.empty');
    empty.style.color = 'var(--color-text-muted)';
    inactiveGroupList.appendChild(empty);
  }
}

addGroupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearGroupError();

  const name = newGroupNameInput.value.trim();
  if (!name) return;

  const response = await fetch('/api/player-groups.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, playerIds: Array.from(newGroupSelectedIds) }),
  });

  if (!response.ok) {
    const data = await response.json();
    showGroupError(data.error || window.t('groups.createFailed'));
    return;
  }

  newGroupNameInput.value = '';
  newGroupSelectedIds.clear();
  loadGroups();
});

window.scoreboardI18nReady.then(loadGroups);
