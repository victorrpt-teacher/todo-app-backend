const state = {
  apiBase: localStorage.getItem('apiBase') || 'http://localhost:8000',
  accessToken: localStorage.getItem('accessToken') || '',
  refreshToken: localStorage.getItem('refreshToken') || '',
  tasks: [],
  diario: [],
};

const els = {
  authView: document.getElementById('auth-view'),
  dashboardView: document.getElementById('dashboard-view'),
  loginForm: document.getElementById('login-form'),
  authMessage: document.getElementById('auth-message'),
  appMessage: document.getElementById('app-message'),
  apiBase: document.getElementById('api-base'),
  apiLabel: document.getElementById('api-label'),
  logoutButton: document.getElementById('logout-button'),
  refreshButton: document.getElementById('refresh-button'),
  taskForm: document.getElementById('task-form'),
  taskUrl: document.getElementById('task-url'),
  taskDescription: document.getElementById('task-description'),
  taskCompleted: document.getElementById('task-completed'),
  taskCancel: document.getElementById('task-cancel'),
  tasksList: document.getElementById('tasks-list'),
  tasksCount: document.getElementById('tasks-count'),
  diarioForm: document.getElementById('diario-form'),
  diarioUrl: document.getElementById('diario-url'),
  diarioText: document.getElementById('diario-text'),
  diarioHighlight: document.getElementById('diario-highlight'),
  diarioCancel: document.getElementById('diario-cancel'),
  diarioList: document.getElementById('diario-list'),
  diarioCount: document.getElementById('diario-count'),
};

els.apiBase.value = state.apiBase;

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '');
}

function showMessage(target, message, type = 'error') {
  target.textContent = message;
  target.className = `message ${message ? type : ''}`;
}

function setView(isAuthenticated) {
  els.authView.classList.toggle('hidden', isAuthenticated);
  els.dashboardView.classList.toggle('hidden', !isAuthenticated);
  els.apiLabel.textContent = state.apiBase;
}

function endpoint(path) {
  return `${state.apiBase}${path}`;
}

async function refreshAccessToken() {
  if (!state.refreshToken) {
    throw new Error('Missing refresh token.');
  }

  const response = await fetch(endpoint('/api/token/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: state.refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Session expired. Sign in again.');
  }

  const data = await response.json();
  state.accessToken = data.access;
  localStorage.setItem('accessToken', data.access);
}

async function apiFetch(pathOrUrl, options = {}, allowRefresh = true) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : endpoint(pathOrUrl);
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
    Authorization: `Bearer ${state.accessToken}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && allowRefresh) {
    await refreshAccessToken();
    return apiFetch(pathOrUrl, options, false);
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`;
    try {
      const data = await response.json();
      detail = data.detail || JSON.stringify(data);
    } catch (error) {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getResults(payload) {
  return Array.isArray(payload) ? payload : payload.results || [];
}

function formatDate(value) {
  if (!value) {
    return 'No date';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function emptyState(label) {
  const node = document.createElement('p');
  node.className = 'empty-state';
  node.textContent = label;
  return node;
}

function renderTasks() {
  els.tasksList.replaceChildren();
  els.tasksCount.textContent = String(state.tasks.length);

  if (!state.tasks.length) {
    els.tasksList.append(emptyState('No tasks yet.'));
    return;
  }

  state.tasks.forEach((task) => {
    const item = document.createElement('article');
    item.className = `item-row ${task.completed ? 'is-complete' : ''}`;

    const content = document.createElement('div');
    content.className = 'item-content';

    const title = document.createElement('h3');
    title.textContent = task.description;

    const meta = document.createElement('p');
    meta.textContent = `${formatDate(task.created)} - ${task.owner || 'unknown owner'}`;

    const status = document.createElement('span');
    status.className = task.completed ? 'badge done' : 'badge';
    status.textContent = task.completed ? 'Done' : 'Open';

    content.append(title, meta, status);

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const edit = document.createElement('button');
    edit.className = 'button subtle small';
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => startTaskEdit(task));

    const remove = document.createElement('button');
    remove.className = 'button danger small';
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => deleteTask(task));

    actions.append(edit, remove);
    item.append(content, actions);
    els.tasksList.append(item);
  });
}

function renderDiario() {
  els.diarioList.replaceChildren();
  els.diarioCount.textContent = String(state.diario.length);

  if (!state.diario.length) {
    els.diarioList.append(emptyState('No diary entries yet.'));
    return;
  }

  state.diario.forEach((entry) => {
    const item = document.createElement('article');
    item.className = `item-row ${entry.highlight ? 'is-highlight' : ''}`;

    const content = document.createElement('div');
    content.className = 'item-content';

    const title = document.createElement('h3');
    title.textContent = entry.day_highlights;

    const meta = document.createElement('p');
    meta.textContent = `${formatDate(entry.created)} - ${entry.owner || 'unknown owner'}`;

    const status = document.createElement('span');
    status.className = entry.highlight ? 'badge highlight' : 'badge';
    status.textContent = entry.highlight ? 'Highlight' : 'Standard';

    content.append(title, meta, status);

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const edit = document.createElement('button');
    edit.className = 'button subtle small';
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => startDiarioEdit(entry));

    const remove = document.createElement('button');
    remove.className = 'button danger small';
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => deleteDiario(entry));

    actions.append(edit, remove);
    item.append(content, actions);
    els.diarioList.append(item);
  });
}

