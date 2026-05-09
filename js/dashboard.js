/* ============================================================
   dashboard.js — Main Hub Logic
   ============================================================ */

if (!requireAuth()) throw new Error('Redirecting...');

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  renderUsername(user.username || 'Dreamer');
  renderBalance(user.balance || 0);
  refreshBalance().then(bal => {
    if (bal !== null) renderBalance(bal);
  });
});

function renderUsername(name) {
  const el = document.getElementById('username-display');
  if (el) el.textContent = name;
}

function renderBalance(amount) {
  const el = document.getElementById('balance-display');
  if (el) el.textContent = formatBalance(amount);

  const navEl = document.getElementById('nav-balance-val');
  if (navEl) navEl.textContent = formatBalance(amount);
}

/* ── Daily Bonus ── */
const bonusBtn = document.getElementById('bonus-btn');
bonusBtn.addEventListener('click', claimBonus);

async function claimBonus() {
  bonusBtn.disabled = true;
  bonusBtn.innerHTML = '<span class="loader"></span> Claiming...';

  try {
    const data = await api.post('/api/wallet/bonus', {});
    const amount = data.amount || data.bonus || data.coins || 0;

    // Update balance
    const newBalance = data.balance || data.newBalance;
    if (newBalance !== undefined) {
      renderBalance(newBalance);
      const user = getUser();
      user.balance = newBalance;
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      await refreshBalance().then(b => { if (b) renderBalance(b); });
    }

    showSuccess('bonus-msg', `✦ Bonus claimed! +₪${formatBalance(amount)}`);

    // Particle burst from button
    const rect = bonusBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    particleBurst(cx, cy, 25, '💰');
    particleBurst(cx, cy, 10, '✨');

    // Hide badge after claim
    const badge = document.getElementById('bonus-badge');
    if (badge) badge.style.display = 'none';

    bonusBtn.textContent = '✓ Bonus Claimed';
    setTimeout(() => {
      bonusBtn.textContent = '✦ Claim Daily Bonus';
      bonusBtn.disabled = false;
    }, 5000);

  } catch (err) {
    showError('bonus-msg', err.message || 'Bonus unavailable. Try again later.');
    bonusBtn.disabled = false;
    bonusBtn.textContent = '✦ Claim Daily Bonus';
  }
}