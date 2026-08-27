// =============================================
// THE CLUSTER - Shared Utilities
// =============================================

// Auth check on every protected page
async function checkAuth() {
  const res = await fetch('/api/auth/check');
  const data = await res.json();
  if (!data.loggedIn) { window.location.href = '/'; return null; }
  const el = document.getElementById('username-display');
  if (el) el.textContent = data.user.uname;
  return data.user;
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    });
  }

  // Active nav highlight
  const links = document.querySelectorAll('.nav-item');
  links.forEach(link => {
    if (link.href && link.href.includes(window.location.pathname)) {
      link.classList.add('active');
    }
  });
});

// API helper
async function api(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// Show alert
function showAlert(id, message, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  setTimeout(() => el.classList.remove('show'), 3500);
}

// Modal helpers
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Search filter
function filterTable(inputId, tableId) {
  document.getElementById(inputId).addEventListener('input', function () {
    const term = this.value.toLowerCase();
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  });
}

// Format date
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format currency
function fmtCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

// Confirm delete
function confirmDelete(message) {
  return confirm(message || 'Are you sure you want to delete this record?');
}

// Tab switching
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tab).classList.add('active');
    });
  });
}
