/* ============================================================
   slots.js — Psychedelic Slot Machine Logic
   ============================================================ */

if (!requireAuth()) throw new Error('Redirecting...');

/* ── State ── */
let spinning = false;
let totalSpins = 0;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initNavBalance();

  refreshBalance().then(bal => {
    if (bal !== null) updateBalanceDisplay(bal);
  });

  document.getElementById('spin-btn').addEventListener('click', handleSpin);
  document.getElementById('bet-down').addEventListener('click', () => adjustBet(-50));
  document.getElementById('bet-up').addEventListener('click', () => adjustBet(50));

  const betInput = document.getElementById('bet-amount');
  betInput.addEventListener('change', () => {
    let val = parseInt(betInput.value);
    if (isNaN(val) || val < 10) val = 10;
    if (val > 10000) val = 10000;
    betInput.value = val;
  });

  // Keyboard: Space to spin
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !spinning) {
      e.preventDefault();
      handleSpin();
    }
  });
});

function adjustBet(delta) {
  const input = document.getElementById('bet-amount');
  let val = parseInt(input.value) + delta;
  val = Math.max(10, Math.min(10000, val));
  input.value = val;
}

/* ── Spin ── */
async function handleSpin() {
  if (spinning) return;

  const betAmount = parseInt(document.getElementById('bet-amount').value);
  if (isNaN(betAmount) || betAmount < 10) {
    showResultMessage('Minimum bet is ₪10', 'lose');
    return;
  }

  spinning = true;
  totalSpins++;
  document.getElementById('total-spins-stat').textContent = totalSpins;

  const spinBtn = document.getElementById('spin-btn');
  spinBtn.disabled = true;
  spinBtn.textContent = '...';

  clearWinState();
  startReelAnimation();

  try {
    const data = await api.post('/api/slots/spin', { betAmount });
    await resolveResult(data);

  } catch (err) {
    stopReelAnimation();
    showResultMessage(err.message || 'Spin failed. Try again.', 'lose');
  } finally {
    spinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = 'SPIN';
  }
}

/* ── Reel Animation ── */
function startReelAnimation() {
  for (let r = 0; r < 3; r++) {
    const reel = document.getElementById(`reel-${r}`);
    reel.classList.add('spinning');
  }
}

function stopReelAnimation() {
  for (let r = 0; r < 3; r++) {
    const reel = document.getElementById(`reel-${r}`);
    reel.classList.remove('spinning');
  }
}

/* ── Resolve Result ── */
async function resolveResult(data) {
  // grid[reel][row] = {name, emoji}
  const { grid, iswin, winninglines, payout } = data;

  // Stagger reel stops
  for (let r = 0; r < 3; r++) {
    await delay(200 + r * 150);
    const reel = document.getElementById(`reel-${r}`);
    reel.classList.remove('spinning');

    if (grid && grid[r]) {
      renderReel(r, grid[r]);
    }
  }

  await delay(200);

  if (iswin || payout > 0) {
    handleWin(payout, winninglines);
  } else {
    handleLoss(data.betAmount);
  }

  // Refresh balance
  const newBal = data.balance ?? data.newBalance;
  if (newBal !== undefined) {
    updateBalanceDisplay(newBal);
    const user = getUser();
    user.balance = newBal;
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    refreshBalance().then(b => { if (b) updateBalanceDisplay(b); });
  }

  // Update last win stat
  if (payout > 0) {
    document.getElementById('last-win-stat').textContent = `₪${formatBalance(payout)}`;
  }
}

/* ── Render Reel ── */
function renderReel(reelIndex, reelData) {
  // reelData = array of 3 rows: [row0, row1, row2] where row1 is middle
  const inner = document.getElementById(`reel-inner-${reelIndex}`);
  inner.innerHTML = '';

  for (let row = 0; row < 3; row++) {
    const sym = reelData[row];
    const div = document.createElement('div');
    div.className = 'reel-symbol' + (row === 1 ? ' middle' : '');

    const emoji = sym?.emoji || sym?.symbol || '❓';
    const name  = sym?.name  || '';

    div.innerHTML = `
      <span>${emoji}</span>
      <span class="symbol-name">${name}</span>
    `;

    inner.appendChild(div);
  }
}

/* ── Win ── */
function handleWin(payout, winningLines) {
  const machine = document.getElementById('machine-frame');
  machine.classList.remove('losing');

  // Highlight win line
  const winLine = document.getElementById('win-line');
  winLine.classList.add('active');

  // Highlight winning reel symbols
  for (let r = 0; r < 3; r++) {
    const inner = document.getElementById(`reel-inner-${r}`);
    const middleSymbol = inner.children[1];
    if (middleSymbol) middleSymbol.classList.add('winning');
  }

  machine.classList.add('winning-flash');
  setTimeout(() => machine.classList.remove('winning-flash'), 1500);

  // Result text
  let lineText = '';
  if (winningLines && winningLines.length > 0) {
    lineText = winningLines.map(l => l.description || l.line || l).join(' · ');
  }

  showResultMessage(`✦ YOU WIN ₪${formatBalance(payout)} ✦`, 'win', lineText);

  // Coin rain
  triggerCoinRain(30);

  // Particle burst from machine center
  const machine_el = document.getElementById('machine-frame');
  const rect = machine_el.getBoundingClientRect();
  particleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20, '💰');
  particleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 10, '⭐');
}

/* ── Loss ── */
function handleLoss() {
  const machine = document.getElementById('machine-frame');
  machine.classList.remove('winning-flash');

  void machine.offsetWidth; // reflow
  machine.classList.add('losing');
  setTimeout(() => machine.classList.remove('losing'), 600);

  showResultMessage('No luck this time...', 'lose');
}

/* ── Clear Win State ── */
function clearWinState() {
  const winLine = document.getElementById('win-line');
  winLine.classList.remove('active');

  for (let r = 0; r < 3; r++) {
    const inner = document.getElementById(`reel-inner-${r}`);
    if (inner) {
      for (const child of inner.children) {
        child.classList.remove('winning');
      }
    }
  }

  document.getElementById('result-display').innerHTML =
    '<div class="result-idle" style="color: var(--text-muted); font-style: italic; font-size: 0.9rem;">Spinning...</div>';
}

/* ── Result Message ── */
function showResultMessage(msg, type, subtext = '') {
  const display = document.getElementById('result-display');
  const cls = type === 'win' ? 'result-win' : 'result-lose';

  display.innerHTML = `
    <div class="${cls}">${msg}</div>
    ${subtext ? `<div class="win-lines-display">${subtext}</div>` : ''}
  `;
}

/* ── Coin Rain ── */
function triggerCoinRain(count) {
  const container = document.getElementById('coin-rain');
  const coins = ['💰', '🪙', '⭐', '✨', '💛'];

  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = coins[Math.floor(Math.random() * coins.length)];

    const left = Math.random() * 100;
    const duration = 1.5 + Math.random() * 1.5;
    const delay_ms = Math.random() * 0.8;
    const rot = (Math.random() - 0.5) * 720;

    coin.style.cssText = `
      left: ${left}%;
      animation-duration: ${duration}s;
      animation-delay: ${delay_ms}s;
      font-size: ${1 + Math.random() * 1.5}rem;
      --rot: ${rot}deg;
    `;

    container.appendChild(coin);
    setTimeout(() => coin.remove(), (duration + delay_ms + 0.1) * 1000);
  }
}

/* ── Helpers ── */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}