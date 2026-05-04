// ==========================================
// ESPORTAL - Main JavaScript
// ==========================================

// Current active game filter
let activeGame = 'all';

// ==========================================
// NAVIGATION & GAME TABS
// ==========================================
function initGameTabs() {
  const tabsContainer = document.getElementById('game-tabs');
  if (!tabsContainer) return;

  GAMES.forEach(game => {
    const tab = document.createElement('a');
    tab.className = 'game-tab' + (game.id === activeGame ? ' active' : '');
    tab.href = game.id === 'all' ? 'index.html' : `tournaments.html?game=${game.id}`;
    tab.innerHTML = `<span class="game-tab-icon">${gameIconHtml(game, 16)}</span>${game.name}`;
    tab.dataset.game = game.id;
    tabsContainer.appendChild(tab);
  });
}

function initSidebarNav(activePage) {
  const navLinks = [
    { icon: '🏠', label: 'Главная', href: 'index.html', key: 'home' },
    { icon: '📅', label: 'Расписание', href: 'schedule.html', key: 'schedule', badge: 'live', badgeText: 'LIVE' },
    { icon: '🏆', label: 'Турниры', href: 'tournaments.html', key: 'tournaments', badge: 'blue', badgeText: '12' },
    { icon: '👥', label: 'Команды', href: 'teams.html', key: 'teams' },
    { icon: '🌍', label: 'Регионы', href: '#', key: 'regions' },
    { icon: '📊', label: 'Статистика', href: '#', key: 'stats' },
    { icon: '🔔', label: 'Уведомления', href: '#', key: 'notifications', badge: 'green', badgeText: '3' },
  ];

  const container = document.getElementById('sidebar-nav');
  if (!container) return;

  navLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.className = 'sidebar-nav-item' + (link.key === activePage ? ' active' : '');
    let badgeHtml = '';
    if (link.badge) {
      badgeHtml = `<span class="sidebar-badge ${link.badge}">${link.badgeText}</span>`;
    }
    a.innerHTML = `<span class="icon">${link.icon}</span>${link.label}${badgeHtml}`;
    container.appendChild(a);
  });
}

function initTopNav(activePage) {
  const nav = document.getElementById('top-nav');
  if (!nav) return;
  const pages = [
    { key: 'home', label: 'Главная', href: 'index.html' },
    { key: 'schedule', label: 'Расписание', href: 'schedule.html' },
    { key: 'tournaments', label: 'Турниры', href: 'tournaments.html' },
    { key: 'teams', label: 'Команды', href: 'teams.html' },
  ];
  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    a.className = p.key === activePage ? 'active' : '';
    nav.appendChild(a);
  });
}

