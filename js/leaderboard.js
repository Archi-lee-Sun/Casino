/* ============================================================
   leaderboard.js — Hall of Fame Logic
   Lucid Fever Dream Casino
   ============================================================ */

// Auth guard
if (!isLoggedIn()) {
  window.location.href = 'index.html';
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadLeaderboard();
});

// ---- Load Leaderboard ----
async function loadLeaderboard() {
  const content = document.getElementById('leaderboardContent');

  try {
    const data = await apiRequest('GET', '/api/leaderboard');
    const players = Array.isArray(data) ? data : data.leaderboard ?? data.players ?? [];

    if (!players.length) {
      content.innerHTML = `
        <div style="text-align:center; padding: 4rem 2rem;">
          <div style="font-family:'Playfair Display',serif; font-size:1.5rem; font-style:italic; color:rgba(245,230,211,0.25);">
            The Hall awaits its first legend.
          </div>
        </div>`;
      return;
    }

    renderLeaderboard(players);
    renderStats(players);
  } catch (err) {
    console.error('Leaderboard load failed:', err);
    content.innerHTML = `
      <div class="error-state">
        The oracle has gone silent.<br>
        <span style="opacity:0.5; font-size:0.7rem;">${err.message || 'Failed to load leaderboard'}</span>
      </div>`;
  }
}

// ---- Render Players ----
function renderLeaderboard(players) {
  const content = document.getElementById('leaderboardContent');
  const list = document.createElement('div');
  list.className = 'hall-of-fame-list';

  players.forEach((player, index) => {
    const rank = index + 1;
    const row = createPlayerRow(player, rank);
    list.appendChild(row);
  });

  content.innerHTML = '';
  content.appendChild(list);
}

function createPlayerRow(player, rank) {
  const row = document.createElement('div');

  const rankClass = rank === 1 ? 'rank-1'
    : rank === 2 ? 'rank-2'
    : rank === 3 ? 'rank-3'
    : 'rank-other';

  row.className = `player-row ${rankClass}`;

  const username = player.username || player.name || player.user || `Player #${rank}`;
  const balance = player.balance ?? player.Balance ?? player.chips ?? 0;

  const medalLabel = rank === 1 ? 'Champion'
    : rank === 2 ? 'Silver'
    : rank === 3 ? 'Bronze'
    : '';

  const rankDisplay = rank <= 3
    ? `<span class="rank-number">${rank}</span>
       <span class="rank-medal">${medalLabel}</span>`
    : `<span class="rank-number">${rank}</span>`;

  const crownHtml = rank === 1
    ? `<div class="crown-decoration">👑</div>` : '';

  row.innerHTML = `
    ${crownHtml}
    <div style="text-align:center;">
      ${rankDisplay}
    </div>
    <div class="player-info">
      <div class="player-username">${escapeHtml(username)}</div>
      <div class="player-tag">Rank #${rank} · Dreamer</div>
    </div>
    <div class="player-balance">
      <span class="balance-amount">$${formatBalance(balance)}</span>
      <span class="balance-label">Balance</span>
    </div>
  `;

  return row;
}

// ---- Stats Bar ----
function renderStats(players) {
  const statsBar = document.getElementById('statsBar');

  if (!players.length) return;

  const balances = players.map(p => p.balance ?? p.Balance ?? p.chips ?? 0);
  const topBalance = Math.max(...balances);
  const avgBalance = balances.reduce((a, b) => a + b, 0) / balances.length;

  document.getElementById('totalPlayers').textContent = players.length;
  document.getElementById('topBalance').textContent = `$${formatBalance(topBalance)}`;
  document.getElementById('avgBalance').textContent = `$${formatBalance(Math.round(avgBalance))}`;

  statsBar.style.display = 'flex';
}

// ---- Utilities ----
function formatBalance(n) {
  const num = Number(n);
  if (isNaN(num)) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}