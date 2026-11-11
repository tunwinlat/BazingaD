'use client';

import { PinOff, Radio } from 'lucide-react';
import { useSports } from '@/components/SportsContext';
import MatchFacts from '@/components/MatchFacts';
import { formatEventStatus, type SportEvent } from '@/lib/sports';

export default function PinnedSportsBar() {
  const { pinned, unpinMatch } = useSports();

  if (pinned.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-2xl p-4 animate-fadeInUp"
      style={{
        background:
          'linear-gradient(145deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(24px)',
        boxShadow:
          '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Pinned Matches
        </span>
        <span className="text-[10px] text-white/30">({pinned.length})</span>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          alignItems: 'start',
        }}
      >
        {pinned.map((match) => (
          <PinnedMatchCard
            key={match.id}
            match={match}
            onUnpin={() => unpinMatch(match.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PinnedMatchCard({
  match,
  onUnpin,
}: {
  match: SportEvent;
  onUnpin: () => void;
}) {
  const isLive = match.status.state === 'in';
  const statusText = formatEventStatus(match);

  return (
    <div
      className="match-card rounded-xl p-3"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-white/40 truncate max-w-[120px]"
          title={match.leagueName}
        >
          {match.leagueAbbreviation}
        </span>
        <div className="flex items-center gap-2">
          {isLive && <LiveDot />}
          <span
            className={`text-[10px] font-medium whitespace-nowrap ${
              isLive ? 'text-emerald-400' : 'text-white/45'
            }`}
          >
            {statusText}
          </span>
          <button
            type="button"
            onClick={onUnpin}
            className="p-1 rounded-md transition-colors hover:bg-white/10 text-white/40 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Unpin match"
            title="Unpin match"
          >
            <PinOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Compact layout (narrow cards / many pins) */}
      <div className="layout-compact space-y-2">
        <CompactTeamRow team={match.away} />
        <CompactTeamRow team={match.home} />
      </div>

      {/* Wide layout (single pin / lots of space) */}
      <div className="layout-wide">
        <div className="flex items-center justify-between gap-3 py-2">
          <WideTeamBlock team={match.away} align="left" />

          <div className="flex flex-col items-center justify-center px-2">
            <div className="match-score font-bold text-white tabular-nums tracking-tight">
              {match.away.score}
              <span className="mx-1.5 text-white/30">-</span>
              {match.home.score}
            </div>
          </div>

          <WideTeamBlock team={match.home} align="right" />
        </div>

        {(match.venue || match.broadcast) && (
          <div
            className="match-extra mt-3 pt-2 flex-wrap items-center justify-center gap-2 text-[11px] text-white/40"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {match.venue && (
              <span className="truncate max-w-[180px]" title={match.venue}>
                {match.venue}
              </span>
            )}
            {match.venue && match.broadcast && (
              <span className="text-white/20">·</span>
            )}
            {match.broadcast && (
              <span className="truncate max-w-[180px]" title={match.broadcast}>
                {match.broadcast}
              </span>
            )}
          </div>
        )}

        <MatchFacts match={match} />
      </div>
    </div>
  );
}

function CompactTeamRow({
  team,
}: {
  team: {
    logo: string;
    abbreviation: string;
    shortName: string;
    name: string;
    score: string;
    winner?: boolean;
  };
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logo}
            alt={team.abbreviation}
            className="w-7 h-7 object-contain flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            {team.abbreviation.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <div
            className={`text-sm truncate ${
              team.winner ? 'text-white font-semibold' : 'text-white/90'
            }`}
          >
            {team.shortName || team.name}
          </div>
          <div className="text-[10px] text-white/40">{team.abbreviation}</div>
        </div>
      </div>
      <span
        className={`text-lg font-bold tabular-nums ${
          team.winner ? 'text-white' : 'text-white/80'
        }`}
      >
        {team.score}
      </span>
    </div>
  );
}

function WideTeamBlock({
  team,
  align,
}: {
  team: {
    logo: string;
    abbreviation: string;
    shortName: string;
    name: string;
    winner?: boolean;
  };
  align: 'left' | 'right';
}) {
  return (
    <div
      className={`flex items-center gap-3 min-w-0 flex-1 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.logo}
          alt={team.abbreviation}
          className="match-logo object-contain flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div
          className="match-logo rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          {team.abbreviation.slice(0, 2)}
        </div>
      )}
      <div className="min-w-0">
        <div
          className={`match-team-name font-semibold truncate ${
            team.winner ? 'text-white' : 'text-white/90'
          }`}
        >
          {team.shortName || team.name}
        </div>
        <div className="text-[11px] text-white/40">{team.abbreviation}</div>
      </div>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
  );
}
