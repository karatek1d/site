// ==========================================
// ESPORTAL — Auth (localStorage)
// ==========================================

const _USERS_KEY   = 'esportal_users';
const _SESSION_KEY = 'esportal_session';

// ---- Хранилище ----

function _getUsers()        { return JSON.parse(localStorage.getItem(_USERS_KEY) || '[]'); }
function _saveUsers(u)      { localStorage.setItem(_USERS_KEY, JSON.stringify(u)); }
function _getSession()      { const d = sessionStorage.getItem(_SESSION_KEY); return d ? JSON.parse(d) : null; }
function _saveSession(u)    { sessionStorage.setItem(_SESSION_KEY, JSON.stringify({ id: u.id, username: u.username, email: u.email })); }
function _clearSession()    { sessionStorage.removeItem(_SESSION_KEY); }

// Простой хеш для демо-хранения паролей
function _hashPwd(pwd) {
  let h = 5381;
  for (let i = 0; i < pwd.length; i++) h = ((h << 5) + h) ^ pwd.charCodeAt(i);
  return btoa('ep' + (h >>> 0).toString(16) + pwd.length);
}

// ---- Публичное API ----

function authRegister(username, email, password) {
  username = username.trim();
  email    = email.trim().toLowerCase();
  if (username.length < 3)  return { ok: false, error: 'Имя пользователя — минимум 3 символа' };
  if (!/\S+@\S+\.\S+/.test(email)) return { ok: false, error: 'Некорректный email' };
  if (password.length < 6)  return { ok: false, error: 'Пароль — минимум 6 символов' };

  const users = _getUsers();
  if (users.find(u => u.email === email))       return { ok: false, error: 'Email уже зарегистрирован' };
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return { ok: false, error: 'Имя пользователя уже занято' };

  const user = { id: Date.now(), username, email, pwdHash: _hashPwd(password), createdAt: new Date().toISOString() };
  users.push(user);
  _saveUsers(users);
  _saveSession(user);
  return { ok: true, user };
}

function authLogin(emailOrName, password) {
  const val   = emailOrName.trim().toLowerCase();
  const users = _getUsers();
  const user  = users.find(u => u.email === val || u.username.toLowerCase() === val);
  if (!user)                         return { ok: false, error: 'Пользователь не найден' };
  if (user.pwdHash !== _hashPwd(password)) return { ok: false, error: 'Неверный пароль' };
  _saveSession(user);
  return { ok: true, user };
}

function authLogout() {
  _clearSession();
  _updateHeaderAuth();
}

function authCurrentUser() {
  return _getSession();
}

// ---- Modal ----

function _injectModal() {
  if (document.getElementById('auth-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.className = 'auth-overlay';
  overlay.innerHTML = `
    <div class="auth-modal" id="auth-modal-box">
      <button class="auth-close" onclick="closeAuthModal()">✕</button>
      <div class="auth-modal-logo">
        <div class="logo-icon">⚡</div>
        <span class="logo-text">Espor<span>Tal</span></span>
      </div>
      <div class="auth-modal-title" id="auth-title">Вход</div>
      <div class="auth-modal-sub"  id="auth-sub">Войдите, чтобы отслеживать турниры</div>
      <div class="auth-error" id="auth-error"></div>

      <div class="auth-field" id="field-username" style="display:none">
        <label>Имя пользователя</label>
        <input type="text" id="auth-username" placeholder="nickname" autocomplete="username">
      </div>
      <div class="auth-field">
        <label>Email или имя пользователя</label>
        <input type="text" id="auth-login-id" placeholder="email / nickname" autocomplete="email">
      </div>
      <div class="auth-field" id="field-email" style="display:none">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="auth-field">
        <label>Пароль</label>
        <input type="password" id="auth-password" placeholder="••••••" autocomplete="current-password">
      </div>
      <div class="auth-field" id="field-confirm" style="display:none">
        <label>Подтвердите пароль</label>
        <input type="password" id="auth-confirm" placeholder="••••••" autocomplete="new-password">
      </div>

      <button class="auth-submit" id="auth-submit-btn" onclick="_authSubmit()">Войти</button>
      <div class="auth-switch" id="auth-switch">
        Нет аккаунта? <a onclick="openAuthModal('register')">Зарегистрироваться</a>
      </div>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) closeAuthModal(); });
  document.body.appendChild(overlay);

  // Enter key submit
  overlay.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') _authSubmit(); });
  });
}

let _authMode = 'login';

function openAuthModal(mode = 'login') {
  _injectModal();
  _authMode = mode;
  _setModalMode(mode);
  document.getElementById('auth-overlay').classList.add('open');
  setTimeout(() => {
    const first = document.querySelector('#auth-modal-box input:not([style*="display:none"])');
    if (first) first.focus();
  }, 100);
}

function closeAuthModal() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('open');
}

function _setModalMode(mode) {
  const isReg = mode === 'register';
  _show('field-username', isReg);
  _show('field-email',    isReg);
  _show('field-confirm',  isReg);

  const loginField = document.getElementById('auth-login-id').closest('.auth-field');
  loginField.style.display = isReg ? 'none' : '';

  document.getElementById('auth-title').textContent      = isReg ? 'Регистрация'    : 'Вход';
  document.getElementById('auth-sub').textContent        = isReg ? 'Создайте аккаунт EsporTal' : 'Войдите, чтобы отслеживать турниры';
  document.getElementById('auth-submit-btn').textContent = isReg ? 'Зарегистрироваться' : 'Войти';
  document.getElementById('auth-switch').innerHTML       = isReg
    ? 'Уже есть аккаунт? <a onclick="openAuthModal(\'login\')">Войти</a>'
    : 'Нет аккаунта? <a onclick="openAuthModal(\'register\')">Зарегистрироваться</a>';

  // Сбросить ошибку и поля
  _setError('');
  ['auth-username','auth-login-id','auth-email','auth-password','auth-confirm']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

function _show(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function _setError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('visible', !!msg);
}

function _authSubmit() {
  _setError('');
  if (_authMode === 'register') {
    const username = document.getElementById('auth-username').value;
    const email    = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const confirm  = document.getElementById('auth-confirm').value;
    if (password !== confirm) { _setError('Пароли не совпадают'); return; }
    const res = authRegister(username, email, password);
    if (!res.ok) { _setError(res.error); return; }
  } else {
    const loginId  = document.getElementById('auth-login-id').value;
    const password = document.getElementById('auth-password').value;
    const res = authLogin(loginId, password);
    if (!res.ok) { _setError(res.error); return; }
  }
  closeAuthModal();
  _updateHeaderAuth();
}

// ---- Шапка ----

function _updateHeaderAuth() {
  const user    = authCurrentUser();
  const wrapper = document.getElementById('auth-header-btns');
  if (!wrapper) return;

  if (user) {
    const initial = user.username[0].toUpperCase();
    wrapper.innerHTML = `
      <div class="auth-user-menu">
        <div class="auth-avatar">${initial}</div>
        <span class="auth-username">${user.username}</span>
        <button class="auth-logout" onclick="authLogout()">Выйти</button>
      </div>`;
  } else {
    wrapper.innerHTML = `
      <a href="#" class="btn btn-ghost"    onclick="openAuthModal('login');    return false;">Войти</a>
      <a href="#" class="btn btn-primary"  onclick="openAuthModal('register'); return false;">Регистрация</a>`;
  }
}

// Автоинициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', _updateHeaderAuth);