async function loadDashboard() {
  showMessage(els.appMessage, '');

  const [tasksPayload, diarioPayload] = await Promise.all([
    apiFetch('/tasks/'),
    apiFetch('/diario/'),
  ]);

  state.tasks = getResults(tasksPayload);
  state.diario = getResults(diarioPayload);
  renderTasks();
  renderDiario();
}

function saveSession(data) {
  state.accessToken = data.access;
  state.refreshToken = data.refresh;
  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  localStorage.setItem('apiBase', state.apiBase);
}

function clearSession() {
  state.accessToken = '';
  state.refreshToken = '';
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function handleLogin(event) {
  event.preventDefault();
  showMessage(els.authMessage, '');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  state.apiBase = normalizeBaseUrl(els.apiBase.value);

  try {
    const response = await fetch(endpoint('/api/token/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed. Check credentials.');
    }

    saveSession(data);
    setView(true);
    await loadDashboard();
  } catch (error) {
    showMessage(els.authMessage, error.message || 'Could not reach the API.');
  }
}

function resetTaskForm() {
  els.taskUrl.value = '';
  els.taskDescription.value = '';
  els.taskCompleted.checked = false;
}

function resetDiarioForm() {
  els.diarioUrl.value = '';
  els.diarioText.value = '';
  els.diarioHighlight.checked = false;
}

function startTaskEdit(task) {
  els.taskUrl.value = task.url;
  els.taskDescription.value = task.description;
  els.taskCompleted.checked = task.completed;
  els.taskDescription.focus();
}

function startDiarioEdit(entry) {
  els.diarioUrl.value = entry.url;
  els.diarioText.value = entry.day_highlights;
  els.diarioHighlight.checked = entry.highlight;
  els.diarioText.focus();
}

async function saveTask(event) {
  event.preventDefault();
  const payload = {
    description: els.taskDescription.value.trim(),
    completed: els.taskCompleted.checked,
  };

  if (!payload.description) {
    showMessage(els.appMessage, 'Task description is required.');
    return;
  }

  try {
    const url = els.taskUrl.value || '/tasks/';
    const method = els.taskUrl.value ? 'PATCH' : 'POST';
    await apiFetch(url, { method, body: JSON.stringify(payload) });
    resetTaskForm();
    await loadDashboard();
    showMessage(els.appMessage, 'Task saved.', 'success');
  } catch (error) {
    showMessage(els.appMessage, error.message);
  }
}

async function saveDiario(event) {
  event.preventDefault();
  const payload = {
    day_highlights: els.diarioText.value.trim(),
    highlight: els.diarioHighlight.checked,
  };

  if (!payload.day_highlights) {
    showMessage(els.appMessage, 'Day highlights are required.');
    return;
  }

  try {
    const url = els.diarioUrl.value || '/diario/';
    const method = els.diarioUrl.value ? 'PATCH' : 'POST';
    await apiFetch(url, { method, body: JSON.stringify(payload) });
    resetDiarioForm();
    await loadDashboard();
    showMessage(els.appMessage, 'Diary entry saved.', 'success');
  } catch (error) {
    showMessage(els.appMessage, error.message);
  }
}

async function deleteTask(task) {
  if (!window.confirm(`Delete task "${task.description}"?`)) {
    return;
  }

  try {
    await apiFetch(task.url, { method: 'DELETE' });
    await loadDashboard();
    showMessage(els.appMessage, 'Task deleted.', 'success');
  } catch (error) {
    showMessage(els.appMessage, error.message);
  }
}

async function deleteDiario(entry) {
  if (!window.confirm('Delete this diary entry?')) {
    return;
  }

  try {
    await apiFetch(entry.url, { method: 'DELETE' });
    await loadDashboard();
    showMessage(els.appMessage, 'Diary entry deleted.', 'success');
  } catch (error) {
    showMessage(els.appMessage, error.message);
  }
}

function logout() {
  clearSession();
  resetTaskForm();
  resetDiarioForm();
  setView(false);
  showMessage(els.authMessage, 'Signed out.', 'success');
}

els.loginForm.addEventListener('submit', handleLogin);
els.logoutButton.addEventListener('click', logout);
els.refreshButton.addEventListener('click', () => {
  loadDashboard().catch((error) => showMessage(els.appMessage, error.message));
});
els.taskForm.addEventListener('submit', saveTask);
els.taskCancel.addEventListener('click', resetTaskForm);
els.diarioForm.addEventListener('submit', saveDiario);
els.diarioCancel.addEventListener('click', resetDiarioForm);

if (state.accessToken && state.refreshToken) {
  setView(true);
  loadDashboard().catch((error) => {
    clearSession();
    resetTaskForm();
    resetDiarioForm();
    setView(false);
    showMessage(els.authMessage, error.message);
  });
} else {
  setView(false);
}
