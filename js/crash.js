/* ============================================================
   crash.js — Crash Game Logic with WebSocket
   ============================================================ */

if (!requireAuth()) throw new Error('Redirecting...');

/* ── State ── */
let gameState   = 'waiting';
let currentMultiplier = 1.00;
let myBetAmount = 0;
let hasBet      = false;
let hasCashedOut = false;
let ws          = null;
let graphProgress = 0; // 0–100

/* ── UI Elements ── */
const multiplierDisplay = document.getElementById('multiplier-display');
const stateBadge        = document.getElementById('state-badge');
const countdown         = document.getElementById('crash-countdown');
const placeBetBtn       = document.getElementById('place-bet-btn');
const cashoutBtn        = document.getElementById('cashout-btn');
const myBetDisplay      = document.getElementById('my-bet-display');
const potentialDisplay  = document.getElementById('potential-display');
const cashoutPotential  = document.getElementById('cashout-potential');
const lastResultDisplay = document.getElementById('last-result-display');
const graphLine         = document.getElementById('graph-line');
const graphFill         = document.getElementById('graph-fill');
const graphDot          = document.getElementById('graph-dot');
const crashGraph        = document.getElementById('crash-graph');

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initNavBalance();
  refreshBalance().then(b => { if (b) updateBalanceDisplay(b); });
  connectWebSocket();

  placeBetBtn.addEventListener('click', handlePlaceBet);
  cashoutBtn.addEventListener('click', handleCashout);
});

/* ── WebSocket ── */
function connectWebSocket() {
  try {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_crash' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
      } catch (e) {
        console.warn('WS parse error:', e);
      }
    };

    ws.onerror = () => {
      console.warn('WebSocket error — game may be in demo mode');
      startDemoMode();
    };

    ws.onclose = () => {
      console.log('WS closed, reconnecting in 3s...');
      setTimeout(connectWebSocket, 3000);
    };
  } catch (e) {
    console.warn('WebSocket unavailable, running demo mode');
    startDemoMode();
  }
}

function handleWSMessage(msg) {
  switch (msg.type) {
    case 'game_state':
      handleGameState(msg);
      break;
    case 'multiplier_update':
      handleMultiplierUpdate(msg.multiplier);
      break;
    default:
      break;
  }
}

/* ── Game State Machine ── */
function handleGameState(msg) {
  gameState = msg.state;
  resetGraphIfNeeded(msg.state);

  switch (msg.state) {
    case 'waiting':
      setStateWaiting(msg.time);
      break;
    case 'running':
      setStateRunning();
      break;
    case 'crashed':
      setStateCrashed(msg.crash_point);
      break;
  }
}

function setStateWaiting(timeMs) {
  gameState = 'waiting';
  currentMultiplier = 1.00;
  graphProgress = 0;
  hasBet = false;
  hasCashedOut = false;
  myBetAmount = 0;

  setMultiplierDisplay('1.00', 'waiting');
  setBadge('WAITING', 'waiting');

  placeBetBtn.disabled = false;
  placeBetBtn.textContent = 'Place Bet';
  cashoutBtn.classList.remove('visible');

  myBetDisplay.textContent = '—';
  potentialDisplay.textContent = '—';
  cashoutPotential.textContent = '₪ —';

  // Countdown
  if (timeMs) {
    const totalSecs = Math.ceil(timeMs / 1000);
    let remaining = totalSecs;
    countdown.textContent = `Next round in ${remaining}s`;
    const timer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        countdown.textContent = 'Launching...';
      } else {
        countdown.textContent = `Next round in ${remaining}s`;
      }
    }, 1000);
  } else {
    countdown.textContent = 'Waiting for next round...';
  }

  updateGraphState(false, false);
}