// ==========================================
// SEARCH
// ==========================================
function initSearch() {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  const allItems = [
    ...TOURNAMENTS.map(t => ({ type: 'tournament', name: t.name, icon: t.icon, href: `tournament.html?id=${t.id}`, sub: GAMES.find(g => g.id === t.game)?.name })),
    ...TEAMS.map(t => ({ type: 'team', name: t.name, icon: t.logo, href: `teams.html`, sub: GAMES.find(g => g.id === t.game)?.name })),
  ];

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    dropdown.innerHTML = '';
    if (q.length < 2) { dropdown.classList.remove('open'); return; }

    const results = allItems.filter(i => i.name.toLowerCase().includes(q)).slice(0, 7);
    if (!results.length) { dropdown.classList.remove('open'); return; }

    results.forEach(item => {
      const div = document.createElement('a');
      div.href = item.href;
      div.className = 'search-dropdown-item';
      div.innerHTML = `<span style="font-size:16px">${item.icon}</span><div><div style="font-size:13px;font-weight:600">${item.name}</div><div style="font-size:11px;color:var(--text-secondary)">${item.type === 'tournament' ? 'Турнир' : 'Команда'} · ${item.sub}</div></div>`;
      dropdown.appendChild(div);
    });
    dropdown.classList.add('open');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// ==========================================
// STATUS & TIER HELPERS
// ==========================================
function statusBadge(status) {
  const map = {
    live: '<span class="status-badge status-live">● LIVE</span>',
    upcoming: '<span class="status-badge status-upcoming">↑ Скоро</span>',
    completed: '<span class="status-badge status-completed">✓ Завершён</span>',
    qualifier: '<span class="status-badge status-qualifier">◈ Квалификация</span>',
  };
  return map[status] || '';
}

function tierBadge(tier) {
  const cls = { S: 'tier-s', A: 'tier-a', B: 'tier-b' }[tier] || '';
  return `<span class="tier-badge ${cls}">Tier ${tier}</span>`;
}

function gameBadge(gameId) {
  const map = {
    cs2: '<span class="match-game-badge badge-cs2">CS2</span>',
    dota2: '<span class="match-game-badge badge-dota">Dota 2</span>',
    lol: '<span class="match-game-badge badge-lol">LoL</span>',
    valorant: '<span class="match-game-badge badge-valorant">VAL</span>',
    rl: '<span class="match-game-badge badge-rl">RL</span>',
    sc2: '<span class="match-game-badge badge-sc2">SC2</span>',
  };
  return map[gameId] || `<span class="match-game-badge">${gameId}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrize(num) {
  if (num >= 1000000) return `$${(num/1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
  if (num >= 1000) return `$${Math.round(num/1000)}K`;
  return `$${num}`;
}

// ==========================================
// FEATURED TOURNAMENTS (принимает массив DTO)
// ==========================================
function renderFeaturedLive(tournaments) {
  const container = document.getElementById('featured-tournaments');
  if (!container) return;
  container.innerHTML = '';

  const featured = tournaments
    .filter(t => t.status === 'live' || t.tier === 'S')
    .slice(0, 4);

  if (!featured.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary)">Турниры не найдены</div>';
    return;
  }

  featured.forEach(t => {
    const card = document.createElement('a');
    card.href = `tournament.html?id=${t.id}`;
    card.className = 'featured-card';
    const game = GAMES.find(g => g.id === t.game);
    card.innerHTML = `
      <div class="featured-card-banner" style="background:${t.bannerColor||'var(--bg-card)'}">
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;opacity:0.3">${t.icon||'🎮'}</div>
      </div>
      <div class="featured-card-body">
        <div class="featured-card-game">${t.icon||'🎮'} ${game?.name || t.game}</div>
        <div class="featured-card-name">${t.name}</div>
        <div class="featured-card-meta">
          <span class="featured-card-prize">${t.prize}</span>
          ${t.status === 'live' ? '<span class="live-dot">LIVE</span>' : `<span>${formatDate(t.startDate)}</span>`}
          <span>${t.location}</span>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

// ==========================================
// MATCHES LIST (принимает массив MatchDto)
// ==========================================
function renderMatchesList(matches) {
  const container = document.getElementById('matches-list');
  if (!container) return;
  container.innerHTML = '';

  if (!matches.length) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-secondary)">Матчи не найдены</div>';
    return;
  }

  matches.forEach(m => {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'match-card';
    const isLive = m.status === 'live';
    const hasScore = m.score1 != null && m.score2 != null && m.score1 !== '' && m.score2 !== '';
    const scoreHtml = isLive
      ? `<div class="match-score live">vs</div>`
      : hasScore
        ? `<div class="match-score">${m.score1}:${m.score2}</div>`
        : `<div class="match-score">—</div>`;
    const logo1 = TEAMS.find(tm => tm.name === m.team1)?.logo || '👾';
    const logo2 = TEAMS.find(tm => tm.name === m.team2)?.logo || '👾';
    a.innerHTML = `
      <div class="match-time ${isLive ? 'live' : ''}">${m.time}</div>
      <div class="match-divider"></div>
      <div class="match-teams">
        <div class="match-team"><div class="match-team-logo">${logo1}</div>${m.team1}</div>
        ${scoreHtml}
        <div class="match-team"><div class="match-team-logo">${logo2}</div>${m.team2}</div>
      </div>
      <div class="match-info">
        <span class="match-tournament">${m.tournamentName}</span>
        ${gameBadge(m.game)}
      </div>`;
    container.appendChild(a);
  });
}

// ==========================================
// ONGOING TABLE (принимает массив DTO)
// ==========================================
function renderOngoingTable(tournaments) {
  const tbody = document.getElementById('ongoing-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  tournaments.forEach(t => {
    const game = GAMES.find(g => g.id === t.game);
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => window.open(`tournament.html?id=${t.id}`, '_self');
    tr.innerHTML = `
      <td><div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">${t.icon||'🎮'}</span>
        <div>
          <div style="font-weight:600">${t.name}</div>
          <div style="font-size:11px;color:var(--text-secondary)">${t.organizer} · ${t.location}</div>
        </div>
      </div></td>
      <td><span style="color:${game?.color||'var(--text-primary)'}">${game?.name||t.game}</span></td>
      <td style="color:var(--accent);font-weight:700">${t.prize}</td>
      <td>${t.teams || '—'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${formatDate(t.startDate)} — ${formatDate(t.endDate)}</td>
      <td>${statusBadge(t.status)}</td>`;
    tbody.appendChild(tr);
  });

  if (!tournaments.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-secondary)">Активных турниров нет</td></tr>';
  }
}

// ==========================================
// UPCOMING GRID (принимает массив DTO)
// ==========================================
function renderUpcomingGrid(tournaments) {
  const grid = document.getElementById('upcoming-grid');
  if (!grid) return;
  grid.innerHTML = '';

  tournaments.slice(0, 6).forEach(t => {
    const game = GAMES.find(g => g.id === t.game);
    const card = document.createElement('a');
    card.href = `tournament.html?id=${t.id}`;
    card.className = 'tournament-card';
    card.innerHTML = `
      <div class="tournament-card-header">
        <div class="tournament-logo">${t.icon||'🎮'}</div>
        <div class="tournament-card-title">
          <div class="tournament-card-name">${t.name}</div>
          <div class="tournament-card-game" style="color:${game?.color||'var(--text-secondary)'};display:flex;align-items:center;gap:5px;">
            ${gameIconHtml(game, 14)} ${game?.name||t.game}
          </div>
        </div>
      </div>
      <div class="tournament-card-body">
        <div class="tournament-card-stat">
          <span class="tournament-card-stat-label">📅 Дата</span>
          <span class="tournament-card-stat-value">${formatDate(t.startDate)}</span>
        </div>
        <div class="tournament-card-stat">
          <span class="tournament-card-stat-label">📍 Место</span>
          <span class="tournament-card-stat-value">${t.location}</span>
        </div>
        <div class="tournament-card-stat">
          <span class="tournament-card-stat-label">👥 Команды</span>
          <span class="tournament-card-stat-value">${t.teams || '—'}</span>
        </div>
      </div>
      <div class="tournament-card-footer">
        ${statusBadge(t.status)}
        <div style="display:flex;align-items:center;gap:8px">
          ${tierBadge(t.tier)}
          <span style="color:var(--accent);font-weight:700;font-size:13px">${t.prize}</span>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

// ==========================================
// SIDEBAR RIGHT — статичные данные
// ==========================================
function renderSidebarRight() {
  const upcomingEl = document.getElementById('widget-upcoming');
  if (upcomingEl && upcomingEl.children.length === 0) {
    TOP_UPCOMING.slice(0, 4).forEach(t => {
      const a = document.createElement('a');
      a.href = `tournament.html?id=${t.id}`;
      a.className = 'widget-match';
      const game = GAMES.find(g => g.id === t.game);
      a.innerHTML = `
        <div class="widget-match-tournament">${game?.name} · ${t.location}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:3px">${t.shortName}</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary)">
          <span>📅 ${formatDate(t.startDate)}</span>
          <span class="text-accent">${t.prize}</span>
        </div>`;
      upcomingEl.appendChild(a);
    });
  }

  const lbEl = document.getElementById('widget-leaderboard');
  if (lbEl && lbEl.children.length === 0) {
    LEADERBOARD.forEach(entry => {
      const a = document.createElement('a');
      a.href = 'teams.html';
      a.className = 'widget-list-item';
      const posColors = ['#f5a623','#aaaaaa','#cd7f32','',''];
      a.innerHTML = `
        <span class="widget-rank" style="color:${posColors[entry.pos-1]||'var(--text-secondary)'}">${entry.pos}</span>
        <div class="widget-team-logo">${TEAMS.find(t=>t.name===entry.team)?.logo||'?'}</div>
        <div class="widget-item-info">
          <div class="widget-item-name">${entry.team}</div>
          <div class="widget-item-sub">${entry.game}</div>
        </div>
        <span class="widget-item-value">${entry.points.toLocaleString()}</span>`;
      lbEl.appendChild(a);
    });
  }
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initSearch();
});
