/* ============================================================
   api.js — Shared fetch wrapper for Lucid Fever Dream Casino
   ============================================================ */

const API_BASE = 'http://localhost:3000';

/**
 * Get JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  return !!getToken();
}

/**
 * Log out the user (remove token, redirect to login)
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/index.html';
}

/**
 * Auth guard — call at top of every protected page
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/index.html';
    return false;
  }
  return true;
}

/**
 * Get stored user object
 */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

/**
 * Core API request wrapper
 * @param {string} method  HTTP verb
 * @param {string} endpoint  e.g. '/api/auth/login'
 * @param {object|null} body  JSON payload (optional)
 * @returns {Promise<object>}  Parsed JSON response
 */
async function apiRequest(method, endpoint, body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: method.toUpperCase(),
    headers,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: 'Invalid server response' };
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

/* ── Convenience shorthands ── */
const api = {
  get:    (endpoint)       => apiRequest('GET',    endpoint),
  post:   (endpoint, body) => apiRequest('POST',   endpoint, body),
  put:    (endpoint, body) => apiRequest('PUT',    endpoint, body),
  delete: (endpoint)       => apiRequest('DELETE', endpoint),
};

/**
 * Show error message in an element
 */
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('success-msg', 'visible');
  el.classList.add('error-msg', 'visible');
  setTimeout(() => el.classList.remove('visible'), 4000);
}

/**
 * Show success message in an element
 */
function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('error-msg', 'visible');
  el.classList.add('success-msg', 'visible');
  setTimeout(() => el.classList.remove('visible'), 4000);
}

/**
 * Format balance for display
 */
function formatBalance(amount) {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Update all balance displays on the page
 */
function updateBalanceDisplay(balance) {
  document.querySelectorAll('[data-balance]').forEach(el => {
    el.textContent = formatBalance(balance);
  });
}

/**
 * Fetch current balance and update displays
 */
async function refreshBalance() {
  try {
    const data = await api.get('/api/wallet/balance');
    const balance = data.balance ?? data.amount ?? 0;
    updateBalanceDisplay(balance);
    const user = getUser();
    user.balance = balance;
    localStorage.setItem('user', JSON.stringify(user));
    return balance;
  } catch (e) {
    console.warn('Balance refresh failed:', e.message);
    return null;
  }
}

/**
 * Particle burst animation at a given position
 */
function particleBurst(x, y, count = 20, emoji = '💰') {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emoji;

    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 80 + Math.random() * 160;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 60;

    p.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      --dx: ${dx}px;
      --dy: ${dy}px;
      animation-duration: ${1 + Math.random() * 0.8}s;
      animation-delay: ${Math.random() * 0.3}s;
      font-size: ${0.8 + Math.random() * 1}rem;
    `;

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}

/**
 * Set up nav balance from stored user
 */
function initNavBalance() {
  const user = getUser();
  const el = document.getElementById('nav-balance');
  if (el && user.balance !== undefined) {
    el.textContent = `₪ ${formatBalance(user.balance)}`;
    el.setAttribute('data-balance', '');
  }
  refreshBalance().then(b => {
    if (b !== null && el) {
      el.textContent = `₪ ${formatBalance(b)}`;
    }
  });
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}