function setStateRunning() {
  gameState = 'running';
  currentMultiplier = 1.00;
  graphProgress = 0;

  setMultiplierDisplay('1.00', 'running');
  setBadge('RUNNING', 'running');
  countdown.textContent = '';
  placeBetBtn.disabled = true;
  placeBetBtn.textContent = 'Round in progress';

  if (hasBet && !hasCashedOut) {
    cashoutBtn.classList.add('visible');
  }

  updateGraphState(false, false);
}

function setStateCrashed(crashPoint) {
  gameState = 'crashed';
  const cp = parseFloat(crashPoint || 0).toFixed(2);

  setMultiplierDisplay(cp, 'crashed');
  setBadge(`CRASHED @ ${cp}×`, 'crashed');
  countdown.textContent = 'Round ended.';
  cashoutBtn.classList.remove('visible');
  placeBetBtn.disabled = true;

  updateGraphState(false, true);

  // Page flash
  document.getElementById('crash-page').classList.add('crashed-overlay');
  setTimeout(() => document.getElementById('crash-page').classList.remove('crashed-overlay'), 1500);

  // Add to history
  addHistoryChip(parseFloat(cp));

  if (hasBet && !hasCashedOut) {
    lastResultDisplay.textContent = `Lost ₪${formatBalance(myBetAmount)}`;
    lastResultDisplay.style.color = 'var(--accent-red)';
    refreshBalance().then(b => { if (b) updateBalanceDisplay(b); });
  }

  hasBet = false;
  hasCashedOut = false;
}

function handleMultiplierUpdate(multiplier) {
  if (gameState !== 'running') return;
  currentMultiplier = parseFloat(multiplier);
  setMultiplierDisplay(currentMultiplier.toFixed(2), 'running');

  // Graph
  graphProgress = Math.min(100, (Math.log(currentMultiplier) / Math.log(100)) * 100);
  updateGraphProgress(graphProgress, currentMultiplier);

  // Potential payout
  if (hasBet && !hasCashedOut) {
    const potential = (myBetAmount * currentMultiplier).toFixed(2);
    potentialDisplay.textContent = `₪${formatBalance(potential)}`;
    cashoutPotential.textContent = `₪${formatBalance(potential)}`;
  }

  // Color shift based on multiplier
  colorShiftByMultiplier(currentMultiplier);
}

/* ── Display Helpers ── */
function setMultiplierDisplay(value, state) {
  multiplierDisplay.textContent = '';
  multiplierDisplay.innerHTML = `${value}<span class="multiplier-x">×</span>`;
  multiplierDisplay.className = `multiplier-display state-${state}`;
}

function setBadge(text, state) {
  stateBadge.textContent = text;
  stateBadge.className = `crash-state-badge state-${state}`;
}

function colorShiftByMultiplier(mult) {
  const hue = mult < 2   ? '120'  // green
            : mult < 5   ? '60'   // yellow
            : mult < 10  ? '30'   // orange
            :              '0';   // red

  multiplierDisplay.style.filter = mult > 5
    ? `hue-rotate(${(mult - 5) * 5}deg)`
    : '';
}

/* ── Graph Animation ── */
function updateGraphProgress(pct, multiplier) {
  graphLine.style.width = `${pct}%`;
  graphFill.style.width = `${pct}%`;

  // Curve effect: tilt the line based on multiplier
  const angle = Math.min(60, (multiplier - 1) * 8);
  graphLine.style.transform = `rotate(-${angle}deg)`;
  graphLine.style.transformOrigin = 'left bottom';
}

function updateGraphState(running, crashed) {
  if (crashed) {
    crashGraph.classList.add('crashed');
  } else {
    crashGraph.classList.remove('crashed');
  }
}

function resetGraphIfNeeded(state) {
  if (state === 'waiting') {
    graphLine.style.width = '0%';
    graphFill.style.width = '0%';
    graphLine.style.transform = 'rotate(0deg)';
    crashGraph.classList.remove('crashed');
  }
}

