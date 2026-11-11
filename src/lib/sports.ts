export type SportState = 'pre' | 'in' | 'post';

export interface TeamStat {
  name: string;
  abbreviation: string;
  displayValue: string;
}

export interface TeamLeader {
  category: string;
  athleteName: string;
  displayValue: string;
}

export interface MatchDetail {
  type: 'goal' | 'yellowCard' | 'redCard' | 'other';
  clock: string;
  teamId: string;
  athleteName?: string;
  displayValue?: string;
}

export interface SportTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  homeAway: 'home' | 'away';
  score: string;
  winner?: boolean;
  stats: TeamStat[];
  leaders: TeamLeader[];
}

export interface SportEvent {
  id: string;
  leagueSlug: string;
  leagueName: string;
  leagueAbbreviation: string;
  date: string;
  status: {
    state: SportState;
    detail: string;
    shortDetail: string;
    completed?: boolean;
    period?: number;
    displayClock?: string;
  };
  home: SportTeam;
  away: SportTeam;
  venue?: string;
  broadcast?: string;
  gamecastUrl?: string;
  details: MatchDetail[];
}

export interface SportsLeague {
  slug: string;
  name: string;
  abbreviation: string;
  sportPath: string;
  icon: string;
}

export const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

export const SPORTS_LEAGUES: SportsLeague[] = [
  { slug: 'nfl', name: 'NFL', abbreviation: 'NFL', sportPath: 'football/nfl', icon: '🏈' },
  { slug: 'nba', name: 'NBA', abbreviation: 'NBA', sportPath: 'basketball/nba', icon: '🏀' },
  { slug: 'mlb', name: 'MLB', abbreviation: 'MLB', sportPath: 'baseball/mlb', icon: '⚾' },
  { slug: 'nhl', name: 'NHL', abbreviation: 'NHL', sportPath: 'hockey/nhl', icon: '🏒' },
  { slug: 'eng.1', name: 'English Premier League', abbreviation: 'EPL', sportPath: 'soccer/eng.1', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'esp.1', name: 'La Liga', abbreviation: 'La Liga', sportPath: 'soccer/esp.1', icon: '🇪🇸' },
  { slug: 'ger.1', name: 'Bundesliga', abbreviation: 'Bundesliga', sportPath: 'soccer/ger.1', icon: '🇩🇪' },
  { slug: 'ita.1', name: 'Serie A', abbreviation: 'Serie A', sportPath: 'soccer/ita.1', icon: '🇮🇹' },
  { slug: 'fra.1', name: 'Ligue 1', abbreviation: 'Ligue 1', sportPath: 'soccer/fra.1', icon: '🇫🇷' },
  { slug: 'usa.1', name: 'Major League Soccer', abbreviation: 'MLS', sportPath: 'soccer/usa.1', icon: '🇺🇸' },
  { slug: 'uefa.champions', name: 'UEFA Champions League', abbreviation: 'UCL', sportPath: 'soccer/uefa.champions', icon: '🇪🇺' },
  { slug: 'fifa.world', name: 'FIFA World Cup', abbreviation: 'World Cup', sportPath: 'soccer/fifa.world', icon: '🏆' },
];

export function getSportsLeague(slug: string): SportsLeague | undefined {
  return SPORTS_LEAGUES.find((league) => league.slug === slug);
}

export function getResizedLogoUrl(logoUrl: string, size: number): string {
  if (!logoUrl) return '';
  if (logoUrl.includes('/combiner/i?')) return logoUrl;
  if (logoUrl.startsWith('https://a.espncdn.com/i/')) {
    const path = logoUrl.replace('https://a.espncdn.com', '');
    return `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(path)}&w=${size}&h=${size}&scale=crop`;
  }
  return logoUrl;
}

function normalizeStats(
  competitor: Record<string, unknown>
): TeamStat[] {
  const stats = (competitor.statistics as Record<string, unknown>[]) || [];
  return stats
    .map((s) => ({
      name: String(s.name || ''),
      abbreviation: String(s.abbreviation || s.name || ''),
      displayValue: String(
        s.displayValue !== undefined ? s.displayValue : s.value ?? ''
      ),
    }))
    .filter((s) => s.name && s.displayValue);
}

function normalizeLeaders(
  competitor: Record<string, unknown>
): TeamLeader[] {
  const leaders = (competitor.leaders as Record<string, unknown>[]) || [];
  const seen = new Set<string>();
  const result: TeamLeader[] = [];
  for (const category of leaders) {
    const categoryName = String(
      category.shortDisplayName || category.displayName || category.name || ''
    );
    if (!categoryName || seen.has(categoryName)) continue;
    seen.add(categoryName);

    const categoryLeaders = (category.leaders as Record<string, unknown>[]) || [];
    const top = categoryLeaders[0];
    if (!top) continue;
    const athlete = (top.athlete as Record<string, unknown>) || {};
    result.push({
      category: categoryName,
      athleteName: String(athlete.shortName || athlete.displayName || ''),
      displayValue: String(top.displayValue || ''),
    });
  }
  return result;
}

