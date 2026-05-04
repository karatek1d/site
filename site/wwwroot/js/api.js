// ==========================================
// ESPORTAL — Data layer (статические данные)
// Все данные хранятся в data.js
// ==========================================

// ---- Публичные функции ----

function fetchTournaments(game = null, status = null) {
  let list = [...TOURNAMENTS];
  if (game && game !== 'all') list = list.filter(t => t.game === game);
  if (status && status !== 'all') list = list.filter(t => t.status === status);
  return Promise.resolve(list.map(mapTournament));
}

function fetchMatches(game = null, days = 3) {
  let list = [...UPCOMING_MATCHES];
  if (game && game !== 'all') list = list.filter(m => m.game === game);
  return Promise.resolve(list.map(mapMatch));
}

function fetchTeams(game = null) {
  let list = [...TEAMS];
  if (game && game !== 'all') list = list.filter(t => t.game === game);
  return Promise.resolve(list.map(t => ({
    name:      t.name,
    game:      t.game,
    region:    t.region,
    ranking:   t.ranking,
    logoUrl:   null,
    _fallback: t,
  })));
}

function fetchRoster(teamName, game) {
  const key = `${teamName}|${game}`;
  const roster = ROSTERS[key] || ROSTERS[teamName] || [];
  return Promise.resolve(roster.map(p => ({
    nick:    p.nick,
    name:    p.name,
    country: p.country,
    role:    p.role,
  })));
}

// ---- Внутренние маперы ----

function mapTournament(t) {
  return {
    id:          String(t.id),
    name:        t.name,
    shortName:   t.shortName,
    game:        t.game,
    tier:        t.tier,
    status:      t.status,
    icon:        t.icon,
    prize:       t.prize,
    prizeNum:    t.prizeNum,
    startDate:   t.startDate,
    endDate:     t.endDate,
    location:    t.location,
    organizer:   t.organizer,
    teams:       t.teams,
    region:      t.region,
    description: t.description,
    format:      t.format,
    bannerColor: t.bannerColor,
  };
}

function mapMatch(m) {
  return {
    id:             String(m.id),
    tournamentName: TOURNAMENTS.find(t => t.id === m.tournamentId)?.shortName ?? '',
    team1:          m.team1,
    team2:          m.team2,
    score1:         null,
    score2:         null,
    status:         m.status,
    time:           m.time,
    date:           m.date,
    game:           m.game,
  };
}

function renderSkeleton(containerId, count = 4, type = 'card') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, () =>
    type === 'row'
      ? `<div class="skeleton-row"></div>`
      : `<div class="skeleton-card"></div>`
  ).join('');
}