/* ── History Chips ── */
function addHistoryChip(multiplier) {
  const history = document.getElementById('crash-history');
  const chip = document.createElement('div');
  chip.className = 'history-chip ' + (
    multiplier < 2   ? 'chip-low' :
    multiplier < 5   ? 'chip-mid' :
    'chip-high'
  );
  chip.textContent = `${multiplier.toFixed(2)}×`;
  history.insertBefore(chip, history.firstChild);

  // Keep max 8 chips
  while (history.children.length > 8) {
    history.removeChild(history.lastChild);
  }
}

/* ── Place Bet ── */
async function handlePlaceBet() {
  if (gameState !== 'waiting') return;

  const amount = parseInt(document.getElementById('crash-bet').value);
  if (!amount || amount < 10) {
    alert('Minimum bet is ₪10');
    return;
  }

  placeBetBtn.disabled = true;
  placeBetBtn.innerHTML = '<span class="loader"></span>';

  try {
    const data = await api.post('/api/crash/bet', { amount });

    myBetAmount = amount;
    hasBet = true;
    hasCashedOut = false;

    myBetDisplay.textContent = `₪${formatBalance(amount)}`;
    potentialDisplay.textContent = `₪${formatBalance(amount)}`;
    cashoutPotential.textContent = `₪${formatBalance(amount)}`;

    placeBetBtn.textContent = '✓ Bet Placed';
    placeBetBtn.disabled = true;

    if (data.balance !== undefined) {
      updateBalanceDisplay(data.balance);
    } else {
      refreshBalance().then(b => { if (b) updateBalanceDisplay(b); });
    }

  } catch (err) {
    placeBetBtn.disabled = false;
    placeBetBtn.textContent = 'Place Bet';
    alert(err.message || 'Could not place bet. Try again.');
  }
}

/* ── Cash Out ── */
async function handleCashout() {
  if (!hasBet || hasCashedOut || gameState !== 'running') return;
  hasCashedOut = true;

  const potential = (myBetAmount * currentMultiplier).toFixed(2);

  cashoutBtn.textContent = 'Cashing out...';
  cashoutBtn.disabled = true;

  try {
    const data = await api.post('/api/crash/cashout', {});

    const payout = data.payout || data.amount || potential;
    lastResultDisplay.textContent = `Won ₪${formatBalance(payout)}`;
    lastResultDisplay.style.color = 'var(--accent-green)';

    cashoutBtn.classList.remove('visible');
    cashoutBtn.disabled = false;

    // Particle burst
    const rect = cashoutBtn.getBoundingClientRect();
    particleBurst(rect.left + rect.width / 2, rect.top, 30, '💰');

    if (data.balance !== undefined) {
      updateBalanceDisplay(data.balance);
    } else {
      refreshBalance().then(b => { if (b) updateBalanceDisplay(b); });
    }

  } catch (err) {
    hasCashedOut = false;
    cashoutBtn.disabled = false;
    cashoutBtn.textContent = 'CASH OUT';
    console.error('Cashout failed:', err.message);
  }
}

/* ── Quick Bet ── */
function setCrashBet(amount) {
  document.getElementById('crash-bet').value = amount;
}

/* ── Demo Mode (when WS unavailable) ── */
function startDemoMode() {
  console.log('Demo mode active');
  let demoMultiplier = 1.00;
  let demoRunning = false;
  let crashPoint;

  function runDemoCycle() {
    // Waiting phase
    setStateWaiting(5000);
    const waitTime = 5000;

    setTimeout(() => {
      // Running phase
      setStateRunning();
      demoMultiplier = 1.00;
      crashPoint = 1.1 + Math.random() * 8;

      const interval = setInterval(() => {
        demoMultiplier += 0.03 + demoMultiplier * 0.01;
        handleMultiplierUpdate(demoMultiplier);

        if (demoMultiplier >= crashPoint) {
          clearInterval(interval);
          setStateCrashed(crashPoint);
          setTimeout(runDemoCycle, 3000);
        }
      }, 80);
    }, waitTime);
  }

  runDemoCycle();
}