function normalizeTeam(
  competitor: Record<string, unknown>,
  homeAway: 'home' | 'away'
): SportTeam {
  const team = (competitor.team as Record<string, unknown>) || {};
  return {
    id: String(team.id || competitor.id || ''),
    name: String(team.displayName || team.name || ''),
    shortName: String(team.shortDisplayName || team.abbreviation || ''),
    abbreviation: String(team.abbreviation || ''),
    logo: getResizedLogoUrl(String(team.logo || ''), 48),
    homeAway,
    score: String(competitor.score || '0'),
    winner: competitor.winner === true,
    stats: normalizeStats(competitor),
    leaders: normalizeLeaders(competitor),
  };
}

export function formatEventStatus(event: SportEvent): string {
  const { state, shortDetail, detail, displayClock } = event.status;

  if (state === 'post') {
    return shortDetail || detail || 'Final';
  }

  if (state === 'in') {
    return shortDetail || detail || displayClock || 'Live';
  }

  const date = new Date(event.date);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
    date.toDateString();
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;

  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} · ${time}`;
}

export function isPinEligible(event: SportEvent): boolean {
  if (event.status.state === 'in') return true;
  if (event.status.state === 'pre') {
    const start = new Date(event.date).getTime();
    return start - Date.now() < 24 * 60 * 60 * 1000;
  }
  return false;
}

export function normalizeEspnEvent(
  raw: unknown,
  league: SportsLeague
): SportEvent | null {
  const event = raw as Record<string, unknown>;
  const competition = ((event.competitions as Record<string, unknown>[]) || [])[0];
  if (!competition) return null;

  const competitors = (competition.competitors as Record<string, unknown>[]) || [];
  const homeRaw = competitors.find((c) => c.homeAway === 'home');
  const awayRaw = competitors.find((c) => c.homeAway === 'away');
  if (!homeRaw || !awayRaw) return null;

  const status = (competition.status as Record<string, unknown>) || (event.status as Record<string, unknown>) || {};
  const statusType = (status.type as Record<string, unknown>) || {};

  const stateRaw = String(statusType.state || '');
  const state: SportState = stateRaw === 'in' ? 'in' : stateRaw === 'post' ? 'post' : 'pre';

  const venueObj = (competition.venue as Record<string, unknown>) || (event.venue as Record<string, unknown>) || {};
  const broadcasts = (competition.broadcasts as Record<string, unknown>[]) || [];
  const broadcastNames = (broadcasts[0]?.names as string[]) || [];

  const links = (event.links as Record<string, unknown>[]) || [];
  const gamecast = links.find((link) => (link.rel as string[])?.includes('summary'));

  const details = normalizeDetails(competition.details as Record<string, unknown>[] | undefined);

  return {
    id: String(event.id || ''),
    leagueSlug: league.slug,
    leagueName: league.name,
    leagueAbbreviation: league.abbreviation,
    date: String(competition.date || event.date || ''),
    status: {
      state,
      detail: String(statusType.detail || statusType.description || ''),
      shortDetail: String(statusType.shortDetail || statusType.detail || ''),
      completed: statusType.completed === true,
      period: status.period ? Number(status.period) : undefined,
      displayClock: status.displayClock ? String(status.displayClock) : undefined,
    },
    home: normalizeTeam(homeRaw, 'home'),
    away: normalizeTeam(awayRaw, 'away'),
    venue: String(venueObj.fullName || venueObj.displayName || '') || undefined,
    broadcast: broadcastNames.join(', ') || undefined,
    gamecastUrl: gamecast ? String(gamecast.href || '') : undefined,
    details,
  };
}

function normalizeDetails(
  rawDetails?: Record<string, unknown>[]
): MatchDetail[] {
  if (!rawDetails) return [];
  const result: MatchDetail[] = [];

  for (const d of rawDetails) {
    const typeObj = (d.type as Record<string, unknown>) || {};
    const typeText = String(typeObj.text || '').toLowerCase();
    const clockObj = (d.clock as Record<string, unknown>) || {};
    const teamObj = (d.team as Record<string, unknown>) || {};
    const athletes = (d.athletesInvolved as Record<string, unknown>[]) || [];
    const athlete = athletes[0] || {};

    let type: MatchDetail['type'] = 'other';
    if (d.scoringPlay === true || typeText.includes('goal')) {
      type = 'goal';
    } else if (d.redCard === true || typeText.includes('red card')) {
      type = 'redCard';
    } else if (d.yellowCard === true || typeText.includes('yellow card')) {
      type = 'yellowCard';
    }

    result.push({
      type,
      clock: String(clockObj.displayValue || ''),
      teamId: String(teamObj.id || ''),
      athleteName: String(athlete.shortName || athlete.displayName || ''),
      displayValue: String(d.displayValue || ''),
    });
  }

  return result;
}
