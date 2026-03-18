/**
 * sidebar.js
 * Injects the shared sidebar and top logo into any protected page.
 * Requires auth-guard.js to have run first (provides window._username).
 *
 * Usage:
 *   <script src="sidebar.js"><\/script>
 *   Call buildSidebar('Почетна')  with the active page name.
 */

function buildSidebar(activePage) {
  // _displayName = Cyrillic full_name fetched by auth-guard
  // _username    = latin login name (fallback)
  const displayName = window._displayName || window._username || 'Корисник';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const nav = [
    { label: 'Почетна',    href: 'dashboard.html', icon: iconHome()     },
    { label: 'Корисници',  href: 'clients.html',   icon: iconClients()  },
    { label: 'Записи',     href: 'logs.html',       icon: iconLogs()     },
    { label: 'Задачи',     href: 'tasks.html',      icon: iconTasks()    },
    { label: 'Извештаи',   href: 'reports.html',    icon: iconReports()  },
    { label: 'Соби',        href: 'rooms.html',     icon: iconRooms()    },
    { label: 'Поставки',   href: 'settings.html',   icon: iconSettings() },
  ];

  const navItems = nav.map(item => `
    <a href="${item.href}" class="nav-item ${activePage === item.label ? 'active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  const html = `
    <aside class="sidebar">

      <!-- Logo -->
      <div class="sidebar-logo">
        <svg width="40" height="40" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="52" height="52" rx="10" fill="#7A7A2E" opacity="0.18"/>
          <path d="M26 8 C18 16 14 26 26 44 C38 26 34 16 26 8Z" fill="#7A7A2E" opacity="0.85"/>
          <path d="M26 44 C26 32 18 26 10 26" stroke="#A8A84A" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M26 44 C26 32 34 26 42 26" stroke="#A8A84A" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="26" cy="44" r="2" fill="#A8A84A"/>
        </svg>
        <div class="sidebar-logo-text">
          <span class="sidebar-logo-name">ПУСЗ Оаза</span>
          <span class="sidebar-logo-portal">ПОРТАЛ ЗА<br>ВРАБОТЕНИ</span>
        </div>
      </div>

      <!-- User badge -->
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">${avatarLetter}</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-label">Пријавен корисник</span>
          <span class="sidebar-user-name">${escapeHtml(displayName)}</span>
        </div>
      </div>

      <div class="sidebar-divider"></div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        ${navItems}
      </nav>

      <!-- Logout -->
      <div class="sidebar-footer">
        <button class="btn-logout" id="logoutBtn">
          ${iconLogout()}
          <span>Одјава</span>
        </button>
      </div>

    </aside>
  `;

  // Inject
  const placeholder = document.getElementById('sidebar-placeholder');
  if (placeholder) placeholder.outerHTML = html;
  else document.body.insertAdjacentHTML('afterbegin', html);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await window._sb.auth.signOut();
    window.location.replace('index.html');
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Icons (inline SVG) ──
function iconHome()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`; }
function iconClients() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function iconLogs()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`; }
function iconTasks()   { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function iconReports() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6"  y1="20" x2="6"  y2="14"/></svg>`; }
function iconSettings(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`; }
function iconLogout()  { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`; }

// Returns true if the logged-in user can create/manage clients
function canManageClients() {
  const u = (window._username || '').toLowerCase();
  return u === 'menadzer' || u === 'glavnasestra';
}
window.canManageClients = canManageClients;
function iconRooms() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`; }
