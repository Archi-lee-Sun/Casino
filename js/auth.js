/* ============================================================
   auth.js — Login / Register Logic
   ============================================================ */

/* Redirect if already logged in */
if (isLoggedIn()) {
  window.location.href = '/pages/dashboard.html';
}

/* ── Rotating Quotes ── */
const QUOTES = [
  { text: "The dream is the small hidden door in the deepest and most intimate sanctum of the soul.", author: "C.G. Jung" },
  { text: "Reality is merely an illusion, albeit a very persistent one.", author: "Albert Einstein" },
  { text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", author: "Albert Camus" },
  { text: "We're all mad here. I'm mad. You're mad. You must be, or you wouldn't have come here.", author: "Lewis Carroll" },
  { text: "Fortune favors the bold.", author: "Virgil" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Every exit is an entry somewhere else.", author: "Tom Stoppard" },
  { text: "The gambler knows that the only way to win is to keep playing.", author: "Anonymous" },
];

let currentQuote = 0;
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');

function rotateQuote() {
  quoteText.classList.remove('visible');

  setTimeout(() => {
    currentQuote = (currentQuote + 1) % QUOTES.length;
    const q = QUOTES[currentQuote];
    quoteText.textContent = `"${q.text}"`;
    quoteAuthor.textContent = `— ${q.author}`;
    quoteText.classList.add('visible');
  }, 1000);
}

// Show first quote
setTimeout(() => quoteText.classList.add('visible'), 200);
setInterval(rotateQuote, 6000);

/* ── Tab Switching ── */
function switchTab(tab) {
  const loginPanel    = document.getElementById('panel-login');
  const registerPanel = document.getElementById('panel-register');
  const loginTab      = document.getElementById('tab-login');
  const registerTab   = document.getElementById('tab-register');

  if (tab === 'login') {
    loginPanel.classList.add('active');
    registerPanel.classList.remove('active');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    registerPanel.classList.add('active');
    loginPanel.classList.remove('active');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  }
}

/* ── Login ── */
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showError('login-error', 'Please fill in all fields.');
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span> Entering...';

  try {
    const data = await api.post('/api/auth/login', { email, password });

    if (data.token) {
      localStorage.setItem('token', data.token);
      // Store user info
      const user = data.user || {};
      user.balance = user.balance ?? 0;
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/pages/dashboard.html';
    } else {
      showError('login-error', 'Login failed. Please try again.');
    }
  } catch (err) {
    showError('login-error', err.message || 'Login failed. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enter the Dream';
  }
}

/* ── Register ── */
document.getElementById('register-btn').addEventListener('click', handleRegister);

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !email || !password) {
    showError('register-error', 'Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showError('register-error', 'Password must be at least 6 characters.');
    return;
  }

  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span> Creating...';

  try {
    const data = await api.post('/api/auth/register', { username, email, password });

    if (data.token) {
      localStorage.setItem('token', data.token);
      const user = data.user || { username };
      user.balance = user.balance ?? 1000;
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/pages/dashboard.html';
    } else {
      // Registration success, ask to log in
      showSuccess('register-success', 'Account created! Please sign in.');
      switchTab('login');
    }
  } catch (err) {
    showError('register-error', err.message || 'Registration failed. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Begin the Journey';
  }
}