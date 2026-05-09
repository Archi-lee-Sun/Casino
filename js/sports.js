/* ============================================================
   sports.js — Sports Betting Logic
   Lucid Fever Dream Casino
   ============================================================ */

// Auth guard
if (!isLoggedIn()) {
  window.location.href = 'index.html';
}

// ---- State ----
let currentBalance = 0;
let currentBet = {
  matchId: null,
  matchApiId: null,
  homeTeam: '',
  awayTeam: '',
  outcome: '',
  odds: 0,
};

const TEAM_EMOJIS = [
  '⚽', '🏟️', '🦁', '🐯', '🦅', '🐉', '⭐', '🔥',
  '🌊', '🏆', '🎯', '🦊', '🐺', '🦋', '🌙', '☀️',
];

function getTeamEmoji(teamName) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) % TEAM_EMOJIS.length;
  }
  return TEAM_EMOJIS[Math.abs(hash)];
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadBalance();
  await loadMatches();
  initModal();
});

// ---- Balance ----
async function loadBalance() {
  try {
    const data = await apiRequest('GET', '/api/wallet/balance');
    currentBalance = data.balance ?? data.Balance ?? 0;
    document.getElementById('balanceDisplay').textContent = `$${Number(currentBalance).toFixed(2)}`;
  } catch (err) {
    console.error('Balance load failed:', err);
  }
}

