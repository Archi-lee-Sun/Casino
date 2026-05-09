/* ============================================================
   history.js — Transaction History Logic
   Lucid Fever Dream Casino
   ============================================================ */

// Auth guard
if (!isLoggedIn()) {
  window.location.href = 'index.html';
}

// ---- State ----
let allTransactions = [];
let filteredTransactions = [];
let currentFilter = 'all';
const PAGE_SIZE = 20;
let currentPage = 1;

// ---- Type mappings ----
const TYPE_META = {
  win:        { icon: '✦', iconClass: 'icon-win',        label: 'Win',       positive: true  },
  payout:     { icon: '✦', iconClass: 'icon-win',        label: 'Payout',    positive: true  },
  bet:        { icon: '◆', iconClass: 'icon-bet',        label: 'Bet',       positive: false },
  spin:       { icon: '◆', iconClass: 'icon-bet',        label: 'Spin',      positive: false },
  crash_bet:  { icon: '◆', iconClass: 'icon-bet',        label: 'Crash',     positive: false },
  sports_bet: { icon: '◆', iconClass: 'icon-bet',        label: 'Sports',    positive: false },
  bonus:      { icon: '★', iconClass: 'icon-bonus',      label: 'Bonus',     positive: true  },
  daily:      { icon: '★', iconClass: 'icon-bonus',      label: 'Daily',     positive: true  },
  deposit:    { icon: '▲', iconClass: 'icon-deposit',    label: 'Deposit',   positive: true  },
  withdrawal: { icon: '▼', iconClass: 'icon-withdrawal', label: 'Withdraw',  positive: false },
  cashout:    { icon: '✦', iconClass: 'icon-win',        label: 'Cashout',   positive: true  },
};

function getTypeMeta(type) {
  if (!type) return { icon: '·', iconClass: 'icon-other', label: 'Other', positive: null };
  const key = String(type).toLowerCase().replace(/[\s-]/g, '_');
  return TYPE_META[key] || { icon: '·', iconClass: 'icon-other', label: type, positive: null };
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadTransactions();
  initFilters();
});

// ---- Load ----
async function loadTransactions() {
  const content = document.getElementById('historyContent');

  try {
    const data = await apiRequest('GET', '/api/wallet/transactions');
    allTransactions = Array.isArray(data) ? data : data.transactions ?? [];

    // Sort newest first
    allTransactions.sort((a, b) => {
      const da = new Date(a.createdAt || a.date || a.timestamp || 0);
      const db = new Date(b.createdAt || b.date || b.timestamp || 0);
      return db - da;
    });

    if (!allTransactions.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📜</div>
          <div class="empty-title">The ledger is empty.</div>
          <div class="empty-text">Your transactions will appear here.</div>
        </div>`;
      return;
    }

    renderSummary(allTransactions);
    applyFilter('all');
  } catch (err) {
    console.error('History load failed:', err);
    content.innerHTML = `
      <div class="error-msg">
        Failed to read the ledger.<br>
        <span style="opacity:0.5;">${err.message || ''}</span>
      </div>`;
  }
}

// ---- Summary ----
function renderSummary(transactions) {
  const summaryCards = document.getElementById('summaryCards');

  let totalWon = 0;
  let totalBet = 0;

  transactions.forEach(tx => {
    const meta = getTypeMeta(tx.type);
    const amount = Math.abs(Number(tx.amount || 0));
    if (meta.positive === true) totalWon += amount;
    if (meta.positive === false) totalBet += amount;
  });

  document.getElementById('totalWon').textContent = `$${formatCurrency(totalWon)}`;
  document.getElementById('totalBet').textContent = `$${formatCurrency(totalBet)}`;
  document.getElementById('txCount').textContent = transactions.length;

  summaryCards.style.display = 'grid';
  document.getElementById('filterBar').style.display = 'flex';
}

// ---- Filters ----
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      applyFilter(currentFilter);
    });
  });
}

function applyFilter(filter) {
  if (filter === 'all') {
    filteredTransactions = [...allTransactions];
  } else {
    filteredTransactions = allTransactions.filter(tx => {
      const meta = getTypeMeta(tx.type);
      if (filter === 'win') return meta.positive === true;
      if (filter === 'bet') return meta.positive === false;
      if (filter === 'bonus') return String(tx.type).toLowerCase().includes('bonus') || String(tx.type).toLowerCase().includes('daily');
      if (filter === 'deposit') return String(tx.type).toLowerCase().includes('deposit');
      return true;
    });
  }
  renderPage();
}

// ---- Render ----
function renderPage() {
  const content = document.getElementById('historyContent');
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredTransactions.slice(start, start + PAGE_SIZE);

  if (!pageItems.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌀</div>
        <div class="empty-title">Nothing here.</div>
        <div class="empty-text">No transactions match this filter.</div>
      </div>`;
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'transactions-table-wrap';

  const head = document.createElement('div');
  head.className = 'table-head';
  head.innerHTML = `
    <div class="th">Type</div>
    <div class="th">Amount</div>
    <div class="th">Description</div>
    <div class="th" style="text-align:right;">Date</div>
  `;
  tableWrap.appendChild(head);

  pageItems.forEach((tx, idx) => {
    const row = createTransactionRow(tx, idx);
    tableWrap.appendChild(row);
  });

  content.innerHTML = '';
  content.appendChild(tableWrap);

  renderPagination();
}

function createTransactionRow(tx, idx) {
  const row = document.createElement('div');
  row.className = 'transaction-row';
  row.style.animationDelay = `${idx * 0.03}s`;

  const meta = getTypeMeta(tx.type);
  const rawAmount = Number(tx.amount || 0);
  const amount = Math.abs(rawAmount);

  // Determine sign: use meta if available, else fall back to raw sign
  const isPositive = meta.positive !== null
    ? meta.positive
    : rawAmount >= 0;

  const amountClass = isPositive ? 'amount-positive' : 'amount-negative';
  const amountSign = isPositive ? '+' : '-';

  const description = tx.description || tx.desc || tx.note || '—';
  const date = formatDate(tx.createdAt || tx.date || tx.timestamp);

  row.innerHTML = `
    <div class="tx-type">
      <div class="tx-type-icon ${meta.iconClass}">${meta.icon}</div>
      <span class="tx-type-label">${escapeHtml(meta.label)}</span>
    </div>
    <div class="tx-amount ${amountClass}">${amountSign}$${formatCurrency(amount)}</div>
    <div class="tx-description" title="${escapeHtml(description)}">${escapeHtml(description)}</div>
    <div class="tx-date">${date}</div>
  `;

  return row;
}

// ---- Pagination ----
function renderPagination() {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';
  pagination.innerHTML = '';

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; renderPage(); scrollToTop(); });
  pagination.appendChild(prevBtn);

  // Page numbers (show up to 5)
  const range = getPaginationRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '...') {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-info';
      ellipsis.textContent = '···';
      pagination.appendChild(ellipsis);
    } else {
      const btn = document.createElement('button');
      btn.className = `page-btn${p === currentPage ? ' active' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => { currentPage = p; renderPage(); scrollToTop(); });
      pagination.appendChild(btn);
    }
  });

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; renderPage(); scrollToTop(); });
  pagination.appendChild(nextBtn);
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range = [];
  range.push(1);
  if (current > 3) range.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);
  if (current < total - 2) range.push('...');
  range.push(total);
  return range;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Utilities ----
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr).slice(0, 10);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatCurrency(n) {
  const num = Number(n);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}