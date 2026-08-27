// Shared sidebar template
function getSidebar(activePage) {
  const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/gyms',      icon: '🏢', label: 'Gyms' },
    { href: '/members',   icon: '👥', label: 'Members' },
    { href: '/trainers',  icon: '💪', label: 'Trainers' },
    { href: '/workouts',  icon: '🏃', label: 'Workouts' },
    { href: '/payments',  icon: '💳', label: 'Payments' },
    { href: '/reports',   icon: '📋', label: 'Reports' },
  ];

  const navHTML = navItems.map(item => `
    <a href="${item.href}" class="nav-item ${item.href.includes(activePage) ? 'active' : ''}">
      <span class="icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <h2>🏋️ THE CLUSTER</h2>
        <p>Gyms Under One System</p>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <button class="logout-btn" id="logout-btn">🚪 Logout</button>
      </div>
    </aside>
  `;
}