// ---- Matches ----
async function loadMatches() {
  const grid = document.getElementById('matchesGrid');
  try {
    const data = await apiRequest('GET', '/api/sports/matches');
    const matches = Array.isArray(data) ? data : data.matches ?? [];

    if (!matches.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No fixtures found in the void.</p>
        </div>`;
      return;
    }

    grid.innerHTML = '';
    matches.forEach((match, index) => {
      const card = createMatchCard(match, index);
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Matches load failed:', err);
    grid.innerHTML = `
      <div class="loading-state">
        <p style="color:#e63946;">Failed to load fixtures. The oracle is silent.</p>
      </div>`;
  }
}

function createMatchCard(match, index) {
  const card = document.createElement('div');
  card.className = 'match-card';
  card.style.animationDelay = `${index * 0.08}s`;

  const homeTeam = match.homeTeam || match.home_team || match.home || 'Home Team';
  const awayTeam = match.awayTeam || match.away_team || match.away || 'Away Team';
  const matchId = match.id || match._id || match.apiMatchId || index;
  const apiMatchId = match.apiMatchId || match.api_match_id || match.id || matchId;
  const league = match.league || match.competition || match.leagueName || 'League';
  const status = match.status || 'upcoming';
  const date = match.date || match.startTime || match.kickoff || match.datetime;

  const homeOdds = match.homeOdds || match.odds?.home || generateOdds('home');
  const drawOdds = match.drawOdds || match.odds?.draw || generateOdds('draw');
  const awayOdds = match.awayOdds || match.odds?.away || generateOdds('away');

  const formattedDate = formatMatchDate(date);
  const statusClass = status === 'LIVE' || status === 'live' || status === 'in_play'
    ? 'status-live' : 'status-upcoming';
  const statusLabel = status === 'LIVE' || status === 'live' || status === 'in_play'
    ? '● Live' : 'Upcoming';

  const homeScore = match.homeScore ?? match.score?.home ?? '';
  const awayScore = match.awayScore ?? match.score?.away ?? '';
  const scoreDisplay = (homeScore !== '' && awayScore !== '')
    ? `${homeScore} — ${awayScore}` : 'vs';

  card.innerHTML = `
    <div class="match-card-inner">
      <div class="match-meta">
        <span class="match-league">${escapeHtml(league)}</span>
        <span class="match-date">${formattedDate}</span>
        <span class="match-status ${statusClass}">${statusLabel}</span>
      </div>

      <div class="match-teams">
        <div class="team-block">
          <div class="team-crest">${getTeamEmoji(homeTeam)}</div>
          <div class="team-name">${escapeHtml(homeTeam)}</div>
        </div>
        <div class="vs-divider">
          <span class="vs-text">${scoreDisplay !== 'vs' ? '' : 'vs'}</span>
          <span class="vs-score">${scoreDisplay}</span>
        </div>
        <div class="team-block">
          <div class="team-crest">${getTeamEmoji(awayTeam)}</div>
          <div class="team-name">${escapeHtml(awayTeam)}</div>
        </div>
      </div>

      <div class="match-odds">
        <button class="odds-btn"
          data-match-id="${matchId}"
          data-api-match-id="${escapeHtml(String(apiMatchId))}"
          data-home="${escapeHtml(homeTeam)}"
          data-away="${escapeHtml(awayTeam)}"
          data-outcome="home"
          data-odds="${homeOdds}">
          <span class="odds-outcome">Home</span>
          <span class="odds-value">${homeOdds}</span>
        </button>
        <button class="odds-btn"
          data-match-id="${matchId}"
          data-api-match-id="${escapeHtml(String(apiMatchId))}"
          data-home="${escapeHtml(homeTeam)}"
          data-away="${escapeHtml(awayTeam)}"
          data-outcome="draw"
          data-odds="${drawOdds}">
          <span class="odds-outcome">Draw</span>
          <span class="odds-value">${drawOdds}</span>
        </button>
        <button class="odds-btn"
          data-match-id="${matchId}"
          data-api-match-id="${escapeHtml(String(apiMatchId))}"
          data-home="${escapeHtml(homeTeam)}"
          data-away="${escapeHtml(awayTeam)}"
          data-outcome="away"
          data-odds="${awayOdds}">
          <span class="odds-outcome">Away</span>
          <span class="odds-value">${awayOdds}</span>
        </button>
      </div>
    </div>
  `;

  card.querySelectorAll('.odds-btn').forEach(btn => {
    btn.addEventListener('click', () => openBetModal(btn));
  });

  return card;
}

// ---- Odds generation (fallback if API doesn't provide) ----
function generateOdds(type) {
  if (type === 'home') return (1.4 + Math.random() * 1.8).toFixed(2);
  if (type === 'draw') return (2.8 + Math.random() * 1.2).toFixed(2);
  if (type === 'away') return (1.6 + Math.random() * 2.2).toFixed(2);
}

// ---- Date formatting ----
function formatMatchDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr).slice(0, 16);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ---- Modal ----
function initModal() {
  const modal = document.getElementById('betModal');
  const closeBtn = document.getElementById('modalClose');
  const amountInput = document.getElementById('betAmountInput');
  const confirmBtn = document.getElementById('confirmBetBtn');

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Quick amount buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      amountInput.value = btn.dataset.amount;
      updatePayoutPreview();
    });
  });

  amountInput.addEventListener('input', updatePayoutPreview);

  confirmBtn.addEventListener('click', handlePlaceBet);
}

function openBetModal(btn) {
  currentBet = {
    matchId: btn.dataset.matchId,
    matchApiId: btn.dataset.apiMatchId,
    homeTeam: btn.dataset.home,
    awayTeam: btn.dataset.away,
    outcome: btn.dataset.outcome,
    odds: parseFloat(btn.dataset.odds),
  };

  const outcomeLabel = currentBet.outcome === 'home'
    ? `${currentBet.homeTeam} Win`
    : currentBet.outcome === 'away'
    ? `${currentBet.awayTeam} Win`
    : 'Draw';

  document.getElementById('modalTeams').textContent =
    `${currentBet.homeTeam} vs ${currentBet.awayTeam}`;
  document.getElementById('modalSelection').textContent = outcomeLabel;
  document.getElementById('modalOdds').textContent = currentBet.odds.toFixed(2);
  document.getElementById('betAmountInput').value = 100;
  document.getElementById('modalError').style.display = 'none';

  updatePayoutPreview();

  document.getElementById('betModal').classList.add('open');
}

function closeModal() {
  document.getElementById('betModal').classList.remove('open');
}

function updatePayoutPreview() {
  const amount = parseFloat(document.getElementById('betAmountInput').value) || 0;
  const payout = (amount * currentBet.odds).toFixed(2);
  document.getElementById('payoutPreview').textContent = `$${payout}`;
}

async function handlePlaceBet() {
  const amountInput = document.getElementById('betAmountInput');
  const confirmBtn = document.getElementById('confirmBetBtn');
  const errorDiv = document.getElementById('modalError');
  const amount = parseFloat(amountInput.value);

  errorDiv.style.display = 'none';

  if (!amount || amount < 10) {
    showModalError('Minimum wager is $10.');
    return;
  }

  if (amount > currentBalance) {
    showModalError('Insufficient balance for this wager.');
    return;
  }

  confirmBtn.disabled = true;
  document.getElementById('confirmBtnText').textContent = 'Placing...';

  try {
    const result = await apiRequest('POST', '/api/sports/bet', {
      apiMatchId: currentBet.matchApiId,
      outcome: currentBet.outcome,
      amount: amount,
    });

    currentBalance = result.balance ?? result.newBalance ?? (currentBalance - amount);
    document.getElementById('balanceDisplay').textContent = `$${Number(currentBalance).toFixed(2)}`;

    closeModal();
    showNotification(`Bet placed! $${amount} on ${currentBet.outcome === 'home' ? currentBet.homeTeam : currentBet.outcome === 'away' ? currentBet.awayTeam : 'Draw'}`, 'success');
  } catch (err) {
    showModalError(err.message || 'Failed to place bet. The fates are against you.');
  } finally {
    confirmBtn.disabled = false;
    document.getElementById('confirmBtnText').textContent = 'Place Bet';
  }
}

function showModalError(msg) {
  const errorDiv = document.getElementById('modalError');
  errorDiv.textContent = msg;
  errorDiv.style.display = 'block';
}

// ---- Notification ----
function showNotification(msg, type = 'success') {
  const notif = document.getElementById('betNotification');
  const inner = document.getElementById('notificationInner');
  inner.className = `notification-inner ${type}`;
  inner.textContent = msg;
  notif.style.display = 'block';
  setTimeout(() => {
    notif.style.display = 'none';
  }, 4000);
}

// ---- Utility ----
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}